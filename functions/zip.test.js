const {readFile /* , writeFile */} = require("node:fs/promises");
const JSZip = require("jszip");
const axios = require("axios");
jest.mock("axios");
const path = require("path");

const {
  createFirestoreDocSnapMock,
  createMockFirebase,
} = require("./testutils");
const {
  getSources,
  parseSources,
  generateSample,
  reportStatus,
} = require("./zip");

const {
  firebase,
  mockDoc,
  mockDocRef,
  // mockQueryRef,
  mockCollection,
  // mockCollectionRef,
  mockBucketFile,
  mockBucketFileSave,
  mockBucketFileDownload,
  mockTaskQueue,
} = createMockFirebase(jest);

const pathData = path.join(__dirname, "..", "test", "data");
// const pathTmp = path.join(__dirname, "..", "tmp");

afterEach(async function() {
  jest.clearAllMocks();
});

const COLLECTION_SOURCES = "sources";
const DOC_CURRENT = "current";

/**
 * Test data: archives
 * @return {Object}
 */
async function createArchiveData() {
  const {createHash} = await require("node:crypto");
  const pageDataK = "test page data K";
  const pageDataJ = "test page data J";
  const hashPageK = createHash("sha256");
  const hashPageJ = createHash("sha256");
  hashPageK.update(new TextEncoder().encode(pageDataK));
  hashPageJ.update(new TextEncoder().encode(pageDataJ));
  const pageHashK = hashPageK.digest("hex");
  const pageHashJ = hashPageJ.digest("hex");

  const zipK = new JSZip();
  const zipJ = new JSZip();
  zipK.file(
      "KEN_ALL.CSV",
      await readFile(path.join(pathData, "KEN_ALL.CSV")),
  );
  zipJ.file(
      "JIGYOSYO.CSV",
      await readFile(path.join(pathData, "JIGYOSYO.CSV")),
  );
  const zipDataK = await zipK.generateAsync({type: "uint8array"});
  const zipDataJ = await zipJ.generateAsync({type: "uint8array"});
  const hashZipK = createHash("sha256");
  const hashZipJ = createHash("sha256");
  hashZipK.update(zipDataK);
  hashZipJ.update(zipDataJ);
  const zipHashK = hashZipK.digest("hex");
  const zipHashJ = hashZipJ.digest("hex");

  return {
    pageDataK,
    pageDataJ,
    zipDataK,
    zipDataJ,
    pageHashK,
    pageHashJ,
    zipHashK,
    zipHashJ,
  };
}

