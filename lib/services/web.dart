// ignore_for_file: avoid_web_libraries_in_flutter
import 'dart:html' as html;
import 'package:uni_links/uni_links.dart';

void uploadApp() => html.window.location.reload();

Future<String?> deepLink() => getInitialLink();
