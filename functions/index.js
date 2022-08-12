const functions = require("firebase-functions");
const {initializeApp} = require("firebase-admin/app");
const {getAuth} = require("firebase-admin/auth");
const {getFirestore} = require("firebase-admin/firestore");
const {getStorage} = require("firebase-admin/storage");
const deployment = require("./deployment");
const {requireAdminAccount} = require("./guard");
const accounts = require("./accounts");
const {kenAll, jigyosyo} = require("./zip");

const region = "asia-northeast2";
const timeZone = "Asia/Tokyo";
const timeoutSeconds = 540; // 9 min (max)
const memory = "1GB";

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
    .runWith({timeoutSeconds, memory})
    .pubsub.schedule("13 3 * * *").timeZone(timeZone)
    .onRun(() => kenAll(firebase));

exports.jigyosyo = functions.region(region)
    .runWith({timeoutSeconds, memory})
    .pubsub.schedule("27 3 * * *").timeZone(timeZone)
    .onRun(() => jigyosyo(firebase));
