import 'package:cloud_firestore/cloud_firestore.dart';

import '../models/account.dart';

FirebaseFirestore _getInstance(FirebaseFirestore? instance) =>
    instance ?? FirebaseFirestore.instance;

class FirestoreRepo {
  final CollectionReference<Map<String, dynamic>> serviceRef;
  final CollectionReference<Map<String, dynamic>> accountsRef;
  final CollectionReference<Map<String, dynamic>> groupsRef;
  final DocumentReference<Map<String, dynamic>> confRef;
  final DocumentReference<Map<String, dynamic>> adminsRef;

  FirestoreRepo({FirebaseFirestore? instance})
      : serviceRef = _getInstance(instance).collection('service'),
        accountsRef = _getInstance(instance).collection('accounts'),
        groupsRef = _getInstance(instance).collection('groups'),
        confRef = _getInstance(instance).collection('service').doc('conf'),
        adminsRef = _getInstance(instance).collection('groups').doc('admins');

  Future<void> addDoc(
    CollectionReference ref,
    Account me,
    Map<String, dynamic> value,
  ) async {
    final ts = DateTime.now();
    await ref.add({
      ...value,
      'createdAt': ts,
      'createdBy': me.id,
      'updatedAt': ts,
      'updatedBy': me.id,
    });
  }

  Future<void> updateDoc(
    DocumentReference ref,
    Account me,
    Map<String, dynamic> value,
  ) async {
    final ts = DateTime.now();
    await ref.update({
      ...value,
      'updatedAt': ts,
      'updatedBy': me.id,
    });
  }

  Future<void> deleteDoc(
    DocumentReference ref,
    Account me,
  ) async {
    final ts = DateTime.now();
    await ref.update({
      'deletedAt': ts,
      'deletedBy': me.id,
    });
  }
}
