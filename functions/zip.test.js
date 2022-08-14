const {readFile, writeFile} = require("node:fs/promises");
const JSZip = require("jszip");
const axios = require("axios");
jest.mock("axios");
const path = require("path");

const {
  createFirestoreDocSnapMock,
  createMockFirebase,
} = require("./testutils");
const {
  kenAll,
  jigyosyo,
  mergeJisx040x,
  mergeSimpleZips,
  mergeSimpleZipsAll,
  archiveSimpleZips,
} = require("./zip");

const doc1 = createFirestoreDocSnapMock(jest, "k20200101000000000000");
const {
  firebase,
  mockQueryRef,
  mockBucketFile,
  mockBucketFileSave,
  mockBucketFileExists,
  mockBucketFileDownload,
  mockBucketFileMakePublic,
} = createMockFirebase(jest);

const pathData = path.join(__dirname, "..", "test", "data");
const pathTmp = path.join(__dirname, "..", "tmp");

afterEach(async function() {
  jest.clearAllMocks();
});

describe("kenAll", function() {
  it("ignores the page with sum saved.", async function() {
    const {createHash} = await require("node:crypto");
    const pageData = "test page data 1";
    const hashPage = createHash("sha256");
    hashPage.update(new TextEncoder().encode(pageData));
    const page = hashPage.digest("hex");
    doc1.data.mockReturnValue({page});
    mockQueryRef.get.mockResolvedValue({docs: [doc1]});
    axios.get
        .mockResolvedValueOnce({data: new TextEncoder().encode(pageData)});

    await kenAll(firebase);

    expect(firebase.logger.info.mock.calls).toEqual([]);
  });

  it("ignores the zip with sum saved.", async function() {
    const {createHash} = await require("node:crypto");
    const pageData = "test page data 1";

    const zip = new JSZip();
    zip.file(
        "KEN_ALL.CSV",
        await readFile(path.join(pathData, "KEN_ALL.CSV")),
    );
    const zipData = await zip.generateAsync({type: "uint8array"});

    const hashPage = createHash("sha256");
    hashPage.update(new TextEncoder().encode(pageData));
    const hashZip = createHash("sha256");
    hashZip.update(zipData);
    const sum = hashZip.digest("hex");
    doc1.data.mockReturnValue({page: "test", sum});
    mockQueryRef.get.mockResolvedValue({docs: [doc1]});
    axios.get
        .mockResolvedValueOnce({data: new TextEncoder().encode(pageData)})
        .mockResolvedValueOnce({data: zipData.buffer});

    await kenAll(firebase);

    expect(firebase.logger.info.mock.calls).toEqual([]);
  });

  it("gets new zip.", async function() {
    const {createHash} = await require("node:crypto");
    const pageData = "test page data 1";

    const zip = new JSZip();
    zip.file(
        "KEN_ALL.CSV",
        await readFile(path.join(pathData, "KEN_ALL.CSV")),
    );
    const zipData = await zip.generateAsync({type: "uint8array"});

    const hashPage = createHash("sha256");
    hashPage.update(new TextEncoder().encode(pageData));
    const hashZip = createHash("sha256");
    hashZip.update(zipData);
    const sum = hashZip.digest("hex");
    doc1.data.mockReturnValue({page: "test", sum: "test"});
    mockQueryRef.get.mockResolvedValue({docs: [doc1]});
    mockBucketFileExists.mockResolvedValue(false);
    axios.get
        .mockResolvedValueOnce({data: new TextEncoder().encode(pageData)})
        .mockResolvedValueOnce({data: zipData.buffer});

    await kenAll(firebase);

    expect(firebase.logger.info.mock.calls).toEqual([
      [sum],
      [expect.stringContaining("saved: ")],
      ["unziped: KEN_ALL.CSV"],
      [expect.stringContaining("parsed: ")],
    ]);

    expect(mockBucketFile.mock.calls).toEqual([
      [expect.stringMatching(/archives\/k[0-9]+.zip/)],
      [expect.stringMatching(/work\/k[0-9]+_jisx0401.json/)],
      [expect.stringMatching(/work\/k[0-9]+_jisx0402.json/)],
      [expect.stringMatching(/work\/k[0-9]+_zips.json/)],
      [expect.stringMatching(/work\/k[0-9]+_jisx0401.json/)],
      ["work/k_jisx0401.json"],
      [expect.stringMatching(/work\/k[0-9]+_jisx0402.json/)],
      ["work/k_jisx0402.json"],
      [expect.stringMatching(/work\/k[0-9]+_zips.json/)],
      ["work/k_zips.json"],
    ]);

    const jisx0401 = JSON.parse(
        await readFile(path.join(pathData, "k_jisx0401.json")),
    );
    const jisx0402 = JSON.parse(
        await readFile(path.join(pathData, "k_jisx0402.json")),
    );
    const zips = JSON.parse(
        await readFile(path.join(pathData, "k_zips.json")),
    );
    // await writeFile(
    //     path.join(pathTmp, "k_zips.json"),
    //     mockBucketFileSave.mock.calls[3][0],
    // );
    expect(JSON.parse(mockBucketFileSave.mock.calls[1][0])).toEqual(jisx0401);
    expect(JSON.parse(mockBucketFileSave.mock.calls[2][0])).toEqual(jisx0402);
    expect(JSON.parse(mockBucketFileSave.mock.calls[3][0])).toEqual(zips);
  });
});

