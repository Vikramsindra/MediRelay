import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius, shadow } from '../theme';
import { AlertCard } from '../components/Cards';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import { LabeledInput } from '../components/Inputs';
import { AppIcon } from '../components/AppIcon';
import { getState } from '../store';

export default function DrugConflictScreen({ navigation, route }) {
  const { transferId, conflict } = route.params ?? {};
  const [overrideNote, setOverrideNote] = React.useState('');
  const [showOverride, setShowOverride] = React.useState(false);

  const state = getState();
  const transfer = state.transfers.find((t) => t.id === transferId);
  const patient = state.patients.find((p) => p.id === transfer?.patientId);

  const allergyMatch = patient?.allergies?.find((a) =>
    conflict?.name?.toLowerCase().includes(a.allergen.toLowerCase().slice(0, 5)),
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Warning header */}
        <View style={styles.warningHeader}>
          <View style={styles.warningIconWrap}>
            <AppIcon name="warning" size={56} color={colors.error} strokeWidth={1.8} />
          </View>
          <Text style={[typography.headlineMd, { color: colors.error, marginTop: spacing[3] }]}>
            Conflict Detected
          </Text>
          <Text style={[typography.bodyMd, { color: colors.onSurfaceVariant, marginTop: spacing[2], textAlign: 'center' }]}>
            A medication conflicts with a known patient allergy.
          </Text>
        </View>

        {/* Conflict card */}
        <AlertCard iconName="warning" title="Drug-Allergy Conflict" variant="critical">
          <View style={styles.conflictRow}>
            <Text style={[typography.labelSm, { color: colors.outline }]}>ALLERGY</Text>
            <Text style={[typography.titleMd, { color: colors.error }]}>
              {allergyMatch?.allergen ?? 'Unknown'}
            </Text>
          </View>
          <View style={[styles.conflictRow, { marginTop: spacing[3] }]}>
            <Text style={[typography.labelSm, { color: colors.outline }]}>MEDICATION</Text>
            <Text style={[typography.titleMd, { color: colors.error }]}>
              {conflict?.name} {conflict?.dose}
            </Text>
          </View>
          <View style={[styles.conflictRow, { marginTop: spacing[3] }]}>
            <Text style={[typography.labelSm, { color: colors.outline }]}>RISK</Text>
            <Text style={[typography.titleMd, { color: colors.error }]}>
              {allergyMatch?.reaction ?? 'Adverse reaction'}
            </Text>
          </View>
        </AlertCard>

        {/* Override section */}
        {showOverride && (
          <View style={styles.overrideWrap}>
            <LabeledInput
              label="Reason for Override"
              value={overrideNote}
              onChangeText={setOverrideNote}
              placeholder="Clinical justification required…"
              multiline
              numberOfLines={3}
              required
              autoFocus
            />
          </View>
        )}

        <View style={styles.actions}>
          <PrimaryButton
            label="Fix Medication"
            iconName="back"
            onPress={() => navigation.navigate('TransferForm', {
              patientId: transfer?.patientId,
              _goToMeds: true,
            })}
          />
          <View style={{ height: spacing[3] }} />
          {!showOverride ? (
            <SecondaryButton
              label="Override with Note"
              onPress={() => setShowOverride(true)}
            />
          ) : (
            <SecondaryButton
              label={overrideNote ? 'Confirm Override & Continue' : 'Enter a reason first'}
              iconName={overrideNote ? 'chevron-right' : undefined}
              onPress={() => {
                if (!overrideNote) return;
                navigation.navigate('QRDisplay', { transferId });
              }}
              disabled={!overrideNote}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: spacing[6], justifyContent: 'center' },
  warningHeader: { alignItems: 'center', marginBottom: spacing[6] },
  warningIconWrap: { marginBottom: spacing[1] },
  conflictRow: { marginBottom: spacing[1] },
  overrideWrap: { marginBottom: spacing[4] },
  actions: { marginTop: spacing[4] },
});
