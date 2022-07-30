const {
  createFirestoreDocSnapMock,
  createMockFirebase,
} = require("./testutils");
const deployment = require("./deployment");

const {
  mockAuth,
  mockDoc,
  mockCollection,
  mockBatch,
  firebase,
} = createMockFirebase(jest);

const deleted = createFirestoreDocSnapMock(jest, "deployment");

const config = {
  initial: {
    url: "http://localhost:5000/",
    email: "primary@example.com",
    password: "primarypassword",
  },
};

const newVersion = 1;

afterEach(async function() {
  jest.clearAllMocks();
});

describe("deployment", function() {
  it("restore deployment version," +
  " and sets initial data and sets deployment version 1" +
  " if previous version is 0", async function() {
    const {url, email, password} = config.initial;
    const uid = "primaryid";
    const displayName = "Primary user";
    deleted.data.mockReturnValueOnce({version: 0});
    mockDoc
        .mockReturnValueOnce({path: "service/conf"})
        .mockReturnValueOnce({path: `accounts/${uid}`})
        .mockReturnValueOnce({path: "groups/admins"})
        .mockReturnValueOnce({path: "groups/testers"});
    mockAuth.createUser.mockResolvedValue({uid, displayName, email});
    await deployment(firebase, config, deleted);

    expect(deleted.ref.set.mock.calls).toEqual([[{version: 0}]]);
    expect(mockCollection.mock.calls[0]).toEqual(["service"]);
    expect(mockDoc.mock.calls[0]).toEqual(["conf"]);
    expect(mockBatch.set.mock.calls[0]).toEqual([
      {path: "service/conf"},
      {
        version: "1.0.0+0",
        url,
        seed: expect.any(String),
        invExp: 10 * 24 * 3600 * 1000,
        policy: expect.any(String),
        createdAt: expect.any(Date),
        createdBy: "system",
        updatedAt: expect.any(Date),
        updatedBy: "system",
      },
    ]);
    expect(mockAuth.createUser.mock.calls).toEqual([[
      {
        displayName,
        email,
        emailVerified: false,
        password,
      },
    ]]);
    expect(mockCollection.mock.calls[1]).toEqual(["accounts"]);
    expect(mockDoc.mock.calls[1]).toEqual([uid]);
    expect(mockBatch.set.mock.calls[1]).toEqual([
      {path: `accounts/${uid}`},
      {
        name: displayName,
        valid: true,
        createdAt: expect.any(Date),
        createdBy: "system",
        updatedAt: expect.any(Date),
        updatedBy: "system",
      },
    ]);
    expect(mockCollection.mock.calls[2]).toEqual(["groups"]);
    expect(mockDoc.mock.calls[2]).toEqual(["admins"]);
    expect(mockBatch.set.mock.calls[2]).toEqual([
      {path: "groups/admins"},
      {
        name: expect.any(String),
        accounts: [uid],
        createdAt: expect.any(Date),
        createdBy: "system",
        updatedAt: expect.any(Date),
        updatedBy: "system",
      },
    ]);
    expect(mockCollection.mock.calls[3]).toEqual(["groups"]);
    expect(mockDoc.mock.calls[3]).toEqual(["testers"]);
    expect(mockBatch.set.mock.calls[3]).toEqual([
      {path: "groups/testers"},
      {
        name: "Tester",
        accounts: [uid],
        createdAt: expect.any(Date),
        createdBy: "system",
        updatedAt: expect.any(Date),
        updatedBy: "system",
      },
    ]);
    expect(mockBatch.set.mock.calls[4]).toEqual([
      deleted.ref, {version: newVersion, updatedAt: expect.any(Date)},
    ]);
    expect(mockBatch.commit.mock.calls).toEqual([[]]);
    expect(mockCollection.mock.calls).toHaveLength(4);
    expect(mockDoc.mock.calls).toHaveLength(4);
    expect(mockBatch.set.mock.calls).toHaveLength(5);
  });

  it("restore deployment version 0," +
  " and sets initial data and sets deployment version 1" +
  " if previous version is null", async function() {
    const {email} = config.initial;
    const displayName = "Primary user";
    deleted.data.mockReturnValueOnce({version: null});
    mockDoc
        .mockReturnValueOnce({path: "service/conf"})
        .mockReturnValueOnce({path: "accounts/new"});
    mockAuth.createUser.mockResolvedValue({displayName, email});
    await deployment(firebase, config, deleted);

    expect(deleted.ref.set.mock.calls).toEqual([[{version: 0}]]);
    expect(mockBatch.set.mock.calls[4]).toEqual([
      deleted.ref, {
        version: newVersion,
        updatedAt: expect.any(Date),
      },
    ]);
  });

  it("sets deployment version 0," +
    " and sets initial data and sets deployment version 1" +
    " if previous version is undefined", async function() {
    const {email} = config.initial;
    const displayName = "Primary user";
    mockDoc
        .mockReturnValueOnce({path: "service/conf"})
        .mockReturnValueOnce({path: "accouns/new"});
    mockAuth.createUser.mockResolvedValue({displayName, email});
    await deployment(firebase, config, deleted);

    expect(deleted.ref.set.mock.calls).toEqual([[{version: 0}]]);
    expect(mockBatch.set.mock.calls[4]).toEqual([
      deleted.ref, {
        version: newVersion,
        updatedAt: expect.any(Date),
      },
    ]);
  });

  it("sets deployment version (newVersion)," +
  " and do nothing" +
  " if previous version is (newVersion)", async function() {
    deleted.data.mockReturnValueOnce({version: newVersion});
    await deployment(firebase, config, deleted);

    expect(deleted.ref.set.mock.calls).toEqual([[{version: 1}]]);
    expect(mockBatch.create.mock.calls).toEqual([]);
    expect(mockBatch.set.mock.calls).toEqual([]);
    expect(mockBatch.update.mock.calls).toEqual([]);
    expect(mockBatch.commit.mock.calls).toEqual([]);
  });

  it("sets deployment version (newVersion + 1)," +
  " and do nothing" +
  " if previous version is (newVersion + 1)", async function() {
    deleted.data.mockReturnValueOnce({version: newVersion + 1});
    await deployment(firebase, config, deleted);

    expect(deleted.ref.set.mock.calls).toEqual([[{version: 2}]]);
    expect(mockBatch.create.mock.calls).toEqual([]);
    expect(mockBatch.set.mock.calls).toEqual([]);
    expect(mockBatch.update.mock.calls).toEqual([]);
    expect(mockBatch.commit.mock.calls).toEqual([]);
  });
});
