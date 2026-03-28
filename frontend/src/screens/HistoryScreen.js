import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius, shadow } from '../theme';
import { StatusPill, SectionLabel } from '../components/Badges';
import { AppIcon } from '../components/AppIcon';
import { setState, useStore } from '../store';
import { fetchTransfers } from '../api/transfers';
import { getStoredDoctorId } from '../storage/authStorage';

function groupByDate(transfers) {
  const groups = {};
  transfers.forEach((t) => {
    const d = new Date(t.createdAt);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    let key;
    if (d.toDateString() === today.toDateString()) key = 'Today';
    else if (d.toDateString() === yesterday.toDateString()) key = 'Yesterday';
    else key = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });
  return groups;
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function HistoryScreen({ navigation }) {
  const { transfers, doctor } = useStore();
  const [activeTab, setActiveTab] = useState('Sent');

  useEffect(() => {
    let cancelled = false;

    const loadTransfers = async () => {
      const doctorId = doctor?.userId || await getStoredDoctorId();
      if (!doctorId) return;

      try {
        const items = await fetchTransfers({ doctorId });
        if (cancelled) return;
        setState((s) => {
          const receivedLocal = (s.transfers || []).filter((t) => t.direction === 'received');
          const sentRemote = (items || []).map((t) => ({ ...t, direction: 'sent' }));

          const merged = [
            ...receivedLocal,
            ...sentRemote.filter((sent) => !receivedLocal.some((received) => received.id === sent.id)),
          ];

          return { ...s, transfers: merged };
        });
      } catch (_error) {
        if (cancelled) return;
      }
    };

    loadTransfers();

    return () => {
      cancelled = true;
    };
  }, [doctor?.userId]);

  const filtered = transfers.filter((t) =>
    activeTab === 'Sent' ? t.direction === 'sent' : t.direction === 'received',
  );

  const groups = groupByDate(filtered);
  const sections = Object.entries(groups);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={[typography.headlineMd, { color: colors.onSurface }]}>History</Text>
      </View>

      {/* Tab filter */}
      <View style={styles.tabRow}>
        {['Sent', 'Received'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            activeOpacity={0.8}
          >
            <Text style={[
              typography.titleSm,
              { color: activeTab === tab ? colors.primary : colors.outline },
            ]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={sections}
        keyExtractor={([date]) => date}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <AppIcon name="warning" size={32} color={colors.outline} />
            <Text style={[typography.bodyMd, { color: colors.outline, marginTop: spacing[3] }]}>
              No {activeTab.toLowerCase()} transfers
            </Text>
          </View>
        }
        renderItem={({ item: [date, items] }) => (
          <View style={styles.group}>
            <SectionLabel>{date}</SectionLabel>
            {items.map((t) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => {
                  if (t.direction === 'sent') navigation.navigate('QRDisplay', { transferId: t.id });
                  else navigation.navigate('RecordViewer', { transferId: t.id });
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.historyCard, shadow.sm]}>
                  <View style={styles.cardHeader}>
                    <Text style={[typography.titleMd, { color: colors.onSurface, flex: 1 }]}>
                      {t.patientName}
                    </Text>
                    <Text style={[typography.labelMd, { color: colors.outline }]}>
                      {formatTime(t.createdAt)}
                    </Text>
                  </View>
                  <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
                    {t.conditionCategory} · {t.diagnosis}
                  </Text>
                  <View style={styles.cardFooter}>
                    <Text style={[typography.bodySm, { color: colors.outline }]}>
                      {t.direction === 'sent' ? `To: ${t.to}` : `From: ${t.from}`}
                    </Text>
                    <StatusPill status={t.status} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: spacing[5],
    marginBottom: spacing[4],
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.md,
    padding: 3,
  },
  tab: {
    flex: 1, paddingVertical: spacing[2.5],
    alignItems: 'center', borderRadius: radius.sm,
  },
  tabActive: { backgroundColor: colors.surfaceContainerLowest, ...shadow.sm },
  list: { paddingHorizontal: spacing[5], paddingBottom: spacing[8] },
  group: { marginBottom: spacing[4] },
  historyCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginTop: spacing[3],
  },
  empty: { alignItems: 'center', paddingTop: spacing[12] },
});
