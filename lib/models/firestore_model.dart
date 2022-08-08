import 'package:flutter/foundation.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:equatable/equatable.dart';

typedef NullableDateTime = DateTime?;

abstract class FirestoreModel extends Equatable {
  static const String fieldCreatedAt = 'createdAt';
  static const String fieldCreatedBy = 'createdBy';
  static const String fieldUpdatedAt = 'updatedAt';
  static const String fieldUpdatedBy = 'updatedBy';
  static const String fieldDeletedAt = 'deletedAt';
  static const String fieldDeletedBy = 'deletedBy';

  final DocumentSnapshot<Map<String, dynamic>> snap;

  const FirestoreModel(this.snap);

  String get id => snap.id;
  DateTime? get createdAt => getValue<DateTime?>(fieldCreatedAt, null);
  String? get createdBy => getValue<String?>(fieldCreatedBy, null);
  DateTime? get updatedAt => getValue<DateTime?>(fieldUpdatedAt, null);
  String? get updatedBy => getValue<String?>(fieldUpdatedBy, null);
  DateTime? get deletedAt => getValue<DateTime?>(fieldDeletedAt, null);
  String? get deletedBy => getValue<String?>(fieldDeletedBy, null);

  T getValue<T>(String key, T defaultValue) {
    try {
      return castValue<T>(snap.get(key), defaultValue);
    } catch (e) {
      return defaultValue;
    }
  }

  List<T> getListValue<T>(String key, T defaultValue) {
    try {
      return ((snap.get(key) ?? []) as List<dynamic>)
          .map<T>((val) => castValue(val, defaultValue))
          .toList();
    } catch (e) {
      return [];
    }
  }

  T castValue<T>(dynamic val, T defaultValue) {
    if (T == NullableDateTime) {
      return val is Timestamp ? (val.toDate() as T) : defaultValue;
    } else if (T == List<String>) {
      try {
        return val.map<String>((item) => item is String ? item : '').toList();
      } catch (e) {
        debugPrint('${DateTime.now().toIso8601String()} castValue $e');
        return defaultValue;
      }
    } else {
      return val is T ? val : defaultValue;
    }
  }

  @override
  List<Object?> get props => [
        createdAt,
        createdBy,
        updatedAt,
        updatedBy,
        deletedAt,
        deletedBy,
      ];
}