describe("jigyosyo", function() {
  it("ignores the page with sum saved.", async function() {
    const {createHash} = await require("node:crypto");
    const pageData = "test page data 1";
    const hashPage = createHash("sha256");
    hashPage.update(new TextEncoder().encode(pageData));
    const page = hashPage.digest("hex");
    doc1.data.mockReturnValue({page});
    mockQueryRef.get.mockResolvedValue({docs: [doc1]});
    axios.get
        .mockResolvedValueOnce({data: new TextEncoder().encode(pageData)});

    await jigyosyo(firebase);

    expect(firebase.logger.info.mock.calls).toEqual([]);
  });

  it("ignores the zip with sum saved.", async function() {
    const {createHash} = await require("node:crypto");
    const pageData = "test page data 1";

    const zip = new JSZip();
    zip.file(
        "JIGYOSYO.CSV",
        await readFile(path.join(pathData, "JIGYOSYO.CSV")),
    );
    const zipData = await zip.generateAsync({type: "uint8array"});

    const hashPage = createHash("sha256");
    hashPage.update(new TextEncoder().encode(pageData));
    const hashZip = createHash("sha256");
    hashZip.update(zipData);
    const sum = hashZip.digest("hex");
    doc1.data.mockReturnValue({page: "test", sum});
    mockQueryRef.get.mockResolvedValue({docs: [doc1]});
    axios.get
        .mockResolvedValueOnce({data: new TextEncoder().encode(pageData)})
        .mockResolvedValueOnce({data: zipData.buffer});

    await jigyosyo(firebase);

    expect(firebase.logger.info.mock.calls).toEqual([]);
  });

  it("gets new zip.", async function() {
    const {createHash} = await require("node:crypto");
    const pageData = "test page data 1";

    const zip = new JSZip();
    zip.file(
        "JIGYOSYO.CSV",
        await readFile(path.join(pathData, "JIGYOSYO.CSV")),
    );
    const zipData = await zip.generateAsync({type: "uint8array"});

    const hashPage = createHash("sha256");
    hashPage.update(new TextEncoder().encode(pageData));
    const hashZip = createHash("sha256");
    hashZip.update(zipData);
    const sum = hashZip.digest("hex");
    doc1.data.mockReturnValue({page: "test", sum: "test"});
    mockQueryRef.get.mockResolvedValue({docs: [doc1]});
    mockBucketFileExists.mockResolvedValue(false);
    axios.get
        .mockResolvedValueOnce({data: new TextEncoder().encode(pageData)})
        .mockResolvedValueOnce({data: zipData.buffer});

    await jigyosyo(firebase);

    expect(firebase.logger.info.mock.calls).toEqual([
      [sum],
      [expect.stringContaining("saved: ")],
      ["unziped: JIGYOSYO.CSV"],
      [expect.stringContaining("parsed: ")],
    ]);

    expect(mockBucketFile.mock.calls).toEqual([
      [expect.stringMatching(/archives\/j[0-9]+.zip/)],
      [expect.stringMatching(/work\/j[0-9]+_jisx0401.json/)],
      [expect.stringMatching(/work\/j[0-9]+_jisx0402.json/)],
      [expect.stringMatching(/work\/j[0-9]+_zips.json/)],
      [expect.stringMatching(/work\/j[0-9]+_jisx0401.json/)],
      ["work/j_jisx0401.json"],
      [expect.stringMatching(/work\/j[0-9]+_jisx0402.json/)],
      ["work/j_jisx0402.json"],
      [expect.stringMatching(/work\/j[0-9]+_zips.json/)],
      ["work/j_zips.json"],
    ]);

    const jisx0401 = JSON.parse(
        await readFile(path.join(pathData, "j_jisx0401.json")),
    );
    const jisx0402 = JSON.parse(
        await readFile(path.join(pathData, "j_jisx0402.json")),
    );
    const zips = JSON.parse(
        await readFile(path.join(pathData, "j_zips.json")),
    );
    // await writeFile(
    //     path.join(pathTmp, "j_zips.json"),
    //     mockBucketFileSave.mock.calls[3][0],
    // );
    expect(JSON.parse(mockBucketFileSave.mock.calls[1][0])).toEqual(jisx0401);
    expect(JSON.parse(mockBucketFileSave.mock.calls[2][0])).toEqual(jisx0402);
    expect(JSON.parse(mockBucketFileSave.mock.calls[3][0])).toEqual(zips);
  });
});

