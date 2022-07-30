import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/theme.dart';
import '../services/auth_repository.dart';

class TestSignInSliver extends ConsumerWidget {
  const TestSignInSliver({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SliverToBoxAdapter(
      child: SizedBox(
        height: 64.0,
        child: Center(
          child: ElevatedButton(
            onPressed: () => AuthRepo().signInWithEmailAndPassword(
              email: 'primary@example.com',
              password: 'password',
            ),
            style: filledButtonStyle(context),
            child: const Text('Test: Sign in'),
          ),
        ),
      ),
    );
  }
}
