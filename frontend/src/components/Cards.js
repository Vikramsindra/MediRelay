import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius, shadow } from '../theme';

/**
 * Card — base surface card (Level 2: surface_container_lowest on surface_container bg)
 */
export function Card({ children, style, elevated }) {
  return (
    <View style={[styles.card, elevated && shadow.md, style]}>
      {children}
    </View>
  );
}

/**
 * AlertCard — critical / allergy / must-not-stop cards (always at top)
 */
export function AlertCard({ icon, title, children, variant = 'critical' }) {
  const variantStyles = {
    critical:  { bg: colors.criticalBg,  border: colors.critical,  text: colors.critical },
    serious:   { bg: colors.seriousBg,   border: colors.serious,   text: colors.serious },
    stable:    { bg: colors.stableBg,    border: colors.stable,    text: colors.stable },
    mustStop:  { bg: colors.criticalBg,  border: colors.critical,  text: colors.critical },
  };
  const v = variantStyles[variant] ?? variantStyles.critical;
  return (
    <View style={[styles.alertCard, { backgroundColor: v.bg, borderLeftColor: v.border }]}>
      <View style={styles.alertHeader}>
        {icon && <Text style={styles.alertIcon}>{icon}</Text>}
        <Text style={[typography.titleMd, { color: v.text }]}>{title}</Text>
      </View>
      <View style={styles.alertBody}>{children}</View>
    </View>
  );
}

/**
 * TransferCard — used on Home + History
 */
export function TransferCard({ patient, severity, diagnosis, subLabel, status, time, onPress }) {
  const severityColor = {
    Critical: colors.critical,
    Serious: colors.serious,
    Stable: colors.stable,
  }[severity] ?? colors.outline;

  return (
    <View onStartShouldSetResponder={() => true} onResponderRelease={onPress}>
      <Card style={styles.transferCard}>
        <View style={styles.transferHeader}>
          <Text style={[typography.titleMd, { color: colors.onSurface, flex: 1 }]}>{patient}</Text>
          <View style={[styles.severityDot, { backgroundColor: severityColor }]} />
          <Text style={[typography.titleSm, { color: severityColor, marginLeft: 4 }]}>{severity?.toUpperCase()}</Text>
        </View>
        <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginTop: 2 }]}>
          {diagnosis}
        </Text>
        {subLabel ? (
          <Text style={[typography.bodySm, { color: colors.outline, marginTop: 2 }]}>{subLabel}</Text>
        ) : null}
        {(status || time) ? (
          <View style={styles.transferFooter}>
            {time ? <Text style={[typography.labelMd, { color: colors.outline }]}>{time}</Text> : null}
            {status ? (
              <View style={[styles.statusPill, { backgroundColor: colors.surfaceContainerHighest }]}>
                <Text style={[typography.labelMd, { color: colors.onSurfaceVariant }]}>{status}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </Card>
    </View>
  );
}

/**
 * PatientCard — used in Patient List
 */
export function PatientCard({ name, age, sex, bloodGroup, allergies, onPress }) {
  const hasAllergies = allergies && allergies.length > 0;
  return (
    <View onStartShouldSetResponder={() => true} onResponderRelease={onPress}>
      <Card style={styles.patientCard}>
        <View style={styles.patientHeader}>
          <View style={styles.patientInitial}>
            <Text style={[typography.headlineSm, { color: colors.primary }]}>
              {name?.[0] ?? '?'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[typography.titleMd, { color: colors.onSurface }]}>{name}</Text>
            <Text style={[typography.bodySm, { color: colors.onSurfaceVariant }]}>
              {sex} · {age}y · {bloodGroup}
            </Text>
          </View>
        </View>
        {hasAllergies ? (
          <View style={styles.allergyRow}>
            <Text style={styles.allergyDot}>⚠ </Text>
            <Text style={[typography.labelMd, { color: colors.error, flex: 1 }]}>
              {allergies.map((a) => a.allergen).join(', ')}
            </Text>
          </View>
        ) : (
          <Text style={[typography.labelMd, { color: '#1a6640', marginTop: 6 }]}>✓ No known allergies</Text>
        )}
      </Card>
    </View>
  );
}

/**
 * MedCard — medication display card (transfer form / record viewer)
 */
export function MedCard({ name, dose, route, frequency, mustNotStop, lastGiven }) {
  return (
    <Card style={[styles.medCard, mustNotStop && styles.medCardAlert]}>
      <View style={styles.medHeader}>
        <Text style={[typography.titleSm, { color: colors.onSurface, flex: 1 }]}>
          {name} · {dose} · {route}
        </Text>
        {mustNotStop && (
          <View style={styles.mustNotStopBadge}>
            <Text style={[typography.labelMd, { color: colors.error }]}>⚠ MUST NOT STOP</Text>
          </View>
        )}
      </View>
      {frequency ? (
        <Text style={[typography.bodySm, { color: colors.onSurfaceVariant, marginTop: 3 }]}>{frequency}</Text>
      ) : null}
      {lastGiven ? (
        <Text style={[typography.labelMd, { color: colors.outline, marginTop: 3 }]}>Last given: {lastGiven}</Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.lg,
    padding: spacing[4],
    ...shadow.sm,
  },
  alertCard: {
    borderRadius: radius.lg,
    padding: spacing[4],
    borderLeftWidth: 4,
    marginBottom: spacing[3],
  },
  alertHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing[2], gap: spacing[2] },
  alertIcon: { fontSize: 18 },
  alertBody: {},
  transferCard: { marginBottom: spacing[3] },
  transferHeader: { flexDirection: 'row', alignItems: 'center' },
  severityDot: { width: 8, height: 8, borderRadius: 4 },
  transferFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing[2] },
  statusPill: {
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  patientCard: { marginBottom: spacing[3] },
  patientHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], marginBottom: spacing[2] },
  patientInitial: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allergyRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  allergyDot: { color: colors.error, fontSize: 13 },
  medCard: { marginBottom: spacing[3] },
  medCardAlert: { borderWidth: 2, borderColor: colors.error },
  medHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2] },
  mustNotStopBadge: {
    backgroundColor: colors.errorContainer,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
});
