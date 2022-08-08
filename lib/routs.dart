import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'models/client_status.dart';
import 'views/scaffold.dart';
import 'views/home_sliver.dart';
import 'views/about_sliver.dart';
import 'views/policy_sliver.dart';
import 'views/preferences_sliver.dart';
import 'views/unknown_sliver.dart';

final List<GoRoute> routes = [
  GoRoute(
    name: RouteName.home.name,
    path: '/',
    builder: (context, state) => MyScaffold(
      routerState: state,
      children: const [
        HomeSliver(),
      ],
    ),
  ),
  GoRoute(
    name: RouteName.about.name,
    path: '/about',
    builder: (context, state) => MyScaffold(
      routerState: state,
      children: const [
        AboutSliver(),
        PolicySliver(),
      ],
    ),
  ),
  GoRoute(
    name: RouteName.me.name,
    path: '/me',
    builder: (context, state) => MyScaffold(
      routerState: state,
      children: const [
        PreferencesSliver(),
      ],
    ),
  ),
];

Widget routeErrorBuilder(BuildContext context, GoRouterState state) =>
    MyScaffold(
      routerState: state,
      children: const [
        UnknownSliver(),
      ],
    );
