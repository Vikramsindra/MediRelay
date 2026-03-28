import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, TextInput, SafeAreaView,
} from 'react-native';
import { colors, typography, spacing, radius, shadow } from '../theme';
import { getState } from '../store';

export default function PatientSearchScreen({ navigation }) {
  const state = getState();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter patients based on search query
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) {
      // Show recent patients if no search
      return state.patients.slice(0, 5);
    }
    const query = searchQuery.toLowerCase();
    return state.patients.filter((p) => {
      const nameMatch = p.name?.toLowerCase().includes(query);
      const idMatch = p.id?.toLowerCase().includes(query);
      return nameMatch || idMatch;
    });
  }, [searchQuery, state.patients]);

  const handleSelectPatient = (patient) => {
    // Navigate to transfer form with patient pre-selected
    navigation.navigate('TransferForm', { patientId: patient.id });
  };

  const handleRegisterNew = () => {
    // Navigate to patient registration, then to transfer form
    navigation.navigate('PatientRegistration', { redirectToTransfer: true });
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[typography.headlineMd, { color: colors.primary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[typography.titleMd, { color: colors.onSurface, flex: 1, textAlign: 'center' }]}>
          Select Patient
        </Text>
        <View style={{ width: 20 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={[typography.labelMd, { color: colors.outline }]}>🔍</Text>
        <TextInput
          style={[typography.bodyMd, styles.searchInput]}
          placeholder="Search by name or ID..."
          placeholderTextColor={colors.outline}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Patient List or Empty State */}
      {filteredPatients.length > 0 ? (
        <FlatList
          data={filteredPatients}
          keyExtractor={(p) => p.id}
          scrollEnabled={true}
          contentContainerStyle={styles.list}
          renderItem={({ item: patient }) => (
            <TouchableOpacity
              onPress={() => handleSelectPatient(patient)}
              style={styles.patientCard}
            >
              {/* Allergy indicator border */}
              {patient.allergies && patient.allergies.length > 0 && (
                <View style={styles.allergyBorderLeft} />
              )}

              {/* Avatar */}
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {patient.name?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>

              {/* Patient Info */}
              <View style={styles.info}>
                <Text style={[typography.titleSm, { color: colors.onSurface }]}>
                  {patient.name}
                </Text>
                <Text style={[typography.bodySm, { color: colors.outline }]}>
                  ID: {patient.id} · {patient.age}y · {patient.sex}
                </Text>
                {patient.hospital && (
                  <Text style={[typography.bodySm, { color: colors.outline, marginTop: spacing[1] }]}>
                    {patient.hospital}
                  </Text>
                )}
              </View>

              {/* Allergy Alert */}
              {patient.allergies && patient.allergies.length > 0 && (
                <View style={styles.allergyAlert}>
                  <Text style={[typography.labelSm, { color: colors.error }]}>⚠️</Text>
                  <Text style={[typography.bodySm, { color: colors.error, marginLeft: spacing[1] }]}>
                    {patient.allergies.length} allerg{patient.allergies.length === 1 ? 'y' : 'ies'}
                  </Text>
                </View>
              )}

              {/* Chevron */}
              <Text style={[typography.headlineMd, { color: colors.outline }]}>›</Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <View style={styles.empty}>
          <Text style={[typography.headlineLg, { color: colors.outlineVariant, marginBottom: spacing[3] }]}>
            👥
          </Text>
          <Text style={[typography.titleSm, { color: colors.onSurfaceVariant }]}>
            {searchQuery ? 'No patients found' : 'No patients yet'}
          </Text>
          <Text style={[typography.bodySm, { color: colors.outline, marginTop: spacing[2] }]}>
            {searchQuery ? 'Try a different search' : 'Register your first patient'}
          </Text>
        </View>
      )}

      {/* Register New Patient Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleRegisterNew}
          style={styles.registerButton}
        >
          <Text style={[typography.titleSm, { color: colors.primary }]}>+ Register New Patient</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing[5],
    marginBottom: spacing[4],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: spacing[2],
    color: colors.onSurface,
  },
  list: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.lg,
    padding: spacing[4],
    marginBottom: spacing[3],
    ...shadow.sm,
  },
  allergyBorderLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.error,
    borderTopLeftRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  avatarText: {
    color: colors.onPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  info: {
    flex: 1,
  },
  allergyAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing[2],
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[4],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  registerButton: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