describe("mergeJisx040x", function() {
  it("ignores merged data.", async function() {
    doc1.data.mockReturnValue({mergedJisx040xAt: new Date()});
    mockQueryRef.get.mockResolvedValue({docs: [doc1]});

    await mergeJisx040x(firebase);

    expect(firebase.logger.info.mock.calls).toEqual([]);
  });

  it("merges unmerged work/[k|j]_jisx0401.json" +
     " and work/[k|j]_jisx0401.json ", async function() {
    doc1.data.mockReturnValue({});
    mockQueryRef.get.mockResolvedValue({docs: [doc1]});
    mockBucketFileDownload
        .mockReturnValueOnce(readFile(path.join(pathData, "k_jisx0401.json")))
        .mockReturnValueOnce(readFile(path.join(pathData, "j_jisx0401.json")))
        .mockReturnValueOnce(readFile(path.join(pathData, "k_jisx0402.json")))
        .mockReturnValueOnce(readFile(path.join(pathData, "j_jisx0402.json")));
    mockBucketFileMakePublic.mockResolvedValue();

    await mergeJisx040x(firebase);

    expect(mockBucketFile.mock.calls).toEqual([
      ["work/k_jisx0401.json"],
      ["work/j_jisx0401.json"],
      ["jisx0401.json"], // .save()
      ["jisx0401.json"], // .makePublic()
      ["work/k_jisx0402.json"],
      ["work/j_jisx0402.json"],
      ["jisx0402.json"], // .save()
      ["jisx0402.json"], // .makePublic()
    ]);

    const saved101 = JSON.parse(mockBucketFileSave.mock.calls[0][0])
        .map((item) => ({code: item.code, name: item.name}));
    const comp101 = JSON
        .parse(await readFile(path.join(pathData, "jisx0401.json")))
        .map((item) => ({code: item.code, name: item.name}));
    const saved102 = JSON.parse(mockBucketFileSave.mock.calls[1][0])
        .map((item) => ({code: item.code, name: item.name}));
    const comp102 = JSON
        .parse(await readFile(path.join(pathData, "jisx0402.json")))
        .map((item) => ({code: item.code, name: item.name}));

    const byCode = (a, b) => a.code === b.code ? 0 : a.code < b.code ? -1 : 1;

    saved101.sort(byCode);
    comp101.sort(byCode);
    saved102.sort(byCode);
    comp102.sort(byCode);

    expect(saved101).toEqual(comp101);
    expect(saved102).toEqual(comp102);

    expect(firebase.logger.info.mock.calls).toEqual([
      ["merged: jisx0401.json"],
      ["merged: jisx0402.json"],
    ]);
  });
});

