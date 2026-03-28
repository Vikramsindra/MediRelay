import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius, shadow } from '../theme';
import { SeverityBadge } from '../components/Badges';
import { SecondaryButton } from '../components/Buttons';
import { AppIcon } from '../components/AppIcon';
import { getState } from '../store';

// Minimal QR placeholder (real QR would use react-native-qrcode-svg)
function QRPlaceholder({ value }) {
  return (
    <View style={styles.qrBox}>
      {/* 7x7 grid approximation for visual authenticity */}
      {Array.from({ length: 7 }).map((_, row) => (
        <View key={row} style={styles.qrRow}>
          {Array.from({ length: 7 }).map((_, col) => {
            const isCorner =
              (row < 2 && col < 2) || (row < 2 && col > 4) || (row > 4 && col < 2);
            const isBorder =
              (row === 0 || row === 6 || col === 0 || col === 6) ||
              (row < 3 && col < 3) || (row < 3 && col > 3) || (row > 3 && col < 3);
            const filled = isCorner || (Math.sin(row * 3 + col * 7) > 0);
            return (
              <View
                key={col}
                style={[
                  styles.qrCell,
                  { backgroundColor: filled ? colors.onSurface : colors.white },
                ]}
              />
            );
          })}
        </View>
      ))}
      <Text style={styles.qrLabel}>{value?.slice(0, 20)}</Text>
    </View>
  );
}

const STATUSES = ['Pending', 'Viewed', 'Acknowledged'];

export default function QRDisplayScreen({ navigation, route }) {
  const { transferId } = route.params ?? {};
  const state = getState();
  const transfer = state.transfers.find((t) => t.id === transferId);
  const shortLink = `medirelay.app/r/${transferId}`;

  // Simulate real-time status updates
  const [status, setStatus] = useState(transfer?.status ?? 'Pending');
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (status === 'Acknowledged') return;
    const t = setTimeout(() => {
      if (status === 'Pending') setStatus('Viewed');
      else if (status === 'Viewed') setStatus('Acknowledged');
    }, 5000);
    return () => clearTimeout(t);
  }, [status]);

  const handleShare = async () => {
    try {
      await Share.share({ message: `MediRelay transfer: https://${shortLink}` });
    } catch (_) {}
  };

  const handleCopyLink = () => {
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const statusColor = {
    Pending: colors.outline,
    Viewed: colors.serious,
    Acknowledged: '#1a6640',
  }[status];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.homeRow}>
            <AppIcon name="back" size={18} color={colors.primary} />
            <Text style={[typography.titleMd, { color: colors.primary, marginLeft: spacing[1.5] }]}>Home</Text>
          </TouchableOpacity>
          <Text style={[typography.titleMd, { color: colors.onSurface }]}>Transfer Created</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Patient info */}
        <View style={styles.patientBanner}>
          <Text style={[typography.headlineSm, { color: colors.onSurface }]}>
            {transfer?.patientName}
          </Text>
          <View style={styles.badgeRow}>
            <Text style={[typography.bodyMd, { color: colors.outline }]}>
              {transfer?.conditionCategory} ·
            </Text>
            <SeverityBadge severity={transfer?.severity} size="sm" />
          </View>
        </View>

        {/* QR Code */}
        <View style={[styles.qrCard, shadow.md]}>
          <QRPlaceholder value={transferId} />
          <Text style={[typography.labelSm, { color: colors.outline, marginTop: spacing[4], textAlign: 'center' }]}>
            Scan to receive patient record
          </Text>
        </View>

        {/* Short link */}
        <TouchableOpacity onPress={handleCopyLink} style={styles.linkRow} activeOpacity={0.75}>
          <Text style={[typography.bodyMd, { color: colors.primary, flex: 1 }]}>
            {shortLink}
          </Text>
          <View style={styles.copyStateRow}>
            {linkCopied ? <AppIcon name="check" size={14} color="#1a6640" /> : null}
            <Text style={[typography.labelMd, { color: linkCopied ? '#1a6640' : colors.outline, marginLeft: linkCopied ? spacing[1] : 0 }]}> 
              {linkCopied ? 'Copied' : 'Tap to copy'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <SecondaryButton label="Share" onPress={handleShare} iconName="chevron-right" />
          <SecondaryButton label="Print" onPress={() => {}} iconName="chevron-right" />
        </View>

        {/* Live status */}
        <View style={[styles.statusBanner, { borderColor: statusColor }]}>
          <AppIcon name={status === 'Acknowledged' ? 'check' : 'warning'} size={20} color={statusColor} />
          <View style={{ flex: 1 }}>
            <Text style={[typography.titleSm, { color: statusColor }]}>
              {status === 'Pending' && 'Pending review…'}
              {status === 'Viewed' && 'Record opened'}
              {status === 'Acknowledged' && 'Transfer acknowledged'}
            </Text>
            {status !== 'Acknowledged' && (
              <Text style={[typography.bodySm, { color: colors.outline, marginTop: 2 }]}>
                Updates in real time
              </Text>
            )}
          </View>
        </View>

        <View style={{ height: spacing[6] }} />

        <TouchableOpacity
          onPress={() => navigation.navigate('Home')}
          style={styles.homeBtn}
          activeOpacity={0.8}
        >
          <Text style={[typography.titleMd, { color: colors.onSurfaceVariant }]}>
            Back to Home
          </Text>
        </TouchableOpacity>

        <View style={{ height: spacing[8] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing[5] },
  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: spacing[5],
  },
  homeRow: { flexDirection: 'row', alignItems: 'center' },
  patientBanner: { alignItems: 'center', marginBottom: spacing[5] },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginTop: spacing[1] },
  qrCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.xl,
    padding: spacing[6],
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  qrBox: {
    padding: spacing[4],
    backgroundColor: colors.white,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  qrRow: { flexDirection: 'row' },
  qrCell: { width: 32, height: 32, margin: 1, borderRadius: 2 },
  qrLabel: {
    marginTop: spacing[2],
    fontSize: 9,
    color: colors.outline,
    letterSpacing: 1,
  },
  linkRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md, padding: spacing[4],
    marginBottom: spacing[4],
  },
  copyStateRow: { flexDirection: 'row', alignItems: 'center' },
  actionsRow: {
    flexDirection: 'row', gap: spacing[3], marginBottom: spacing[5],
  },
  statusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    borderWidth: 1.5, borderRadius: radius.lg,
    padding: spacing[4],
    backgroundColor: colors.surfaceContainerLowest,
  },
  homeBtn: {
    alignItems: 'center', padding: spacing[4],
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.md,
  },
});
