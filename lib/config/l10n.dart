import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'l10n_en.dart';
import 'l10n_ja.dart';

/// Callers can lookup localized strings with an instance of AppLocalizations returned
/// by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// localizationDelegates list, and the locales they support in the app's
/// supportedLocales list. For example:
///
/// ```
/// import 'gen_l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class L10n {
  L10n(String locale)
      : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static L10n? of(BuildContext context) {
    return Localizations.of<L10n>(context, L10n);
  }

  static const LocalizationsDelegate<L10n> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('ja')
  ];

  // Actions
  String get edit;
  String get add;
  String get create;
  String get update;
  String get goBack;
  String get goForward;
  String get search;
  String get send;
  String get confirm;
  String get save;
  String get delete;
  String get restore;
  String get cancel;
  String get deleteOrRestor;
  String get updateApp;
  String get reauthWithEmail;
  String get siginInWithEmail;
  String get siginInWithPasword;
  String get signOutForRetry;
  String get signOut;
  // Pages and sections
  String get accounts;
  String get groups;
  String get connecting;
  String get signIn;
  String get verifyEmail;
  String get home;
  String get settings;
  String get admin;
  String get aboutApp;
  String get copyrightAndLicenses;
  String get privacyPolicy;
  String get development;
  // Theme mode
  String get auto;
  String get light;
  String get dark;
  // Items
  String get account;
  String get group;
  String get email;
  String get password;
  String get displayName;
  String get themeMode;
  String confirmation(String label);
  // Messages: confirmation
  String confirmDelete(String collection, String item);
  String confirmRestore(String collection, String item);
  String get alertSignOut;
  String get confirmSignOut;
  // Messages: completed
  String get sentReauthUrl;
  String get sentUrlForSignIn;
  String get sentUrlToVerify;
  String get successRequest;
  String successSave(String label);
  // Messages: error
  String get errorRequired;
  String get errorEmailFormat;
  String get errorPasswordLength;
  String get errorPasswordChars;
  String get errorConfirmation;
  String get errorRequest;
  String errorSave(String label);
  String get erroSendEmail;
  String get errorSignInWithPassword;
  String get errorReauthPassword;
  // Messages: guide
  String get noEmailAndPassword;
  String get reauthRequired;
  String get emailVerificationRequired;
  String get pleaseWait;
  String get notFound;
}

class _AppLocalizationsDelegate extends LocalizationsDelegate<L10n> {
  const _AppLocalizationsDelegate();

  @override
  Future<L10n> load(Locale locale) {
    return SynchronousFuture<L10n>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'ja'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

L10n lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return L10nEn();
    case 'ja':
      return L10nJa();
  }

  throw FlutterError(
      'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
      'an issue with the localizations generation tool. Please file an issue '
      'on GitHub with a reproducible sample app and the gen-l10n configuration '
      'that was used.');
}
