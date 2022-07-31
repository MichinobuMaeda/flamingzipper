const functions = require("firebase-functions");
const admin = require("firebase-admin");
const deployment = require("./deployment");
const {requireAdminAccount} = require("./guard");
const accounts = require("./accounts");

const firebase = admin.initializeApp();

exports.deployment = functions.region(functions.config().region)
    .firestore.document("service/deployment")
    .onDelete(
        function(snap) {
          return deployment(firebase, functions.config(), snap);
        },
    );

exports.updateUserEmail = functions.region(functions.config().region)
    .https.onCall(
        function(data, context) {
          return requireAdminAccount(
              firebase,
              context.auth?.uid,
              accounts.updateUserEmail(data),
          );
        });

exports.updateUserPassword = functions.region(functions.config().region)
    .https.onCall(
        function(data, context) {
          return requireAdminAccount(
              firebase,
              context.auth?.uid,
              accounts.updateUserPassword(data),
          );
        });
