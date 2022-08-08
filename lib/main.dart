import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_storage/firebase_storage.dart' as firebase_storage;

import 'config/app_info.dart';
import 'config/firebase_options.dart';
import 'config/l10n.dart';
import 'config/theme.dart';
import 'services/auth_repository.dart';
import 'services/firestore_repository.dart';
import 'services/observer.dart';
import 'services/providers.dart';
import 'services/web.dart';
import 'routs.dart';

void main() async {
  debugPrint('${DateTime.now().toIso8601String()} ensureInitialized()');
  WidgetsFlutterBinding.ensureInitialized();

  LicenseRegistry.addLicense(() async* {
    final license = await rootBundle.loadString('google_fonts/OFL.txt');
    yield LicenseEntryWithLineBreaks(['google_fonts'], license);
  });

  debugPrint('${DateTime.now().toIso8601String()} Firebase.initializeApp()');
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  if (version.contains('test')) {
    debugPrint('${DateTime.now().toIso8601String()} Use emulators.');
    try {
      await FirebaseAuth.instance.useAuthEmulator('localhost', 9099);
      FirebaseFirestore.instance.useFirestoreEmulator('localhost', 8080);
      FirebaseFunctions.instance.useFunctionsEmulator('localhost', 5001);
      await firebase_storage.FirebaseStorage.instance
          .useStorageEmulator('localhost', 9199);
    } catch (e) {
      debugPrint('Firebase has been started.');
    }
  }

  FirebaseAuth.instance.setLanguageCode('ja_JP');

  AuthRepo().handleDeepLink(await deepLink());

  debugPrint('${DateTime.now().toIso8601String()} runApp()');
  runApp(
    ProviderScope(
      observers: [
        MyObserver(
          AuthRepo(),
          FirestoreRepo(),
        ),
      ],
      child: MyApp(),
    ),
  );
}

class MyApp extends ConsumerWidget {
  MyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    debugPrint('${DateTime.now().toIso8601String()} MaterialApp');

    return MaterialApp.router(
      title: ref.watch(appTitileProvider),
      theme: ThemeData(
        colorSchemeSeed: colorSchemeSeed,
        brightness: Brightness.light,
        fontFamily: fontFamilySansSerif,
        useMaterial3: true,
      ),
      darkTheme: ThemeData(
        colorSchemeSeed: colorSchemeSeed,
        brightness: Brightness.dark,
        fontFamily: fontFamilySansSerif,
        useMaterial3: true,
      ),
      localizationsDelegates: L10n.localizationsDelegates,
      supportedLocales: L10n.supportedLocales,
      locale: const Locale('ja', 'JP'),
      routeInformationProvider: _router.routeInformationProvider,
      routeInformationParser: _router.routeInformationParser,
      routerDelegate: _router.routerDelegate,
    );
  }

  final _router = GoRouter(
    routes: routes,
    errorBuilder: routeErrorBuilder,
  );
}
