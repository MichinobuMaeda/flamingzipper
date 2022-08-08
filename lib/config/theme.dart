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

ButtonStyle filledButtonStyle(BuildContext context) => ElevatedButton.styleFrom(
      primary: Theme.of(context).colorScheme.primary,
      onPrimary: Theme.of(context).colorScheme.onPrimary,
    );

ButtonStyle fullWithdOutlinedButtonStyle = OutlinedButton.styleFrom(
  minimumSize: const Size.fromHeight(40.0),
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
