import 'dart:math';
import 'package:flutter/material.dart';

const colorSchemeSeed = Colors.deepOrange;

const assetLogo = 'images/logo.png';
const assetLogoDark = 'images/logo_dark.png';
const assetLogoSmall = 'images/logo_small.png';
const assetLogoDarkSmall = 'images/logo_dark_small.png';

const fontFamilySansSerif = 'NotoSansJP';

const mobileWidth = 540.0;
const mobileHeight = 640.0;
const columnWidth = 480.0;
const spacing = 16.0;
const chipPadding = EdgeInsets.symmetric(
  vertical: 12.0,
  horizontal: 16.0,
);

Color chipSelectedColor(BuildContext context) =>
    Theme.of(context).colorScheme.primary.withAlpha(64);

const buttonPaddint = EdgeInsets.symmetric(
  vertical: 20.0,
  horizontal: 24.0,
);

ButtonStyle filledButtonStyle(BuildContext context) => ElevatedButton.styleFrom(
      backgroundColor: Theme.of(context).colorScheme.primary,
      foregroundColor: Theme.of(context).colorScheme.onPrimary,
      padding: buttonPaddint,
    );

ButtonStyle fullWithdOutlinedButtonStyle = OutlinedButton.styleFrom(
  minimumSize: const Size.fromHeight(40.0),
  padding: buttonPaddint,
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

Widget menuBackground(BuildContext context) => Padding(
      padding: const EdgeInsets.all(8.0),
      child: Image(
        image: AssetImage(logoAssetName(context)),
        alignment: logoAlignment(context),
      ),
    );

class SliverWithSingleColumn extends StatelessWidget {
  final List<Widget> children;
  const SliverWithSingleColumn({super.key, required this.children});

  @override
  Widget build(BuildContext context) => SliverToBoxAdapter(
        child: Padding(
          padding: EdgeInsets.symmetric(
            vertical: spacing,
            horizontal: max(
                (MediaQuery.of(context).size.width - columnWidth) / 2, 12.0),
          ),
          child: Column(children: children),
        ),
      );
}
