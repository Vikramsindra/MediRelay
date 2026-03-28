import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius, shadow } from '../theme';
import { TransferCard } from '../components/Cards';
import { SectionLabel } from '../components/Badges';
import { AppIcon } from '../components/AppIcon';
import { SecondaryButton } from '../components/Buttons';
import { setState, useStore } from '../store';
import { fetchTransfers } from '../api/transfers';
import { getStoredDoctorId } from '../storage/authStorage';

function formatTimeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function HomeScreen({ navigation, onLogout }) {
  const { doctor, isOnline, transfers } = useStore();

  useEffect(() => {
    let cancelled = false;

    const loadTransfers = async () => {
      const doctorId = doctor?.userId || await getStoredDoctorId();
      if (!doctorId) return;

      try {
        const items = await fetchTransfers({ doctorId });
        if (cancelled) return;
        setState((s) => ({ ...s, transfers: items }));
      } catch (_error) {
        if (cancelled) return;
      }
    };

    loadTransfers();

    return () => {
      cancelled = true;
    };
  }, [doctor?.userId]);

  const incoming = transfers.filter(
    (t) => t.direction === 'received' && String(t.status || '').toLowerCase() === 'pending',
  );
  const recentSent = transfers
    .filter((t) => t.direction === 'sent')
    .slice(0, 5);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <SafeAreaView style={styles.safe}>

      {/* Offline banner — subtle, top */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={[typography.labelMd, { color: colors.offlineBanner }]}>
            ● Working offline — will sync when connected
          </Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.displayMd, { color: colors.onSurface }]}>
              {greeting},
            </Text>
            <Text style={[typography.headlineMd, { color: colors.primary }]}>
              {doctor?.name ?? 'Doctor'}
            </Text>
            <Text style={[typography.bodyMd, { color: colors.outline, marginTop: spacing[1] }]}>
              {doctor?.hospital}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.onlineDot, { backgroundColor: isOnline ? '#1a6640' : colors.serious }]} />
            <SecondaryButton
              label="Logout"
              iconName="close"
              onPress={onLogout}
            />
          </View>
        </View>

        {/* Primary CTA */}
        <TouchableOpacity
          onPress={() => navigation.navigate('PatientList', { mode: 'transfer' })}
          style={[styles.newTransferBtn, shadow.md]}
          activeOpacity={0.88}
        >
          <AppIcon name="plus" size={22} color={colors.onPrimary} />
          <View style={{ flex: 1 }}>
            <Text style={[typography.headlineSm, { color: colors.onPrimary }]}>New Transfer</Text>
            <Text style={[typography.bodySm, { color: 'rgba(255,255,255,0.75)', marginTop: 2 }]}>
              Send a patient record
            </Text>
          </View>
          <AppIcon name="chevron-right" size={20} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>

        {/* Secondary quick actions */}
        <View style={styles.quickRow}>
          <TouchableOpacity
            onPress={() => navigation.navigate('QRScanner')}
            style={[styles.quickBtn, shadow.sm]}
            activeOpacity={0.8}
          >
            <AppIcon name="camera" size={22} color={colors.primary} />
            <Text style={[typography.titleSm, { color: colors.onSurface }]}>Scan QR</Text>
            <Text style={[typography.bodySm, { color: colors.outline }]}>Receive transfer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('QRScanner', { mode: 'paste' })}
            style={[styles.quickBtn, shadow.sm]}
            activeOpacity={0.8}
          >
            <AppIcon name="link" size={22} color={colors.primary} />
            <Text style={[typography.titleSm, { color: colors.onSurface }]}>Paste Link</Text>
            <Text style={[typography.bodySm, { color: colors.outline }]}>From WhatsApp / SMS</Text>
          </TouchableOpacity>
        </View>

        {/* Needs Acknowledgement — only if present */}
        {incoming.length > 0 && (
          <View style={styles.section}>
            <SectionLabel>Needs Acknowledgement</SectionLabel>
            {incoming.map((t) => (
              <TransferCard
                key={t.id}
                patient={t.patientName}
                severity={t.severity}
                diagnosis={t.diagnosis}
                subLabel={`From: ${t.from}`}
                time={formatTimeAgo(t.createdAt)}
                onPress={() => navigation.navigate('RecordViewer', { transferId: t.id })}
              />
            ))}
          </View>
        )}

        {/* Recently Sent */}
        {recentSent.length > 0 && (
          <View style={styles.section}>
            <SectionLabel>Recently Sent</SectionLabel>
            {recentSent.map((t) => (
              <TransferCard
                key={t.id}
                patient={t.patientName}
                severity={t.severity}
                diagnosis={t.diagnosis}
                subLabel={`To: ${t.to}`}
                status={t.status}
                time={formatTimeAgo(t.createdAt)}
                onPress={() => navigation.navigate('QRDisplay', { transferId: t.id })}
              />
            ))}
          </View>
        )}

        {/* Empty state — no sent transfers */}
        {recentSent.length === 0 && incoming.length === 0 && (
          <View style={styles.emptyState}>
            <AppIcon name="clipboard" size={40} color={colors.outline} />
            <Text style={[typography.titleMd, { color: colors.onSurfaceVariant, marginTop: spacing[3] }]}>
              Start your first transfer
            </Text>
            <Text style={[typography.bodySm, { color: colors.outline, textAlign: 'center', marginTop: spacing[2] }]}>
              Tap "New Transfer" to send a patient record to another hospital.
            </Text>
          </View>
        )}

        <View style={{ height: spacing[8] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  offlineBanner: {
    backgroundColor: colors.offlineBannerBg,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    alignItems: 'center',
  },
  scroll: { padding: spacing[6], paddingTop: spacing[4] },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[6],
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: spacing[2],
  },
  onlineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 8 },
  newTransferBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing[5],
    gap: spacing[4],
    marginBottom: spacing[4],
  },
  quickRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  quickBtn: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    padding: spacing[4],
    alignItems: 'flex-start',
    gap: spacing[1],
  },
  section: { marginBottom: spacing[4] },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[12],
  },
});