describe("getSources", function() {
  it("ignores pages with sum saved.", async function() {
    const {
      pageDataK,
      pageDataJ,
      pageHashK,
      pageHashJ,
    } = await createArchiveData();

    const doc = createFirestoreDocSnapMock(jest, DOC_CURRENT);
    doc.data.mockReturnValue({
      k: {
        id: "k20200101000000000000",
        page: pageHashK,
      },
      j: {
        id: "j20200101000000000001",
        page: pageHashJ,
      },
    });
    mockDocRef.get.mockResolvedValueOnce(doc);

    axios.get
        .mockResolvedValueOnce({data: new TextEncoder().encode(pageDataK)})
        .mockResolvedValueOnce({data: new TextEncoder().encode(pageDataJ)});

    await getSources(firebase);

    expect(mockCollection.mock.calls[0]).toEqual([COLLECTION_SOURCES]);
    expect(mockDoc.mock.calls[0]).toEqual([DOC_CURRENT]);

    expect(mockCollection.mock.calls).toHaveLength(1);
    expect(mockDoc.mock.calls).toHaveLength(1);
    expect(mockBucketFileSave.mock.calls).toHaveLength(0);
    expect(mockDocRef.set.mock.calls).toHaveLength(0);
    expect(mockTaskQueue.enqueue.mock.calls).toHaveLength(0);
    expect(firebase.logger.info.mock.calls).toHaveLength(0);
  });

  it("ignores the zips with sum saved.", async function() {
    const {
      pageDataK,
      pageDataJ,
      zipDataK,
      zipDataJ,
      zipHashK,
      zipHashJ,
    } = await createArchiveData();

    const doc = createFirestoreDocSnapMock(jest, DOC_CURRENT);
    doc.data.mockReturnValue({
      k: {
        id: "k20200101000000000000",
        page: "test",
        source: zipHashK,
      },
      j: {
        id: "j20200101000000000001",
        page: "test",
        source: zipHashJ,
      },
    });
    mockDocRef.get.mockResolvedValueOnce(doc);

    axios.get
        .mockResolvedValueOnce({data: new TextEncoder().encode(pageDataK)})
        .mockResolvedValueOnce({data: new TextEncoder().encode(pageDataJ)})
        .mockResolvedValueOnce({data: zipDataK.buffer})
        .mockResolvedValueOnce({data: zipDataJ.buffer});

    await getSources(firebase);

    expect(mockCollection.mock.calls[0]).toEqual([COLLECTION_SOURCES]);
    expect(mockDoc.mock.calls[0]).toEqual([DOC_CURRENT]);

    expect(mockCollection.mock.calls).toHaveLength(1);
    expect(mockDoc.mock.calls).toHaveLength(1);
    expect(mockBucketFileSave.mock.calls).toHaveLength(0);
    expect(mockDocRef.set.mock.calls).toHaveLength(0);
    expect(mockTaskQueue.enqueue.mock.calls).toHaveLength(0);
    expect(firebase.logger.info.mock.calls).toHaveLength(0);
  });

  it("gets new ken_all.zip without saved data.", async function() {
    const {
      pageDataK,
      pageDataJ,
      zipDataK,
      pageHashK,
      pageHashJ,
      zipHashK,
      zipHashJ,
    } = await createArchiveData();

    const curr = {
      k: {
        id: "k20200101000000000000",
        page: "test",
        source: "test",
        savedAt: new Date(),
        parsedAt: new Date(),
      },
      j: {
        id: "j20200101000000000001",
        page: pageHashJ,
        source: zipHashJ,
        savedAt: new Date(),
        parsedAt: new Date(),
      },
    };
    const doc = createFirestoreDocSnapMock(jest, "current");
    doc.data.mockReturnValue(curr);
    mockDocRef.get.mockResolvedValueOnce(doc);

    axios.get
        .mockResolvedValueOnce({data: new TextEncoder().encode(pageDataK)})
        .mockResolvedValueOnce({data: new TextEncoder().encode(pageDataJ)})
        .mockResolvedValueOnce({data: zipDataK.buffer});

    await getSources(firebase);


    expect(mockCollection.mock.calls[0]).toEqual([COLLECTION_SOURCES]);
    expect(mockDoc.mock.calls[0]).toEqual([DOC_CURRENT]);

    expect(mockBucketFileSave.mock.calls[0]).toEqual(
        [expect.any(Buffer)],
    );

    expect(firebase.logger.info.mock.calls[0]).toEqual(
        [expect.stringMatching(/^saved: k[0-9]+$/)],
    );

    expect(mockCollection.mock.calls[1]).toEqual([COLLECTION_SOURCES]);
    expect(mockDoc.mock.calls[1]).toEqual(["h20200101000000000001"]);
    expect(mockDocRef.set.mock.calls[0]).toEqual([curr]);

    const docNew = {
      k: {
        id: expect.stringMatching(/^k[0-9]+$/),
        page: pageHashK,
        source: zipHashK,
        savedAt: expect.any(Date),
        parsedAt: null,
      },
      j: {
        id: "j20200101000000000001",
        page: pageHashJ,
        source: zipHashJ,
        savedAt: expect.any(Date),
        parsedAt: expect.any(Date),
      },
    };
    expect(mockCollection.mock.calls[2]).toEqual([COLLECTION_SOURCES]);
    expect(mockDoc.mock.calls[2]).toEqual([DOC_CURRENT]);
    expect(mockDocRef.set.mock.calls[1]).toEqual([docNew]);

    expect(mockTaskQueue.enqueue.mock.calls[0]).toEqual([docNew]);

    expect(firebase.logger.info.mock.calls[1]).toEqual(
        ["requestd: parseSources()"],
    );

    expect(mockCollection.mock.calls).toHaveLength(3);
    expect(mockDoc.mock.calls).toHaveLength(3);
    expect(mockDocRef.set.mock.calls).toHaveLength(2);
    expect(mockBucketFileSave.mock.calls).toHaveLength(1);
    expect(firebase.logger.info.mock.calls).toHaveLength(2);
    expect(mockTaskQueue.enqueue.mock.calls).toHaveLength(1);
  });

  it("gets new jigyosyo.zip without saved data.", async function() {
    const {
      pageDataK,
      pageDataJ,
      zipDataJ,
      pageHashK,
      pageHashJ,
      zipHashK,
      zipHashJ,
    } = await createArchiveData();

    const curr = {
      k: {
        id: "k20200101000000000002",
        page: pageHashK,
        source: zipHashK,
        savedAt: new Date(),
        parsedAt: new Date(),
      },
      j: {
        id: "j20200101000000000001",
        page: "test",
        source: "test",
        savedAt: new Date(),
        parsedAt: new Date(),
      },
    };
    const doc = createFirestoreDocSnapMock(jest, "current");
    doc.data.mockReturnValue(curr);
    mockDocRef.get.mockResolvedValueOnce(doc);

    axios.get
        .mockResolvedValueOnce({data: new TextEncoder().encode(pageDataK)})
        .mockResolvedValueOnce({data: new TextEncoder().encode(pageDataJ)})
        .mockResolvedValueOnce({data: zipDataJ.buffer});

    await getSources(firebase);


    expect(mockCollection.mock.calls[0]).toEqual([COLLECTION_SOURCES]);
    expect(mockDoc.mock.calls[0]).toEqual([DOC_CURRENT]);

    expect(mockBucketFileSave.mock.calls[0]).toEqual(
        [expect.any(Buffer)],
    );

    expect(firebase.logger.info.mock.calls[0]).toEqual(
        [expect.stringMatching(/^saved: j[0-9]+$/)],
    );

    expect(mockCollection.mock.calls[1]).toEqual([COLLECTION_SOURCES]);
    expect(mockDoc.mock.calls[1]).toEqual(["h20200101000000000002"]);
    expect(mockDocRef.set.mock.calls[0]).toEqual([curr]);

    const docNew = {
      k: {
        id: "k20200101000000000002",
        page: pageHashK,
        source: zipHashK,
        savedAt: expect.any(Date),
        parsedAt: expect.any(Date),
      },
      j: {
        id: expect.stringMatching(/^j[0-9]+$/),
        page: pageHashJ,
        source: zipHashJ,
        savedAt: expect.any(Date),
        parsedAt: null,
      },
    };
    expect(mockCollection.mock.calls[2]).toEqual([COLLECTION_SOURCES]);
    expect(mockDoc.mock.calls[2]).toEqual([DOC_CURRENT]);
    expect(mockDocRef.set.mock.calls[1]).toEqual([docNew]);

    expect(mockTaskQueue.enqueue.mock.calls[0]).toEqual([docNew]);

    expect(firebase.logger.info.mock.calls[1]).toEqual(
        ["requestd: parseSources()"],
    );

    expect(mockCollection.mock.calls).toHaveLength(3);
    expect(mockDoc.mock.calls).toHaveLength(3);
    expect(mockDocRef.set.mock.calls).toHaveLength(2);
    expect(mockBucketFileSave.mock.calls).toHaveLength(1);
    expect(firebase.logger.info.mock.calls).toHaveLength(2);
    expect(mockTaskQueue.enqueue.mock.calls).toHaveLength(1);
  });
});

