import 'package:firebase_auth/firebase_auth.dart';
import 'package:equatable/equatable.dart';

class AuthUser extends Equatable {
  final bool loaded;
  final String? uid;
  final String? displayName;
  final String? email;
  final bool? emailVerified;

  const AuthUser()
      : loaded = false,
        uid = null,
        displayName = null,
        email = null,
        emailVerified = null;

  AuthUser.fromUser(User? user)
      : loaded = true,
        uid = user?.uid,
        displayName = user?.displayName,
        email = user?.email,
        emailVerified = user?.emailVerified;

  @override
  List<Object?> get props => [
        loaded,
        uid,
        displayName,
        email,
        emailVerified,
      ];
}
