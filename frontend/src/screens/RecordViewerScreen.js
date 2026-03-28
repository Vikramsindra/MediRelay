import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius, shadow } from '../theme';
import { AlertCard, MedCard } from '../components/Cards';
import { SeverityBadge, SectionLabel } from '../components/Badges';
import { PrimaryButton, ToggleGroup } from '../components/Buttons';
import { LabeledInput } from '../components/Inputs';
import { AppIcon } from '../components/AppIcon';
import { getState, setState, useStore } from '../store';
import { getTransferById, getTransferByShareId, updateTransfer } from '../api/transfers';
import {
  fetchMedicalHistoryByAbhaId,
  fetchMedicalHistoryForPatientProfile,
  getPatientById,
} from '../api/patients';
import { getStoredDoctorId } from '../storage/authStorage';

export default function RecordViewerScreen({ navigation, route }) {
  const { transferId, transferShareId, transferPayload, transferDirection } = route.params ?? {};
  const effectiveDirection = transferDirection === 'received' ? 'received' : 'sent';
  const state = useStore();
  const [transfer, setTransfer] = useState(
    transferPayload
      ? { ...transferPayload, direction: transferPayload.direction || effectiveDirection }
      : state.transfers.find((t) => t.id === transferId) || null,
  );

  useEffect(() => {
    if (transferPayload) {
      const payloadWithDirection = {
        ...transferPayload,
        direction: transferPayload.direction || effectiveDirection,
      };
      setState((s) => {
        const exists = s.transfers.some((t) => t.id === payloadWithDirection.id);
        return {
          ...s,
          transfers: exists
            ? s.transfers.map((t) => (t.id === payloadWithDirection.id ? payloadWithDirection : t))
            : [payloadWithDirection, ...s.transfers],
        };
      });
      return;
    }

    let cancelled = false;

    const loadTransfer = async () => {
      if (!transferId && !transferShareId) return;
      try {
        const fetched = transferShareId
          ? await getTransferByShareId(transferShareId)
          : await getTransferById(transferId);
        const fetchedWithDirection = {
          ...fetched,
          direction: transfer?.direction || effectiveDirection,
        };
        if (cancelled) return;
        setTransfer(fetchedWithDirection);
        setState((s) => {
          const exists = s.transfers.some((t) => t.id === fetchedWithDirection.id);
          return {
            ...s,
            transfers: exists
              ? s.transfers.map((t) => (t.id === fetchedWithDirection.id ? fetchedWithDirection : t))
              : [fetchedWithDirection, ...s.transfers],
          };
        });
      } catch (_error) {
        // Ignore and keep best-effort local state.
      }
    };

    loadTransfer();

    return () => {
      cancelled = true;
    };
  }, [transferId, transferShareId, transferPayload, transferDirection]);

  const patient = state.patients.find((p) => p.id === transfer?.patientId)
    || transfer?.patientSnapshot
    || null;

  const [showAckPanel, setShowAckPanel] = useState(false);
  const [arrivalCondition, setArrivalCondition] = useState('');
  const [arrivalNote, setArrivalNote] = useState('');
  const [discrepancy, setDiscrepancy] = useState('');
  const [acknowledged, setAcknowledged] = useState(transfer?.status === 'Acknowledged');
  const [ackError, setAckError] = useState('');
  const [isSubmittingAck, setIsSubmittingAck] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyError, setHistoryError] = useState('');
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [hasFetchedHistory, setHasFetchedHistory] = useState(false);

  const vitals = transfer?.vitals ?? {};
  const mustNotStop = (transfer?.activeMeds ?? patient?.medications ?? []).filter((m) => m.mustNotStop);
  const regularMeds = (transfer?.activeMeds ?? patient?.medications ?? []).filter((m) => !m.mustNotStop);
  const hasAllergies = patient?.allergies?.length > 0;
  const patientAbhaId = String(patient?.abhaId || transfer?.patientSnapshot?.abhaId || '').trim();

  const handleAcknowledge = async () => {
    if (!arrivalCondition) return;

    const effectiveTransferId = transfer?.id || transferId;
    if (!effectiveTransferId) {
      setAckError('Unable to identify this transfer. Please retry.');
      return;
    }

    try {
      setAckError('');
      setIsSubmittingAck(true);

      const updated = await updateTransfer(effectiveTransferId, {
        status: 'acknowledged',
        acknowledgement: {
          arrivalCondition,
          arrivalNote,
          discrepancy,
          acknowledgedAt: new Date().toISOString(),
        },
      });

      const updatedWithDirection = {
        ...updated,
        direction: transfer?.direction || effectiveDirection,
      };

      setTransfer(updatedWithDirection);
      setState((s) => ({
        ...s,
        transfers: s.transfers.map((t) =>
          t.id === updatedWithDirection.id ? { ...t, ...updatedWithDirection } : t,
        ),
      }));
      setAcknowledged(true);
      setShowAckPanel(false);
    } catch (error) {
      setAckError(error?.message || 'Failed to submit acknowledgement');
    } finally {
      setIsSubmittingAck(false);
    }
  };

  const handleFetchMedicalHistory = async () => {
    try {
      setIsFetchingHistory(true);
      setHistoryError('');

      let abhaForLookup = patientAbhaId;

      // If ABHA is missing in transfer payload/snapshot, verify from saved patient record in DB.
      if (!abhaForLookup && transfer?.patientId) {
        const doctorId = getState()?.doctor?.userId || await getStoredDoctorId();
        if (doctorId) {
          try {
            const patientFromDb = await getPatientById(transfer.patientId, doctorId);
            abhaForLookup = String(patientFromDb?.abhaId || '').trim();
          } catch (_error) {
            // Fall back to profile-based matching below.
          }
        }
      }

      const history = abhaForLookup
        ? await fetchMedicalHistoryByAbhaId(abhaForLookup)
        : await fetchMedicalHistoryForPatientProfile({
          name: patient?.name || transfer?.patientName,
          age: patient?.age,
          phone: patient?.phone,
        });

      setHistoryItems(history);
      setHasFetchedHistory(true);
    } catch (error) {
      setHistoryItems([]);
      setHistoryError(error?.message || 'Unable to fetch medical history right now.');
      setHasFetchedHistory(true);
    } finally {
      setIsFetchingHistory(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>

      {/* Fixed critical section — does NOT scroll away */}
      <View style={styles.criticalSection}>
        {/* Header row */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <AppIcon name="back" size={18} color={colors.primary} />
            <Text style={[typography.titleMd, { color: colors.primary, marginLeft: spacing[1.5] }]}>Back</Text>
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={[typography.titleMd, { color: colors.onSurface }]}>
              {patient?.name} · {patient?.sex} · {patient?.age}y
            </Text>
            <Text style={[typography.bodySm, { color: colors.outline }]}>
              {patient?.bloodGroup} · From: {transfer?.from ?? 'Unknown'}
            </Text>
          </View>
          <View style={{ width: 60 }} />
        </View>

        {/* Allergy card — ALWAYS shown */}
        {hasAllergies ? (
          <AlertCard iconName="warning" title="Allergies" variant="critical">
            {patient.allergies.filter(a => a).map((a, i) => {
              let allergen = '';
              let reaction = '';
              
              if (typeof a === 'string') {
                allergen = a;
              } else if (typeof a === 'object' && a !== null) {
                allergen = String(a.allergen || '');
                reaction = String(a.reaction || '');
              }
              
              return (
                <Text key={i} style={[typography.bodyMd, { color: colors.error }]}>
                  {allergen}{reaction ? `: ${reaction}` : ''}
                </Text>
              );
            })}
          </AlertCard>
        ) : (
          <View style={styles.noAllergyBanner}>
            <View style={styles.safeRow}>
              <AppIcon name="check" size={14} color="#1a6640" />
              <Text style={[typography.titleSm, { color: '#1a6640', marginLeft: 6 }]}>No known allergies</Text>
            </View>
          </View>
        )}

        {/* Must not stop — if any */}
        {mustNotStop.length > 0 && (
          <AlertCard iconName="warning" title="Must NOT Stop" variant="mustStop">
            {mustNotStop.map((m, i) => (
              <Text key={i} style={[typography.bodyMd, { color: colors.error, marginBottom: 2 }]}>
                {m.name} {m.dose} · {m.route}
                {m.frequency ? ` · ${m.frequency}` : ''}
              </Text>
            ))}
          </AlertCard>
        )}

        {/* Severity + reason */}
        <View style={[styles.severityCard, { borderLeftColor:
          transfer?.severity === 'Critical' ? colors.critical :
          transfer?.severity === 'Serious' ? colors.serious : colors.stable,
        }]}>
          <View style={styles.severityRow}>
            <SeverityBadge severity={transfer?.severity} />
            <Text style={[typography.titleSm, { color: colors.onSurfaceVariant, marginLeft: spacing[3] }]}>
              {transfer?.conditionCategory}
            </Text>
          </View>
          <Text style={[typography.bodyMd, { color: colors.onSurface, marginTop: spacing[2] }]}>
            {transfer?.diagnosis ?? 'No diagnosis recorded'}
          </Text>
        </View>
      </View>

      {/* Scrollable detail section */}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Vitals */}
        <SectionLabel>Vitals</SectionLabel>
        <View style={styles.vitalsGrid}>
          {[
            { label: 'BP', value: vitals.bpSys && vitals.bpDia ? `${vitals.bpSys}/${vitals.bpDia}` : '—' },
            { label: 'HR', value: vitals.hr ? `${vitals.hr} bpm` : '—' },
            { label: 'SpO₂', value: vitals.spo2 ? `${vitals.spo2}%` : '—' },
            { label: 'Temp', value: vitals.temp ? `${vitals.temp}°F` : '—' },
            { label: 'RR', value: vitals.rr ? `${vitals.rr}/min` : '—' },
          ].map((v) => (
            <View key={v.label} style={styles.vitalCell}>
              <Text style={[typography.labelSm, { color: colors.outline }]}>{v.label}</Text>
              <Text style={[typography.headlineSm, { color: colors.onSurface }]}>{v.value}</Text>
            </View>
          ))}
        </View>

        {/* Active medications */}
        {regularMeds.length > 0 && (
          <>
            <SectionLabel style={{ marginTop: spacing[5] }}>Active Medications</SectionLabel>
            {regularMeds.map((m, i) => (
              <MedCard key={i} name={m.name} dose={m.dose} route={m.route}
                frequency={m.frequency} mustNotStop={false} />
            ))}
          </>
        )}

        {/* Clinical summary */}
        {transfer?.summary ? (
          <>
            <SectionLabel style={{ marginTop: spacing[5] }}>Clinical Summary</SectionLabel>
            <View style={styles.summaryCard}>
              <Text style={[typography.bodyMd, { color: colors.onSurface, lineHeight: 24 }]}>
                {transfer.summary}
              </Text>
            </View>
          </>
        ) : null}

        {/* Pending investigations */}
        {transfer?.investigations?.length > 0 && (
          <>
            <SectionLabel style={{ marginTop: spacing[5] }}>Pending Investigations</SectionLabel>
            <View style={styles.chipsRow}>
              {transfer.investigations.map((inv) => (
                <View key={inv} style={styles.invChip}>
                  <Text style={[typography.labelMd, { color: colors.secondary }]}>{inv}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Sending doctor info */}
        <SectionLabel style={{ marginTop: spacing[5] }}>Sent By</SectionLabel>
        <View style={styles.senderCard}>
          <Text style={[typography.titleSm, { color: colors.onSurface }]}>
            {transfer?.doctorName || 'Unknown Doctor'}
          </Text>
          <Text style={[typography.bodySm, { color: colors.outline }]}>
            {transfer?.from || 'Unknown Hospital'}
          </Text>
        </View>

        {(hasFetchedHistory || isFetchingHistory) ? (
          <>
            <SectionLabel style={{ marginTop: spacing[5] }}>Medical History</SectionLabel>
            {isFetchingHistory ? (
              <View style={styles.historyCard}>
                <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant }]}>Fetching medical history...</Text>
              </View>
            ) : null}

            {!isFetchingHistory && historyError ? (
              <View style={styles.historyCard}>
                <Text style={[typography.bodyMd, { color: colors.error }]}>{historyError}</Text>
              </View>
            ) : null}

            {!isFetchingHistory && !historyError && historyItems.length === 0 ? (
              <View style={styles.historyCard}>
                <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant }]}>No medical history entries found.</Text>
              </View>
            ) : null}

            {!isFetchingHistory && !historyError && historyItems.length > 0
              ? historyItems.map((item) => (
                <View key={item.id} style={styles.historyCard}>
                  <Text style={[typography.titleSm, { color: colors.onSurface }]}>
                    {item.date || 'Unknown date'} · {item.diagnosis || 'Clinical record'}
                  </Text>
                  <Text style={[typography.bodySm, { color: colors.outline, marginTop: spacing[1] }]}>
                    {item.hospital || 'Unknown hospital'}
                  </Text>
                  {item.treatment ? (
                    <Text style={[typography.bodyMd, { color: colors.onSurface, marginTop: spacing[2] }]}>
                      Treatment: {item.treatment}
                    </Text>
                  ) : null}
                  {item.notes ? (
                    <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginTop: spacing[1.5] }]}>
                      Notes: {item.notes}
                    </Text>
                  ) : null}
                </View>
              ))
              : null}
          </>
        ) : null}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky acknowledge button */}
      <View style={styles.stickyBottom}>
        {acknowledged ? (
          <View>
            <View style={styles.acknowledgedBanner}>
              <View style={styles.ackRow}>
                <AppIcon name="check" size={16} color="#1a6640" />
                <Text style={[typography.titleMd, { color: '#1a6640', marginLeft: 6 }]}>Transfer Acknowledged</Text>
              </View>
            </View>
            <View style={{ height: spacing[3] }} />
            <PrimaryButton
              label={isFetchingHistory ? 'Fetching Medical History...' : 'Fetch Medical History'}
              iconName="chevron-right"
              onPress={handleFetchMedicalHistory}
              disabled={isFetchingHistory}
            />
          </View>
        ) : (
          <PrimaryButton
            label="Mark as Reviewed"
            iconName="check"
            onPress={() => setShowAckPanel(true)}
          />
        )}
      </View>

      {/* Acknowledgement bottom sheet */}
      <Modal
        visible={showAckPanel}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAckPanel(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sheet}>
            <Text style={[typography.headlineSm, { color: colors.onSurface, marginBottom: spacing[5] }]}>
              Acknowledge Transfer
            </Text>
            <Text style={[typography.labelSm, { color: colors.outline, marginBottom: spacing[3] }]}>
              PATIENT CONDITION ON ARRIVAL
            </Text>
            <ToggleGroup
              options={['Stable', 'Deteriorated', 'Critical']}
              value={arrivalCondition}
              onChange={setArrivalCondition}
              colorMap={{ Critical: colors.critical, Deteriorated: colors.serious, Stable: colors.stable }}
            />
            <View style={{ marginTop: spacing[5] }}>
              <LabeledInput
                label="Arrival Note (optional)"
                value={arrivalNote}
                onChangeText={setArrivalNote}
                placeholder="Brief note on patient on arrival…"
                multiline
                numberOfLines={2}
              />
              <LabeledInput
                label="Flag Discrepancy (optional)"
                value={discrepancy}
                onChangeText={setDiscrepancy}
                placeholder="e.g. Medication was stopped en route"
                multiline
                numberOfLines={2}
              />
            </View>
            <PrimaryButton
              label="Confirm & Submit"
              onPress={handleAcknowledge}
              disabled={!arrivalCondition || isSubmittingAck}
            />
            {ackError ? (
              <Text style={[typography.bodySm, { color: colors.error, marginTop: spacing[2] }]}>
                {ackError}
              </Text>
            ) : null}
            <TouchableOpacity onPress={() => setShowAckPanel(false)} style={styles.cancelBtn}>
              <Text style={[typography.bodyMd, { color: colors.outline, textAlign: 'center' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  criticalSection: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  noAllergyBanner: {
    backgroundColor: '#d3f5e4',
    borderRadius: radius.md, padding: spacing[3], marginBottom: spacing[3],
  },
  safeRow: { flexDirection: 'row', alignItems: 'center' },
  severityCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    padding: spacing[4],
  },
  severityRow: { flexDirection: 'row', alignItems: 'center' },
  scroll: { padding: spacing[5] },
  vitalsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3], marginBottom: spacing[2],
  },
  vitalCell: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    padding: spacing[3],
    minWidth: 80,
    flex: 1,
    alignItems: 'center',
    ...shadow.sm,
  },
  summaryCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    padding: spacing[4],
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  invChip: {
    backgroundColor: colors.secondaryContainer,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  senderCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    padding: spacing[4],
  },
  historyCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    padding: spacing[4],
    marginTop: spacing[2.5],
  },
  stickyBottom: {
    padding: spacing[5],
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  acknowledgedBanner: {
    alignItems: 'center', padding: spacing[4],
    backgroundColor: '#d3f5e4', borderRadius: radius.md,
  },
  ackRow: { flexDirection: 'row', alignItems: 'center' },
  modalOverlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(25,27,35,0.4)',
  },
  sheet: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing[6],
    paddingBottom: spacing[8],
  },
  cancelBtn: { paddingVertical: spacing[4] },
});
