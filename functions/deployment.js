const {logger} = require("firebase-functions");

/**
 * Update data on deployment.
 * @param {object} firebase Firebase API
 * @param {object} config config of functions
 * @param {object} snap deleted doc
 * @return {Promise} void
 */
async function deployment({auth, db}, config, snap) {
  const deleted = snap.data();
  const current = deleted?.version || 0;
  logger.info(`Get version: ${current}`);
  await snap.ref.set({version: current});


  const version = 1;
  if (current < version) {
    const ts = new Date();
    const docInfo = {
      createdAt: ts,
      createdBy: "system",
      updatedAt: ts,
      updatedBy: "system",
    };

    const {randomBytes} = await require("node:crypto");

    const batch = db.batch();
    batch.set(
        db.collection("service").doc("conf"),
        {
          ...docInfo,
          version: "1.0.0+0",
          url: config.initial.url,
          seed: randomBytes(128).toString("hex"),
          policy: `
# Privacy policy

## headline level 2

<https://example.com>

[link](https://example.com)

The quick brown fox jumps over the lazy dog.
The quick brown fox jumps over the lazy dog.
The quick brown fox jumps over the lazy dog.
The quick brown fox jumps over the lazy dog.
The quick brown fox jumps over the lazy dog.
The quick brown fox jumps over the lazy dog.

- list item 1
- list item 2
- list item 3
- list item 4

\`\`\`
code block 1
code block 2
code block 3
code block 4
\`\`\`
`,
        },
    );

    const user = await auth.createUser({
      displayName: "Primary user",
      email: config.initial.email,
      emailVerified: false,
      password: config.initial.password,
    });

    batch.set(
        db.collection("accounts").doc(user.uid),
        {
          ...docInfo,
          name: user.displayName,
          valid: true,
        },
    );

    batch.set(
        db.collection("groups").doc("admins"),
        {
          ...docInfo,
          name: "System admin",
          accounts: [user.uid],
        },
    );

    batch.set(
        db.collection("groups").doc("testers"),
        {
          ...docInfo,
          name: "Tester",
          accounts: [user.uid],
        },
    );

    batch.set(snap.ref, {version, updatedAt: new Date()});
    await batch.commit();
    logger.info(`Set version: ${version}`);
  }
}

module.exports = deployment;
