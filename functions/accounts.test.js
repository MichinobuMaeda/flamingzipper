const {
  createFirestoreDocSnapMock,
  createMockFirebase,
} = require("./testutils");
const {
  onCreateAccount,
  onUpdateAccount,
  generateRandomePassword,
  updateUserEmail,
  updateUserPassword,
} = require("./accounts");

const doc1 = createFirestoreDocSnapMock(jest, "user01id");
const {
  mockAuth,
  firebase,
} = createMockFirebase(jest);

const EMPTY_EMAIL = "unknown@domain.invalid";

afterEach(async function() {
  jest.clearAllMocks();
});

describe("onCreateAccount", function() {
  it("do nothing with same display name.", async function() {
    const uid = doc1.id;
    const displayName = "User 01";
    const name = displayName;
    const user = {uid, displayName};
    doc1.data.mockReturnValue({name});
    mockAuth.getUser.mockResolvedValue(user);

    await onCreateAccount(firebase, doc1);

    expect(mockAuth.getUser.mock.calls).toEqual([[uid]]);
    expect(mockAuth.updateUser.mock.calls).toHaveLength(0);
    expect(mockAuth.createUser.mock.calls).toHaveLength(0);
  });

  it("update user with different display name.", async function() {
    const uid = doc1.id;
    const displayName = "User 01";
    const name = displayName;
    const user = {uid, displayName: "org"};
    doc1.data.mockReturnValue({name});
    mockAuth.getUser.mockResolvedValue(user);

    await onCreateAccount(firebase, doc1);

    expect(mockAuth.getUser.mock.calls).toEqual([[uid]]);
    expect(mockAuth.updateUser.mock.calls).toEqual([[uid, {displayName}]]);
    expect(mockAuth.createUser.mock.calls).toHaveLength(0);
  });

  it("creates auth user" +
  "if user is not exists.", async function() {
    const uid = doc1.id;
    const displayName = "User 01";
    const name = displayName;
    const user = {uid, displayName};
    doc1.data.mockReturnValue({name});
    mockAuth.getUser.mockRejectedValue(new Error("test"));
    mockAuth.createUser.mockResolvedValue(user);

    await onCreateAccount(firebase, doc1);

    expect(mockAuth.getUser.mock.calls).toEqual([[uid]]);
    expect(mockAuth.updateUser.mock.calls).toHaveLength(0);
    expect(mockAuth.createUser.mock.calls).toEqual([[{uid, displayName}]]);
  });

  it("creates auth user with empty namme" +
  " if user is not exists.", async function() {
    const uid = doc1.id;
    const displayName = "";
    const user = {uid, displayName};
    doc1.data.mockReturnValue({});
    mockAuth.getUser.mockRejectedValue(new Error("test"));
    mockAuth.createUser.mockResolvedValue(user);

    await onCreateAccount(firebase, doc1);

    expect(mockAuth.getUser.mock.calls).toEqual([[uid]]);
    expect(mockAuth.updateUser.mock.calls).toHaveLength(0);
    expect(mockAuth.createUser.mock.calls).toEqual([[{uid, displayName}]]);
  });
});

describe("onUpdateAccount", function() {
  it("calls onCreateAccount() for empty uid.", async function() {
    const uid = doc1.id;
    const displayName = "User 01";
    const name = displayName;
    const user = {uid, displayName};
    doc1.data.mockReturnValue({name});
    mockAuth.getUser.mockRejectedValueOnce(new Error("test"));
    mockAuth.createUser.mockResolvedValue(user);

    await onUpdateAccount(firebase, {
      before: {/* not used */},
      after: doc1,
    });

    expect(mockAuth.getUser.mock.calls).toEqual([[uid], [uid]]);
    expect(mockAuth.updateUser.mock.calls).toEqual([]);
    expect(mockAuth.createUser.mock.calls).toEqual([[user]]);
  });

  it("sets name of auth user with old name.", async function() {
    const uid = doc1.id;
    const displayName = "old name";
    const name = "new name";
    const user = {uid, displayName};
    doc1.data.mockReturnValue({name});
    mockAuth.getUser.mockResolvedValue(user);

    await onUpdateAccount(firebase, {
      before: {/* not used */},
      after: doc1,
    });

    expect(mockAuth.getUser.mock.calls).toEqual([[uid]]);
    expect(mockAuth.updateUser.mock.calls).toEqual([
      [uid, {displayName: name}],
    ]);
  });

  it("sets name of auth user without name.", async function() {
    const uid = doc1.id;
    const name = "new name";
    const user = {uid};
    doc1.data.mockReturnValue({name});
    mockAuth.getUser.mockResolvedValue(user);

    await onUpdateAccount(firebase, {
      before: {/* not used */},
      after: doc1,
    });

    expect(mockAuth.getUser.mock.calls).toEqual([[uid]]);
    expect(mockAuth.updateUser.mock.calls).toEqual([
      [uid, {displayName: name}],
    ]);
  });

  it("resets name of auth user for empty name.", async function() {
    const uid = doc1.id;
    const displayName = "old name";
    const user = {uid, displayName};
    doc1.data.mockReturnValue({});
    mockAuth.getUser.mockResolvedValue(user);

    await onUpdateAccount(firebase, {
      before: {/* not used */},
      after: doc1,
    });

    expect(mockAuth.getUser.mock.calls).toEqual([[uid]]);
    expect(mockAuth.updateUser.mock.calls).toEqual([
      [uid, {displayName: ""}],
    ]);
  });

  it("do nothing for same name.", async function() {
    const uid = doc1.id;
    const displayName = "User 01";
    const name = displayName;
    const user = {uid, displayName};
    doc1.data.mockReturnValue({name});
    mockAuth.getUser.mockResolvedValue(user);

    await onUpdateAccount(firebase, {
      before: {/* not used */},
      after: doc1,
    });

    expect(mockAuth.getUser.mock.calls).toEqual([[uid]]);
    expect(mockAuth.updateUser.mock.calls).toHaveLength(0);
  });
});

describe("generateRandomePassword", function() {
  it("return randome string.", async function() {
    const ret = await generateRandomePassword("user01id");

    expect(ret).toHaveLength(64);
  });
});

describe("updateUserEmail", function() {
  it("set email to given user.", async function() {
    const uid = "admin";
    const id = "user01id";
    const email = "user01@example.com";

    await updateUserEmail({id, email})(firebase, uid);

    expect(mockAuth.updateUser.mock.calls).toEqual([
      [id, {email}],
    ]);
  });

  it("set empty email to given user.", async function() {
    const uid = "admin";
    const id = "user01id";

    await updateUserEmail({id})(firebase, uid);

    expect(mockAuth.updateUser.mock.calls).toEqual([
      [id, {email: EMPTY_EMAIL}],
    ]);
  });
});

describe("updateUserPassword", function() {
  it("set password to given user.", async function() {
    const uid = "admin";
    const id = "user01id";
    const password = "user01password";

    await updateUserPassword({id, password})(firebase, uid);

    expect(mockAuth.updateUser.mock.calls).toEqual([
      [id, {password}],
    ]);
  });

  it("set empty email to given user.", async function() {
    const uid = "admin";
    const id = "user01id";

    await updateUserPassword({id})(firebase, uid);

    expect(mockAuth.updateUser.mock.calls).toEqual([
      [id, {password: expect.any(String)}],
    ]);
  });
});
