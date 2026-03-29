import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius, shadow } from '../theme';
import { getState } from '../store';

function getTransfer(transferId) {
  const state = getState();
  if (transferId) {
    const match = state.transfers.find((t) => t.id === transferId);
    if (match) return match;
  }
  return state.transfers[0] || null;
}

export default function PatientHistoryScreen({ navigation, route }) {
  const selectedTransferId = route.params?.transferId;
  const transfer = useMemo(() => getTransfer(selectedTransferId), [selectedTransferId]);

  if (!transfer) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <Text style={styles.emptyTitle}>No transfer record</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backRow}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.brandText}>Vitality Care</Text>
            <Text style={styles.subtitle}>TRANSFER DETAIL</Text>
          </View>
          <Text style={styles.docAvatar}>🧑‍⚕️</Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>ALLERGY STATUS</Text>
          <Text style={styles.heroTitle}>ALLERGIES:{'\n'}Penicillin</Text>

          <Text style={styles.heroLabel}>CRITICAL MEDICATION</Text>
          <Text style={styles.heroSubTitle}>MUST NOT STOP: Aspirin 75mg</Text>

          <Text style={styles.heroLabel}>CLINICAL CONTEXT</Text>
          <Text style={styles.heroSubTitle}>REASON: ICU Management</Text>

          <View style={styles.warningBox}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.warningTitle}>Critical Warning</Text>
              <Text style={styles.warningBody}>
                Ensure pharmacological reconciliation before any sedation protocol.
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>VITALS (LAST RECORDED)</Text>
        <View style={styles.vitalsCol}>
          {[
            ['BLOOD PRESSURE', '118/74', 'mmHg'],
            ['HEART RATE', '82', 'BPM'],
            ['OXYGEN SATURATION', '98', '%'],
            ['BODY TEMP', '36.8', '°C'],
          ].map(([label, value, unit]) => (
            <View style={styles.vitalCard} key={label}>
              <Text style={styles.vitalLabel}>{label}</Text>
              <View style={styles.vitalValueRow}>
                <Text style={styles.vitalValue}>{value}</Text>
                <Text style={styles.vitalUnit}> {unit}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>MEDICATIONS LIST</Text>
        <View style={styles.sectionCard}>
          <Text style={styles.medTitle}>Aspirin 75mg</Text>
          <Text style={styles.medSub}>Oral • Once Daily • 08:00</Text>
          <Text style={styles.medFlag}>MUST NOT STOP</Text>

          <Text style={[styles.medTitle, styles.medGap]}>Atorvastatin 40mg</Text>
          <Text style={styles.medSub}>Oral • Nightly • 22:00</Text>

          <Text style={[styles.medTitle, styles.medGap]}>Furosemide 20mg</Text>
          <Text style={styles.medSub}>IV • Twice Daily • 08:00, 16:00</Text>
        </View>

        <Text style={styles.sectionTitle}>INVESTIGATIONS</Text>
        <View style={styles.sectionCard}>
          <Text style={styles.linkTitle}>12–Lead ECG</Text>
          <Text style={styles.noteText}>Sinus rhythm, no acute ST changes, previous LBBB noted.</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.linkTitle}>Bloods (FBC/U&E)</Text>
          <Text style={styles.noteText}>K+ 4.2, Creatinine 98, Hb 12.4. Stable trend.</Text>
        </View>

        <Text style={styles.sectionTitle}>CLINICAL SUMMARY</Text>
        <View style={styles.sectionCard}>
          <Text style={styles.noteTextLong}>
            Patient presented with acute shortness of breath and chest tightness. Initial assessment in A&E
            suggested NSTEMI, now being managed for ICU transition. Stable hemodynamic status maintained.
            No neurological deficits observed.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.guestButton}
          onPress={() => navigation.navigate('PatientGuestRecord')}
          activeOpacity={0.85}
        >
          <Text style={styles.guestButtonText}>Open Patient QR Record</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f6fc' },
  center: { alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { ...typography.headlineMd, color: colors.onSurface },
  scroll: { paddingHorizontal: spacing[4], paddingBottom: spacing[8] },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing[3],
    marginBottom: spacing[3],
  },
  backRow: { padding: spacing[2] },
  backText: { fontSize: 24, color: colors.primary },
  brandText: { ...typography.headlineSm, color: colors.primary, textAlign: 'center' },
  subtitle: { ...typography.labelSm, color: '#667085', textAlign: 'center' },
  docAvatar: { fontSize: 24 },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    padding: spacing[4],
    marginBottom: spacing[5],
    ...shadow.sm,
  },
  heroLabel: {
    ...typography.labelSm,
    color: '#a9cbff',
    letterSpacing: 2,
    marginBottom: spacing[1],
    marginTop: spacing[2],
  },
  heroTitle: {
    ...typography.displaySm,
    color: '#ffffff',
    fontWeight: '800',
    lineHeight: 44,
    marginBottom: spacing[1],
  },
  heroSubTitle: {
    ...typography.headlineSm,
    color: '#ffffff',
    fontWeight: '700',
    marginBottom: spacing[1],
  },
  warningBox: {
    marginTop: spacing[4],
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.md,
    padding: spacing[3],
    flexDirection: 'row',
    gap: spacing[2],
  },
  warningIcon: { fontSize: 22 },
  warningTitle: { ...typography.titleSm, color: '#ffffff', marginBottom: 2 },
  warningBody: { ...typography.bodySm, color: '#d9e7ff' },
  sectionTitle: {
    ...typography.labelSm,
    color: '#5f6778',
    letterSpacing: 2,
    marginBottom: spacing[2],
    marginTop: spacing[3],
  },
  vitalsCol: { gap: spacing[2] },
  vitalCard: {
    backgroundColor: '#ffffff',
    borderRadius: radius.md,
    padding: spacing[3],
  },
  vitalLabel: { ...typography.labelSm, color: '#7f8798' },
  vitalValueRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing[1] },
  vitalValue: { ...typography.headlineMd, color: '#121726', fontSize: 40 },
  vitalUnit: { ...typography.bodySm, color: '#758199', paddingBottom: 6 },
  sectionCard: {
    backgroundColor: '#eef1fb',
    borderRadius: radius.md,
    padding: spacing[3],
    marginBottom: spacing[2],
  },
  medTitle: { ...typography.titleMd, color: '#101625' },
  medSub: { ...typography.bodySm, color: '#687084', marginTop: 2 },
  medFlag: {
    ...typography.labelSm,
    color: '#b91c1c',
    marginTop: spacing[1],
  },
  medGap: { marginTop: spacing[3] },
  linkTitle: { ...typography.titleMd, color: colors.primary },
  noteText: { ...typography.bodySm, color: '#61687b', marginTop: spacing[1] },
  noteTextLong: { ...typography.bodyMd, color: '#4d5568' },
  guestButton: {
    marginTop: spacing[5],
    marginBottom: spacing[4],
    height: 52,
    borderRadius: radius.full,
    backgroundColor: '#dce5fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestButtonText: {
    ...typography.titleMd,
    color: colors.primary,
    fontWeight: '700',
  },
});
