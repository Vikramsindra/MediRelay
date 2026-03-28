import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { colors, typography, spacing, radius, shadow } from '../theme';
import { PrimaryButton } from '../components/Buttons';

export default function AckConfirmationScreen({ navigation, route }) {
  const { transferId, arrivalTime } = route.params ?? {};

  useEffect(() => {
    // Auto-dismiss after 4 seconds (optional)
    const timer = setTimeout(() => {
      // Uncomment to auto-navigate:
      // navigation.navigate('Home');
    }, 4000);
    return () => clearTimeout(timer);
  }, [navigation]);

  const handleViewRecord = () => {
    if (transferId) {
      navigation.navigate('RecordViewer', { transferId });
    }
  };

  const handleDone = () => {
    navigation.navigate('Home');
  };

  const formattedTime = arrivalTime
    ? new Date(arrivalTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Success Checkmark */}
        <View style={styles.checkmarkContainer}>
          <Text style={styles.checkmark}>✓</Text>
        </View>

        {/* Success Message */}
        <Text style={[typography.headlineMd, { color: colors.onSurface, marginTop: spacing[4] }]}>
          Handoff Complete
        </Text>
        <Text style={[typography.bodyMd, { color: colors.outline, marginTop: spacing[2], textAlign: 'center' }]}>
          Patient acknowledgement has been recorded
        </Text>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={[typography.labelSm, { color: colors.outline }]}>Acknowledged at</Text>
            <Text style={[typography.bodyMd, { color: colors.onSurface, fontWeight: '600' }]}>
              {formattedTime}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={[typography.labelSm, { color: colors.outline }]}>Transfer ID</Text>
            <Text style={[typography.bodyMd, { color: colors.onSurface, fontWeight: '600', fontFamily: 'Menlo' }]}>
              {transferId ? transferId.substring(0, 8).toUpperCase() : 'N/A'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={[typography.labelSm, { color: colors.outline }]}>Status</Text>
            <View style={styles.statusBadge}>
              <Text style={[typography.labelSm, { color: colors.onTertiary }]}>RECEIVED</Text>
            </View>
          </View>
        </View>

        {/* Notification */}
        <View style={styles.notification}>
          <Text style={[typography.labelSm, { color: colors.outline }]}>🔔</Text>
          <Text style={[typography.bodySm, { color: colors.outline, marginLeft: spacing[2], flex: 1 }]}>
            Sending team has been notified of successful handoff
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleViewRecord}
          style={styles.secondaryButton}
        >
          <Text style={[typography.titleSm, { color: colors.primary }]}>View Record</Text>
        </TouchableOpacity>
        <PrimaryButton
          label="Done"
          onPress={handleDone}
          style={{ marginLeft: spacing[3], flex: 1 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[6],
  },
  checkmarkContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.tertiaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.md,
  },
  checkmark: {
    fontSize: 40,
    color: colors.tertiary,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.lg,
    padding: spacing[4],
    marginTop: spacing[6],
    width: '100%',
    ...shadow.sm,
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
  statusBadge: {
    backgroundColor: colors.tertiaryContainer,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radius.sm,
  },
  notification: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceContainerLow,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing[3],
    marginTop: spacing[5],
    width: '100%',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[4],
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    gap: spacing[3],
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
