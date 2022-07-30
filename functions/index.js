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

exports.onCreateAccount = functions.region(functions.config().region)
    .firestore.document("accounts/{accountId}").onCreate(
        function(doc) {
          return accounts.onCreateAccount(firebase, doc);
        },
    );

exports.onUpdateAccount = functions.region(functions.config().region)
    .firestore.document("accounts/{accountId}").onUpdate(
        function(chane) {
          return accounts.onUpdateAccount(firebase, chane);
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

exports.invite = functions.region(functions.config().region)
    .https.onCall(
        function(data, context) {
          return requireAdminAccount(
              firebase,
              context.auth?.uid,
              accounts.invite(data),
          );
        });

exports.getToken = functions.region(functions.config().region)
    .https.onCall(
        function(data) {
          return accounts.getToken(firebase, data);
        },
    );
