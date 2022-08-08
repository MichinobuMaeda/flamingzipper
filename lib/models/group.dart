import 'package:cloud_firestore/cloud_firestore.dart';

import 'firestore_model.dart';

class Group extends FirestoreModel {
  static const fieldName = 'name';
  static const fieldaccounts = 'accounts';

  const Group(DocumentSnapshot<Map<String, dynamic>> snap) : super(snap);

  String get name => getValue<String>(fieldName, '');
  List<String> get accounts => getValue<List<String>>(fieldaccounts, []);

  @override
  List<Object?> get props => super.props
    ..addAll([
      name,
      accounts,
    ]);
}