describe("parseSources", function() {
  it("ignores parsed data.", async function() {
    await parseSources(
        firebase,
        {
          k: {
            id: "k20200101000000000000",
            savedAt: new Date(),
            parsedAt: new Date(),
          },
          j: {
            id: "j20200101000000000001",
            savedAt: new Date(),
            parsedAt: new Date(),
          },
        },
    );

    expect(mockBucketFile.mock.calls).toHaveLength(0);
    expect(mockDoc.mock.calls).toHaveLength(0);
    expect(mockDocRef.update.mock.calls).toHaveLength(0);
    expect(firebase.logger.info.mock.calls).toHaveLength(0);
    expect(mockTaskQueue.enqueue.mock.calls).toHaveLength(0);
  });

  it("parses new ken_all.zip.", async function() {
    const {zipDataK} = await createArchiveData();

    mockBucketFileDownload
        // getSourceData
        .mockResolvedValueOnce([Buffer.from(zipDataK)])
        // getParsedData
        .mockResolvedValueOnce(
            [await readFile(path.join(pathData, "j_jisx0401.json"))])
        .mockResolvedValueOnce(
            [await readFile(path.join(pathData, "j_jisx0402.json"))])
        .mockResolvedValueOnce(
            [await readFile(path.join(pathData, "j_zips.json"))]);

    await parseSources(
        firebase,
        {
          k: {
            id: "k20200101000000000000",
            savedAt: new Date(),
            parsedAt: null,
          },
          j: {
            id: "j20200101000000000001",
            savedAt: new Date(),
            parsedAt: new Date(),
          },
        },
    );

    expect(mockBucketFile.mock.calls).toEqual([
      // getSourceInfo
      [expect.stringMatching(/sources\/k[0-9]+.zip/)],
      // saveParsed
      [expect.stringMatching(/work\/k[0-9]+_jisx0401.json/)],
      [expect.stringMatching(/work\/k[0-9]+_jisx0402.json/)],
      [expect.stringMatching(/work\/k[0-9]+_zips.json/)],
      [expect.stringMatching(/work\/k[0-9]+_jisx0401.json/)],
      ["work/k_jisx0401.json"],
      [expect.stringMatching(/work\/k[0-9]+_jisx0402.json/)],
      ["work/k_jisx0402.json"],
      [expect.stringMatching(/work\/k[0-9]+_zips.json/)],
      ["work/k_zips.json"],
      // getParsedData
      ["work/j_jisx0401.json"],
      ["work/j_jisx0402.json"],
      ["work/j_zips.json"],
      ["jisx0401.json"],
      ["jisx0401.json"],
      ["jisx0402.json"],
      ["jisx0402.json"],
      ["simple.json"],
      ["simple_utf8.csv"],
      ["simple_sjis.csv"],
      ["simple.zip"],
      ["update.txt"],
      ["update.txt"],
      // saveHistory
      ["simple.json"],
      [expect.stringMatching(/history\/[0-9]+_simple.json/)],
      ["simple_utf8.csv"],
      [expect.stringMatching(/history\/[0-9]+_simple_utf8.csv/)],
      ["simple_sjis.csv"],
      [expect.stringMatching(/history\/[0-9]+_simple_sjis.csv/)],
      ["simple.zip"],
      [expect.stringMatching(/history\/[0-9]+_simple.zip/)],
    ]);

    expect(mockDoc.mock.calls).toEqual([
      ["current"],
      ["current"],
    ]);

    expect(mockDocRef.update.mock.calls).toEqual([
      [{["k.parsedAt"]: expect.any(Date)}],
      [{mergedAt: expect.any(Date)}],
    ]);

    expect(firebase.logger.info.mock.calls).toEqual([
      [expect.stringMatching(/k: k[0-9]+, j: j[0-9]+/)],
      ["extracted: KEN_ALL.CSV"],
      [expect.stringContaining("parsed: k")],
      ["merged: jisx0401.json"],
      ["merged: jisx0402.json"],
      ["saved: simple.json"],
      ["saved: simple_utf8.csv"],
      ["saved: simple_sjis.csv"],
      ["saved: simple.zip"],
      ["requestd: generateSample()"],
    ]);

    const orderBy = (field) => (a, b) => a[field] === b[field] ?
          0 : a[field] < b[field] ? -1 : 1;

    const saved101 = JSON.parse(mockBucketFileSave.mock.calls[0][0])
        .map((item) => ({code: item.code, name: item.name}));
    const comp101 = JSON
        .parse(await readFile(path.join(pathData, "k_jisx0401.json")))
        .map((item) => ({code: item.code, name: item.name}));
    const saved102 = JSON.parse(mockBucketFileSave.mock.calls[1][0])
        .map((item) => ({code: item.code, name: item.name}));
    const comp102 = JSON
        .parse(await readFile(path.join(pathData, "k_jisx0402.json")))
        .map((item) => ({code: item.code, name: item.name}));
    const savedZips = JSON.parse(mockBucketFileSave.mock.calls[2][0]);
    const compZips = JSON
        .parse(await readFile(path.join(pathData, "k_zips.json")));

    saved101.sort(orderBy("code"));
    comp101.sort(orderBy("code"));
    saved102.sort(orderBy("code"));
    comp102.sort(orderBy("code"));

    expect(saved101).toEqual(comp101);
    expect(saved102).toEqual(comp102);
    expect(savedZips).toEqual(compZips);

    const saved101Merged = JSON.parse(mockBucketFileSave.mock.calls[3][0])
        .map((item) => ({code: item.code, name: item.name}));
    const comp101Merged = JSON
        .parse(await readFile(path.join(pathData, "jisx0401.json")))
        .map((item) => ({code: item.code, name: item.name}));
    const saved102Merged = JSON.parse(mockBucketFileSave.mock.calls[4][0])
        .map((item) => ({code: item.code, name: item.name}));
    const comp102Merged = JSON
        .parse(await readFile(path.join(pathData, "jisx0402.json")))
        .map((item) => ({code: item.code, name: item.name}));
    const savedZipsMerged = JSON.parse(mockBucketFileSave.mock.calls[5][0]);
    const compZipsMerged = JSON
        .parse(await readFile(path.join(pathData, "simple.json")));

    saved101Merged.sort(orderBy("code"));
    comp101Merged.sort(orderBy("code"));
    saved102Merged.sort(orderBy("code"));
    comp102Merged.sort(orderBy("code"));
    savedZipsMerged.sort(orderBy("zip"));
    compZipsMerged.sort(orderBy("zip"));

    expect(saved101Merged).toEqual(comp101Merged);
    expect(saved102Merged).toEqual(comp102Merged);
    expect(savedZipsMerged).toEqual(compZipsMerged);

    expect(mockBucketFileSave.mock.calls).toHaveLength(10);

    expect(mockTaskQueue.enqueue.mock.calls[0]).toEqual([
      {
        k: {id: "k20200101000000000000"},
        j: {id: "j20200101000000000001"},
        prefix: "0",
      },
    ]);

    expect(mockTaskQueue.enqueue.mock.calls[9]).toEqual([
      {
        k: {id: "k20200101000000000000"},
        j: {id: "j20200101000000000001"},
        prefix: "9",
      },
    ]);
    expect(mockTaskQueue.enqueue.mock.calls).toHaveLength(10);
  });

  it("parses new jigyosyo.zip.", async function() {
    const {zipDataJ} = await createArchiveData();

    mockBucketFileDownload
        // getParsedData
        .mockResolvedValueOnce(
            [await readFile(path.join(pathData, "k_jisx0401.json"))])
        .mockResolvedValueOnce(
            [await readFile(path.join(pathData, "k_jisx0402.json"))])
        .mockResolvedValueOnce(
            [await readFile(path.join(pathData, "k_zips.json"))])
        // getSourceData
        .mockResolvedValueOnce([Buffer.from(zipDataJ)]);

    await parseSources(
        firebase,
        {
          k: {
            id: "k20200101000000000000",
            savedAt: new Date(),
            parsedAt: new Date(),
          },
          j: {
            id: "j20200101000000000001",
            savedAt: new Date(),
            parsedAt: null,
          },
        },
    );

    expect(mockBucketFile.mock.calls).toEqual([
      // getParsedData
      ["work/k_jisx0401.json"],
      ["work/k_jisx0402.json"],
      ["work/k_zips.json"],
      // getSourceInfo
      [expect.stringMatching(/sources\/j[0-9]+.zip/)],
      // saveParsed
      [expect.stringMatching(/work\/j[0-9]+_jisx0401.json/)],
      [expect.stringMatching(/work\/j[0-9]+_jisx0402.json/)],
      [expect.stringMatching(/work\/j[0-9]+_zips.json/)],
      [expect.stringMatching(/work\/j[0-9]+_jisx0401.json/)],
      ["work/j_jisx0401.json"],
      [expect.stringMatching(/work\/j[0-9]+_jisx0402.json/)],
      ["work/j_jisx0402.json"],
      [expect.stringMatching(/work\/j[0-9]+_zips.json/)],
      ["work/j_zips.json"],
      ["jisx0401.json"],
      ["jisx0401.json"],
      ["jisx0402.json"],
      ["jisx0402.json"],
      ["simple.json"],
      ["simple_utf8.csv"],
      ["simple_sjis.csv"],
      ["simple.zip"],
      ["update.txt"],
      ["update.txt"],
      // saveHistory
      ["simple.json"],
      [expect.stringMatching(/history\/[0-9]+_simple.json/)],
      ["simple_utf8.csv"],
      [expect.stringMatching(/history\/[0-9]+_simple_utf8.csv/)],
      ["simple_sjis.csv"],
      [expect.stringMatching(/history\/[0-9]+_simple_sjis.csv/)],
      ["simple.zip"],
      [expect.stringMatching(/history\/[0-9]+_simple.zip/)],
    ]);

    expect(mockDoc.mock.calls).toEqual([
      ["current"],
      ["current"],
    ]);

    expect(mockDocRef.update.mock.calls).toEqual([
      [{["j.parsedAt"]: expect.any(Date)}],
      [{mergedAt: expect.any(Date)}],
    ]);

    expect(firebase.logger.info.mock.calls).toEqual([
      [expect.stringMatching(/k: k[0-9]+, j: j[0-9]+/)],
      ["extracted: JIGYOSYO.CSV"],
      [expect.stringContaining("parsed: j")],
      ["merged: jisx0401.json"],
      ["merged: jisx0402.json"],
      ["saved: simple.json"],
      ["saved: simple_utf8.csv"],
      ["saved: simple_sjis.csv"],
      ["saved: simple.zip"],
      ["requestd: generateSample()"],
    ]);

    const orderBy = (field) => (a, b) => a[field] === b[field] ?
            0 : a[field] < b[field] ? -1 : 1;

    const saved101 = JSON.parse(mockBucketFileSave.mock.calls[0][0])
        .map((item) => ({code: item.code, name: item.name}));
    const comp101 = JSON
        .parse(await readFile(path.join(pathData, "j_jisx0401.json")))
        .map((item) => ({code: item.code, name: item.name}));
    const saved102 = JSON.parse(mockBucketFileSave.mock.calls[1][0])
        .map((item) => ({code: item.code, name: item.name}));
    const comp102 = JSON
        .parse(await readFile(path.join(pathData, "j_jisx0402.json")))
        .map((item) => ({code: item.code, name: item.name}));
    const savedZips = JSON.parse(mockBucketFileSave.mock.calls[2][0]);
    const compZips = JSON
        .parse(await readFile(path.join(pathData, "j_zips.json")));

    saved101.sort(orderBy("code"));
    comp101.sort(orderBy("code"));
    saved102.sort(orderBy("code"));
    comp102.sort(orderBy("code"));

    expect(saved101).toEqual(comp101);
    expect(saved102).toEqual(comp102);
    expect(savedZips).toEqual(compZips);

    const saved101Merged = JSON.parse(mockBucketFileSave.mock.calls[3][0])
        .map((item) => ({code: item.code, name: item.name}));
    const comp101Merged = JSON
        .parse(await readFile(path.join(pathData, "jisx0401.json")))
        .map((item) => ({code: item.code, name: item.name}));
    const saved102Merged = JSON.parse(mockBucketFileSave.mock.calls[4][0])
        .map((item) => ({code: item.code, name: item.name}));
    const comp102Merged = JSON
        .parse(await readFile(path.join(pathData, "jisx0402.json")))
        .map((item) => ({code: item.code, name: item.name}));
    const savedZipsMerged = JSON.parse(mockBucketFileSave.mock.calls[5][0]);
    const compZipsMerged = JSON
        .parse(await readFile(path.join(pathData, "simple.json")));

    saved101Merged.sort(orderBy("code"));
    comp101Merged.sort(orderBy("code"));
    saved102Merged.sort(orderBy("code"));
    comp102Merged.sort(orderBy("code"));
    savedZipsMerged.sort(orderBy("zip"));
    compZipsMerged.sort(orderBy("zip"));

    expect(saved101Merged).toEqual(comp101Merged);
    expect(saved102Merged).toEqual(comp102Merged);
    expect(savedZipsMerged).toEqual(compZipsMerged);

    expect(mockBucketFileSave.mock.calls).toHaveLength(10);

    expect(mockTaskQueue.enqueue.mock.calls[0]).toEqual([
      {
        k: {id: "k20200101000000000000"},
        j: {id: "j20200101000000000001"},
        prefix: "0",
      },
    ]);

    expect(mockTaskQueue.enqueue.mock.calls[9]).toEqual([
      {
        k: {id: "k20200101000000000000"},
        j: {id: "j20200101000000000001"},
        prefix: "9",
      },
    ]);
    expect(mockTaskQueue.enqueue.mock.calls).toHaveLength(10);
  });
});

