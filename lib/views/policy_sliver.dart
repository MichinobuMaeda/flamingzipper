import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class PolicySliver extends ConsumerWidget {
  const PolicySliver({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SliverToBoxAdapter(
      child: SizedBox(
        height: 1024.0,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [Text('Policy')],
        ),
      ),
    );
  }
}
