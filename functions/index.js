const functions = require("firebase-functions");
const {initializeApp} = require("firebase-admin/app");
const {getAuth} = require("firebase-admin/auth");
const {getFirestore} = require("firebase-admin/firestore");
const {getStorage} = require("firebase-admin/storage");
const deployment = require("./deployment");
const {requireAdminAccount} = require("./guard");
const accounts = require("./accounts");
const {
  kenAll, jigyosyo, mergeJisx040x, mergeSimpleZips,
  mergeSimpleZipsAll, archiveSimpleZips,
} = require("./zip");

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
    .runWith({timeoutSeconds, memory: "1GB"})
    .pubsub.schedule("11 3 * * *").timeZone(timeZone)
    .onRun(() => kenAll(firebase));

exports.jigyosyo = functions.region(region)
    .runWith({timeoutSeconds, memory: "1GB"})
    .pubsub.schedule("12 3 * * *").timeZone(timeZone)
    .onRun(() => jigyosyo(firebase));

exports.mergeJisx040x = functions.region(region)
    .runWith({timeoutSeconds})
    .pubsub.schedule("17 3 * * *").timeZone(timeZone)
    .onRun(() => mergeJisx040x(firebase));

exports.mergeSimpleZips0 = functions.region(region)
    .runWith({timeoutSeconds})
    .pubsub.schedule("41 3 * * *").timeZone(timeZone)
    .onRun(() => mergeSimpleZips(firebase, "0"));

exports.mergeSimpleZips1 = functions.region(region)
    .runWith({timeoutSeconds})
    .pubsub.schedule("42 3 * * *").timeZone(timeZone)
    .onRun(() => mergeSimpleZips(firebase, "1"));

exports.mergeSimpleZips2 = functions.region(region)
    .runWith({timeoutSeconds})
    .pubsub.schedule("43 3 * * *").timeZone(timeZone)
    .onRun(() => mergeSimpleZips(firebase, "2"));

exports.mergeSimpleZips3 = functions.region(region)
    .runWith({timeoutSeconds})
    .pubsub.schedule("44 3 * * *").timeZone(timeZone)
    .onRun(() => mergeSimpleZips(firebase, "3"));

exports.mergeSimpleZips4 = functions.region(region)
    .runWith({timeoutSeconds})
    .pubsub.schedule("45 3 * * *").timeZone(timeZone)
    .onRun(() => mergeSimpleZips(firebase, "4"));

exports.mergeSimpleZips5 = functions.region(region)
    .runWith({timeoutSeconds})
    .pubsub.schedule("46 3 * * *").timeZone(timeZone)
    .onRun(() => mergeSimpleZips(firebase, "5"));

exports.mergeSimpleZips6 = functions.region(region)
    .runWith({timeoutSeconds})
    .pubsub.schedule("47 3 * * *").timeZone(timeZone)
    .onRun(() => mergeSimpleZips(firebase, "6"));

exports.mergeSimpleZips7 = functions.region(region)
    .runWith({timeoutSeconds})
    .pubsub.schedule("48 3 * * *").timeZone(timeZone)
    .onRun(() => mergeSimpleZips(firebase, "7"));

exports.mergeSimpleZips8 = functions.region(region)
    .runWith({timeoutSeconds})
    .pubsub.schedule("49 3 * * *").timeZone(timeZone)
    .onRun(() => mergeSimpleZips(firebase, "8"));

exports.mergeSimpleZips9 = functions.region(region)
    .runWith({timeoutSeconds})
    .pubsub.schedule("50 3 * * *").timeZone(timeZone)
    .onRun(() => mergeSimpleZips(firebase, "9"));

exports.mergeSimpleZipsAll = functions.region(region)
    .runWith({timeoutSeconds, memory: "2GB"})
    .pubsub.schedule("21 3 * * *").timeZone(timeZone)
    .onRun(() => mergeSimpleZipsAll(firebase));

exports.archiveSimpleZips = functions.region(region)
    .runWith({timeoutSeconds, memory: "2GB"})
    .pubsub.schedule("23 3 * * *").timeZone(timeZone)
    .onRun(() => archiveSimpleZips(firebase));
