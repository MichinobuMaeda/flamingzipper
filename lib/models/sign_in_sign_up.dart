import 'package:equatable/equatable.dart';

class SignInSignUp extends Equatable {
  final String displayName;
  final String email;
  final String password;
  final String confirmation;
  final bool showPassword;
  final bool register;

  const SignInSignUp({
    this.displayName = '',
    this.email = '',
    this.password = '',
    this.confirmation = '',
    this.showPassword = false,
    this.register = false,
  });

  SignInSignUp copyWith({
    String? displayName,
    String? email,
    String? password,
    String? confirmation,
    bool? showPassword,
    bool? register,
  }) =>
      SignInSignUp(
        displayName: displayName ?? this.displayName,
        email: email ?? this.email,
        password: password ?? this.password,
        confirmation: confirmation ?? this.confirmation,
        showPassword: showPassword ?? this.showPassword,
        register: register ?? this.register,
      );

  @override
  List<Object?> get props => [
        displayName,
        email,
        password,
        confirmation,
        showPassword,
        register,
      ];

  @override
  String toString() {
    return '{ displayName: "$displayName",'
        ' email: "$email",'
        ' password: "$password",'
        ' confirmation: "$confirmation",'
        ' showPassword: $showPassword,'
        ' register: $register }';
  }
}
