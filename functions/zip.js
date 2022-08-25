const JSZip = require("jszip");
const iconv = require("iconv-lite");
const axios = require("axios");
const {parse} = require("csv-parse");
const {stringify} =require( "csv-stringify/sync");
const {region} = require("./config");

const URL_PAGE_K = "https://www.post.japanpost.jp/zipcode/dl/kogaki-zip.html";
const URL_PAGE_J = "https://www.post.japanpost.jp/zipcode/dl/jigyosyo/index-zip.html";
const URL_SOURCE_K = "https://www.post.japanpost.jp/zipcode/dl/kogaki/zip/ken_all.zip";
const URL_SOURCE_J = "https://www.post.japanpost.jp/zipcode/dl/jigyosyo/zip/jigyosyo.zip";
const COLLECTION_SOURCES = "sources";
const DOC_CURRENT = "current";

const setTaskQueue = (functions, name, data) => functions
    .taskQueue(`locations/${region}/functions/${name}`).enqueue(data);

/**
 * Get the hash of the page.
 * @param {String} url The URL of the page
 * @return {Promise<Object>} {content, hash}
 */
async function getContent(url) {
  const respPage = await axios.get(url, {responseType: "arraybuffer"});
  const {createHash} = await require("node:crypto");
  const hashPage = createHash("sha256");
  hashPage.update(Buffer.from(respPage.data));
  return {
    data: respPage.data,
    hash: hashPage.digest("hex"),
  };
}

/**
 * Save source.
 * @param {Object} firebase Firebase API
 * @param {String} type "k", "j"
 * @param {Date} ts
 * @param {Object} info {type: {page, source}}
 * @param {Object} page {data, hash}
 * @param {Object} source  {data, hash}
 * @return {Promise<void>}
 */
async function saveSource(firebase, type, ts, info, page, source) {
  const {bucket, logger} = firebase;

  const id = `${type}${ts.toISOString().replace(/[^0-9]/g, "")}`;

  await bucket.file(`sources/${id}.zip`).save(Buffer.from(source.data));

  info[type].id = id;
  info[type].page = page.hash;
  info[type].source = source.hash;
  info[type].savedAt = ts;
  info[type].parsedAt = null;

  logger.info(`saved: ${id}`);
}

/**
 * Get source file.
 * @param {Object} firebase Firebase API
 * @return {Promise<string>} ID of the source file
 */
async function getSources(firebase) {
  const {db, functions, logger} = firebase;

  const doc = await db.collection(COLLECTION_SOURCES).doc(DOC_CURRENT).get();
  const curr = doc.data();

  const pages = {
    k: await getContent(URL_PAGE_K),
    j: await getContent(URL_PAGE_J),
  };

  if (doc.exists &&
      curr.k && curr.j &&
      pages.k.hash === curr.k.page &&
      pages.j.hash === curr.j.page) {
    return;
  }

  const info = {k: {...(curr.k || {})}, j: {...(curr.j || {})}}; // Deep copy

  const sources = {
    k: {hash: curr.k.hash},
    j: {hash: curr.j.hash},
  };

  const ts = new Date();
  let saved = false;

  if (pages.k.hash !== curr.k.page) {
    sources.k = await getContent(URL_SOURCE_K);
    if (sources.k.hash !== curr.k.source) {
      await saveSource(firebase, "k", ts, info, pages.k, sources.k);
      saved = true;
    }
  }

  if (pages.j.hash !== curr.j.page) {
    sources.j = await getContent(URL_SOURCE_J);
    if (sources.j.hash !== curr.j.source) {
      await saveSource(firebase, "j", ts, info, pages.j, sources.j);
      saved = true;
    }
  }

  if (!saved) {
    return;
  }

  if (curr.k && curr.j) {
    const history = curr.k.id.slice(1) > curr.j.id.slice(1) ?
    `h${curr.k.id.slice(1)}` : `h${curr.j.id.slice(1)}`;
    await db.collection(COLLECTION_SOURCES).doc(history).set(curr);
  }

  await db.collection(COLLECTION_SOURCES).doc(DOC_CURRENT).set(info);
  await setTaskQueue(functions, "parseSources", info);
  logger.info("requestd: parseSources()");
}

/**
 * Get data from source.
 * @param {Object} firebase Firebase API
 * @param {string} id ID of the source file
 * @return {Promise} Reader of csv data or null
 */
