import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:math';

import '../config/l10n.dart';
import '../config/theme.dart';

class LoadingSliver extends ConsumerWidget {
  const LoadingSliver({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bodyHeight = min<double>(
      max(
        MediaQuery.of(context).size.height - menuBarHeight(context) - 40,
        96.0,
      ),
      min(
        320.0,
        MediaQuery.of(context).size.width - 24.0,
      ),
    );

    return SliverToBoxAdapter(
      child: SizedBox(
        height: bodyHeight,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SizedBox(
              width: bodyHeight / 2,
              height: bodyHeight / 2,
              child: const CircularProgressIndicator(),
            ),
            SizedBox(height: bodyHeight / 8),
            Flexible(child: Text(L10n.of(context)!.pleaseWait)),
          ],
        ),
      ),
    );
  }
}
