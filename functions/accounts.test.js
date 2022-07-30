const {
  createFirestoreDocSnapMock,
  createMockFirebase,
} = require("./testutils");
const {
  onCreateAccount,
  onUpdateAccount,
  hashInvitation,
  generateRandomePassword,
  updateUserEmail,
  updateUserPassword,
  invite,
  getToken,
} = require("./accounts");

const conf = createFirestoreDocSnapMock(jest, "conf");
const doc1 = createFirestoreDocSnapMock(jest, "user01id");
const {
  mockAuth,
  mockDoc,
  mockDocRef,
  mockQueryRef,
  mockCollectionRef,
  mockCollection,
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

describe("invite", function() {
  it("sets invitation.", async function() {
    const invitedBy = "admin";
    const seed = "test";
    conf.data.mockReturnValue({seed});
    mockDocRef.get.mockResolvedValue(conf);

    const code = await invite({invitee: doc1.id})(firebase, invitedBy);

    expect(mockCollection.mock.calls).toEqual([
      ["service"],
      ["accounts"],
    ]);
    expect(mockDoc.mock.calls).toEqual([
      ["conf"],
      [doc1.id],
    ]);
    expect(mockDocRef.get.mock.calls).toEqual([
      [],
    ]);
    expect(mockDocRef.update.mock.calls).toEqual([
      [{
        invitation: await hashInvitation(seed, code),
        invitedBy,
        invitedAt: expect.any(Date),
        updatedBy: invitedBy,
        updatedAt: expect.any(Date),
      }],
    ]);
  });

  it("sets invitation with empty seed" +
    "if conf.seed is undefined.", async function() {
    const invitedBy = "admin";
    const seed = "";
    conf.data.mockReturnValue({});
    mockDocRef.get.mockResolvedValue(conf);

    const code = await invite({invitee: doc1.id})(firebase, invitedBy);

    expect(mockCollection.mock.calls).toEqual([
      ["service"],
      ["accounts"],
    ]);
    expect(mockDoc.mock.calls).toEqual([
      ["conf"],
      [doc1.id],
    ]);
    expect(mockDocRef.get.mock.calls).toEqual([
      [],
    ]);
    expect(mockDocRef.update.mock.calls).toEqual([
      [{
        invitation: await hashInvitation(seed, code),
        invitedBy,
        invitedAt: expect.any(Date),
        updatedBy: invitedBy,
        updatedAt: expect.any(Date),
      }],
    ]);
  });
});

describe("getToken", function() {
  it("rejects invitation with no account matches.", async function() {
    const seed = "test";
    const code = "dummy";
    const invExp = 1000000;
    conf.data.mockReturnValue({seed, invExp});
    mockQueryRef.get.mockResolvedValue({docs: []});

    await expect(
        function() {
          return getToken(firebase, {code});
        },
    ).rejects.toThrow("No record");

    expect(mockCollection.mock.calls).toEqual([
      ["service"],
      ["accounts"],
    ]);
    expect(mockDoc.mock.calls).toEqual([
      ["conf"],
    ]);
    expect(mockDocRef.get.mock.calls).toEqual([
      [],
    ]);
    expect(mockCollectionRef.where.mock.calls).toEqual([
      ["invitation", "==", expect.any(String)],
    ]);
    expect(doc1.ref.update.mock.calls).toEqual([]);
  });

  it("rejects invitation with multi accounts matches.", async function() {
    const seed = "test";
    const code = "dummy";
    const invExp = 1000000;
    conf.data.mockReturnValue({seed, invExp});
    mockQueryRef.get.mockResolvedValue({docs: [{}, {}]});

    await expect(
        function() {
          return getToken(firebase, {code});
        },
    ).rejects.toThrow("No record");

    expect(mockCollection.mock.calls).toEqual([
      ["service"],
      ["accounts"],
    ]);
    expect(mockDoc.mock.calls).toEqual([
      ["conf"],
    ]);
    expect(mockDocRef.get.mock.calls).toEqual([
      [],
    ]);
    expect(mockCollectionRef.where.mock.calls).toEqual([
      ["invitation", "==", expect.any(String)],
    ]);
    expect(doc1.ref.update.mock.calls).toEqual([]);
  });

  it("rejects account without the timestamp of invitation.", async function() {
    const seed = "test";
    const code = "dummy";
    const invExp = 1000000;
    conf.data.mockReturnValue({seed, invExp});
    const invitation = await hashInvitation(seed, code);
    const invitedAt = null;
    const invitedBy = "admin";
    doc1.data.mockReturnValue({invitation, invitedAt, invitedBy});
    mockQueryRef.get.mockResolvedValue({docs: [doc1]});

    await expect(
        () => getToken(firebase, {code}),
    ).rejects.toThrow(`Invalid status: ${doc1.id} invitedAt`);

    expect(mockCollection.mock.calls).toEqual([
      ["service"],
      ["accounts"],
    ]);
    expect(mockDoc.mock.calls).toEqual([
      ["conf"],
    ]);
    expect(mockDocRef.get.mock.calls).toEqual([
      [],
    ]);
    expect(mockCollectionRef.where.mock.calls).toEqual([
      ["invitation", "==", expect.any(String)],
    ]);
    expect(doc1.ref.update.mock.calls).toEqual([
      [{
        invitation: null,
        invitedBy: null,
        invitedAt: null,
        updatedBy: "system",
        updatedAt: expect.any(Date),
      }],
    ]);
  });

  it("rejects account without the timestamp of invitation.", async function() {
    const seed = "test";
    const code = "dummy";
    const invExp = 1000000;
    conf.data.mockReturnValue({seed, invExp});
    const invitation = await hashInvitation(seed, code);
    const invitedAt = {
      toMillis: function() {
        return new Date().getTime() - invExp;
      },
    };
    const invitedBy = null;
    doc1.data.mockReturnValue({invitation, invitedAt, invitedBy});
    mockQueryRef.get.mockResolvedValue({docs: [doc1]});

    await expect(
        () => getToken(firebase, {code}),
    ).rejects.toThrow(`Invalid status: ${doc1.id} invitedBy`);

    expect(mockCollection.mock.calls).toEqual([
      ["service"],
      ["accounts"],
    ]);
    expect(mockDoc.mock.calls).toEqual([
      ["conf"],
    ]);
    expect(mockDocRef.get.mock.calls).toEqual([
      [],
    ]);
    expect(mockCollectionRef.where.mock.calls).toEqual([
      ["invitation", "==", expect.any(String)],
    ]);
    expect(doc1.ref.update.mock.calls).toEqual([
      [{
        invitation: null,
        invitedBy: null,
        invitedAt: null,
        updatedBy: "system",
        updatedAt: expect.any(Date),
      }],
    ]);
  });

  it("rejects expired invitation.", async function() {
    const seed = "test";
    const code = "dummy";
    const invExp = 1000000;
    conf.data.mockReturnValue({seed, invExp});
    const invitation = await hashInvitation(seed, code);
    const invitedAt = {
      toMillis: function() {
        return new Date().getTime() - invExp - 1;
      },
    };
    const invitedBy = "admin";
    doc1.data.mockReturnValue({invitation, invitedAt, invitedBy});
    mockQueryRef.get.mockResolvedValue({docs: [doc1]});

    await expect(() => getToken(firebase, {code}))
        .rejects.toThrow(`Expired: ${doc1.id}`);

    expect(mockCollection.mock.calls).toEqual([
      ["service"],
      ["accounts"],
    ]);
    expect(mockDoc.mock.calls).toEqual([
      ["conf"],
    ]);
    expect(mockDocRef.get.mock.calls).toEqual([
      [],
    ]);
    expect(mockCollectionRef.where.mock.calls).toEqual([
      ["invitation", "==", expect.any(String)],
    ]);
    expect(doc1.ref.update.mock.calls).toEqual([
      [{
        invitation: null,
        invitedBy: null,
        invitedAt: null,
        updatedBy: "system",
        updatedAt: expect.any(Date),
      }],
    ]);
  });

  it("gets invitation token.", async function() {
    const seed = "test";
    const code = "dummy";
    const invExp = 1000000;
    conf.data.mockReturnValue({seed, invExp});
    const invitation = await hashInvitation(seed, code);
    const invitedAt = {
      toMillis: function() {
        return new Date().getTime() - invExp;
      },
    };
    const invitedBy = "admin";
    doc1.data.mockReturnValue({invitation, invitedAt, invitedBy});
    mockQueryRef.get.mockResolvedValue({docs: [doc1]});
    const token = "test token";
    mockAuth.createCustomToken.mockResolvedValue(token);

    const ret = await getToken(firebase, {code});

    expect(mockCollection.mock.calls).toEqual([
      ["service"],
      ["accounts"],
    ]);
    expect(mockDoc.mock.calls).toEqual([
      ["conf"],
    ]);
    expect(mockDocRef.get.mock.calls).toEqual([
      [],
    ]);
    expect(mockCollectionRef.where.mock.calls).toEqual([
      ["invitation", "==", expect.any(String)],
    ]);
    expect(doc1.ref.update.mock.calls).toEqual([]);
    expect(ret).toEqual(token);
  });
});
