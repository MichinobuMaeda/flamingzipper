import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/l10n.dart';

class HomeSliver extends ConsumerWidget {
  const HomeSliver({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SliverToBoxAdapter(
      child: SizedBox(
        height: 64.0,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Flexible(child: Text(L10n.of(context)!.home)),
          ],
        ),
      ),
    );
  }
}
