import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart';
import './firestore_repository.dart';

class AuthRepo {
  final FirebaseAuth _instance;

  AuthRepo({FirebaseAuth? instance})
      : _instance = instance ?? FirebaseAuth.instance;

  void handleDeepLink(String? initialLink) async {
    debugPrint('${DateTime.now().toIso8601String()} initialLink: $initialLink');

    if (initialLink != null && _instance.isSignInWithEmailLink(initialLink)) {
      //   final String? email = _platformBloc.state.email;
      //   if (email != null) {
      //     await _auth.signInWithEmailLink(
      //       email: email,
      //       emailLink: initialLink,
      //     );
      //     _platformBloc.add(SignedInAtChanged());
      //   }
    }
  }

  Stream<User?> authStateChanges() => _instance.authStateChanges();

  Future<void> createUserWithEmailAndPassword({
    required String displayName,
    required String email,
    required String password,
    required FirestoreRepo db,
  }) async {
    await _instance.createUserWithEmailAndPassword(
      email: email,
      password: password,
    );
    await _instance.currentUser?.updateDisplayName(displayName);
    db.setDoc(
      db.accountsRef.doc(_instance.currentUser?.uid),
      _instance.currentUser?.uid ?? 'unknown',
      {
        "name": displayName,
        "valid": true,
      },
    );
  }

  Future<void> signInWithEmailAndPassword({
    required String email,
    required String password,
  }) async {
    await _instance.signInWithEmailAndPassword(
        email: email, password: password);
  }

  Future<void> sendEmailVerification() async {
    debugPrint('sendEmailVerification();');
    await _instance.currentUser?.sendEmailVerification();
  }

  Future<User?> reloadUser() async {
    await _instance.currentUser?.reload();
    return _instance.currentUser;
  }

  Future<void> signOutIfSignedIn() async {
    if (_instance.currentUser != null) {
      debugPrint('${DateTime.now().toIso8601String()} signOut()');
      await _instance.signOut();
    }
  }
}
