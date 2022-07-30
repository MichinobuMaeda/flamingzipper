import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/l10n.dart';
import '../config/app_info.dart';
import '../config/theme.dart';

class AboutSliver extends ConsumerWidget {
  const AboutSliver({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final logoSize = MediaQuery.of(context).size.width < 480 ||
            MediaQuery.of(context).size.height < 480
        ? MediaQuery.of(context).size.width / 8
        : 96.0;

    return SliverToBoxAdapter(
      child: SizedBox(
        // Container(
        //   color: listItemColor(context, 1),
        height: 64.0,
        child: Center(
          child: OutlinedButton.icon(
            onPressed: () {
              showAboutDialog(
                context: context,
                applicationIcon: Image(
                  image: AssetImage(
                    isDarkMode(context) ? assetLogoDark : assetLogo,
                  ),
                  width: logoSize,
                  height: logoSize,
                ),
                applicationName: appName,
                applicationVersion: version,
                applicationLegalese: copyright,
              );
            },
            icon: const Icon(Icons.copyright),
            label: Text(L10n.of(context)!.copyrightAndLicenses),
          ),
        ),
      ),
    );
  }
}
