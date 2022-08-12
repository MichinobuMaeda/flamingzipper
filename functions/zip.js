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
 * @param {Object} firebase Firebase API
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
  await bucket.file(`archives/${id}.zip`).save(Buffer.from(respZip.data));
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
 * @param {Object} firebase Firebase API
 * @param {string} id ID of Zip file
 * @param {Array} jisx0401s List of prefectures
 * @param {Array} jisx0402s List of cities
 * @param {Object} zips List of zips
 * @return {Promise} void
 */
async function saveParsed(firebase, id, jisx0401s, jisx0402s, zips) {
  const {db, bucket, logger} = firebase;

  await bucket.file(`work/${id}_jisx0401.json`).save(JSON.stringify(jisx0401s));
  await bucket.file(`work/${id}_jisx0402.json`).save(JSON.stringify(jisx0402s));
  await bucket.file(`work/${id}_zips.json`).save(JSON.stringify(zips));

  await bucket.file(`work/${id}_jisx0401.json`).copy(
      bucket.file(`work/${id.slice(0, 1)}_jisx0401.json`),
  );
  await bucket.file(`work/${id}_jisx0402.json`).copy(
      bucket.file(`work/${id.slice(0, 1)}_jisx0402.json`),
  );
  await bucket.file(`work/${id}_zips.json`).copy(
      bucket.file(`work/${id.slice(0, 1)}_zips.json`),
  );

  await db.collection(COLLECTION_ZIP).doc(id).update({parsedAt: new Date()});

  logger.info(`parsed: ${id}`);
}

/**
 * Generate zip records from joind zip data.
 * @param {Object} zips Reslut
 * @param {string} code Zip code
 * @param {Object} item Joined zip data
 */
function generateZipRecord(zips, code, item) {
  if (
    item.addr1.match(/^以下に/) ||
    item.addr1.match(/一円$/) ||
    item.addr1.match(/～/)
  ) {
    item.note = item.addr1;
    item.addr1 = "";
  }

  if (
    item.addr2.match(/～/) ||
    item.addr2.match(/・/)||
    item.addr2.match(/「/)||
    item.addr2.match(/」/) ||
    item.addr2.match(/階層不明/) ||
    item.addr2.match(/除く/) ||
    item.addr2.match(/以外/) ||
    item.addr2.match(/以上/) ||
    item.addr2.match(/以内/) ||
    item.addr2.match(/を含む/) ||
    item.addr2.match(/その他/) ||
    item.addr2.match(/○○/) ||
    item.addr2.match(
        /^[^０１２３４５６７８９－、]+[０１２３４５６７８９－、]+、[０１２３４５６７８９－、]+[^０１２３４５６７８９－、]+/,
    ) ||
    item.addr2.match(
        /^[０１２３４５６７８９－]+[^０１２３４５６７８９－、]+[０１２３４５６７８９－]+/,
    ) ||
  item.addr2 === "丁目" ||
    item.addr2 === "番地"||
    item.addr2 === "大字"
  ) {
    item.note = item.addr2;
    item.addr2 = "";
  }

  item.addr1.split("、")
      .map(
          function(addr1) {
            return {...item, addr1};
          },
      )
      .forEach(
          function(item1) {
            const suffix = item1.addr2.match(
                /^[０１２３４５６７８９－、]+[^０１２３４５６７８９－、]+$/,
            ) ? item1.addr2.replace(/^[０１２３４５６７８９－、]+/, "") : "";
            const addr2s = item1.addr2.split("、")
                .map(
                    function(str) {
                      if (suffix && !str.endsWith(suffix)) {
                        return `${str}${suffix}`;
                      }
                      return str;
                    },
                );
            addr2s.map(
                function(addr2) {
                  return {...item1, addr2};
                },
            )
                .forEach(
                    function(item2) {
                      if (zips[code] && zips[code].items) {
                        zips[code].items.push(item2);
                      } else {
                        zips[code] = {items: [item2]};
                      }
                    },
                );
          },
      );
}

