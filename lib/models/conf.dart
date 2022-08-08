import 'package:cloud_firestore/cloud_firestore.dart';

import 'firestore_model.dart';

class Conf extends FirestoreModel {
  static const fieldVersion = 'version';
  static const fieldUrl = 'url';
  static const fieldSeed = 'seed';
  static const fieldInvExp = 'invExp';
  static const fieldPolicy = 'policy';

  const Conf(DocumentSnapshot<Map<String, dynamic>> snap) : super(snap);

  String get version => getValue<String>(fieldVersion, '');
  String get url => getValue<String>(fieldUrl, '');
  String get seed => getValue<String>(fieldSeed, '');
  int get invExp => getValue<int>(fieldInvExp, 0);
  String get policy => getValue<String>(fieldPolicy, '');

  @override
  List<Object?> get props => super.props
    ..addAll([
      version,
      url,
      seed,
      invExp,
      policy,
    ]);
}
