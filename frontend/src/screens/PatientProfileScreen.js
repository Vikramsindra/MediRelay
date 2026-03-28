import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius, shadow } from '../theme';
import { PrimaryButton } from '../components/Buttons';
import { AppIcon } from '../components/AppIcon';
import { setState, useStore } from '../store';
import { getPatientById } from '../api/patients';

export default function PatientProfileScreen({ navigation, route }) {
  const { patientId } = route.params;
  const { patients } = useStore();
  const localPatient = useMemo(() => patients.find((p) => p.id === patientId), [patients, patientId]);
  const [remotePatient, setRemotePatient] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadPatient() {
      setIsLoading(true);
      setLoadError('');

      try {
        const fetchedPatient = await getPatientById(patientId);
        if (cancelled) return;

        setRemotePatient(fetchedPatient);
        setState((s) => {
          const exists = s.patients.some((p) => p.id === fetchedPatient.id);
          if (exists) {
            return {
              ...s,
              patients: s.patients.map((p) => (p.id === fetchedPatient.id ? { ...p, ...fetchedPatient } : p)),
            };
          }
          return { ...s, patients: [...s.patients, fetchedPatient] };
        });
      } catch (error) {
        if (cancelled) return;
        setLoadError(error?.message || 'Unable to load patient details');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadPatient();
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  const patient = remotePatient || localPatient;

  if (!patient && isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <View style={styles.backRow}>
              <AppIcon name="back" size={18} color={colors.primary} />
              <Text style={[typography.titleMd, { color: colors.primary, marginLeft: spacing[1.5] }]}>Back</Text>
            </View>
          </TouchableOpacity>
          <Text style={[typography.headlineSm, { color: colors.onSurface }]}>Patient Details</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.empty}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[typography.bodyMd, { color: colors.outline, marginTop: spacing[3] }]}>Loading patient...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!patient) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <View style={styles.backRow}>
              <AppIcon name="back" size={18} color={colors.primary} />
              <Text style={[typography.titleMd, { color: colors.primary, marginLeft: spacing[1.5] }]}>Back</Text>
            </View>
          </TouchableOpacity>
          <Text style={[typography.headlineSm, { color: colors.onSurface }]}>Patient Details</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.empty}>
          <Text style={[typography.bodyMd, { color: colors.outline }]}>Patient not found</Text>
          {loadError ? (
            <Text style={[typography.bodySm, { color: colors.error, marginTop: spacing[2] }]}>{loadError}</Text>
          ) : null}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <View style={styles.backRow}>
            <AppIcon name="back" size={18} color={colors.primary} />
            <Text style={[typography.titleMd, { color: colors.primary, marginLeft: spacing[1.5] }]}>Back</Text>
          </View>
        </TouchableOpacity>
        <Text style={[typography.headlineSm, { color: colors.onSurface }]}>Patient Details</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Basic Info Card */}
        <View style={[styles.card, shadow.sm]}>
          <Text style={[typography.titleMd, { color: colors.onSurface, marginBottom: spacing[3] }]}>
            Personal Information
          </Text>
          <View style={styles.infoRow}>
            <Text style={[typography.bodyMd, { color: colors.outline }]}>Name</Text>
            <Text style={[typography.bodyMd, { color: colors.onSurface, fontWeight: '600' }]}>{patient.name}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={[typography.bodyMd, { color: colors.outline }]}>Age</Text>
            <Text style={[typography.bodyMd, { color: colors.onSurface, fontWeight: '600' }]}>{patient.age} years</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={[typography.bodyMd, { color: colors.outline }]}>Sex</Text>
            <Text style={[typography.bodyMd, { color: colors.onSurface, fontWeight: '600' }]}>{patient.sex}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={[typography.bodyMd, { color: colors.outline }]}>Blood Group</Text>
            <Text style={[typography.bodyMd, { color: colors.onSurface, fontWeight: '600' }]}>{patient.bloodGroup}</Text>
          </View>
          {patient.phone && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={[typography.bodyMd, { color: colors.outline }]}>Phone</Text>
                <Text style={[typography.bodyMd, { color: colors.onSurface, fontWeight: '600' }]}>{patient.phone}</Text>
              </View>
            </>
          )}
          {patient.id && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={[typography.bodyMd, { color: colors.outline }]}>Patient ID</Text>
                <Text style={[typography.bodyMd, { color: colors.onSurface, fontWeight: '600' }]}>{patient.id}</Text>
              </View>
            </>
          )}
        </View>

        {/* Allergies Section */}
        {patient.allergies && Array.isArray(patient.allergies) && patient.allergies.filter(a => a).length > 0 && (
          <View style={[styles.card, shadow.sm]}>
            <Text style={[typography.titleMd, { color: colors.onSurface, marginBottom: spacing[3] }]}>
              Allergies
            </Text>
            <View style={styles.allergyList}>
              {patient.allergies.filter(a => a).map((item, idx) => {
                let allergen = '';
                let reaction = '';
                
                if (typeof item === 'string') {
                  allergen = item;
                } else if (typeof item === 'object' && item !== null) {
                  allergen = String(item.allergen || '');
                  reaction = String(item.reaction || '');
                }
                
                return (
                  <View key={idx} style={styles.allergyTag}>
                    <View style={{ marginTop: spacing[0.5] }}>
                      <AppIcon name="warning" size={14} color={colors.error} />
                    </View>
                    <View style={{ marginLeft: spacing[1] }}>
                      <Text style={[typography.bodyMd, { color: colors.error, fontWeight: '600' }]}>
                        {allergen}
                      </Text>
                      {reaction && (
                        <Text style={[typography.bodySm, { color: colors.error, opacity: 0.8 }]}>
                          {reaction}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Vitals Section */}
        {patient.vitals && Object.keys(patient.vitals).length > 0 && (
          <View style={[styles.card, shadow.sm]}>
            <Text style={[typography.titleMd, { color: colors.onSurface, marginBottom: spacing[3] }]}>
              Recent Vitals
            </Text>
            {Object.entries(patient.vitals).map(([key, value], idx) => (
              <View key={key}>
                <View style={styles.infoRow}>
                  <Text style={[typography.bodyMd, { color: colors.outline, textTransform: 'capitalize' }]}>
                    {key}
                  </Text>
                  <Text style={[typography.bodyMd, { color: colors.onSurface, fontWeight: '600' }]}>
                    {value}
                  </Text>
                </View>
                {idx < Object.entries(patient.vitals).length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Action Button */}
      <View style={styles.stickyBottom}>
        <PrimaryButton
          label="Initiate Transfer"
          onPress={() => navigation.navigate('TransferForm', { patientId: patient.id })}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  backBtn: { width: 72 },
  backRow: { flexDirection: 'row', alignItems: 'center' },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
    paddingBottom: spacing[5],
  },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  divider: {
    height: 1,
    backgroundColor: colors.outlineVariant,
    marginVertical: spacing[2],
  },
  allergyList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  allergyTag: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.errorContainer,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyBottom: {
    padding: spacing[5],
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
});
