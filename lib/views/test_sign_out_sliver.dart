import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/theme.dart';
import '../services/auth_repository.dart';

class TestSignOutSliver extends ConsumerWidget {
  const TestSignOutSliver({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SliverToBoxAdapter(
      child: SizedBox(
        height: 64.0,
        child: Center(
          child: ElevatedButton(
            onPressed: AuthRepo().signOutIfSignedIn,
            style: filledButtonStyle(context),
            child: const Text('Test: Sign out'),
          ),
        ),
      ),
    );
  }
}
