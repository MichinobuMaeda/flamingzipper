import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../config/l10n.dart';
import '../models/client_status.dart';

enum Menu { none, preferences, about, development }

class MoreMenu extends ConsumerWidget {
  final GoRouterState routerState;

  const MoreMenu({
    super.key,
    required this.routerState,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = GoRouter.of(context);

    return PopupMenuButton<Menu>(
      icon: const Icon(Icons.more_horiz),
      position: PopupMenuPosition.under,
      initialValue: Menu.none,
      onSelected: (Menu item) {
        switch (item) {
          case Menu.preferences:
            router.goNamed(RouteName.me.name);
            break;
          case Menu.about:
            router.goNamed(RouteName.about.name);
            break;
          default:
            break;
        }
      },
      itemBuilder: (BuildContext context) => [
        PopupMenuItem<Menu>(
          enabled: routerState.name != RouteName.me.name,
          value: Menu.preferences,
          child: ListTile(
            leading: const Icon(Icons.account_circle),
            title: Text(L10n.of(context)!.settings),
          ),
        ),
        PopupMenuItem<Menu>(
          enabled: routerState.name != RouteName.about.name,
          value: Menu.about,
          child: ListTile(
            leading: const Icon(Icons.info),
            title: Text(L10n.of(context)!.aboutApp),
          ),
        ),
        PopupMenuItem<Menu>(
          value: Menu.development,
          child: ListTile(
            leading: const Icon(Icons.memory),
            title: Text(L10n.of(context)!.development),
          ),
        ),
      ],
    );
  }
}
