import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:math';

import '../config/l10n.dart';
import '../config/theme.dart';

class PreferencesSliver extends ConsumerWidget {
  const PreferencesSliver({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bodyHeight = min<double>(
      max(
        MediaQuery.of(context).size.height - menuBarHeight(context) - 40,
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
            Flexible(child: Text(L10n.of(context)!.settings)),
          ],
        ),
      ),
    );
  }
}