describe("generateSample", function() {
  it("generates sample json files.", async function() {
    Array.from(Array(10).keys()).reduce(
        function(ret) {
          ret
              .mockReturnValueOnce(
                  readFile(path.join(pathData, "jisx0401.json")),
              )
              .mockReturnValueOnce(
                  readFile(path.join(pathData, "jisx0402.json")),
              )
              .mockReturnValueOnce(
                  readFile(path.join(pathData, "k_zips.json")),
              )
              .mockReturnValueOnce(
                  readFile(path.join(pathData, "j_zips.json")),
              );
          return ret;
        },
        mockBucketFileDownload,
    );

    const data = {
      k: {id: "k20200101000000000000"},
      j: {id: "j20200101000000000001"},
    };
    await generateSample(firebase, {...data, prefix: "0"});
    await generateSample(firebase, {...data, prefix: "1"});
    await generateSample(firebase, {...data, prefix: "2"});
    await generateSample(firebase, {...data, prefix: "3"});
    await generateSample(firebase, {...data, prefix: "4"});
    await generateSample(firebase, {...data, prefix: "5"});
    await generateSample(firebase, {...data, prefix: "6"});
    await generateSample(firebase, {...data, prefix: "7"});
    await generateSample(firebase, {...data, prefix: "8"});
    await generateSample(firebase, {...data, prefix: "9"});

    expect(firebase.logger.info.mock.calls).toEqual([
      ["generated: simple/0??.json"],
      ["generated: simple/1??.json"],
      ["generated: simple/2??.json"],
      ["generated: simple/3??.json"],
      ["generated: simple/4??.json"],
      ["generated: simple/5??.json"],
      ["generated: simple/6??.json"],
      ["generated: simple/7??.json"],
      ["generated: simple/8??.json"],
      ["generated: simple/9??.json"],
    ]);

    const zip1s = mockBucketFile.mock.calls
        .map((item) => item[0].replace(/[^0-9]/g, ""))
        .filter((zip1) => zip1.length === 3);
    console.log(zip1s);
    const output = mockBucketFileSave.mock.calls.reduce(
        function(ret, cur, index) {
          const zip1 = zip1s[index];
          const data = JSON.parse(cur[0]);
          return {
            ...ret,
            [zip1]: data,
          };
        },
        {},
    );

    // await writeFile(
    //     path.join(pathTmp, "sample.json"),
    //     JSON.stringify(output),
    // );
    expect(output).toEqual(
        JSON.parse(await readFile(path.join(pathData, "sample.json"))),
    );
  });
});

