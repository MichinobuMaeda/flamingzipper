import 'package:flutter/material.dart';

const colorSchemeSeed = Colors.red;

const assetLogo = 'images/logo.png';
const assetLogoDark = 'images/logo_dark.png';
const assetLogoSmall = 'images/logo_small.png';
const assetLogoDarkSmall = 'images/logo_dark_small.png';

const fontFamilySansSerif = 'NotoSansJP';

const mobileWidth = 540;
const mobileHeight = 640;

ButtonStyle filledButtonStyle(BuildContext context) => ElevatedButton.styleFrom(
      primary: Theme.of(context).colorScheme.primary,
      onPrimary: Theme.of(context).colorScheme.onPrimary,
    );

Color listItemColor(BuildContext context, int index) => index.isOdd
    ? Theme.of(context).colorScheme.secondary.withAlpha(32)
    : Theme.of(context).colorScheme.background;

bool isDarkMode(BuildContext context) =>
    Theme.of(context).colorScheme.brightness == Brightness.dark;

String logoAssetName(BuildContext context) =>
    isDarkMode(context) ? assetLogoDarkSmall : assetLogoSmall;

Alignment logoAlignment(BuildContext context) =>
    MediaQuery.of(context).size.width < mobileWidth ||
            MediaQuery.of(context).size.height < mobileHeight
        ? Alignment.topLeft
        : Alignment.topCenter;

double menuBarHeight(BuildContext context) =>
    MediaQuery.of(context).size.height < mobileHeight ? 72.0 : 152.0;

Widget menuBackground(BuildContext context) => Image(
      image: AssetImage(logoAssetName(context)),
      alignment: logoAlignment(context),
    );
