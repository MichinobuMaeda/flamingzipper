import 'package:firebase_auth/firebase_auth.dart';
import 'package:equatable/equatable.dart';

class AuthUser extends Equatable {
  final bool loaded;
  final String? uid;
  final String? displayName;
  final String? email;
  final bool? emailVerified;
  final bool sentEmailVerification;

  const AuthUser({
    this.loaded = false,
    this.uid,
    this.displayName,
    this.email,
    this.emailVerified,
    this.sentEmailVerification = false,
  });

  AuthUser.fromUser(User? user)
      : loaded = true,
        uid = user?.uid,
        displayName = user?.displayName,
        email = user?.email,
        emailVerified = user?.emailVerified,
        sentEmailVerification = false;

  AuthUser copyWithSentEmailVerification(
    bool sentEmailVerification,
  ) =>
      AuthUser(
        loaded: loaded,
        uid: uid,
        displayName: displayName,
        email: email,
        emailVerified: emailVerified,
        sentEmailVerification: sentEmailVerification,
      );

  @override
  List<Object?> get props => [
        loaded,
        uid,
        displayName,
        email,
        emailVerified,
        sentEmailVerification,
      ];
}