const createTimestamp = (str) => ({toDate: () => new Date(str)});

describe("reportStatus", function() {
  it("do nothng without records.", async function() {
    mockDocRef.get.mockResolvedValueOnce({exists: false});

    await reportStatus(firebase, {email: {sender: "sender@example.com"}});

    expect(firebase.logger.info.mock.calls).toEqual([]);
  });

  it("do nothng for a reported record.", async function() {
    const info = createFirestoreDocSnapMock(jest, DOC_CURRENT);
    info.data.mockReturnValue({
      "k": {
        id: "k20200101000000000000",
        page: "test page k",
        source: "test source k",
        savedAt: createTimestamp("2022-01-01T00:00:00.000Z"),
        parsedAt: createTimestamp("2022-01-01T00:00:00.001Z"),
      },
      "j": {
        id: "j20200101000000000001",
        page: "test page j",
        source: "test source j",
        savedAt: createTimestamp("2022-01-01T00:00:00.010Z"),
        parsedAt: createTimestamp("2022-01-01T00:00:00.021Z"),
      },
      "mergedAt": createTimestamp("2022-01-01T00:00:00.020Z"),
      "generatedSample0At": createTimestamp("2022-01-01T00:00:00.030Z"),
      "generatedSample1At": createTimestamp("2022-01-01T00:00:00.031Z"),
      "generatedSample2At": createTimestamp("2022-01-01T00:00:00.032Z"),
      "generatedSample3At": createTimestamp("2022-01-01T00:00:00.033Z"),
      "generatedSample4At": createTimestamp("2022-01-01T00:00:00.034Z"),
      "generatedSample5At": createTimestamp("2022-01-01T00:00:00.035Z"),
      "generatedSample6At": createTimestamp("2022-01-01T00:00:00.036Z"),
      "generatedSample7At": createTimestamp("2022-01-01T00:00:00.037Z"),
      "generatedSample8At": createTimestamp("2022-01-01T00:00:00.038Z"),
      "generatedSample9At": createTimestamp("2022-01-01T00:00:00.039Z"),
      "reportedAt": createTimestamp("2022-01-01T00:00:00.090Z"),
    });
    mockDocRef.get.mockResolvedValueOnce(info);

    await reportStatus(firebase, {email: {sender: "sender@example.com"}});

    expect(firebase.logger.info.mock.calls).toEqual([]);
  });

  it("saves an email data for a record with no error.", async function() {
    const info = createFirestoreDocSnapMock(jest, DOC_CURRENT);
    info.data.mockReturnValue({
      "k": {
        id: "k20200101000000000000",
        page: "test page k",
        source: "test source k",
        savedAt: createTimestamp("2022-01-01T00:00:00.000Z"),
        parsedAt: createTimestamp("2022-01-01T00:00:00.001Z"),
      },
      "j": {
        id: "j20200101000000000001",
        page: "test page j",
        source: "test source j",
        savedAt: createTimestamp("2022-01-01T00:00:00.010Z"),
        parsedAt: createTimestamp("2022-01-01T00:00:00.021Z"),
      },
      "mergedAt": createTimestamp("2022-01-01T00:00:00.020Z"),
      "generatedSample0At": createTimestamp("2022-01-01T00:00:00.030Z"),
      "generatedSample1At": createTimestamp("2022-01-01T00:00:00.031Z"),
      "generatedSample2At": createTimestamp("2022-01-01T00:00:00.032Z"),
      "generatedSample3At": createTimestamp("2022-01-01T00:00:00.033Z"),
      "generatedSample4At": createTimestamp("2022-01-01T00:00:00.034Z"),
      "generatedSample5At": createTimestamp("2022-01-01T00:00:00.035Z"),
      "generatedSample6At": createTimestamp("2022-01-01T00:00:00.036Z"),
      "generatedSample7At": createTimestamp("2022-01-01T00:00:00.037Z"),
      "generatedSample8At": createTimestamp("2022-01-01T00:00:00.038Z"),
      "generatedSample9At": createTimestamp("2022-01-01T00:00:00.039Z"),
    });
    const admins = createFirestoreDocSnapMock(jest, "admins");
    admins.data.mockReturnValue({
      // accounts: undefined,
    });
    mockDocRef.get
        .mockResolvedValueOnce(info)
        .mockResolvedValueOnce(admins);

    await reportStatus(firebase, {email: {sender: "sender@example.com"}});

    expect(firebase.logger.info.mock.calls).toEqual([
      ["status: SUCCESS"],
    ]);

    expect(mockDocRef.set.mock.calls).toEqual([
      [{
        to: ["sender@example.com"],
        message: {
          subject: "[flamingzipper] status: SUCCESS",
          text: expect.not.stringContaining("error"),
        },
        type: "status",
        createdAt: expect.any(Date),
      }],
    ]);

    expect(mockDocRef.update.mock.calls).toEqual([
      [{
        reportedAt: expect.any(Date),
      }],
    ]);
  });

  it("saves an email data for a record with errors.", async function() {
    const info = createFirestoreDocSnapMock(jest, DOC_CURRENT);
    info.data.mockReturnValue({
      "k": {
        id: "k20200101000000000000",
        page: "test page k",
        source: "test source k",
        savedAt: createTimestamp("2022-01-01T00:00:00.000Z"),
        parsedAt: createTimestamp("2022-01-01T00:00:00.001Z"),
      },
      "j": {
        id: "j20200101000000000001",
        page: "test page j",
        source: "test source j",
        savedAt: createTimestamp("2022-01-01T00:00:00.010Z"),
        parsedAt: createTimestamp("2022-01-01T00:00:00.021Z"),
      },
      "mergedAt": createTimestamp("2022-01-01T00:00:00.020Z"),
      "generatedSample0At": createTimestamp("2022-01-01T00:00:00.030Z"),
      "generatedSample1At": createTimestamp("2022-01-01T00:00:00.031Z"),
      "generatedSample2At": createTimestamp("2022-01-01T00:00:00.032Z"),
      "generatedSample3At": createTimestamp("2022-01-01T00:00:00.033Z"),
      "generatedSample4At": createTimestamp("2022-01-01T00:00:00.034Z"),
      "generatedSample5At": createTimestamp("2022-01-01T00:00:00.035Z"),
      "generatedSample6At": createTimestamp("2022-01-01T00:00:00.036Z"),
      "generatedSample7At": createTimestamp("2022-01-01T00:00:00.037Z"),
      // "generatedSample8At": createTimestamp("2022-01-01T00:00:00.038Z"),
      "generatedSample9At": createTimestamp("2022-01-01T00:00:00.039Z"),
    });
    const admins = createFirestoreDocSnapMock(jest, "admins");
    admins.data.mockReturnValue({
      accounts: ["id01", "id02", "id03"],
    });
    const admin01 = createFirestoreDocSnapMock(jest, "id01");
    admin01.data.mockReturnValue({
      email: "admin01@example.com",
    });
    const admin02 = createFirestoreDocSnapMock(jest, "id02");
    admin02.data.mockReturnValue({
      // email: undefined,
    });
    const admin03 = createFirestoreDocSnapMock(jest, "id03");
    admin03.data.mockReturnValue({
      email: "admin03@example.com",
    });
    mockDocRef.get
        .mockResolvedValueOnce(info)
        .mockResolvedValueOnce(admins)
        .mockResolvedValueOnce(admin01)
        .mockResolvedValueOnce(admin02)
        .mockResolvedValueOnce(admin03);

    await reportStatus(firebase, {email: {sender: "sender@example.com"}});

    expect(firebase.logger.info.mock.calls).toEqual([
      ["status: ERROR"],
    ]);

    expect(mockDocRef.set.mock.calls).toEqual([
      [{
        to: ["admin01@example.com", "admin03@example.com"],
        message: {
          subject: "[flamingzipper] status: ERROR",
          text: expect.stringContaining("error"),
        },
        type: "status",
        createdAt: expect.any(Date),
      }],
    ]);

    expect(mockDocRef.update.mock.calls).toEqual([
      [{
        reportedAt: expect.any(Date),
      }],
    ]);
  });
});
