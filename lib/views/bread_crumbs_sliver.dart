import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../config/l10n.dart';
import '../config/theme.dart';
import '../models/client_status.dart';
import '../services/providers.dart';

class BreadCrumbsSliver extends ConsumerWidget {
  final GoRouterState routerState;

  const BreadCrumbsSliver({
    super.key,
    required this.routerState,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = GoRouter.of(context);
    final register = ref.watch(
      signInSignUpProvider.select((value) => value.register),
    );

    return SliverToBoxAdapter(
      child: Container(
        color: listItemColor(context, -1),
        height: 40.0,
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children:
                [Authz.user, Authz.admin].contains(ref.watch(authzProvider))
                    ? [
                        TextButton.icon(
                          onPressed: routerState.name == RouteName.home.name
                              ? null
                              : () => router.goNamed(RouteName.home.name),
                          icon: const Icon(Icons.home),
                          label: Text(L10n.of(context)!.home),
                        ),
                        if (routerState.name != RouteName.home.name)
                          const Text('»'),
                        if (routerState.name == RouteName.me.name)
                          TextButton.icon(
                            onPressed: null,
                            icon: const Icon(Icons.account_circle),
                            label: Text(L10n.of(context)!.settings),
                          ),
                        if (routerState.name == RouteName.about.name)
                          TextButton.icon(
                            onPressed: null,
                            icon: const Icon(Icons.info),
                            label: Text(L10n.of(context)!.aboutApp),
                          ),
                      ]
                    : [
                        if (ref.watch(authzProvider) == Authz.guest)
                          TextButton.icon(
                            onPressed: routerState.name == RouteName.home.name
                                ? null
                                : () => router.goNamed(RouteName.home.name),
                            icon: Icon(
                              register ? Icons.person_add : Icons.login,
                            ),
                            label: Text(
                              register
                                  ? L10n.of(context)!.register
                                  : L10n.of(context)!.signIn,
                            ),
                          ),
                        if (ref.watch(authzProvider) == Authz.notVerified)
                          TextButton.icon(
                            onPressed: routerState.name == RouteName.home.name
                                ? null
                                : () => router.goNamed(RouteName.home.name),
                            icon: const Icon(Icons.mark_email_read),
                            label: Text(L10n.of(context)!.verifyEmail),
                          ),
                        if (![Authz.guest, Authz.notVerified]
                            .contains(ref.watch(authzProvider)))
                          TextButton.icon(
                            onPressed: routerState.name == RouteName.home.name
                                ? null
                                : () => router.goNamed(RouteName.home.name),
                            icon: const Icon(Icons.home),
                            label: Text(L10n.of(context)!.home),
                          ),
                        const Text('|'),
                        TextButton.icon(
                          onPressed: routerState.name == RouteName.about.name
                              ? null
                              : () => router.goNamed(RouteName.about.name),
                          icon: const Icon(Icons.info),
                          label: Text(L10n.of(context)!.aboutApp),
                        ),
                      ],
          ),
        ),
      ),
    );
  }
}
