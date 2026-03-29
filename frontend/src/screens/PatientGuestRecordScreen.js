import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../theme';

export default function PatientGuestRecordScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>ⓘ Guest Access: You are viewing this record via QR code.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.brand}>Vitality Care</Text>
          <Text style={styles.avatar}>🧑‍⚕️</Text>
        </View>

        <View style={styles.signinCard}>
          <Text style={styles.signinTitle}>Is this your record?</Text>
          <Text style={styles.signinSub}>Sign in to securely save this record and track your medical history.</Text>
          <TouchableOpacity style={styles.signinBtn} activeOpacity={0.9}>
            <Text style={styles.signinBtnText}>Sign in to track history</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.tag}>EMERGENCY DIGITAL RECORD</Text>
        <Text style={styles.name}>Jordan M.{'\n'}Smith</Text>
        <Text style={styles.meta}>Patient DOB: May 12, 1988 • Blood Type: <Text style={styles.blood}>O-Negative</Text></Text>

        <View style={styles.statusCard}>
          <Text style={styles.sectionLabel}>ACTIVE STATUS</Text>
          <Text style={styles.statusValue}>Stable</Text>
          <Text style={styles.syncText}>Last sync: 2 minutes ago</Text>
        </View>

        <View style={styles.allergyCard}>
          <Text style={styles.allergyHead}>⚠︎  CRITICAL ALLERGIES</Text>
          <View style={styles.allergyRow}><Text style={styles.allergyName}>Penicillin</Text><Text style={styles.severe}>Severe</Text></View>
          <View style={styles.allergyRow}><Text style={styles.allergyName}>Peanuts</Text><Text style={styles.severe}>Severe</Text></View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>RECENT VITALS</Text>
          <View style={styles.vitalsRow}><Text style={styles.vitalLabel}>BPM</Text><Text style={styles.vitalValue}>72</Text></View>
          <View style={styles.progressTrack}><View style={styles.progressFill} /></View>
          <View style={[styles.vitalsRow, { marginTop: spacing[2] }]}><Text style={styles.vitalLabel}>BP</Text><Text style={styles.vitalValueSmall}>120/80</Text></View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>CURRENT MEDICATIONS</Text>
          {[
            ['Lisinopril', '10mg • Daily morning', 'Hypertension'],
            ['Metformin', '500mg • Twice daily', ''],
            ['Atorvastatin', '20mg • Nightly', ''],
          ].map(([name, sub, chip]) => (
            <View style={styles.medRow} key={name}>
              <View style={styles.dot} />
              <View>
                <Text style={styles.medName}>{name}</Text>
                <Text style={styles.medSub}>{sub}</Text>
                {!!chip && <Text style={styles.medChip}>{chip}</Text>}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>RECENT CLINICAL NOTES</Text>
          <Text style={styles.notesText}>
            Patient reports mild persistent headache. No neurological deficits noted. Cardiovascular exam normal.
            Plan to continue current BP management. Follow up in 3 months.
          </Text>
          <Text style={styles.verified}>Verified by Dr. Sarah Chen • May 14, 2024</Text>
        </View>

        <TouchableOpacity style={styles.returnBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Text style={styles.returnBtnText}>Return to Scanner</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f5fb' },
  banner: { backgroundColor: '#aac0eb', paddingHorizontal: spacing[4], paddingVertical: spacing[3] },
  bannerText: { ...typography.titleSm, color: '#21314f' },
  scroll: { paddingHorizontal: spacing[4], paddingBottom: spacing[8] },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing[4],
    marginBottom: spacing[4],
  },
  backBtn: { padding: spacing[2] },
  backText: { fontSize: 24, color: colors.primary },
  brand: { ...typography.headlineSm, color: colors.primary },
  avatar: { fontSize: 24 },
  signinCard: {
    backgroundColor: '#ffffff',
    borderRadius: radius.lg,
    padding: spacing[4],
    marginBottom: spacing[5],
  },
  signinTitle: { ...typography.headlineMd, color: '#111827', marginBottom: spacing[1] },
  signinSub: { ...typography.bodyMd, color: '#6b7280', marginBottom: spacing[3] },
  signinBtn: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signinBtnText: { ...typography.titleMd, color: '#fff', fontWeight: '700' },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: '#efe8e8',
    color: '#9f2a00',
    borderRadius: radius.full,
    paddingVertical: 4,
    paddingHorizontal: 10,
    ...typography.labelSm,
    marginBottom: spacing[3],
  },
  name: { ...typography.displayLg, color: '#121826', lineHeight: 54 },
  meta: { ...typography.headlineSm, color: '#2e3446', marginTop: spacing[2], marginBottom: spacing[4] },
  blood: { color: '#ba1a1a', fontWeight: '700' },
  statusCard: { backgroundColor: '#eef1fb', borderRadius: radius.md, padding: spacing[4], marginBottom: spacing[4] },
  sectionLabel: { ...typography.labelSm, color: '#6d7283', letterSpacing: 2, marginBottom: spacing[2] },
  statusValue: { ...typography.displaySm, color: '#121826' },
  syncText: { ...typography.bodyMd, color: '#7b8192' },
  allergyCard: { backgroundColor: '#ffdedd', borderRadius: radius.md, padding: spacing[4], marginBottom: spacing[4] },
  allergyHead: { ...typography.labelSm, color: '#8f1010', letterSpacing: 2, marginBottom: spacing[2] },
  allergyRow: {
    backgroundColor: '#ffecec',
    borderRadius: 10,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing[2],
  },
  allergyName: { ...typography.titleMd, color: '#8b0d0d' },
  severe: {
    ...typography.labelSm,
    color: '#fff',
    backgroundColor: '#be1414',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  sectionCard: { backgroundColor: '#ffffff', borderRadius: radius.md, padding: spacing[4], marginBottom: spacing[4] },
  vitalsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vitalLabel: { ...typography.headlineSm, color: '#5c6376' },
  vitalValue: { ...typography.displayMd, color: '#111827' },
  vitalValueSmall: { ...typography.headlineMd, color: '#111827' },
  progressTrack: {
    marginTop: spacing[1],
    width: '100%',
    height: 5,
    borderRadius: radius.full,
    backgroundColor: '#d8dde8',
  },
  progressFill: { width: '66%', height: '100%', borderRadius: radius.full, backgroundColor: colors.primary },
  medRow: { flexDirection: 'row', gap: spacing[3], marginBottom: spacing[3] },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    marginTop: 8,
  },
  medName: { ...typography.headlineSm, color: '#101726' },
  medSub: { ...typography.bodyMd, color: '#6f7689' },
  medChip: {
    alignSelf: 'flex-start',
    marginTop: spacing[1],
    ...typography.labelMd,
    backgroundColor: '#dbe8ff',
    color: '#385ea7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.md,
  },
  notesText: { ...typography.bodyMd, color: '#3f4658', lineHeight: 28 },
  verified: { ...typography.labelMd, color: '#2a3042', marginTop: spacing[3] },
  returnBtn: {
    alignSelf: 'center',
    marginTop: spacing[3],
    backgroundColor: '#e5e8f1',
    borderRadius: radius.full,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
  },
  returnBtnText: { ...typography.titleMd, color: '#29354f' },
});
