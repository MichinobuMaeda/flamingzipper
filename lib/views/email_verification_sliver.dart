import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';

import '../config/l10n.dart';
import '../config/theme.dart';
import '../models/auth_user.dart';
import '../services/auth_repository.dart';
import '../services/providers.dart';

class EmailVerification extends ConsumerWidget {
  const EmailVerification({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SliverWithSingleColumn(
      children: [
        Text(L10n.of(context)!.emailVerificationRequired),
        const SizedBox(height: spacing),
        OutlinedButton(
          onPressed: () async {
            await AuthRepo().sendEmailVerification();
            ref.watch(authnProvider.notifier).state = ref
                .watch(authnProvider.notifier)
                .state
                .copyWithSentEmailVerification(true);
          },
          style: fullWithdOutlinedButtonStyle,
          child: Text(L10n.of(context)!.send),
        ),
        const SizedBox(height: spacing),
        Text(L10n.of(context)!.sentUrlToVerify),
        if (ref.watch(
            authnProvider.select((authn) => authn.sentEmailVerification)))
          const SizedBox(height: spacing),
        if (ref.watch(
            authnProvider.select((authn) => authn.sentEmailVerification)))
          OutlinedButton(
            onPressed: () async {
              final User? user = await AuthRepo().reloadUser();
              ref.watch(authnProvider.notifier).state = AuthUser.fromUser(user);
            },
            style: fullWithdOutlinedButtonStyle,
            child: Text(L10n.of(context)!.confirm),
          ),
        const SizedBox(height: spacing),
        Text(L10n.of(context)!.signOutForRetry),
        const SizedBox(height: spacing),
        OutlinedButton(
          onPressed: AuthRepo().signOutIfSignedIn,
          style: fullWithdOutlinedButtonStyle,
          child: Text(L10n.of(context)!.signOut),
        ),
      ],
    );
  }
}