/**
 * Merge JIS X 0401 data of ken_all.zip and jigyosyo.zip
 * @param {Object} firebase Firebase API
 * @param {Array} k JIS X 0401 data of ken_all.zip
 * @param {Array} j JIS X 0401 data of jigyosyo.zip
 * @return {Promise} void
 */
async function mergeJisx0401(firebase, k, j) {
  const {bucket, logger} = firebase;
  const merged = [
    ...k,
    ...j.filter((item) => !k.some((comp) => comp.code === item.code)),
  ];
  await bucket.file("jisx0401.json").save(JSON.stringify(merged));
  logger.info("merged: jisx0401.json");
  return merged;
}

/**
 * Merge JIS X 0402 data of ken_all.zip and jigyosyo.zip
 * @param {Object} firebase Firebase API
 * @param {Array} k JIS X 0402 data of ken_all.zip
 * @param {Array} j JIS X 0402 data of jigyosyo.zip
 * @return {Promise} void
 */
async function mergeJisx0402(firebase, k, j) {
  const {bucket, logger} = firebase;
  const merged = [
    ...k,
    ...j.filter((item) => !k.some((comp) => comp.code === item.code)),
  ];
  await bucket.file("jisx0402.json").save(JSON.stringify(merged));
  logger.info("merged: jisx0402.json");
  return merged;
}

/**
 * Merge parsed zip data of ken_all.zip and jigyosyo.zip
 * @param {Object} firebase Firebase API
 * @param {Array} jisx0401s JIS X 0402
 * @param {Array} jisx0402s JIS X 0402
 * @param {Array} k Parsed zip data of ken_all.zip
 * @param {Array} j Parsed zip of jigyosyo.zip
 * @return {Promise} void
 */
async function mergeZips(firebase, jisx0401s, jisx0402s, k, j) {
  const {bucket, logger} = firebase;

  const saveMergedSimple = (o) => Object.keys(o).slice(0, 1000).map(
      function(code) {
        let jisx0402 = "";
        let addr1 = "";
        let addr2 = "";
        let name = "";

        try {
          o[code].items.forEach(
              function(item, index) {
                if (index === 0) {
                  jisx0402 = item.jisx0402 || "";
                  addr1 = item.addr1 || "";
                  addr2 = item.addr2 || "";
                  name = item.name || "";
                } else {
                  if (jisx0402 !== item.jisx0402) {
                    jisx0402 = "";
                  }
                  if (addr1 !== item.addr1) {
                    addr1 = "";
                  }
                  if (addr2 !== item.addr2) {
                    addr2 = "";
                  }
                  if (name !== item.name) {
                    name = "";
                  }
                }
              },
          );

          const pref = (jisx0401s.find(
              (item) => item.code === jisx0402.slice(0, 2),
          ) || {name: ""}).name;
          const city = (jisx0402s.find(
              (item) => item.code === jisx0402,
          ) || {name: ""}).name;

          return {code, pref, city, addr1, addr2, name};
        } catch (e) {
          logger.error(e);
          return null;
        }
      },
  ).reduce(
      async function(ret, cur) {
        await ret;
        if (cur) {
          const {code, ...data} = cur;
          return bucket.file(`simple/${code}.json`)
              .save(JSON.stringify(data));
        }
        return null;
      },
      Promise.resolve(),
  );

  await saveMergedSimple(k);
  logger.info("merged: k_zips.json");
  await saveMergedSimple(j);
  logger.info("merged: j_zips.json");
}

/**
 * Get the JSON content of the file at given path of given bucket.
 * @param {Object} bucket
 * @param {string} path
 * @return {any} content
 */
async function getJsonContent(bucket, path) {
  try {
    return JSON.parse(await bucket.file(path).download());
  } catch (e) {
    return null;
  }
}

/**
 * Get and parse ken_all.zip
 * @param {Object} firebase Firebase API
 * @return {Promise} void
 */
