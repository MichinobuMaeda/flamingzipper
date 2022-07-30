import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/app_info.dart';
import '../models/auth_user.dart';
import '../models/account.dart';
import '../models/conf.dart';
import '../models/client_status.dart';
import '../models/group.dart';

enum ProviderName {
  testMode,
  appTitile,
  authn,
  conf,
  accounts,
  groups,
  me,
  admins,
  updateAvailable,
  authz
}

final testModeProvider = Provider<bool>(
  name: ProviderName.testMode.name,
  (_) => version.contains('test'),
);

final authnProvider = StateProvider<AuthUser>(
  name: ProviderName.authn.name,
  (_) => const AuthUser(),
);

final confProvider = StateProvider<Conf?>(
  name: ProviderName.conf.name,
  (_) => null,
);

final accountsProvider = StateProvider<List<Account>>(
  name: ProviderName.accounts.name,
  (_) => [],
);

final groupsProvider = StateProvider<List<Group>>(
  name: ProviderName.groups.name,
  (_) => [],
);

// Calculated states

final appTitileProvider = Provider<String>(
  name: ProviderName.appTitile.name,
  (ref) => ref.watch(testModeProvider) ? 'Local test' : appName,
);

final meProvider = StateProvider<Account?>(
  name: ProviderName.me.name,
  (ref) {
    try {
      final uid = ref.watch(authnProvider).uid;
      return ref
          .watch(accountsProvider)
          .singleWhere((account) => account.id == uid);
    } catch (_) {
      return null;
    }
  },
);

final adminsProvider = StateProvider<Group?>(
  name: ProviderName.admins.name,
  (ref) {
    try {
      return ref
          .watch(groupsProvider)
          .singleWhere((group) => group.id == 'admins');
    } catch (_) {
      return null;
    }
  },
);

final updateAvailableProvider = StateProvider<bool>(
  name: ProviderName.updateAvailable.name,
  (ref) {
    String? avaliable = ref.watch(confProvider.select((conf) => conf?.version));
    return avaliable != null && avaliable != version;
  },
);

final authzProvider = StateProvider<Authz>(
  name: ProviderName.authz.name,
  (ref) {
    if (ref.watch(confProvider) == null) {
      return Authz.loading;
    }

    if (!ref.watch(authnProvider.select((authUser) => authUser.loaded))) {
      return Authz.loading;
    }

    final me = ref.watch(meProvider);

    if (me == null) {
      return Authz.guest;
    }

    final emailVerified = ref.watch(
      authnProvider.select((authUser) => authUser.emailVerified),
    );

    if (emailVerified != true) {
      return Authz.notVerified;
    }

    return ref.watch(adminsProvider)?.accounts.contains(me.id) == true
        ? Authz.admin
        : Authz.user;
  },
);
