import 'package:flamingzipper/services/providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/l10n.dart';
import '../config/theme.dart';

class SignInSignUpSliver extends ConsumerWidget {
  const SignInSignUpSliver({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final signInSignUpNotifire = ref.watch(signInSignUpProvider.notifier);
    final signInSignUpState = ref.watch(signInSignUpProvider);
    final register = ref.watch(
      signInSignUpProvider.select((value) => value.register),
    );

    return SliverWithSingleColumn(
      children: [
        Row(
          children: [
            ChoiceChip(
              avatar: const Icon(Icons.login),
              label: Text(L10n.of(context)!.signIn),
              selected: !register,
              selectedColor: chipSelectedColor(context),
              padding: chipPadding,
              onSelected: (_) =>
                  signInSignUpNotifire.state = signInSignUpState.copyWith(
                register: false,
              ),
            ),
            const SizedBox(width: spacing),
            ChoiceChip(
              avatar: const Icon(Icons.person_add),
              label: Text(L10n.of(context)!.register),
              selected: register,
              selectedColor: chipSelectedColor(context),
              padding: chipPadding,
              onSelected: (_) =>
                  signInSignUpNotifire.state = signInSignUpState.copyWith(
                register: true,
              ),
            ),
            const SizedBox(height: spacing),
          ],
        ),
      ],
    );
  }
}
