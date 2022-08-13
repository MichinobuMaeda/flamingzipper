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

  await db.collection(COLLECTION_ZIP).doc(id).update({
    parsedAt: new Date(),
  });

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
                      const zip1 = code.slice(0, 3);
                      const zip2 = code.slice(3);

                      if (!zips[zip1]) {
                        zips[zip1] = {};
                      }

                      if (!zips[zip1][zip2]) {
                        zips[zip1][zip2] = [];
                      }

                      zips[zip1][zip2].push(item2);
                    },
                );
          },
      );
}

/**
 * Get and parse ken_all.zip
 * @param {Object} firebase Firebase API
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
}

/**
 * Get and parse jigyosyo.zip
 * @param {Object} firebase Firebase API
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

    const zip1 = rec[7].slice(0, 3);
    const zip2 = rec[7].slice(3);

    if (!zips[zip1]) {
      zips[zip1] = {};
    }

    if (!zips[zip1][zip2]) {
      zips[zip1][zip2] = [];
    }

    zips[zip1][zip2].push(item);
  }

  await saveParsed(firebase, id, jisx0401s, jisx0402s, zips);
}

/**
 * Merge JIS X 0401 and 0402 of ken_all and jigyosyo.zip
 * @param {Object} firebase Firebase API
 * @return {Promise} void
 */
async function mergeJisx040x(firebase) {
  const {db, bucket, logger} = firebase;

  const info = await db.collection(COLLECTION_ZIP)
      .orderBy("parsedAt", "desc")
      .limit(1).get();

  if (!info.docs || info.docs[0].get("mergedJisx040xAt")) {
    return;
  }

  const kJisx0401 = await JSON.parse(
      await bucket.file("work/k_jisx0401.json").download(),
  );
  const jJisx0401 = await JSON.parse(
      await bucket.file("work/j_jisx0401.json").download(),
  );

  await bucket.file("jisx0401.json").save(JSON.stringify([
    ...kJisx0401,
    ...jJisx0401
        .filter((item) => !kJisx0401.some((comp) => comp.code === item.code)),
  ]));


  logger.info("merged: jisx0401.json");

  const kJisx0402 = await JSON.parse(
      await bucket.file("work/k_jisx0402.json").download(),
  );
  const jJisx0402 = await JSON.parse(
      await bucket.file("work/j_jisx0402.json").download(),
  );

  await bucket.file("jisx0402.json").save(JSON.stringify([
    ...kJisx0402,
    ...jJisx0402
        .filter((item) => !kJisx0402.some((comp) => comp.code === item.code)),
  ]));

  logger.info("merged: jisx0402.json");

  await db.collection(COLLECTION_ZIP).doc(info.docs[0].id).update({
    mergedJisx040xAt: new Date(),
  });
}

/**
 * Merge data of ken_all and jigyosyo.zip
 * @param {Object} firebase Firebase API
 * @param {String} prefix prefix of zip code of target
 * @return {Promise} void
 */
async function mergeZips(firebase, prefix) {
  const {db, bucket, logger} = firebase;

  const info = await db.collection(COLLECTION_ZIP)
      .orderBy("mergedJisx040xAt", "desc")
      .limit(1).get();

  if (!info.docs || info.docs[0].get(`mergedSimpleZips${prefix}At`)) {
    return;
  }

  const jisx0401s = await JSON.parse(
      await bucket.file("jisx0401.json").download(),
  );
  const jisx0402s = await JSON.parse(
      await bucket.file("jisx0402.json").download(),
  );
  const k = await JSON.parse(
      await bucket.file("work/k_zips.json").download(),
  );
  const j = await JSON.parse(
      await bucket.file("work/j_zips.json").download(),
  );

  const mergeArrays = (a, b) => [...a, ...b.filter((i) => !a.includes(i))];

  await mergeArrays(Object.keys(k), Object.keys(j))
      .filter((zip1) => zip1.startsWith(prefix))
      .map(
          function(zip1) {
            const zip2s = mergeArrays(
                Object.keys(k[zip1] || {}),
                Object.keys(j[zip1] || {}),
            );
            return {
              zip1,
              items: zip2s.reduce(
                  function(ret, zip2) {
                    try {
                      let jisx0402 = "";
                      let addr1 = "";
                      let addr2 = "";
                      let name = "";

                      [
                        ...(k[zip1][zip2] || []),
                        ...(j[zip1][zip2] || []),
                      ].forEach(
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

                      return {...ret, [zip2]: {pref, city, addr1, addr2, name}};
                    } catch (e) {
                      logger.error(e);
                      return null;
                    }
                  },
                  {},
              ),
            };
          },
      ).reduce(
          async function(ret, cur) {
            await ret;
            if (cur) {
              const {zip1, items} = cur;
              return bucket.file(`simple/${zip1}.json`)
                  .save(JSON.stringify(items));
            }
            return null;
          },
          Promise.resolve(),
      );

  logger.info(`merged: simple/${prefix}*.json`);

  await db.collection(COLLECTION_ZIP).doc(info.docs[0].id).update({
    [`mergedSimpleZips${prefix}At`]: new Date(),
  });
}

module.exports = {
  kenAll,
  jigyosyo,
  mergeJisx040x,
  mergeZips,
};
