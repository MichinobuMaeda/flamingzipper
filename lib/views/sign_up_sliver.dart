import 'package:flamingzipper/services/providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../config/l10n.dart';
import '../config/theme.dart';
import '../config/validators.dart';
import '../services/auth_repository.dart';
import '../services/firestore_repository.dart';

class SignUpSliver extends ConsumerWidget {
  final displayNameController = TextEditingController();
  final emailController = TextEditingController();
  final passwordController = TextEditingController();
  final confirmationController = TextEditingController();

  SignUpSliver({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final signInSignUpNotifire = ref.watch(signInSignUpProvider.notifier);
    final signInSignUpState = ref.watch(signInSignUpProvider);
    final displayName = ref.watch(
      signInSignUpProvider.select((value) => value.displayName),
    );
    final email = ref.watch(
      signInSignUpProvider.select((value) => value.email),
    );
    final password = ref.watch(
      signInSignUpProvider.select((value) => value.password),
    );
    final confirmation = ref.watch(
      signInSignUpProvider.select((value) => value.confirmation),
    );
    final showPassword = ref.watch(
      signInSignUpProvider.select((value) => value.showPassword),
    );
    if (displayNameController.text != displayName) {
      displayNameController.text = displayName;
    }
    if (emailController.text != email) {
      emailController.text = email;
    }
    if (passwordController.text != password) {
      passwordController.text = password;
    }
    if (confirmationController.text != confirmation) {
      confirmationController.text = confirmation;
    }

    return SliverWithSingleColumn(
      children: [
        TextField(
          key: const ValueKey('RegisterInDisplayName'),
          controller: displayNameController,
          decoration: InputDecoration(
            label: Text(L10n.of(context)!.displayName),
            errorText: requiredValidator(context)(displayName),
          ),
          onChanged: (String value) {
            signInSignUpNotifire.state = signInSignUpState.copyWith(
              displayName: value,
            );
          },
        ),
        const SizedBox(height: spacing),
        TextField(
          key: const ValueKey('RegisterInEmail'),
          controller: emailController,
          decoration: InputDecoration(
            label: Text(L10n.of(context)!.email),
            errorText: requiredValidator(context)(email) ??
                emailValidator(context)(email),
          ),
          style: GoogleFonts.robotoMono(),
          onChanged: (String value) {
            signInSignUpNotifire.state = signInSignUpState.copyWith(
              email: value,
            );
          },
        ),
        const SizedBox(height: spacing),
        TextField(
          key: const ValueKey('RegisterPassword'),
          controller: passwordController,
          decoration: InputDecoration(
            label: Text(L10n.of(context)!.password),
            suffixIcon: IconButton(
              icon: Icon(
                showPassword ? Icons.visibility : Icons.visibility_off,
              ),
              onPressed: () {
                signInSignUpNotifire.state = signInSignUpState.copyWith(
                  showPassword: !showPassword,
                );
              },
            ),
            errorText: requiredValidator(context)(password) ??
                passwordValidator(context)(password),
          ),
          style: GoogleFonts.robotoMono(),
          obscureText: !showPassword,
          onChanged: (String value) {
            signInSignUpNotifire.state = signInSignUpState.copyWith(
              password: value,
            );
          },
        ),
        const SizedBox(height: spacing),
        TextField(
          key: const ValueKey('RegisterConfirmation'),
          controller: confirmationController,
          decoration: InputDecoration(
            label: Text(L10n.of(context)!.confirm),
            suffixIcon: IconButton(
              icon: Icon(
                showPassword ? Icons.visibility : Icons.visibility_off,
              ),
              onPressed: () {
                signInSignUpNotifire.state = signInSignUpState.copyWith(
                  showPassword: !showPassword,
                );
              },
            ),
            errorText: confermationValidator(context)(password, confirmation),
          ),
          style: GoogleFonts.robotoMono(),
          obscureText: !showPassword,
          onChanged: (String value) {
            signInSignUpNotifire.state = signInSignUpState.copyWith(
              confirmation: value,
            );
          },
        ),
        const SizedBox(height: spacing),
        if (displayName.isNotEmpty &&
            email.isNotEmpty &&
            password.isNotEmpty &&
            emailValidator(context)(email) == null &&
            passwordValidator(context)(password) == null &&
            confermationValidator(context)(password, confirmation) == null)
          OutlinedButton(
            onPressed: () {
              try {
                AuthRepo().createUserWithEmailAndPassword(
                  displayName: displayName,
                  email: email,
                  password: password,
                  db: FirestoreRepo(),
                );
              } catch (e) {
                debugPrint(e.toString());
                // TODO: firebase_auth/email-already-in-use
              }
            },
            style: fullWithdOutlinedButtonStyle,
            child: Text((L10n.of(context)!.register)),
          ),
      ],
    );
  }
}
