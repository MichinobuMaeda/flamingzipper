import 'package:flamingzipper/services/providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../config/l10n.dart';
import '../config/theme.dart';
import '../config/validators.dart';
import '../services/auth_repository.dart';

class SignInSliver extends ConsumerWidget {
  final emailController = TextEditingController();
  final passwordController = TextEditingController();

  SignInSliver({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final signInSignUpNotifire = ref.watch(signInSignUpProvider.notifier);
    final signInSignUpState = ref.watch(signInSignUpProvider);
    final email = ref.watch(
      signInSignUpProvider.select((value) => value.email),
    );
    final password = ref.watch(
      signInSignUpProvider.select((value) => value.password),
    );
    final showPassword = ref.watch(
      signInSignUpProvider.select((value) => value.showPassword),
    );
    if (emailController.text != email) {
      emailController.text = email;
    }
    if (passwordController.text != password) {
      passwordController.text = password;
    }

    return SliverWithSingleColumn(
      children: [
        TextField(
          key: const ValueKey('SignInEmail'),
          controller: emailController,
          decoration: InputDecoration(
            label: Text(L10n.of(context)!.email),
            errorText: emailValidator(context)(email),
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
          key: const ValueKey('SignInPassword'),
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
              )),
          style: GoogleFonts.robotoMono(),
          obscureText: !showPassword,
          onChanged: (String value) {
            signInSignUpNotifire.state = signInSignUpState.copyWith(
              password: value,
            );
          },
        ),
        const SizedBox(height: spacing),
        if (password.isNotEmpty &&
            email.isNotEmpty &&
            emailValidator(context)(email) == null)
          OutlinedButton(
            onPressed: () => AuthRepo().signInWithEmailAndPassword(
              email: email,
              password: password,
            ),
            style: fullWithdOutlinedButtonStyle,
            child: Text((L10n.of(context)!.siginInWithPasword)),
          ),
        // if (password.isEmpty &&
        //     email.isNotEmpty &&
        //     emailValidator(context)(email) == null)
        //   OutlinedButton(
        //     onPressed: () => AuthRepo().(
        //       email: email,
        //       password: password,
        //     ),
        //     style: fullWithdOutlinedButtonStyle,
        //     child: Text((L10n.of(context)!.siginInWithPasword)),
        //   ),
      ],
    );
  }
}
