import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

import '../models/account.dart';
import '../models/auth_user.dart';
import '../models/client_status.dart';
import '../models/conf.dart';
import '../models/group.dart';
import '../models/sign_in_sign_up.dart';
import '../services/auth_repository.dart';
import '../services/firestore_repository.dart';
import '../services/providers.dart';

class MyObserver extends ProviderObserver {
  final AuthRepo auth;
  final FirestoreRepo db;

  StreamSubscription? _accountsSub;
  StreamSubscription? _groupsSub;

  MyObserver(
    this.auth,
    this.db,
  );

  @override
  void didAddProvider(
    ProviderBase provider,
    Object? value,
    ProviderContainer container,
  ) {
    for (var providerName in ProviderName.values) {
      if (providerName.name != provider.name) continue;

      switch (providerName) {
        case ProviderName.testMode:
          break;
        case ProviderName.appTitile:
          break;
        case ProviderName.authn:
          didAddAuthnProvider(container);
          break;
        case ProviderName.conf:
          didAddConfProvider(container);
          break;
        case ProviderName.accounts:
          break;
        case ProviderName.groups:
          break;
        case ProviderName.me:
          break;
        case ProviderName.admins:
          break;
        case ProviderName.updateAvailable:
          break;
        case ProviderName.authz:
          break;
        case ProviderName.signInSignUp:
          break;
      }
    }
    super.didAddProvider(provider, value, container);
  }

  @override
  void didUpdateProvider(
    ProviderBase provider,
    Object? previousValue,
    Object? newValue,
    ProviderContainer container,
  ) {
    if (previousValue == newValue) {
      return;
    }
    for (var providerName in ProviderName.values) {
      if (providerName.name != provider.name) continue;

      switch (providerName) {
        case ProviderName.testMode:
          break;
        case ProviderName.appTitile:
          break;
        case ProviderName.authn:
          didUpdateAuthnProvider(
            previousValue as AuthUser,
            newValue as AuthUser,
            container,
          );
          break;
        case ProviderName.conf:
          didUpdateConfProvider(
            previousValue as Conf?,
            newValue as Conf,
            container,
          );
          break;
        case ProviderName.accounts:
          didUpdateAccountsProvider(
            previousValue as List<Account>,
            newValue as List<Account>,
            container,
          );
          break;
        case ProviderName.groups:
          didUpdateGroupsProvider(
            previousValue as List<Group>,
            newValue as List<Group>,
            container,
          );
          break;
        case ProviderName.me:
          didUpdateMeProvider(
            previousValue as Account?,
            newValue as Account?,
            container,
          );
          break;
        case ProviderName.admins:
          didUpdateAdminsProvider(
            previousValue as Group?,
            newValue as Group?,
            container,
          );
          break;
        case ProviderName.updateAvailable:
          didUpdateUpdateAvailableProvider(
            previousValue as bool?,
            newValue as bool,
            container,
          );
          break;
        case ProviderName.authz:
          didUpdateAuthzProvider(
            previousValue as Authz?,
            newValue as Authz,
            container,
          );
          break;
        case ProviderName.signInSignUp:
          didUpdateSignInSignUpProvider(
            previousValue as SignInSignUp?,
            newValue as SignInSignUp,
            container,
          );
          break;
      }
    }
  }

  void didAddAuthnProvider(
    ProviderContainer container,
  ) {
    debugPrint('${DateTime.now().toIso8601String()} didAddAuthnProvider()');

    auth.authStateChanges().listen((User? user) async {
      container.read(authnProvider.notifier).state = AuthUser.fromUser(user);
    });
  }

  void didAddConfProvider(
    ProviderContainer container,
  ) {
    debugPrint('${DateTime.now().toIso8601String()} didAddConfProvider()');

    db.confRef.snapshots().listen(
      (DocumentSnapshot<Map<String, dynamic>> snap) {
        container.read(confProvider.notifier).state =
            snap.exists ? Conf(snap) : null;
      },
      onError: (Object error, StackTrace stackTrace) {
        debugPrint('$runtimeType:onError\n$error\n$stackTrace');
      },
    );
  }

