const functions = require("firebase-functions");
const {initializeApp} = require("firebase-admin/app");
const {getAuth} = require("firebase-admin/auth");
const {getFirestore} = require("firebase-admin/firestore");
const {getStorage} = require("firebase-admin/storage");
const deployment = require("./deployment");
const {requireAdminAccount} = require("./guard");
const accounts = require("./accounts");
const {kenAll, jigyosyo, mergeJisx040x, mergeZips} = require("./zip");

const region = "asia-northeast2";
const timeZone = "Asia/Tokyo";
const timeoutSeconds = 300;

initializeApp();

const firebase = {
  auth: getAuth(),
  db: getFirestore(),
  bucket: getStorage().bucket(),
  logger: functions.logger,
};

exports.deployment = functions.region(region)
    .firestore.document("service/deployment")
    .onDelete(
        function(snap) {
          return deployment(firebase, functions.config(), snap);
        },
    );

exports.updateUserEmail = functions.region(region)
    .https.onCall(
        function(data, context) {
          return requireAdminAccount(
              firebase,
              context.auth?.uid,
              accounts.updateUserEmail(data),
          );
        });

exports.updateUserPassword = functions.region(region)
    .https.onCall(
        function(data, context) {
          return requireAdminAccount(
              firebase,
              context.auth?.uid,
              accounts.updateUserPassword(data),
          );
        });

exports.kenAll = functions.region(region)
    .runWith({timeoutSeconds})
    .pubsub.schedule("11 3 * * *").timeZone(timeZone)
    .onRun(() => kenAll(firebase));

exports.jigyosyo = functions.region(region)
    .runWith({timeoutSeconds})
    .pubsub.schedule("11 3 * * *").timeZone(timeZone)
    .onRun(() => jigyosyo(firebase));

exports.mergeJisx040x = functions.region(region)
    .runWith({timeoutSeconds})
    .pubsub.schedule("17 3 * * *").timeZone(timeZone)
    .onRun(() => mergeJisx040x(firebase));

exports.mergeZips0 = functions.region(region)
    .runWith({timeoutSeconds})
    .pubsub.schedule("21 3 * * *").timeZone(timeZone)
    .onRun(() => mergeZips(firebase, "0"));

exports.mergeZips1 = functions.region(region)
    .runWith({timeoutSeconds})
    .pubsub.schedule("21 3 * * *").timeZone(timeZone)
    .onRun(() => mergeZips(firebase, "1"));

exports.mergeZips2 = functions.region(region)
    .runWith({timeoutSeconds})
    .pubsub.schedule("21 3 * * *").timeZone(timeZone)
    .onRun(() => mergeZips(firebase, "2"));

exports.mergeZips3 = functions.region(region)
    .runWith({timeoutSeconds})
    .pubsub.schedule("21 3 * * *").timeZone(timeZone)
    .onRun(() => mergeZips(firebase, "3"));

exports.mergeZips4 = functions.region(region)
    .runWith({timeoutSeconds})
    .pubsub.schedule("21 3 * * *").timeZone(timeZone)
    .onRun(() => mergeZips(firebase, "4"));

exports.mergeZips5 = functions.region(region)
    .runWith({timeoutSeconds})
    .pubsub.schedule("21 3 * * *").timeZone(timeZone)
    .onRun(() => mergeZips(firebase, "5"));

exports.mergeZips6 = functions.region(region)
    .runWith({timeoutSeconds})
    .pubsub.schedule("21 3 * * *").timeZone(timeZone)
    .onRun(() => mergeZips(firebase, "6"));

exports.mergeZips7 = functions.region(region)
    .runWith({timeoutSeconds})
    .pubsub.schedule("21 3 * * *").timeZone(timeZone)
    .onRun(() => mergeZips(firebase, "7"));

exports.mergeZips8 = functions.region(region)
    .runWith({timeoutSeconds})
    .pubsub.schedule("21 3 * * *").timeZone(timeZone)
    .onRun(() => mergeZips(firebase, "8"));

exports.mergeZips9 = functions.region(region)
    .runWith({timeoutSeconds})
    .pubsub.schedule("21 3 * * *").timeZone(timeZone)
    .onRun(() => mergeZips(firebase, "9"));
