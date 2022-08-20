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
} = require("./zip");

const {
  firebase,
  mockDoc,
  mockDocRef,
  mockQueryRef,
  mockBucketFile,
  mockBucketFileSave,
  // mockBucketFileExists,
  mockBucketFileDownload,
  // mockBucketFileMakePublic,
  mockTaskQueue,
} = createMockFirebase(jest);

const pathData = path.join(__dirname, "..", "test", "data");
// const pathTmp = path.join(__dirname, "..", "tmp");

afterEach(async function() {
  jest.clearAllMocks();
});

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

    const docK = createFirestoreDocSnapMock(jest, "k20200101000000000000");
    const docJ = createFirestoreDocSnapMock(jest, "j20200101000000000000");
    docK.data.mockReturnValue({
      page: pageHashK,
    });
    docJ.data.mockReturnValue({
      page: pageHashJ,
    });
    mockQueryRef.get
        .mockResolvedValueOnce({docs: [docK]})
        .mockResolvedValueOnce({docs: [docJ]});

    axios.get
        .mockResolvedValueOnce({data: new TextEncoder().encode(pageDataK)})
        .mockResolvedValueOnce({data: new TextEncoder().encode(pageDataJ)});

    await getSources(firebase);

    expect(mockTaskQueue.enqueue.mock.calls).toEqual([
      [
        {
          k: {id: expect.stringMatching(/^k[0-9]+.$/)},
          j: {id: expect.stringMatching(/^j[0-9]+.$/)},
        },
      ],
    ]);

    expect(firebase.logger.info.mock.calls).toEqual([]);
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

    const docK = createFirestoreDocSnapMock(jest, "k20200101000000000000");
    const docJ = createFirestoreDocSnapMock(jest, "j20200101000000000000");
    docK.data.mockReturnValue({
      page: "test",
      sum: zipHashK,
    });
    docJ.data.mockReturnValue({
      page: "test",
      sum: zipHashJ,
    });
    mockQueryRef.get
        .mockResolvedValueOnce({docs: [docK]})
        .mockResolvedValueOnce({docs: [docJ]});

    axios.get
        .mockResolvedValueOnce({data: new TextEncoder().encode(pageDataK)})
        .mockResolvedValueOnce({data: zipDataK.buffer})
        .mockResolvedValueOnce({data: new TextEncoder().encode(pageDataJ)})
        .mockResolvedValueOnce({data: zipDataJ.buffer});

    await getSources(firebase);

    expect(mockTaskQueue.enqueue.mock.calls).toEqual([
      [
        {
          k: {id: expect.stringMatching(/^k[0-9]+.$/)},
          j: {id: expect.stringMatching(/^j[0-9]+.$/)},
        },
      ],
    ]);

    expect(firebase.logger.info.mock.calls).toEqual([]);
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

    const docK = createFirestoreDocSnapMock(jest, "k20200101000000000000");
    const docJ = createFirestoreDocSnapMock(jest, "j20200101000000000000");
    docK.data.mockReturnValue({
      page: "test",
      sum: "test",
      savedAt: new Date(),
      parsedAt: new Date(),
    });
    docJ.data.mockReturnValue({
      page: pageHashJ,
      sum: zipHashJ,
      savedAt: new Date(),
      parsedAt: new Date(),
    });
    mockQueryRef.get
        .mockResolvedValueOnce({docs: [docK]})
        .mockResolvedValueOnce({docs: [docJ]});

    axios.get
        .mockResolvedValueOnce({data: new TextEncoder().encode(pageDataK)})
        .mockResolvedValueOnce({data: zipDataK.buffer})
        .mockResolvedValueOnce({data: new TextEncoder().encode(pageDataJ)});

    await getSources(firebase);

    expect(mockDoc.mock.calls).toEqual([
      [expect.stringMatching(/^k/)],
    ]);

    expect(mockDocRef.set.mock.calls).toEqual([
      [{
        type: "k",
        page: pageHashK,
        sum: zipHashK,
        savedAt: expect.anything(),
      }],
    ]);

    expect(mockBucketFile.mock.calls).toEqual([
      [expect.stringMatching(/^sources\/k[0-9]+.zip$/)],
    ]);

    expect(mockBucketFileSave.mock.calls).toEqual([
      [expect.anything()], // Buffer
    ]);

    expect(firebase.logger.info.mock.calls).toEqual([
      [expect.stringContaining("saved: k")],
    ]);

    expect(mockTaskQueue.enqueue.mock.calls).toEqual([
      [
        {
          k: {
            id: expect.stringMatching(/^k[0-9]+.$/),
          },
          j: {
            id: expect.stringMatching(/^j[0-9]+.$/),
            savedAt: expect.anything(),
            parsedAt: expect.anything(),
          },
        },
      ],
    ]);
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

    const docK = createFirestoreDocSnapMock(jest, "k20200101000000000000");
    const docJ = createFirestoreDocSnapMock(jest, "j20200101000000000000");
    docK.data.mockReturnValue({
      page: pageHashK,
      sum: zipHashK,
      savedAt: new Date(),
      parsedAt: new Date(),
    });
    docJ.data.mockReturnValue({
      page: "test",
      sum: "test",
      savedAt: new Date(),
      parsedAt: new Date(),
    });
    mockQueryRef.get
        .mockResolvedValueOnce({docs: [docK]})
        .mockResolvedValueOnce({docs: [docJ]});

    axios.get
        .mockResolvedValueOnce({data: new TextEncoder().encode(pageDataK)})
        .mockResolvedValueOnce({data: new TextEncoder().encode(pageDataJ)})
        .mockResolvedValueOnce({data: zipDataJ.buffer});

    await getSources(firebase);

    expect(mockDoc.mock.calls).toEqual([
      [expect.stringMatching(/^j/)],
    ]);

    expect(mockDocRef.set.mock.calls).toEqual([
      [{
        type: "j",
        page: pageHashJ,
        sum: zipHashJ,
        savedAt: expect.anything(),
      }],
    ]);

    expect(mockBucketFile.mock.calls).toEqual([
      [expect.stringMatching(/^sources\/j[0-9]+.zip$/)],
    ]);

    expect(mockBucketFileSave.mock.calls).toEqual([
      [expect.anything()], // Buffer
    ]);

    expect(firebase.logger.info.mock.calls).toEqual([
      [expect.stringContaining("saved: j")],
    ]);

    expect(mockTaskQueue.enqueue.mock.calls).toEqual([
      [
        {
          k: {
            id: expect.stringMatching(/^k[0-9]+.$/),
            savedAt: expect.anything(),
            parsedAt: expect.anything(),
          },
          j: {
            id: expect.stringMatching(/^j[0-9]+.$/),
          },
        },
      ],
    ]);
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
            id: "j20200101000000000000",
            savedAt: new Date(),
            parsedAt: new Date(),
          },
        },
    );

    expect(firebase.logger.info.mock.calls).toEqual([]);

    expect(mockTaskQueue.enqueue.mock.calls).toEqual([]);
  });

  it("parses new ken_all.zip without parsed data.", async function() {
    const {zipDataK} = await createArchiveData();

    mockBucketFileDownload
        // getSourceInfo
        .mockReturnValueOnce([Buffer.from(zipDataK)])
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
          },
          j: {
            id: "j20200101000000000000",
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
      [expect.stringMatching(/^k/)],
      [expect.stringMatching(/^k/)],
      [expect.stringMatching(/^j/)],
    ]);

    expect(mockDocRef.update.mock.calls).toEqual([
      [{parsedAt: expect.anything()}],
      [{mergedAt: expect.anything()}],
      [{mergedAt: expect.anything()}],
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
    ]);

    const saved101 = JSON.parse(mockBucketFileSave.mock.calls[3][0])
        .map((item) => ({code: item.code, name: item.name}));
    const comp101 = JSON
        .parse(await readFile(path.join(pathData, "jisx0401.json")))
        .map((item) => ({code: item.code, name: item.name}));
    const saved102 = JSON.parse(mockBucketFileSave.mock.calls[4][0])
        .map((item) => ({code: item.code, name: item.name}));
    const comp102 = JSON
        .parse(await readFile(path.join(pathData, "jisx0402.json")))
        .map((item) => ({code: item.code, name: item.name}));

    const byCode = (a, b) => a.code === b.code ?
        0 : a.code < b.code ? -1 : 1;

    saved101.sort(byCode);
    comp101.sort(byCode);
    saved102.sort(byCode);
    comp102.sort(byCode);

    expect(saved101).toEqual(comp101);
    expect(saved102).toEqual(comp102);

    expect(mockTaskQueue.enqueue.mock.calls).toHaveLength(10);
    expect(mockTaskQueue.enqueue.mock.calls[0]).toEqual([
      {
        k: {id: "k20200101000000000000"},
        j: {id: "j20200101000000000000"},
        prefix: "0",
      },
    ]);

    expect(mockTaskQueue.enqueue.mock.calls[9]).toEqual([
      {
        k: {id: "k20200101000000000000"},
        j: {id: "j20200101000000000000"},
        prefix: "9",
      },
    ]);
  });

  it("parses new jigyosyo.zip without parsed data.", async function() {
    const {zipDataJ} = await createArchiveData();

    mockBucketFileDownload
        // getParsedData
        .mockResolvedValueOnce(
            [await readFile(path.join(pathData, "k_jisx0401.json"))])
        .mockResolvedValueOnce(
            [await readFile(path.join(pathData, "k_jisx0402.json"))])
        .mockResolvedValueOnce(
            [await readFile(path.join(pathData, "k_zips.json"))])
        // getSourceInfo
        .mockReturnValueOnce([Buffer.from(zipDataJ)]);

    await parseSources(
        firebase,
        {
          k: {
            id: "k20200101000000000000",
            savedAt: new Date(),
            parsedAt: new Date(),
          },
          j: {
            id: "j20200101000000000000",
            savedAt: new Date(),
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
      [expect.stringMatching(/^j/)],
      [expect.stringMatching(/^k/)],
      [expect.stringMatching(/^j/)],
    ]);

    expect(mockDocRef.update.mock.calls).toEqual([
      [{parsedAt: expect.anything()}],
      [{mergedAt: expect.anything()}],
      [{mergedAt: expect.anything()}],
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
    ]);

    const saved101 = JSON.parse(mockBucketFileSave.mock.calls[3][0])
        .map((item) => ({code: item.code, name: item.name}));
    const comp101 = JSON
        .parse(await readFile(path.join(pathData, "jisx0401.json")))
        .map((item) => ({code: item.code, name: item.name}));
    const saved102 = JSON.parse(mockBucketFileSave.mock.calls[4][0])
        .map((item) => ({code: item.code, name: item.name}));
    const comp102 = JSON
        .parse(await readFile(path.join(pathData, "jisx0402.json")))
        .map((item) => ({code: item.code, name: item.name}));

    const byCode = (a, b) => a.code === b.code ?
        0 : a.code < b.code ? -1 : 1;

    saved101.sort(byCode);
    comp101.sort(byCode);
    saved102.sort(byCode);
    comp102.sort(byCode);

    expect(saved101).toEqual(comp101);
    expect(saved102).toEqual(comp102);

    expect(mockTaskQueue.enqueue.mock.calls).toHaveLength(10);
    expect(mockTaskQueue.enqueue.mock.calls[0]).toEqual([
      {
        k: {id: "k20200101000000000000"},
        j: {id: "j20200101000000000000"},
        prefix: "0",
      },
    ]);

    expect(mockTaskQueue.enqueue.mock.calls[9]).toEqual([
      {
        k: {id: "k20200101000000000000"},
        j: {id: "j20200101000000000000"},
        prefix: "9",
      },
    ]);
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
      j: {id: "j20200101000000000000"},
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
    //     path.join(pathTmp, "simple.json"),
    //     JSON.stringify(output),
    // );
    expect(output).toEqual(
        JSON.parse(await readFile(path.join(pathData, "simple.json"))),
    );
  });
});
