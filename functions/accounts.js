const {logger} = require("firebase-functions");

const EMPTY_EMAIL = "unknown@domain.invalid";

/**
 * Handle firestore event: created doc of collection 'accoutns'.
 * @param {object} firebase Firebase API
 * @param {object} doc the created doc.
 * @return {Promise} void
 */
async function onCreateAccount({auth}, doc) {
  const displayName = doc.get("name") || "";
  let user;

  try {
    user = await auth.getUser(doc.id);
    if (user.displayName !== displayName) {
      await auth.updateUser(user.uid, {displayName});
    }
  } catch (e) {
    user = await auth.createUser({uid: doc.id, displayName});
  }
}

/**
 * Handle firestore event: updated doc of collection 'accoutns'.
 * @param {object} firebase Firebase API
 * @param {object} change the updated doc
 * @return {Promise} void
 */
async function onUpdateAccount({auth}, {after}) {
  try {
    const user = await auth.getUser(after.id);

    if ((user.displayName || "") !== (after.get("name") || "")) {
      await auth.updateUser(after.id, {displayName: after.get("name") || ""});
    }
  } catch (e) {
    await onCreateAccount({auth}, after);
  }
}

/**
 * Generate randome password.
 * @param {string} seed the seed for hash
 * @return {striing} hashed invitation code
 */
async function generateRandomePassword(seed) {
  const {createHash} = await require("node:crypto");
  const hash = createHash("sha256");
  hash.update(seed);
  hash.update(new Date().toISOString());
  return hash.digest("hex");
}

/**
 * Update the email of the given user.
 * @param {object} request the request parameter: invited user id
 * @return {function} the function for invited user
 */
function updateUserEmail({id, email}) {
  return async function({auth}, uid) {
    logger.info(`update email: ${email} of ${id} by ${uid}`);
    await auth.updateUser(id, {email: email || EMPTY_EMAIL});
  };
}

/**
 * Update the password of the given user.
 * @param {object} request the request parameter: invited user id
 * @return {function} the function for invited user
 */
function updateUserPassword({id, password}) {
  return async function({auth}, uid) {
    logger.info(`update password of ${id} by ${uid}`);
    await auth.updateUser(
        id,
        {password: password || await generateRandomePassword(id)},
    );
  };
}

module.exports = {
  onCreateAccount,
  onUpdateAccount,
  updateUserEmail,
  generateRandomePassword,
  updateUserPassword,
};
