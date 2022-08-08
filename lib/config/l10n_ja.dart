import 'l10n.dart';

/// The translations for Japanese (`ja`).
class L10nJa extends L10n {
  L10nJa([String locale = 'ja']) : super(locale);

  // Actions

  @override
  String get edit => '編集';

  @override
  String get add => '追加';

  @override
  String get create => '作成';

  @override
  String get update => '更新';

  @override
  String get goBack => '戻る';

  @override
  String get goForward => '進む';

  @override
  String get search => '検索';

  @override
  String get send => '送信';

  @override
  String get confirm => '確認';

  @override
  String get save => '保存';

  @override
  String get register => '登録';

  @override
  String get delete => '削除';

  @override
  String get restore => '復活';

  @override
  String get cancel => '中止';

  @override
  String get deleteOrRestor => '削除／復活';

  @override
  String get updateApp => 'アプリを更新してください';

  @override
  String get reauthWithEmail => '確認用のURLをメールで受け取る';

  @override
  String get siginInWithEmail => 'ログイン用のURLをメールで受け取る';

  @override
  String get siginInWithPasword => 'メールアドレスとパスワードでログインする';

  @override
  String get signOutForRetry => 'メールアドレスを修正してやり直す場合はログアウトしてください。';

  @override
  String get signOut => 'ログアウト';

  // Pages and sections

  @override
  String get accounts => 'アカウント';

  @override
  String get groups => 'グループ';

  @override
  String get connecting => '接続中';

  @override
  String get signIn => 'ログイン';

  @override
  String get verifyEmail => 'メールアドレスの確認';

  @override
  String get home => 'ホーム';

  @override
  String get settings => '設定';

  @override
  String get admin => '管理';

  @override
  String get aboutApp => 'アプリについて';

  @override
  String get copyrightAndLicenses => '著作権とライセンス';

  @override
  String get privacyPolicy => 'プライバシー・ポリシー';

  @override
  String get development => '開発';

  // Theme mode

  @override
  String get auto => '自動';

  @override
  String get light => 'ライト';

  @override
  String get dark => 'ダーク';

  // Items

  @override
  String get account => 'アカウント';

  @override
  String get group => 'グループ';

  @override
  String get email => 'メールアドレス';

  @override
  String get password => 'パスワード';

  @override
  String get themeMode => '表示テーマモード';

  @override
  String get displayName => '表示名';

  @override
  String confirmation(String label) => '$labelの確認';

  // Messages: confirmation

  @override
  String confirmDelete(String collection, String item) => '$collection$item';

  @override
  String confirmRestore(String collection, String item) => '$collection$item';

  @override
  String get alertSignOut => 'このアプリの通常の使い方でログアウトする必要はありません。';

  @override
  String get confirmSignOut => '本当にログアウトしますか？';

  // Messages: completed

  @override
  String get sentReauthUrl => '登録されたアドレスにメールを送信しました。'
      'メールに記載された手順で再ログインしてください。';

  @override
  String get sentUrlForSignIn => 'ログイン用のリンクをメールで送信しました。';

  @override
  String get sentUrlToVerify => '登録されたメールアドレスに確認のためのメールを送信しました。'
      'そのメールに記載された指示に従って操作してください。';

  @override
  String get successRequest => '完了しました。';

  @override
  String successSave(String label) => '$labelを保存しました。';

  // Messages: error

  @override
  String get errorRequired => '必ず入力してください。';

  @override
  String get errorEmailFormat => '正しい書式のメールアドレスを入力してください。';

  @override
  String get errorPasswordLength => '8文字以上としてください。';

  @override
  String get errorPasswordChars => '3種類以上の文字（大文字・小文字・数字・記号）を使ってください。';

  @override
  String get errorConfirmation => '確認の入力内容が一致しません。';

  @override
  String get errorRequest => '処理に失敗しました。通信の状態を確認してやり直してください。';

  @override
  String errorSave(String label) => '$labelが保存できませんでした。通信の状態を確認してやり直してください。';

  @override
  String get erroSendEmail => 'メールが送信できませんでした。通信の状態を確認してやり直してください。';

  @override
  String get errorSignInWithPassword =>
      'ログインできませんでした。メールアドレスとパスワードを確認してやり直してください。';

  @override
  String get errorReauthPassword => 'パスワードの確認ができませんでした。';

  // Messages: guide

  @override
  String get noEmailAndPassword => 'メールアドレスとパスワードは設定されていません。'
      'メールアドレスとパスワードの設定は管理者に依頼してください。';

  @override
  String get reauthRequired => 'メールアドレスまたはパスワードを変更するために、'
      '現在のメールアドレスまたはパスワードの確認が必要です。';

  @override
  String get emailVerificationRequired =>
      '初めて使うメールアドレスの確認が必要です。下の「送信」ボタンを押してください。'
      '登録されたメールアドレスに確認のためのメールを送信します。';

  @override
  String get pleaseWait => 'しばらくお待ちください';

  @override
  String get notFound => 'お探しのデータが見つかりませんでした。';
}
