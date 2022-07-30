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
    return SliverToBoxAdapter(
      child: SizedBox(
        height: 240.0,
        child: Column(
          children: [
            Flexible(child: Text(L10n.of(context)!.emailVerificationRequired)),
            const SizedBox(height: 8.0),
            ElevatedButton(
              onPressed: AuthRepo().sendEmailVerification,
              style: filledButtonStyle(context),
              child: Text(L10n.of(context)!.send),
            ),
            const SizedBox(height: 8.0),
            ElevatedButton(
              onPressed: () async {
                final User? user = await AuthRepo().reloadUser();
                ref.watch(authnProvider.notifier).state =
                    AuthUser.fromUser(user);
              },
              style: filledButtonStyle(context),
              child: Text(L10n.of(context)!.confirm),
            ),
            const SizedBox(height: 8.0),
            Flexible(child: Text(L10n.of(context)!.signOutForRetry)),
            const SizedBox(height: 8.0),
            ElevatedButton(
              onPressed: AuthRepo().signOutIfSignedIn,
              style: filledButtonStyle(context),
              child: Text(L10n.of(context)!.signOut),
            ),
          ],
        ),
      ),
    );
  }
}
