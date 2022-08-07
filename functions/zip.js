const yauzl = require("yauzl-promise");
const iconv = require("iconv-lite");
const axios = require("axios");
const {parse} = require("csv-parse");

const URL_K_PAGE = "https://www.post.japanpost.jp/zipcode/dl/kogaki-zip.html";
const URL_K_ZIP = "https://www.post.japanpost.jp/zipcode/dl/kogaki/zip/ken_all.zip";
const URL_J_PAGE = "https://www.post.japanpost.jp/zipcode/dl/jigyosyo/index-zip.html";
const URL_J_ZIP = "https://www.post.japanpost.jp/zipcode/dl/jigyosyo/zip/jigyosyo.zip";

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
  const collectionZip = "zips";
  const ts = new Date();
  const info = await db.collection(collectionZip)
      .where("type", "==", type)
      .orderBy("ts", "desc")
      .limit(1).get();
  const respPage = await axios.get(pageUrl, {responseType: "arraybuffer"});
  const {createHash} = await require("node:crypto");
  const hashPage = createHash("sha256");
  hashPage.update(Buffer.from(respPage.data));
  const page = hashPage.digest("hex");
  logger.info(page);

  if (info.docs.length == 1 && info.docs[0].get("page") == page) {
    logger.info("skip");
    return {};
  }

  const respZip = await axios.get(zipUrl, {responseType: "arraybuffer"});
  const hashZip = createHash("sha256");
  hashZip.update(Buffer.from(respZip.data));
  const sum = hashZip.digest("hex");
  logger.info(sum);

  if (info.docs.length == 1 && info.docs[0].get("sum") == sum) {
    logger.info("skip");
    return {};
  }

  const id = `${type}${ts.toISOString().replace(/[^0-9]/g, "")}`;
  await bucket.file(`zips/${id}.zip`).save(Buffer.from(respZip.data));
  await db.collection(collectionZip).doc(id).set({type, page, sum, ts});

  const zipFile = await yauzl.fromBuffer(
      Buffer.from(respZip.data),
      {lazyEntries: true},
  );
  const entry = await zipFile.readEntry();
  logger.info(entry.fileName);
  const readStream = await entry.openReadStream();
  const textReader = iconv.decodeStream("Shift_JIS");
  const csvReader = parse();
  textReader.pipe(csvReader);
  readStream.pipe(textReader);

  return {id, csvReader};
}

/**
 * Get and parse ken_all.zip
 * @param {object} firebase Firebase API
 * @return {Promise} void
 */
async function kenAll(firebase) {
  const {csvReader} = await fetchZip(
      firebase, "k", URL_K_PAGE, URL_K_ZIP,
  );

  if (!csvReader) {
    return;
  }

  let i = 0;
  for await (const line of csvReader) {
    if (i++) continue;
    console.log(line);
  }
}

/**
 * Get and parse jigyosyo.zip
 * @param {object} firebase Firebase API
 * @return {Promise} void
 */
async function jigyosyo(firebase) {
  const {csvReader} = await fetchZip(
      firebase, "j", URL_J_PAGE, URL_J_ZIP,
  );

  if (!csvReader) {
    return;
  }

  let i = 0;
  for await (const line of csvReader) {
    if (i++) continue;
    console.log(line);
  }
}

module.exports = {
  kenAll,
  jigyosyo,
};