  void didUpdateAuthnProvider(
    AuthUser previousValue,
    AuthUser newValue,
    ProviderContainer container,
  ) {
    debugPrint('${DateTime.now().toIso8601String()} '
        'didUpdateAuthnProvider('
        'uid: ${previousValue.uid}, ${newValue.uid}, '
        'emailVerified: ${previousValue.emailVerified}, ${newValue.emailVerified})');

    if (newValue.uid == null) {
      if (previousValue.uid == null) {
        // Nothing to do
      } else {
        // Signed-out
        resetUserData(container);
      }
    } else if (previousValue.uid == null) {
      // Signed-in
      onSignedIn(newValue.uid!, container);
    } else if (previousValue.uid == newValue.uid) {
      // Nothing to do
    } else {
      debugPrint('${DateTime.now().toIso8601String()} unknown state: '
          'previousValue.uid != newValue.uid');
      resetUserData(container);
    }
  }

  void resetSignInSignUpProvider(
    ProviderContainer container,
  ) =>
      container.read(signInSignUpProvider.notifier).state =
          const SignInSignUp();

  Future<void> resetUserData(
    ProviderContainer container,
  ) async {
    debugPrint('${DateTime.now().toIso8601String()} resetUserData()');

    resetSignInSignUpProvider(container);

    await _accountsSub?.cancel();
    _accountsSub = null;
    await _groupsSub?.cancel();
    _groupsSub = null;

    await auth.signOutIfSignedIn();

    if (container.read(accountsProvider).isNotEmpty) {
      container.read(accountsProvider.notifier).state = [];
    }

    if (container.read(groupsProvider).isNotEmpty) {
      container.read(groupsProvider.notifier).state = [];
    }
  }

  Future<void> onSignedIn(
    String uid,
    ProviderContainer container,
  ) async {
    final adminsDoc = await db.adminsRef.get();

    resetSignInSignUpProvider(container);

    if (!adminsDoc.exists) {
      resetUserData(container);
      return;
    }

    final admins = Group(adminsDoc);

    if (admins.deletedAt != null) {
      resetUserData(container);
      return;
    }

    container.read(groupsProvider.notifier).state = [admins];
    debugPrint('admins.accounts: ${admins.accounts}');

    if (admins.accounts.contains(uid)) {
      setAdminData(container);
    } else {
      setUserData(uid, container);
    }
  }

  void setUserData(
    String uid,
    ProviderContainer container,
  ) {
    debugPrint('${DateTime.now().toIso8601String()} setUserData()');

    _accountsSub = db.accountsRef.doc(uid).snapshots().listen(
      (DocumentSnapshot<Map<String, dynamic>> snap) {
        container.read(accountsProvider.notifier).state =
            snap.exists ? [Account(snap)] : [];
      },
      onError: (Object error, StackTrace stackTrace) {
        debugPrint('$runtimeType:onError\n$error\n$stackTrace');
      },
    );

    _groupsSub =
        db.groupsRef.where('accounts', arrayContains: uid).snapshots().listen(
      (QuerySnapshot<Map<String, dynamic>> snap) {
        var org = container.read(groupsProvider);
        if (org.isEmpty) {
          org = snap.docs.map((item) => Group(item)).toList();
        } else {
          for (var change in snap.docChanges) {
            switch (change.type) {
              case DocumentChangeType.added:
                org = [
                  ...org.where((item) => item.id != change.doc.id).toList(),
                  Group(change.doc),
                ];
                break;
              case DocumentChangeType.modified:
                org = org
                    .map((item) =>
                        item.id == change.doc.id ? Group(change.doc) : item)
                    .toList();
                break;
              case DocumentChangeType.removed:
                org = org.where((item) => item.id != change.doc.id).toList();
            }
          }
        }
        container.read(groupsProvider.notifier).state = org;
      },
      onError: (Object error, StackTrace stackTrace) {
        debugPrint('$runtimeType:onError\n$error\n$stackTrace');
      },
    );
  }

