import 'l10n.dart';

/// The translations for English (`en`).
class L10nEn extends L10n {
  L10nEn([String locale = 'en']) : super(locale);

  // Actions

  @override
  String get edit => 'Edit';

  @override
  String get add => 'Add';

  @override
  String get create => 'Create';

  @override
  String get update => 'Update';

  @override
  String get goBack => 'Go back';

  @override
  String get goForward => 'Go forward';

  @override
  String get search => 'Search';

  @override
  String get send => 'Send';

  @override
  String get confirm => 'Confirm';

  @override
  String get save => 'Save';

  @override
  String get register => 'register';

  @override
  String get delete => 'Delete';

  @override
  String get restore => 'restore';

  @override
  String get cancel => 'Cancel';

  @override
  String get deleteOrRestor => 'Delete/Restore';

  @override
  String get updateApp => 'Update this app.';

  @override
  String get reauthWithEmail => 'Receive the e-mail for re-authenticate';

  @override
  String get siginInWithEmail => 'Receive the e-mail for sign in';

  @override
  String get siginInWithPasword => 'Sign in with e-mail address and password';

  @override
  String get signOutForRetry =>
      'If you want to correct your email address, please sign out and try again.';

  @override
  String get signOut => 'Sign out';

  // Pages and sections

  @override
  String get accounts => 'Accounts';

  @override
  String get groups => 'Groups';

  @override
  String get connecting => 'Connecting';

  @override
  String get signIn => 'Sign in';

  @override
  String get verifyEmail => 'Verification';

  @override
  String get home => 'Home';

  @override
  String get settings => 'Settings';

  @override
  String get admin => 'Admin';

  @override
  String get aboutApp => 'About this app';

  @override
  String get copyrightAndLicenses => 'Copyright and licenses';

  @override
  String get privacyPolicy => 'Privacy policy';

  @override
  String get development => 'Development';

  // Theme mode

  @override
  String get auto => 'Auto';

  @override
  String get light => 'Light';

  @override
  String get dark => 'Dark';

  // Items

  @override
  String get account => 'Account';

  @override
  String get group => 'Group';

  @override
  String get email => 'E-mail';

  @override
  String get password => 'Password';

  @override
  String get themeMode => 'Theme mode';

  @override
  String get displayName => 'Display name';

  @override
  String confirmation(String label) => 'confirm $label';

  // Messages: confirmation

  @override
  String confirmDelete(String collection, String item) =>
      'Delete the ${collection.toLowerCase()}: "$item".';

  @override
  String confirmRestore(String collection, String item) =>
      'Restore the deleted ${collection.toLowerCase()}: "$item".';

  @override
  String get alertSignOut =>
      'You do not need to sign out for normal usage of this app.';

  @override
  String get confirmSignOut => 'Do you really want to sign out?';

  // Messages: completed

  @override
  String get sentReauthUrl =>
      'An email has been sent to the registered address. '
      'Please sign in again according to the procedure described in the email.';

  @override
  String get sentUrlForSignIn => 'Sent an e-mail for sign in';

  @override
  String get sentUrlToVerify =>
      'An email for confirmation has been sentto the registered e-mail address.'
      ' so please follow the instructions. described in the e-mail.';

  @override
  String get successRequest => 'Completed.';

  @override
  String successSave(String label) => '$label has been saved.';

  // Messages: error

  @override
  String get errorRequired => 'Make sure to enter';

  @override
  String get errorEmailFormat => 'Please enter the correct email address.';

  @override
  String get errorPasswordLength => 'Please enter at least 8 characters.';

  @override
  String get errorPasswordChars =>
      'Please use at least 3 types of letters (uppercase, lowercase, numbers, symbols).';

  @override
  String get errorConfirmation => 'The confirmation input does not match.';

  @override
  String get errorRequest =>
      'Failed to complete the request. Please check the network status and try again.';

  @override
  String errorSave(String label) =>
      'Failed to save the $label. Please check the network status and try again.';

  @override
  String get erroSendEmail =>
      'Failed to sent an email. Check the network status and try again.';

  @override
  String get errorSignInWithPassword =>
      'Falied to sign in. Please check your email address and password and try again.';

  @override
  String get errorReauthPassword =>
      'Failed to re-authenticate with the password.';

  // Messages: guide

  @override
  String get noEmailAndPassword =>
      'No email address and password have been set.'
      ' Ask the administrator to set your e-mail address and password.';

  @override
  String get reauthRequired => 'If you change your email address or password,'
      ' you will need to confirm your current email address or password.';

  @override
  String get emailVerificationRequired =>
      'You need to confirm the email address you use for the first time.'
      ' Please press the "Send" button below.'
      ' A confirmation e-mail will be sent to the registered e-mail address,';

  @override
  String get pleaseWait => 'Loading now';

  @override
  String get notFound => 'The data you were looking for was not found.';
}
