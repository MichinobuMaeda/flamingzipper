const {readFile} = require("node:fs/promises");
const axios = require("axios");
jest.mock("axios");

const {
  createFirestoreDocSnapMock,
  createMockFirebase,
} = require("./testutils");
const {
  kenAll,
  jigyosyo,
} = require("./zip");

const doc1 = createFirestoreDocSnapMock(jest, "k20200101000000000000");
const {
  firebase,
  mockQueryRef,
} = createMockFirebase(jest);

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

    expect(firebase.logger.info.mock.calls).toEqual([
      [page],
      ["skip"],
    ]);
  });

  it("ignores the zip with sum saved.", async function() {
    const {createHash} = await require("node:crypto");
    const pageData = "test page data 1";
    const zipData = await readFile("../test/data/ken_all_01.zip");
    const hashPage = createHash("sha256");
    hashPage.update(new TextEncoder().encode(pageData));
    const page = hashPage.digest("hex");
    const hashZip = createHash("sha256");
    hashZip.update(zipData);
    const sum = hashZip.digest("hex");
    doc1.data.mockReturnValue({page: "test", sum});
    mockQueryRef.get.mockResolvedValue({docs: [doc1]});
    axios.get
        .mockResolvedValueOnce({data: new TextEncoder().encode(pageData)})
        .mockResolvedValueOnce({data: zipData.buffer});

    await kenAll(firebase);

    expect(firebase.logger.info.mock.calls).toEqual([
      [page],
      [sum],
      ["skip"],
    ]);
  });

  it("gets new zip.", async function() {
    const {createHash} = await require("node:crypto");
    const pageData = "test page data 1";
    const zipData = await readFile("../test/data/ken_all_01.zip");
    const hashPage = createHash("sha256");
    hashPage.update(new TextEncoder().encode(pageData));
    const page = hashPage.digest("hex");
    const hashZip = createHash("sha256");
    hashZip.update(zipData);
    const sum = hashZip.digest("hex");
    doc1.data.mockReturnValue({page: "test", sum: "test"});
    mockQueryRef.get.mockResolvedValue({docs: [doc1]});
    axios.get
        .mockResolvedValueOnce({data: new TextEncoder().encode(pageData)})
        .mockResolvedValueOnce({data: zipData.buffer});

    await kenAll(firebase);

    expect(firebase.logger.info.mock.calls).toEqual([
      [page],
      [sum],
      [expect.stringContaining("saved: ")],
      ["unziped: KEN_ALL.CSV"],
      [expect.stringContaining("parsed: ")],
    ]);
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

    expect(firebase.logger.info.mock.calls).toEqual([
      [page],
      ["skip"],
    ]);
  });

  it("ignores the zip with sum saved.", async function() {
    const {createHash} = await require("node:crypto");
    const pageData = "test page data 1";
    const zipData = await readFile("../test/data/jigyosyo_01.zip");
    const hashPage = createHash("sha256");
    hashPage.update(new TextEncoder().encode(pageData));
    const page = hashPage.digest("hex");
    const hashZip = createHash("sha256");
    hashZip.update(zipData);
    const sum = hashZip.digest("hex");
    doc1.data.mockReturnValue({page: "test", sum});
    mockQueryRef.get.mockResolvedValue({docs: [doc1]});
    axios.get
        .mockResolvedValueOnce({data: new TextEncoder().encode(pageData)})
        .mockResolvedValueOnce({data: zipData.buffer});

    await jigyosyo(firebase);

    expect(firebase.logger.info.mock.calls).toEqual([
      [page],
      [sum],
      ["skip"],
    ]);
  });

  it("gets new zip.", async function() {
    const {createHash} = await require("node:crypto");
    const pageData = "test page data 1";
    const zipData = await readFile("../test/data/jigyosyo_01.zip");
    const hashPage = createHash("sha256");
    hashPage.update(new TextEncoder().encode(pageData));
    const page = hashPage.digest("hex");
    const hashZip = createHash("sha256");
    hashZip.update(zipData);
    const sum = hashZip.digest("hex");
    doc1.data.mockReturnValue({page: "test", sum: "test"});
    mockQueryRef.get.mockResolvedValue({docs: [doc1]});
    axios.get
        .mockResolvedValueOnce({data: new TextEncoder().encode(pageData)})
        .mockResolvedValueOnce({data: zipData.buffer});

    await jigyosyo(firebase);

    expect(firebase.logger.info.mock.calls).toEqual([
      [page],
      [sum],
      [expect.stringContaining("saved: ")],
      ["unziped: JIGYOSYO.CSV"],
      [expect.stringContaining("parsed: ")],
    ]);
  });
});
