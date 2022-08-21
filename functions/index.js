const functions = require("firebase-functions");
const {initializeApp} = require("firebase-admin/app");
const {getAuth} = require("firebase-admin/auth");
const {getFirestore} = require("firebase-admin/firestore");
const {getStorage} = require("firebase-admin/storage");
const {getFunctions} = require("firebase-admin/functions");
const {region, timeZone} = require("./config");
const deployment = require("./deployment");
const {requireAdminAccount} = require("./guard");
const accounts = require("./accounts");
const {
  getSources,
  parseSources,
  generateSample,
  reporStatus,
} = require("./zip");

const timeoutSeconds = 300;

initializeApp();

const firebase = {
  auth: getAuth(),
  db: getFirestore(),
  bucket: getStorage().bucket(),
  functions: getFunctions(),
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

exports.getSources = functions.region(region)
    .pubsub.schedule("11 3 * * *").timeZone(timeZone)
    .onRun(() => getSources(firebase));

exports.parseSources = functions.region(region)
    .runWith({timeoutSeconds, memory: "2GB"})
    .tasks.taskQueue()
    .onDispatch((data) => parseSources(firebase, data));

exports.generateSample = functions.region(region)
    .runWith({timeoutSeconds})
    .tasks.taskQueue()
    .onDispatch((data) => generateSample(firebase, data));

exports.reporStatus = functions.region(region)
    .pubsub.schedule("57 3 * * *").timeZone(timeZone)
    .onRun(() => reporStatus(firebase, functions.config()));
