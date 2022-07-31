const test = require("firebase-functions-test")();
const deployment = require("./deployment");
const guard = require("./guard");
const accounts = require("./accounts");
const index = require("./index.js");

jest.mock("./deployment");
jest.mock("./guard");
jest.mock("./accounts");

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
