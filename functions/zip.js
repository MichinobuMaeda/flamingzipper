const yauzl = require("yauzl-promise");
const iconv = require("iconv-lite");
const axios = require("axios");
const {parse} = require("csv-parse");

const URL_K_PAGE = "https://www.post.japanpost.jp/zipcode/dl/kogaki-zip.html";
const URL_K_ZIP = "https://www.post.japanpost.jp/zipcode/dl/kogaki/zip/ken_all.zip";
const URL_J_PAGE = "https://www.post.japanpost.jp/zipcode/dl/jigyosyo/index-zip.html";
const URL_J_ZIP = "https://www.post.japanpost.jp/zipcode/dl/jigyosyo/zip/jigyosyo.zip";
const COLLECTION_ZIP = "zips";

/**
 * Get zip file.
 * @param {object} firebase Firebase API
 * @param {string} type "k" / "j"
 * @param {string} pageUrl URL of the page
 * @param {string} zipUrl URL of the zip
 * @return {Promise} Reader of csv data or null
 */
async function fetchZip(firebase, type, pageUrl, zipUrl) {
  const {db, bucket, logger} = firebase;
  const ts = new Date();
  const info = await db.collection(COLLECTION_ZIP)
      .where("type", "==", type)
      .orderBy("createdAt", "desc")
      .limit(1).get();
  const respPage = await axios.get(pageUrl, {responseType: "arraybuffer"});
  const {createHash} = await require("node:crypto");
  const hashPage = createHash("sha256");
  hashPage.update(Buffer.from(respPage.data));
  const page = hashPage.digest("hex");
  logger.info(page);

  if (info.docs.length == 1 && info.docs[0].get("page") === page) {
    logger.info("skip");
    return {};
  }

  const respZip = await axios.get(zipUrl, {responseType: "arraybuffer"});
  const hashZip = createHash("sha256");
  hashZip.update(Buffer.from(respZip.data));
  const sum = hashZip.digest("hex");
  logger.info(sum);

  if (info.docs.length == 1 && info.docs[0].get("sum") === sum) {
    logger.info("skip");
    return {};
  }

  const id = `${type}${ts.toISOString().replace(/[^0-9]/g, "")}`;
  await bucket.file(`zips/${id}.zip`).save(Buffer.from(respZip.data));
  await db.collection(COLLECTION_ZIP).doc(id)
      .set({type, page, sum, createdAt: ts});
  logger.info(`saved: ${id}`);

  const zipFile = await yauzl.fromBuffer(
      Buffer.from(respZip.data),
      {lazyEntries: true},
  );
  const entry = await zipFile.readEntry();
  logger.info(`unziped: ${entry.fileName}`);
  const readStream = await entry.openReadStream();
  const textReader = iconv.decodeStream("Shift_JIS");
  const csvReader = parse();
  textReader.pipe(csvReader);
  readStream.pipe(textReader);

  return {id, csvReader};
}

/**
 * Save parsed data.
 * @param {object} firebase Firebase API
 * @param {string} id ID of Zip file
 * @param {Array} prefs List of prefectures
 * @param {Array} cities List of cities
 * @param {object} zips List of zips
 * @return {Promise} void
 */
async function saveParsed(firebase, id, prefs, cities, zips) {
  const {db, bucket, logger} = firebase;

  await bucket.file(`work/${id}_jisx0401.json`).save(JSON.stringify(prefs));
  await bucket.file(`work/${id}_jisx0402.json`).save(JSON.stringify(cities));
  await bucket.file(`work/${id}_zips.json`).save(JSON.stringify(zips));
  await db.collection(COLLECTION_ZIP).doc(id).update({parsedAt: new Date()});

  logger.info(`parsed: ${id}`);
}

/**
 * Get and parse ken_all.zip
 * @param {object} firebase Firebase API
 * @return {Promise} void
 */
async function kenAll(firebase) {
  const {id, csvReader} = await fetchZip(
      firebase, "k", URL_K_PAGE, URL_K_ZIP,
  );

  if (!csvReader) {
    return;
  }

  let jisx0401 = "";
  const prefs = [];
  let jisx0402 = "";
  const cities = [];
  const zips = {};
  let inside = false;
  let addr1 = "";
  let addr2 = "";
  let note = "";

  for await (const rec of csvReader) {
    if (jisx0401 !== rec[0].slice(0, 2)) {
      jisx0401 = rec[0].slice(0, 2);
      prefs.push({
        code: jisx0401,
        name: rec[6],
        kana: rec[3],
      });
    }

    if (jisx0402 !== rec[0]) {
      jisx0402 = rec[0];
      cities.push({
        code: jisx0402,
        name: rec[7],
        kana: rec[4],
      });
    }

    const addZipRecord = (item) => {
      if (
        item.addr1.match(/^以下に/) ||
        item.addr1.match(/一円$/) ||
        item.addr1.match(/〜/)
      ) {
        item.note = item.addr1;
        item.addr1 = "";
      }

      if (
        item.addr2.match(/〜/) ||
        item.addr2.match(/不明/) ||
        item.addr2.match(/除く/) ||
        item.addr2.match(/その他/)
      ) {
        item.note = item.addr2;
        item.addr2 = "";
      }

      if (zips[rec[2]] && zips[rec[2]].items) {
        zips[rec[2]].items.push(item);
      } else {
        zips[rec[2]] = {items: [item]};
      }
    };

    if (inside) {
      if (rec[8].match(/）/)) {
        addr2 += rec[8].replace(/）/, "");
        note = "";
        inside = false;
        addZipRecord({jisx0402, addr1, addr2, note});
      } else {
        addr2 += rec[8];
      }
    } else if (rec[8].match(/（/)) {
      if (rec[8].match(/）/)) {
        addr1 = rec[8].replace(/（.*/, "");
        addr2 = rec[8].replace(/.*（/, "").replace(/）/, "");
        note = "";
        addZipRecord({jisx0402, addr1, addr2, note});
      } else {
        inside = true;
        addr1 = rec[8].replace(/）.*/, "");
        addr2 = rec[8].replace(/.*（/, "");
      }
    } else {
      addr1 = rec[8];
      addr2 = "";
      note = "";
      addZipRecord({jisx0402, addr1, addr2, note});
    }
  }

  await saveParsed(firebase, id, prefs, cities, zips);
}

/**
 * Get and parse jigyosyo.zip
 * @param {object} firebase Firebase API
 * @return {Promise} void
 */
async function jigyosyo(firebase) {
  const {id, csvReader} = await fetchZip(
      firebase, "j", URL_J_PAGE, URL_J_ZIP,
  );

  if (!csvReader) {
    return;
  }


  let jisx0401 = "";
  const prefs = [];
  let jisx0402 = "";
  const cities = [];
  const zips = {};

  for await (const rec of csvReader) {
    if (jisx0401 !== rec[0].slice(0, 2)) {
      jisx0401 = rec[0].slice(0, 2);
      prefs.push({
        code: jisx0401,
        name: rec[3],
      });
    }

    if (jisx0402 !== rec[0]) {
      jisx0402 = rec[0];
      cities.push({
        code: jisx0402,
        name: rec[4],
      });
    }

    const item = {
      jisx0402,
      addr1: rec[5],
      addr2: rec[6],
      name: rec[2],
      kana: rec[1],
    };

    if (zips[rec[0]] && zips[rec[0]].items) {
      zips[rec[0]].items.push(item);
    } else {
      zips[rec[0]] = {items: [item]};
    }
  }

  await saveParsed(firebase, id, prefs, cities, zips);
}

module.exports = {
  kenAll,
  jigyosyo,
};
