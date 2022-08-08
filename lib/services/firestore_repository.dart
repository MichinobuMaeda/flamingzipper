import 'package:cloud_firestore/cloud_firestore.dart';

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
    String uid,
    Map<String, dynamic> value,
  ) async {
    final ts = DateTime.now();
    await ref.add({
      ...value,
      'createdAt': ts,
      'createdBy': uid,
      'updatedAt': ts,
      'updatedBy': uid,
    });
  }

  Future<void> setDoc(
    DocumentReference ref,
    String uid,
    Map<String, dynamic> value,
  ) async {
    final ts = DateTime.now();
    await ref.set({
      ...value,
      'createdAt': ts,
      'createdBy': uid,
      'updatedAt': ts,
      'updatedBy': uid,
    });
  }

  Future<void> updateDoc(
    DocumentReference ref,
    String uid,
    Map<String, dynamic> value,
  ) async {
    final ts = DateTime.now();
    await ref.update({
      ...value,
      'updatedAt': ts,
      'updatedBy': uid,
    });
  }

  Future<void> deleteDoc(
    DocumentReference ref,
    String uid,
  ) async {
    final ts = DateTime.now();
    await ref.update({
      'deletedAt': ts,
      'deletedBy': uid,
    });
  }
}