describe("mergeZips", function() {
  it("ignores merged data.", async function() {
    doc1.data
        .mockReturnValueOnce({mergeSimpleZips0At: new Date()})
        .mockReturnValueOnce({mergeSimpleZips1At: new Date()});
    mockQueryRef.get.mockResolvedValue({docs: [doc1]});

    await mergeSimpleZips(firebase, "0");
    await mergeSimpleZips(firebase, "1");

    expect(firebase.logger.info.mock.calls).toEqual([]);
  });

  it("merges unmerged work/[k|j]_zips.json", async function() {
    doc1.data
        .mockReturnValueOnce({})
        .mockReturnValueOnce({mergeSimpleZips0At: new Date()})
        .mockReturnValueOnce({mergeSimpleZips1At: new Date()})
        .mockReturnValueOnce({mergeSimpleZips2At: new Date()})
        .mockReturnValueOnce({mergeSimpleZips3At: new Date()})
        .mockReturnValueOnce({mergeSimpleZips4At: new Date()})
        .mockReturnValueOnce({mergeSimpleZips5At: new Date()})
        .mockReturnValueOnce({mergeSimpleZips6At: new Date()})
        .mockReturnValueOnce({mergeSimpleZips7At: new Date()})
        .mockReturnValueOnce({
          mergeSimpleZips0At: new Date(),
          mergeSimpleZips1At: new Date(),
          mergeSimpleZips2At: new Date(),
          mergeSimpleZips3At: new Date(),
          mergeSimpleZips4At: new Date(),
          mergeSimpleZips5At: new Date(),
          mergeSimpleZips6At: new Date(),
          mergeSimpleZips7At: new Date(),
          mergeSimpleZips8At: new Date(),
        });
    mockQueryRef.get.mockResolvedValue({docs: [doc1]});
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

    await mergeSimpleZips(firebase, "0");
    await mergeSimpleZips(firebase, "1");
    await mergeSimpleZips(firebase, "2");
    await mergeSimpleZips(firebase, "3");
    await mergeSimpleZips(firebase, "4");
    await mergeSimpleZips(firebase, "5");
    await mergeSimpleZips(firebase, "6");
    await mergeSimpleZips(firebase, "7");
    await mergeSimpleZips(firebase, "8");
    await mergeSimpleZips(firebase, "9");

    expect(firebase.logger.info.mock.calls).toEqual([
      ["merged: simple/0??.json"],
      ["merged: simple/1??.json"],
      ["merged: simple/2??.json"],
      ["merged: simple/3??.json"],
      ["merged: simple/4??.json"],
      ["merged: simple/5??.json"],
      ["merged: simple/6??.json"],
      ["merged: simple/7??.json"],
      ["merged: simple/8??.json"],
      ["merged: simple/9??.json"],
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

    await writeFile(
        path.join(pathTmp, "simple.json"),
        JSON.stringify(output),
    );
    expect(output).toEqual(
        JSON.parse(await readFile(path.join(pathData, "simple.json"))),
    );
  });
});

describe("mergeSimpleZipsAll", function() {
  it("ignores merged data.", async function() {
    doc1.data.mockReturnValue({archiveSimpleZipsAt: new Date()});
    mockQueryRef.get.mockResolvedValue({docs: [doc1]});

    await archiveSimpleZips(firebase);

    expect(firebase.logger.info.mock.calls).toEqual([]);
  });

  it("merges unmerged work/[k|j]_zips.json to simpe.json", async function() {
    doc1.data.mockReturnValueOnce({});
    mockQueryRef.get.mockResolvedValue({docs: [doc1]});
    mockBucketFileDownload
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

    await mergeSimpleZipsAll(firebase);

    expect(firebase.logger.info.mock.calls).toEqual([
      ["save: simple.json"],
    ]);
  });
});

describe("archiveSimpleZips", function() {
  it("ignores merged data.", async function() {
    doc1.data.mockReturnValue({archiveSimpleZipsAt: new Date()});
    mockQueryRef.get.mockResolvedValue({docs: [doc1]});

    await archiveSimpleZips(firebase);

    expect(firebase.logger.info.mock.calls).toEqual([]);
  });

  it("merges unmerged work/[k|j]_zips.json to simpe.zip", async function() {
    doc1.data.mockReturnValueOnce({});
    mockQueryRef.get.mockResolvedValue({docs: [doc1]});
    mockBucketFileDownload
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

    await archiveSimpleZips(firebase);

    expect(firebase.logger.info.mock.calls).toEqual([
      ["save: simple.zip"],
    ]);
  });
});