async function getSourceData(firebase, id) {
  const {bucket, logger} = firebase;

  const source = await bucket.file(`sources/${id}.zip`).download();

  const zip = new JSZip();
  await zip.loadAsync(source[0]);
  const entry = zip.filter(function(relativePath, file) {
    return relativePath.match(/\.CSV$/i) && !file.dir;
  })[0];
  logger.info(`extracted: ${entry.name}`);
  const readStream = entry.nodeStream();

  const textReader = iconv.decodeStream("Shift_JIS");
  const csvReader = parse();
  textReader.pipe(csvReader);
  readStream.pipe(textReader);

  return csvReader;
}

/**
 * Save parsed data.
 * @param {Object} firebase Firebase API
 * @param {string} id ID of the source file
 * @param {Array} jisx0401s List of prefectures
 * @param {Array} jisx0402s List of cities
 * @param {Object} zips List of zips
 * @return {Promise} void
 */
async function saveParsed(firebase, id, jisx0401s, jisx0402s, zips) {
  const {db, bucket, logger} = firebase;
  const type = id.slice(0, 1);

  await bucket.file(`work/${id}_jisx0401.json`).save(JSON.stringify(jisx0401s));
  await bucket.file(`work/${id}_jisx0402.json`).save(JSON.stringify(jisx0402s));
  await bucket.file(`work/${id}_zips.json`).save(JSON.stringify(zips));

  await bucket.file(`work/${id}_jisx0401.json`).copy(
      bucket.file(`work/${type}_jisx0401.json`),
  );
  await bucket.file(`work/${id}_jisx0402.json`).copy(
      bucket.file(`work/${type}_jisx0402.json`),
  );
  await bucket.file(`work/${id}_zips.json`).copy(
      bucket.file(`work/${type}_zips.json`),
  );

  await db.collection(COLLECTION_SOURCES).doc(DOC_CURRENT).update({
    [`${type}.parsedAt`]: new Date(),
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
    item.addr1.match(/場合$/) ||
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
    item.addr2.match(/階層不明$/) ||
    item.addr2.match(/を除く/) ||
    item.addr2.match(/以外$/) ||
    item.addr2.match(/以上$/) ||
    item.addr2.match(/以下$/) ||
    item.addr2.match(/以内$/) ||
    item.addr2.match(/以降$/) ||
    item.addr2.match(/を含む$/) ||
    item.addr2.match(/その他$/) ||
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

  if (item.addr1 === "" && item.addr2 !== "") {
    item.addr1 = item.addr2;
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
 * Get parsed data for marge.
 * @param {Object} firebase Firebase API
 * @param {string} id ID of the source file
 * @return {Object} {id, jisx0401s, jisx0402s, zips}
 */
async function getParsedData(firebase, id) {
  const {bucket} = firebase;
  const type = id.slice(0, 1);
  return {
    id,
    jisx0401s: JSON.parse(
        (await bucket.file(`work/${type}_jisx0401.json`).download())[0],
    ),
    jisx0402s: JSON.parse(
        (await bucket.file(`work/${type}_jisx0402.json`).download())[0],
    ),
    zips: JSON.parse(
        (await bucket.file(`work/${type}_zips.json`).download())[0],
    ),
  };
}

/**
 * Get and parse ken_all.zip
 * @param {Object} firebase Firebase API
 * @param {string} id ID of the source file
 * @return {Promise} void
 */
async function parseSourceK(firebase, id) {
  const csvReader = await getSourceData(firebase, id);

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

  return {id, jisx0401s, jisx0402s, zips};
}

/**
 * Get and parse jigyosyo.zip
 * @param {Object} firebase Firebase API
 * @param {string} id ID of the source file
 * @return {Promise} void
 */
async function parseSourceJ(firebase, id) {
  const csvReader = await getSourceData(firebase, id);

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

  return {id, jisx0401s, jisx0402s, zips};
}

/**
 * Merge arrays to the array of unique values。
 * @param {Array} a
 * @param {Array} b
 * @return {Array}
 */
function mergeArrays(a, b) {
  return [...a, ...b.filter((i) => !a.includes(i))];
}

/**
 * Generate function to reduce data par zip2
 * @param {Object} logger
 * @param {Array} jisx0401s
 * @param {Array} jisx0402s
 * @param {Object} k
 * @param {Object} j
 * @return {function}
 */
function reduceSimpleZip2(logger, jisx0401s, jisx0402s, k, j) {
  return function(zip1) {
    const zip2s = mergeArrays(
        Object.keys(k[zip1] || {}),
        Object.keys(j[zip1] || {}),
    );
    return {
      zip1,
      items: zip2s.reduce(
          function(ret, zip2) {
            let jisx0402 = "";
            let addr1 = "";
            let addr2 = "";
            let name = "";

            [
              ...((k[zip1] || [])[zip2] || []),
              ...((j[zip1] || [])[zip2] || []),
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
                      if (addr1.startsWith(item.addr1)) {
                        addr1 = item.addr1;
                      } else if (!item.addr1.startsWith(addr1)) {
                        addr1 = "";
                      }
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
          },
          {},
      ),
    };
  };
}

/**
 * Parse sources
 * @param {Object} firebase Firebase API
 * @param {Object} data {k, j}
 * @return {Promise} void
 */
async function parseSources(firebase, data) {
  const {db, bucket, functions, logger} = firebase;

  if (data.k.parsedAt && data.j.parsedAt) {
    return;
  }

  logger.info(`k: ${data.k.id}, j: ${data.j.id}`);

  const parsedK = data.k.parsedAt ?
    await getParsedData(firebase, data.k.id) :
    await parseSourceK(firebase, data.k.id);
  const parsedJ = data.j.parsedAt ?
    await getParsedData(firebase, data.j.id) :
    await parseSourceJ(firebase, data.j.id);

  const jisx0401s = [
    ...parsedK.jisx0401s,
    ...parsedJ.jisx0401s.filter(
        (item) => !parsedK.jisx0401s.some((comp) => comp.code === item.code),
    ),
  ];

  await bucket.file("jisx0401.json").save(JSON.stringify(jisx0401s));
  await bucket.file("jisx0401.json").makePublic();
  logger.info("merged: jisx0401.json");

  const jisx0402s = [
    ...parsedK.jisx0402s,
    ...parsedJ.jisx0402s.filter(
        (item) => !parsedK.jisx0402s.some((comp) => comp.code === item.code),
    ),
  ];

  await bucket.file("jisx0402.json").save(JSON.stringify(jisx0402s));
  await bucket.file("jisx0402.json").makePublic();
  logger.info("merged: jisx0402.json");

  const k = parsedK.zips;
  const j = parsedJ.zips;

  const records = [];

  mergeArrays(Object.keys(k), Object.keys(j))
      .map(reduceSimpleZip2(logger, jisx0401s, jisx0402s, k, j))
      .forEach(
          function({zip1, items}) {
            Object.keys(items).forEach(
                function(zip2) {
                  const zip = `${zip1}${zip2}`;
                  const {pref, city, addr1, addr2, name} = items[zip2];
                  records.push([zip, pref, city, addr1, addr2, name]);
                },
            );
          },
      );

  const json = bucket.file("simple.json");
  await json.save(JSON.stringify(records.map(
      ([zip, pref, city, addr1, addr2, name]) => ({
        zip, pref, city, addr1, addr2, name,
      })),
  ));

  logger.info("saved: simple.json");

  const csvOptions = {
    quoted: true,
    quoted_empty: true,
    record_delimiter: "windows",
  };

  const csvUtf8 = bucket.file("simple_utf8.csv");
  await csvUtf8.save(stringify(records, csvOptions));

  logger.info("saved: simple_utf8.csv");

  const csvSjis = bucket.file("simple_sjis.csv");
  await csvSjis.save(
      iconv.encode(
          stringify(records, csvOptions), "Shift_JIS",
      ),
  );

  logger.info("saved: simple_sjis.csv");

  const zipImage = new JSZip();

  records.forEach(
      function([zip, pref, city, addr1, addr2, name]) {
        zipImage.file(
            `${zip}.json`,
            JSON.stringify({pref, city, addr1, addr2, name}),
        );
      },
  );

  const zipData = await zipImage.generateAsync({type: "uint8array"});
  const file = bucket.file("simple.zip");
  await file.save(zipData);

  logger.info("saved: simple.zip");

  const ts = new Date();
  const prefix = ts.toISOString().replace(/[^0-9]/g, "");

  const saveHistory = (path) =>
    bucket.file(path).copy(bucket.file(`history/${prefix}_${path}`));

  await bucket.file("update.txt").save(prefix);
  await bucket.file("update.txt").makePublic();

  await saveHistory("simple.json");
  await saveHistory("simple_utf8.csv");
  await saveHistory("simple_sjis.csv");
  await saveHistory("simple.zip");

  await db.collection(COLLECTION_SOURCES).doc(DOC_CURRENT).update({
    mergedAt: ts,
  });

  await Promise.all(
      Array.from(Array(10).keys())
          .map((prefix) => `${prefix}`)
          .map((prefix) => setTaskQueue(functions, "generateSample", {
            k: {id: data.k.id},
            j: {id: data.j.id},
            prefix,
          }),
          ),
  );

  logger.info("requestd: generateSample()");
}

/**
 * Generate sample json files.
 * @param {Object} firebase Firebase API
 * @param {Object} data {k, j, prefix}
 * @return {Promise} void
 */
async function generateSample(firebase, data) {
  const {db, bucket, logger} = firebase;

  const jisx0401s= JSON.parse(await bucket.file("jisx0401.json").download());
  const jisx0402s= JSON.parse(await bucket.file("jisx0402.json").download());
  const k= JSON.parse(await bucket.file("work/k_zips.json").download());
  const j= JSON.parse(await bucket.file("work/j_zips.json").download());

  await mergeArrays(Object.keys(k), Object.keys(j))
      .filter((zip1) => zip1.startsWith(data.prefix))
      .map(reduceSimpleZip2(logger, jisx0401s, jisx0402s, k, j))
      .reduce(
          async function(ret, cur) {
            await ret;
            if (cur) {
              const {zip1, items} = cur;
              const file = bucket.file(`simple/${zip1}.json`);
              await file.save(JSON.stringify(items));
              await file.makePublic();
            }
            return null;
          },
          Promise.resolve(),
      );

  logger.info(`generated: simple/${data.prefix}??.json`);

  const ts = new Date();

  await db.collection(COLLECTION_SOURCES).doc(DOC_CURRENT).update({
    [`generatedSample${data.prefix}At`]: ts,
  });
}

/**
 * Report status of getSources, parseSources and generateSample.
 * @param {Object} firebase Firebase API
 * @param {Object} config The runtime configuration of Functions
 * @return {Promise} void
 */
async function reportStatus(firebase, config) {
  const {db, logger} = firebase;

  const ts = new Date();

  const doc = await db.collection(COLLECTION_SOURCES).doc(DOC_CURRENT).get();

  if (!doc.exists || doc.get("reportedAt")) {
    return;
  }

  let status = "SUCCESS";
  const report = [];
  const data = doc.data();

  report.push("--");
  ["k", "j"].forEach(
      function(type) {
        ["savedAt", "parsedAt"].forEach(
            function(field) {
              const val = data[type][field];
              if (val && val.toDate) {
                report.push(`${type}.${field}: ${val.toDate().toISOString()}`);
              } else {
                report.push(`${type}.${field}: error`);
                status = "ERROR";
              }
            },
        );
      },
  );

  [
    "mergedAt",
    "generatedSample0At",
    "generatedSample1At",
    "generatedSample2At",
    "generatedSample3At",
    "generatedSample4At",
    "generatedSample5At",
    "generatedSample6At",
    "generatedSample7At",
    "generatedSample8At",
    "generatedSample9At",
  ].forEach(
      function(field) {
        if (data[field] && data[field].toDate) {
          report.push(`${field}: ${data[field].toDate().toISOString()}`);
        } else {
          report.push(`${field}: error`);
          status = "ERROR";
        }
      },
  );
  report.push("--");

  logger.info(`status: ${status}`);

  const admins = await db.collection("groups").doc("admins").get();
  const to = (await Promise.all(
      (admins.get("accounts") || []).map(
          async function(id) {
            const account = await db.collection("accounts").doc(id).get();
            return account.get("email");
          },
      ),
  )).filter((email) => email);

  if (!to.length) {
    to.push(config.email.sender);
  }
  const subject = `[flamingzipper] status: ${status}`;
  const text = `
${ts.toISOString()}
${report.join("\n")}
`;

  await db.collection("mail")
      .doc(ts.toISOString().replace(/[^0-9]/g, ""))
      .set({
        to,
        message: {subject, text},
        type: "status",
        createdAt: ts,
      });

  await db.collection(COLLECTION_SOURCES).doc(DOC_CURRENT).update({
    reportedAt: ts,
  });
}

module.exports = {
  getSources,
  parseSources,
  generateSample,
  reportStatus,
};
