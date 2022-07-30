/**
 * Evaluate if the account is valid.
 * @param {object} firebase Firebase API
 * @param {string} uid the id of the account
 * @return {Promise} the object of the account
 */
async function isValidAccount(firebase, uid) {
  if (!uid) throw Error(`uid: ${uid}`);

  const db = firebase.firestore();
  const account = await db.collection("accounts").doc(uid).get();

  if (account.exists !== true) {
    throw Error(`uid: ${uid}, exists: ${account.exists}`);
  }

  if (account.get("valid") !== true) {
    throw Error(`uid: ${uid}, valid: ${account.get("valid")}`);
  }

  if (account.get("deletedAt")) {
    throw Error(`uid: ${uid}, deletedAt: ${account.get("deletedAt")}`);
  }

  return account;
}

/**
 * Do the given call back function if the account is valid.
 * @param {object} firebase Firebase API
 * @param {string} uid the id of the account
 * @param {function} cb Call back function
 * @return {Promise} the return value of the call back function.
 */
async function requireValidAccount(firebase, uid, cb) {
  await isValidAccount(firebase, uid);
  return cb(firebase, uid);
}

/**
 * Do the given call back function if the account is valid
 * and the account has admin privilige.
 * @param {object} firebase Firebase API
 * @param {string} uid the id of the account
 * @param {function} cb Call back function
 * @return {Promise} the return value of the call back function.
 */
async function requireAdminAccount(firebase, uid, cb) {
  await isValidAccount(firebase, uid);

  const db = firebase.firestore();
  const admins = await db.collection("groups").doc("admins").get();

  if (!admins.get("accounts")?.includes(uid)) {
    throw Error(`uid: ${uid} is not admin`);
  }

  return cb(firebase, uid);
}

module.exports = {
  isValidAccount,
  requireValidAccount,
  requireAdminAccount,
};
