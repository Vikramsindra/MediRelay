import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius, shadow } from '../theme';
import { useStore } from '../store';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function statusLabel(status) {
  if (!status) return 'IN PROGRESS';
  const s = String(status).toLowerCase();
  if (s.includes('pending')) return 'IN PROGRESS';
  if (s.includes('ack')) return 'COMPLETED';
  return s.toUpperCase();
}

export default function PatientHomeScreen({ navigation }) {
  const { transfers, patientProfile } = useStore();

  const ordered = useMemo(() => {
    return [...(transfers || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [transfers]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topHeader}>
        <View style={styles.brandRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <Text style={styles.brandTitle}>{patientProfile?.hospitalBrand || 'Vitality Care'}</Text>
        </View>
        <Text style={styles.bell}>🔔</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>My Transfers</Text>
        <Text style={styles.pageSub}>Real-time status of clinical logistics</Text>

        {ordered.map((t, index) => {
          const origin = t.from || 'City General';
          const destination = t.to || 'KEM Hospital';
          const primaryDiagnosis = t.diagnosis || 'Acute Myocardial Infarction';
          const pill = statusLabel(t.status);
          const active = index === 0;

          return (
            <TouchableOpacity
              key={t.id}
              style={[styles.cardWrap, active && styles.cardWrapActive]}
              onPress={() => navigation.navigate('PatientTransferDetail', { transferId: t.id })}
              activeOpacity={0.9}
            >
              <View style={styles.cardHeaderRow}>
                <Text style={styles.dateText}>{formatDate(t.createdAt)}</Text>
                <View style={[styles.statusPill, active && styles.statusPillActive]}>
                  <Text style={[styles.statusPillText, active && styles.statusPillTextActive]}>{pill}</Text>
                </View>
              </View>

              <View style={styles.transferRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.metaLabel}>ORIGIN</Text>
                  <Text style={styles.metaValue}>{origin}</Text>
                </View>
                <Text style={styles.arrow}>→</Text>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={styles.metaLabel}>DESTINATION</Text>
                  <Text style={styles.metaValue}>{destination}</Text>
                </View>
              </View>

              <View style={styles.dxBox}>
                <Text style={styles.dxLabel}>Primary Diagnosis</Text>
                <Text style={styles.dxValue}>{primaryDiagnosis}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f4f5fb' },
  topHeader: {
    backgroundColor: '#eef0f6',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: '#dbe3f7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  avatarText: { fontSize: 22 },
  brandTitle: {
    ...typography.displayMd,
    color: colors.primary,
    fontSize: 50,
  },
  bell: { fontSize: 24 },
  scroll: { paddingHorizontal: spacing[5], paddingBottom: spacing[8] },
  pageTitle: {
    ...typography.displayMd,
    color: '#0f1625',
    marginTop: spacing[6],
    marginBottom: spacing[1],
  },
  pageSub: {
    ...typography.headlineSm,
    color: '#6b7282',
    marginBottom: spacing[5],
  },
  cardWrap: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: spacing[5],
    marginBottom: spacing[5],
    ...shadow.sm,
  },
  cardWrapActive: {
    borderLeftWidth: 5,
    borderLeftColor: colors.primary,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  dateText: {
    ...typography.headlineMd,
    color: '#141926',
  },
  statusPill: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: '#e9edf7',
    borderRadius: radius.full,
  },
  statusPillActive: {
    backgroundColor: '#dbe8ff',
  },
  statusPillText: {
    ...typography.titleMd,
    color: '#6f7c95',
    letterSpacing: 1,
    fontWeight: '700',
  },
  statusPillTextActive: { color: colors.primary },
  transferRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
    gap: spacing[2],
  },
  metaLabel: {
    ...typography.labelSm,
    color: '#8c93a5',
    letterSpacing: 1.6,
  },
  metaValue: {
    ...typography.displaySm,
    color: '#131925',
    fontWeight: '600',
  },
  arrow: {
    color: colors.primary,
    fontSize: 36,
    marginHorizontal: spacing[2],
  },
  dxBox: {
    marginTop: spacing[1],
    borderRadius: 16,
    backgroundColor: '#f0f2fb',
    padding: spacing[4],
  },
  dxLabel: {
    ...typography.headlineSm,
    color: '#727a8e',
    marginBottom: spacing[1],
  },
  dxValue: {
    ...typography.displaySm,
    color: '#161c2a',
  },
});
