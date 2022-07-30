import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../config/l10n.dart';
import '../config/theme.dart';
import '../models/client_status.dart';
import '../services/providers.dart';
import '../services/web.dart';
import '../views/loading_sliver.dart';
import '../views/email_verification_sliver.dart';
import '../views/sign_in_sliver.dart';
import '../views/test_sign_in_sliver.dart';
import '../views/test_sign_out_sliver.dart';
import 'bread_crumbs_sliver.dart';
import 'more_menu.dart';

enum Menu { none, preferences, about, development }

class MyScaffold extends ConsumerWidget {
  final GoRouterState routerState;
  final List<Widget> children;

  const MyScaffold({
    super.key,
    required this.routerState,
    required this.children,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    debugPrint('${DateTime.now().toIso8601String()} Scaffold');
    bool updateAvailable = ref.watch(updateAvailableProvider);

    return Scaffold(
      body: CustomScrollView(
        slivers: <Widget>[
          SliverAppBar(
            pinned: false,
            snap: true,
            floating: true,
            expandedHeight:
                menuBarHeight(context) + (updateAvailable ? 48.0 : 0),
            flexibleSpace: FlexibleSpaceBar(
              titlePadding: EdgeInsets.only(
                bottom: updateAvailable ? 48.0 : 8.0,
              ),
              title: Text(
                ref.watch(appTitileProvider),
                style: TextStyle(color: Theme.of(context).colorScheme.primary),
              ),
              background: menuBackground(context),
            ),
            bottom: updateAvailable
                ? PreferredSize(
                    preferredSize: const Size.fromHeight(0.0),
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 8.0),
                      child: OutlinedButton.icon(
                        icon: const Icon(Icons.system_update_alt),
                        label: Text(L10n.of(context)!.updateApp),
                        style: OutlinedButton.styleFrom(
                          primary: Theme.of(context).colorScheme.error,
                        ),
                        onPressed: () => uploadApp(),
                      ),
                    ),
                  )
                : null,
            actions:
                [Authz.user, Authz.admin].contains(ref.watch(authzProvider))
                    ? [
                        const SizedBox(width: 16.0),
                        IconButton(
                          icon: const Icon(Icons.add),
                          tooltip: L10n.of(context)!.add,
                          onPressed: null,
                        ),
                        const SizedBox(width: 16.0),
                        IconButton(
                          icon: const Icon(Icons.edit),
                          tooltip: L10n.of(context)!.edit,
                          onPressed: null,
                        ),
                        const SizedBox(width: 16.0),
                        IconButton(
                          icon: const Icon(Icons.search),
                          tooltip: L10n.of(context)!.search,
                          onPressed: null,
                        ),
                        const SizedBox(width: 16.0),
                        MoreMenu(routerState: routerState),
                      ]
                    : null,
            // backgroundColor: Theme.of(context).colorScheme.background,
          ),
          BreadCrumbsSliver(routerState: routerState),
          ...(routerState.name == RouteName.about.name)
              ? children
              : ref.watch(authzProvider) == Authz.loading
                  ? [
                      const LoadingSliver(),
                    ]
                  : ref.watch(authzProvider) == Authz.guest
                      ? [
                          const SignInSliver(),
                          if (ref.watch(testModeProvider))
                            const TestSignInSliver(),
                        ]
                      : ref.watch(authzProvider) == Authz.notVerified
                          ? [
                              const EmailVerification(),
                            ]
                          : [
                              ...children,
                              if (ref.watch(testModeProvider))
                                const TestSignOutSliver(),
                            ],
        ],
      ),
    );
  }
}