  void setAdminData(
    ProviderContainer container,
  ) {
    debugPrint('${DateTime.now().toIso8601String()} setAdminData()');

    _accountsSub = db.accountsRef.snapshots().listen(
      (QuerySnapshot<Map<String, dynamic>> snap) {
        var org = container.read(accountsProvider);
        if (org.isEmpty) {
          org = snap.docs.map((item) => Account(item)).toList();
        } else {
          for (var change in snap.docChanges) {
            switch (change.type) {
              case DocumentChangeType.added:
                org = [
                  ...org.where((item) => item.id != change.doc.id).toList(),
                  Account(change.doc),
                ];
                break;
              case DocumentChangeType.modified:
                org = org
                    .map((item) =>
                        item.id == change.doc.id ? Account(change.doc) : item)
                    .toList();
                break;
              case DocumentChangeType.removed:
                org = org.where((item) => item.id != change.doc.id).toList();
            }
          }
        }
        container.read(accountsProvider.notifier).state = org;
      },
      onError: (Object error, StackTrace stackTrace) {
        debugPrint('$runtimeType:onError\n$error\n$stackTrace');
      },
    );

    _groupsSub = db.groupsRef.snapshots().listen(
      (QuerySnapshot<Map<String, dynamic>> snap) {
        var org = container.read(groupsProvider);
        if (org.isEmpty) {
          org = snap.docs.map((item) => Group(item)).toList();
        } else {
          for (var change in snap.docChanges) {
            switch (change.type) {
              case DocumentChangeType.added:
                org = [
                  ...org.where((item) => item.id != change.doc.id).toList(),
                  Group(change.doc),
                ];
                break;
              case DocumentChangeType.modified:
                org = org
                    .map((item) =>
                        item.id == change.doc.id ? Group(change.doc) : item)
                    .toList();
                break;
              case DocumentChangeType.removed:
                org = org.where((item) => item.id != change.doc.id).toList();
            }
          }
        }
        container.read(groupsProvider.notifier).state = org;
      },
      onError: (Object error, StackTrace stackTrace) {
        debugPrint('$runtimeType:onError\n$error\n$stackTrace');
      },
    );
  }

  void didUpdateConfProvider(
    Conf? previousValue,
    Conf? newValue,
    ProviderContainer container,
  ) {
    debugPrint('${DateTime.now().toIso8601String()} '
        'didUpdateConfProvider(${previousValue?.id}, ${newValue?.id})');
  }

  void didUpdateAccountsProvider(
    List<Account> previousValue,
    List<Account> newValue,
    ProviderContainer container,
  ) {
    debugPrint('${DateTime.now().toIso8601String()} '
        'didUpdateAccountsProvider(${previousValue.length}, ${newValue.length})');
  }

  void didUpdateGroupsProvider(
    List<Group> previousValue,
    List<Group> newValue,
    ProviderContainer container,
  ) {
    debugPrint('${DateTime.now().toIso8601String()} '
        'didUpdateGroupsProvider(${previousValue.length}, ${newValue.length})');
  }

  void didUpdateMeProvider(
    Account? previousValue,
    Account? newValue,
    ProviderContainer container,
  ) {
    debugPrint('${DateTime.now().toIso8601String()} '
        'didUpdateMeProvider(${previousValue?.id}, ${newValue?.id})');
  }

  void didUpdateAdminsProvider(
    Group? previousValue,
    Group? newValue,
    ProviderContainer container,
  ) {
    debugPrint('${DateTime.now().toIso8601String()} '
        'didUpdateAdminsProvider(${previousValue?.id}, ${newValue?.id})');
  }

  void didUpdateUpdateAvailableProvider(
    bool? previousValue,
    bool newValue,
    ProviderContainer container,
  ) {
    debugPrint('${DateTime.now().toIso8601String()} '
        'didUpdateUpdateAvailableProvider($previousValue, $newValue)');
  }

  void didUpdateAuthzProvider(
    Authz? previousValue,
    Authz newValue,
    ProviderContainer container,
  ) {
    debugPrint('${DateTime.now().toIso8601String()} '
        'didUpdateAuthzProvider(${previousValue?.name}, ${newValue.name})');

    if ((previousValue == Authz.user && newValue == Authz.admin) ||
        (previousValue == Authz.admin && newValue == Authz.user)) {
      debugPrint('${DateTime.now().toIso8601String()} '
          '${previousValue?.name} --> ${newValue.name}');
      resetUserData(container);
    } else {
      // Nothing to do.
    }
  }

  void didUpdateSignInSignUpProvider(
    SignInSignUp? previousValue,
    SignInSignUp newValue,
    ProviderContainer container,
  ) {
    debugPrint('${DateTime.now().toIso8601String()} '
        'didUpdateSignInSignUpProvider($previousValue, $newValue)');
  }
}
