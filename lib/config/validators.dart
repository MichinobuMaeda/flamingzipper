import 'package:flutter/widgets.dart';
import 'l10n.dart';

const String regexEmail =
    r"^[a-zA-Z0-9.a-zA-Z0-9.!#$%&'*+-/=?^_`{|}~]+@[a-zA-Z0-9]+\.[a-zA-Z]+";

String? Function(String?) requiredValidator(
  BuildContext context,
) =>
    (
      String? value,
    ) =>
        (value != null && value.isNotEmpty)
            ? null
            : L10n.of(context)!.errorRequired;

String? Function(String?) emailValidator(
  BuildContext context,
) =>
    (
      String? value,
    ) =>
        (value == null || value.isEmpty)
            ? null
            : RegExp(regexEmail).hasMatch(value)
                ? null
                : L10n.of(context)!.errorEmailFormat;

String? Function(String?) passwordValidator(
  BuildContext context,
) =>
    (
      String? value,
    ) =>
        (value == null || value.length < 8)
            ? L10n.of(context)!.errorPasswordLength
            : (((RegExp(r"[A-Z]").hasMatch(value) ? 1 : 0) +
                        (RegExp(r"[a-z]").hasMatch(value) ? 1 : 0) +
                        (RegExp(r"[0-9]").hasMatch(value) ? 1 : 0) +
                        (RegExp(r"[^A-Za-z0-9]").hasMatch(value) ? 1 : 0)) <
                    3)
                ? L10n.of(context)!.errorPasswordChars
                : null;

String? Function(String?, String?) confermationValidator(
  BuildContext context,
) =>
    (
      String? value,
      String? confirmation,
    ) =>
        (value ?? '') == (confirmation ?? '')
            ? null
            : L10n.of(context)!.errorConfirmation;
