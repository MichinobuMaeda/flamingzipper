import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../config/l10n.dart';
import '../config/theme.dart';

class UnknownSliver extends ConsumerWidget {
  const UnknownSliver({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bodyHeight = min<double>(
      max(
        MediaQuery.of(context).size.height - 192.0,
        96.0,
      ),
      320.0,
    );

    return SliverToBoxAdapter(
      child: SizedBox(
        height: bodyHeight,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ElevatedButton.icon(
              icon: const Icon(Icons.home),
              label: Text(L10n.of(context)!.goBack),
              onPressed: () => context.go('/'),
              style: filledButtonStyle(context),
            ),
            SizedBox(height: bodyHeight / 8),
            Flexible(child: Text(L10n.of(context)!.notFound)),
          ],
        ),
      ),
    );
  }
}
