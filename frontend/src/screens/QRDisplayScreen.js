import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { colors, typography, spacing, radius, shadow } from '../theme';
import { SeverityBadge } from '../components/Badges';
import { SecondaryButton } from '../components/Buttons';
import { AppIcon } from '../components/AppIcon';
import { buildTransferQrPayload, getTransferById } from '../api/transfers';
import { setState, useStore } from '../store';

const STATUSES = ['Pending', 'Viewed', 'Acknowledged'];

export default function QRDisplayScreen({ navigation, route }) {
  const { transferId, qrPayload: qrPayloadFromRoute } = route.params ?? {};
  const { transfers } = useStore();
  const [transfer, setTransfer] = useState(transfers.find((t) => t.id === transferId) || null);
  const [qrPayload, setQrPayload] = useState('');
  const shortLink = transfer?.shareId
    ? `medirelay.app/r/${transfer.shareId}`
    : `medirelay.app/r/${transferId}`;

  const [status, setStatus] = useState(transfer?.status ?? 'Pending');
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadTransfer = async () => {
      if (!transferId) return;
      try {
        const fetched = await getTransferById(transferId);
        if (cancelled) return;
        setTransfer(fetched);
        setQrPayload(buildTransferQrPayload(fetched));
        setStatus(fetched?.status || 'Pending');
        setState((s) => {
          const exists = s.transfers.some((t) => t.id === fetched.id);
          return {
            ...s,
            transfers: exists
              ? s.transfers.map((t) => (t.id === fetched.id ? fetched : t))
              : [fetched, ...s.transfers],
          };
        });
      } catch (_error) {
        // Ignore fetch failures and keep local transfer data.
      }
    };

    loadTransfer();

    const interval = setInterval(loadTransfer, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [transferId]);

  useEffect(() => {
    if (!transfer) return;
    setQrPayload(buildTransferQrPayload(transfer));
  }, [transfer]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `MediRelay transfer: https://${shortLink}`,
      });
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
          <View style={styles.qrBackdrop}>
            <View style={[styles.qrOrb, styles.qrOrbTop]} />
            <View style={[styles.qrOrb, styles.qrOrbBottom]} />

            <View style={styles.qrFrame}>
              <View style={[styles.frameCorner, styles.frameCornerTL]} />
              <View style={[styles.frameCorner, styles.frameCornerTR]} />
              <View style={[styles.frameCorner, styles.frameCornerBL]} />
              <View style={[styles.frameCorner, styles.frameCornerBR]} />

              <View style={styles.qrBox}>
                <QRCode
                  value={qrPayload || String(transferId || '')}
                  size={228}
                  backgroundColor={colors.white}
                  color={colors.onSurface}
                  ecl="L"
                />
              </View>
            </View>

            <View style={styles.offlineReadyPill}>
              <AppIcon name="check" size={13} color="#1a6640" />
              <Text style={[typography.labelMd, { color: '#1a6640', marginLeft: spacing[1] }]}>Offline Ready</Text>
            </View>
          </View>
          <Text style={[typography.labelSm, { color: colors.outline, marginTop: spacing[4], textAlign: 'center' }]}>
            Scan in MediRelay to open transfer offline
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
  qrBackdrop: {
    width: '100%',
    borderRadius: radius.lg,
    paddingVertical: spacing[5],
    paddingHorizontal: spacing[4],
    alignItems: 'center',
    backgroundColor: '#f4f8f6',
    borderWidth: 1,
    borderColor: '#e1ebe6',
    overflow: 'hidden',
  },
  qrOrb: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#e6f3ed',
  },
  qrOrbTop: {
    top: -55,
    right: -35,
  },
  qrOrbBottom: {
    bottom: -60,
    left: -40,
  },
  qrFrame: {
    position: 'relative',
    borderRadius: radius.md,
    padding: spacing[2],
    backgroundColor: '#dbe8e1',
    marginBottom: spacing[4],
  },
  frameCorner: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderColor: colors.primary,
    zIndex: 2,
  },
  frameCornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  frameCornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  frameCornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  frameCornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  qrBox: {
    padding: spacing[3],
    backgroundColor: colors.white,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  offlineReadyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dff2e7',
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
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
