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
            [await readFile(path.join(pathData, "j_parsed.json"))]);

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
      [expect.stringMatching(/work\/k[0-9]+_parsed.json/)],
      [expect.stringMatching(/work\/k[0-9]+_jisx0401.json/)],
      ["work/k_jisx0401.json"],
      [expect.stringMatching(/work\/k[0-9]+_jisx0402.json/)],
      ["work/k_jisx0402.json"],
      [expect.stringMatching(/work\/k[0-9]+_parsed.json/)],
      ["work/k_parsed.json"],
      // getParsedData
      ["work/j_jisx0401.json"],
      ["work/j_jisx0402.json"],
      ["work/j_parsed.json"],
      // save jisX0401
      ["jisx0401.json"],
      ["jisx0401_utf8.csv"],
      ["jisx0401_sjis.csv"],
      // save sisX0402
      ["jisx0402.json"],
      ["jisx0402_utf8.csv"],
      ["jisx0402_sjis.csv"],
      // save simple
      ["simple.json"],
      ["simple_utf8.csv"],
      ["simple_sjis.csv"],
      ["simple.zip"],
      // saveHistory
      ["simple_utf8.csv"],
      [expect.stringMatching(/history\/[0-9]+_simple_utf8.csv/)],
      ["simple_sjis.csv"],
      [expect.stringMatching(/history\/[0-9]+_simple_sjis.csv/)],
      ["simple.json"],
      [expect.stringMatching(/history\/[0-9]+_simple.json/)],
      ["simple.zip"],
      [expect.stringMatching(/history\/[0-9]+_simple.zip/)],
      ["update.txt"],
      ["update.txt"],
    ]);

    expect(mockDoc.mock.calls).toEqual([
      ["current"],
      ["current"],
    ]);

    expect(mockDocRef.update.mock.calls).toEqual([
      [{["k.parsedAt"]: expect.any(Date)}],
      [{savedSimpleAt: expect.any(Date)}],
    ]);

    expect(firebase.logger.info.mock.calls).toEqual([
      [expect.stringMatching(/k: k[0-9]+, j: j[0-9]+/)],
      ["extracted: KEN_ALL.CSV"],
      [expect.stringContaining("parsed: k")],
      ["saved: jisx0401.json"],
      ["saved: jisx0401_utf8.csv"],
      ["saved: jisx0401_sjis.csv"],
      ["saved: jisx0402.json"],
      ["saved: jisx0402_utf8.csv"],
      ["saved: jisx0402_sjis.csv"],
      ["saved: simple.json"],
      ["saved: simple_utf8.csv"],
      ["saved: simple_sjis.csv"],
      ["saved: simple.zip"],
    ]);

    expect(
        JSON.parse(mockBucketFileSave.mock.calls[0][0]),
    ).toEqual(
        JSON.parse(await readFile(path.join(pathData, "k_jisx0401.json"))),
    );

    expect(
        JSON.parse(mockBucketFileSave.mock.calls[1][0]),
    ).toEqual(
        JSON.parse(await readFile(path.join(pathData, "k_jisx0402.json"))),
    );

    expect(
        JSON.parse(mockBucketFileSave.mock.calls[2][0]),
    ).toEqual(
        JSON.parse(await readFile(path.join(pathData, "k_parsed.json"))),
    );

    expect(
        JSON.parse(mockBucketFileSave.mock.calls[3][0]),
    ).toEqual(
        JSON.parse(await readFile(path.join(pathData, "jisx0401.json"))),
    );

    expect(
        JSON.parse(mockBucketFileSave.mock.calls[6][0]),
    ).toEqual(
        JSON.parse(await readFile(path.join(pathData, "jisx0402.json"))),
    );

    expect(
        JSON.parse(mockBucketFileSave.mock.calls[9][0]),
    ).toEqual(
        JSON.parse(await readFile(path.join(pathData, "simple.json"))),
    );
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
            [await readFile(path.join(pathData, "k_parsed.json"))])
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
      ["work/k_parsed.json"],
      // getSourceInfo
      [expect.stringMatching(/sources\/j[0-9]+.zip/)],
      // saveParsed
      [expect.stringMatching(/work\/j[0-9]+_jisx0401.json/)],
      [expect.stringMatching(/work\/j[0-9]+_jisx0402.json/)],
      [expect.stringMatching(/work\/j[0-9]+_parsed.json/)],
      [expect.stringMatching(/work\/j[0-9]+_jisx0401.json/)],
      ["work/j_jisx0401.json"],
      [expect.stringMatching(/work\/j[0-9]+_jisx0402.json/)],
      ["work/j_jisx0402.json"],
      [expect.stringMatching(/work\/j[0-9]+_parsed.json/)],
      ["work/j_parsed.json"],
      // save jisX0401
      ["jisx0401.json"],
      ["jisx0401_utf8.csv"],
      ["jisx0401_sjis.csv"],
      // save sisX0402
      ["jisx0402.json"],
      ["jisx0402_utf8.csv"],
      ["jisx0402_sjis.csv"],
      // save simple
      ["simple.json"],
      ["simple_utf8.csv"],
      ["simple_sjis.csv"],
      ["simple.zip"],
      // saveHistory
      ["simple_utf8.csv"],
      [expect.stringMatching(/history\/[0-9]+_simple_utf8.csv/)],
      ["simple_sjis.csv"],
      [expect.stringMatching(/history\/[0-9]+_simple_sjis.csv/)],
      ["simple.json"],
      [expect.stringMatching(/history\/[0-9]+_simple.json/)],
      ["simple.zip"],
      [expect.stringMatching(/history\/[0-9]+_simple.zip/)],
      ["update.txt"],
      ["update.txt"],
    ]);

    expect(mockDoc.mock.calls).toEqual([
      ["current"],
      ["current"],
    ]);

    expect(mockDocRef.update.mock.calls).toEqual([
      [{["j.parsedAt"]: expect.any(Date)}],
      [{savedSimpleAt: expect.any(Date)}],
    ]);

    expect(firebase.logger.info.mock.calls).toEqual([
      [expect.stringMatching(/k: k[0-9]+, j: j[0-9]+/)],
      ["extracted: JIGYOSYO.CSV"],
      [expect.stringContaining("parsed: j")],
      ["saved: jisx0401.json"],
      ["saved: jisx0401_utf8.csv"],
      ["saved: jisx0401_sjis.csv"],
      ["saved: jisx0402.json"],
      ["saved: jisx0402_utf8.csv"],
      ["saved: jisx0402_sjis.csv"],
      ["saved: simple.json"],
      ["saved: simple_utf8.csv"],
      ["saved: simple_sjis.csv"],
      ["saved: simple.zip"],
    ]);

    expect(
        JSON.parse(mockBucketFileSave.mock.calls[0][0]),
    ).toEqual(
        JSON.parse(await readFile(path.join(pathData, "j_jisx0401.json"))),
    );

    expect(
        JSON.parse(mockBucketFileSave.mock.calls[1][0]),
    ).toEqual(
        JSON.parse(await readFile(path.join(pathData, "j_jisx0402.json"))),
    );

    expect(
        JSON.parse(mockBucketFileSave.mock.calls[2][0]),
    ).toEqual(
        JSON.parse(await readFile(path.join(pathData, "j_parsed.json"))),
    );

    expect(
        JSON.parse(mockBucketFileSave.mock.calls[3][0]),
    ).toEqual(
        JSON.parse(await readFile(path.join(pathData, "jisx0401.json"))),
    );

    expect(
        JSON.parse(mockBucketFileSave.mock.calls[6][0]),
    ).toEqual(
        JSON.parse(await readFile(path.join(pathData, "jisx0402.json"))),
    );

    expect(
        JSON.parse(mockBucketFileSave.mock.calls[9][0]),
    ).toEqual(
        JSON.parse(await readFile(path.join(pathData, "simple.json"))),
    );
  });
});

const createTimestamp = (str) => ({toDate: () => new Date(str)});

describe("reportStatus", function() {
  it("do nothng without records.", async function() {
    mockDocRef.get.mockResolvedValueOnce({exists: false});

    await reportStatus(firebase, {mail: {sender: "sender@example.com"}});

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
      "savedSimpleAt": createTimestamp("2022-01-01T00:00:00.020Z"),
      "reportedAt": createTimestamp("2022-01-01T00:00:00.090Z"),
    });
    mockDocRef.get.mockResolvedValueOnce(info);

    await reportStatus(firebase, {mail: {sender: "sender@example.com"}});

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
      "savedSimpleAt": createTimestamp("2022-01-01T00:00:00.020Z"),
    });
    const admins = createFirestoreDocSnapMock(jest, "admins");
    admins.data.mockReturnValue({
      // accounts: undefined,
    });
    mockDocRef.get
        .mockResolvedValueOnce(info)
        .mockResolvedValueOnce(admins);

    await reportStatus(firebase, {mail: {sender: "sender@example.com"}});

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
      // "savedSimpleAt": createTimestamp("2022-01-01T00:00:00.020Z"),
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

    await reportStatus(firebase, {mail: {sender: "sender@example.com"}});

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
