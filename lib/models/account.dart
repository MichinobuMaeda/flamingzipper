import 'package:cloud_firestore/cloud_firestore.dart';

import 'firestore_model.dart';

class Account extends FirestoreModel {
  static const fieldName = 'name';
  static const fieldValid = 'valid';

  const Account(DocumentSnapshot<Map<String, dynamic>> snap) : super(snap);

  String get name => getValue<String>(fieldName, '');
  bool get valid => getValue<bool>(fieldValid, false);

  @override
  List<Object?> get props => super.props
    ..addAll([
      name,
      valid,
    ]);
}