async function kenAll(firebase) {
  const {db, bucket} = firebase;
  const {id, csvReader} = await fetchZip(
      firebase, "k", URL_K_PAGE, URL_K_ZIP,
  );

  if (!csvReader) {
    return;
  }

  let jisx0401 = "";
  const jisx0401s = [];
  let jisx0402 = "";
  const jisx0402s = [];
  const zips = {};
  let inside = false;
  let addr1 = "";
  let addr2 = "";
  let note = "";

  for await (const rec of csvReader) {
    if (jisx0401 !== rec[0].slice(0, 2)) {
      jisx0401 = rec[0].slice(0, 2);
      jisx0401s.push({
        code: jisx0401,
        name: rec[6],
        kana: rec[3],
      });
    }

    if (jisx0402 !== rec[0]) {
      jisx0402 = rec[0];
      jisx0402s.push({
        code: jisx0402,
        name: rec[7],
        kana: rec[4],
      });
    }

    if (inside) {
      if (rec[8].match(/）/)) {
        addr2 += rec[8].replace(/）/, "");
        note = "";
        inside = false;
        generateZipRecord(zips, rec[2], {jisx0402, addr1, addr2, note});
      } else {
        addr2 += rec[8];
      }
    } else if (rec[8].match(/（/)) {
      if (rec[8].match(/）/)) {
        addr1 = rec[8].replace(/（.*/, "");
        addr2 = rec[8].replace(/.*（/, "").replace(/）/, "");
        note = "";
        generateZipRecord(zips, rec[2], {jisx0402, addr1, addr2, note});
      } else {
        inside = true;
        addr1 = rec[8].replace(/（.*/, "");
        addr2 = rec[8].replace(/.*（/, "");
      }
    } else {
      addr1 = rec[8];
      addr2 = "";
      note = "";
      generateZipRecord(zips, rec[2], {jisx0402, addr1, addr2, note});
    }
  }

  await saveParsed(firebase, id, jisx0401s, jisx0402s, zips);

  const mergedJisx0401 = await mergeJisx0401(
      firebase,
      jisx0401s,
      await getJsonContent(bucket, "work/j_jisx0401.json") || [],
  );
  const mergedJisx0402 = await mergeJisx0402(
      firebase,
      jisx0402s,
      await getJsonContent(bucket, "work/j_jisx0402.json") || [],
  );
  await mergeZips(
      firebase,
      mergedJisx0401,
      mergedJisx0402,
      zips,
      await getJsonContent(bucket, "work/j_zips.json") || [],
  );

  await db.collection(COLLECTION_ZIP).doc(id).update({mergedAt: new Date()});
}

/**
 * Get and parse jigyosyo.zip
 * @param {Object} firebase Firebase API
 * @return {Promise} void
 */
async function jigyosyo(firebase) {
  const {db, bucket} = firebase;
  const {id, csvReader} = await fetchZip(
      firebase, "j", URL_J_PAGE, URL_J_ZIP,
  );

  if (!csvReader) {
    return;
  }


  let jisx0401 = "";
  const jisx0401s = [];
  let jisx0402 = "";
  const jisx0402s = [];
  const zips = {};

  for await (const rec of csvReader) {
    if (jisx0401 !== rec[0].slice(0, 2)) {
      jisx0401 = rec[0].slice(0, 2);
      jisx0401s.push({
        code: jisx0401,
        name: rec[3],
      });
    }

    if (jisx0402 !== rec[0]) {
      jisx0402 = rec[0];
      jisx0402s.push({
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

    if (zips[rec[7]] && zips[rec[7]].items) {
      zips[rec[7]].items.push(item);
    } else {
      zips[rec[7]] = {items: [item]};
    }
  }

  await saveParsed(firebase, id, jisx0401s, jisx0402s, zips);

  const mergedJisx0401 = await mergeJisx0401(
      firebase,
      await getJsonContent(bucket, "work/k_jisx0401.json") || [],
      jisx0401s,
  );
  const mergedJisx0402 = await mergeJisx0402(
      firebase,
      await getJsonContent(bucket, "work/k_jisx0402.json") || [],
      jisx0402s,
  );
  await mergeZips(
      firebase,
      mergedJisx0401,
      mergedJisx0402,
      await getJsonContent(bucket, "work/k_zips.json") || [],
      zips,
  );

  await db.collection(COLLECTION_ZIP).doc(id).update({mergedAt: new Date()});
}

module.exports = {
  kenAll,
  jigyosyo,
};
