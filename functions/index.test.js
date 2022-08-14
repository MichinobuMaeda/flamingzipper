const test = require("firebase-functions-test")();
const deployment = require("./deployment");
const guard = require("./guard");
const accounts = require("./accounts");
const zip = require("./zip");
const index = require("./index.js");

jest.mock("./deployment");
jest.mock("./guard");
jest.mock("./accounts");
jest.mock("./zip");

accounts.updateUserEmail = jest.fn(function() {
  return function() {};
});

accounts.updateUserPassword = jest.fn(function() {
  return function() {};
});

accounts.invite = jest.fn(function() {
  return function() {
    return "test";
  };
});

afterEach(async function() {
  jest.clearAllMocks();
});

describe("deployment", function() {
  it("calls deployment() with given data.", function() {
    const wrapped = test.wrap(index.deployment);
    wrapped({version: 0});
    expect(deployment.mock.calls).toEqual([
      [
        expect.any(Object), // FirebaseApp
        expect.any(Object), // config
        {version: 0},
      ],
    ]);
  });
});

describe("updateUserEmail", function() {
  it("calls requireAdminAccount()" +
  "with callback updateUserEmail().", function() {
    const wrapped = test.wrap(index.updateUserEmail);
    const id = "user01id";
    const email ="user01@example.com";
    wrapped({id, email}, {auth: {uid: "adminid"}});
    expect(guard.requireAdminAccount.mock.calls).toEqual([
      [
        expect.any(Object), // FirebaseApp
        "adminid",
        expect.any(Function),
      ],
    ]);
    expect(accounts.updateUserEmail.mock.calls).toEqual([
      [{id, email}],
    ]);
  });
});

describe("updateUserPassword", function() {
  it("calls requireAdminAccount()" +
  "with callback updateUserPassword().", function() {
    const wrapped = test.wrap(index.updateUserPassword);
    const id = "user01id";
    const password ="user01password";
    wrapped({id, password}, {auth: {uid: "adminid"}});
    expect(guard.requireAdminAccount.mock.calls).toEqual([
      [
        expect.any(Object), // FirebaseApp
        "adminid",
        expect.any(Function),
      ],
    ]);
    expect(accounts.updateUserPassword.mock.calls).toEqual([
      [{id, password}],
    ]);
  });
});

describe("kenAll", function() {
  it("calls kenAll()", function() {
    const wrapped = test.wrap(index.kenAll);
    wrapped();
    expect(zip.kenAll.mock.calls).toHaveLength(1);
  });
});

describe("jigyosyo", function() {
  it("calls jigyosyo()", function() {
    const wrapped = test.wrap(index.jigyosyo);
    wrapped();
    expect(zip.jigyosyo.mock.calls).toHaveLength(1);
  });
});

describe("mergeJisx040x", function() {
  it("calls mergeJisx040x()", function() {
    const wrapped = test.wrap(index.mergeJisx040x);
    wrapped();
    expect(zip.mergeJisx040x.mock.calls).toHaveLength(1);
  });
});

describe("mergeZips0 -> 9", function() {
  it("calls mergeZips0() -> 9() with prefix '0' -> '9'", function() {
    Array.from(Array(10).keys()).forEach(
        function(n) {
          const wrapped = test.wrap(index[`mergeSimpleZips${n}`]);
          wrapped();
        },
    );
    expect(zip.mergeSimpleZips.mock.calls).toHaveLength(10);
    Array.from(Array(10).keys()).forEach(
        function(n) {
          expect(zip.mergeSimpleZips.mock.calls[n][1]).toEqual(`${n}`);
        },
    );
  });
});

describe("archiveSimpleZips", function() {
  it("calls archiveSimpleZips()", function() {
    const wrapped = test.wrap(index.archiveSimpleZips);
    wrapped();
    expect(zip.archiveSimpleZips.mock.calls).toHaveLength(1);
  });
});
