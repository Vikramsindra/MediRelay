import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radius } from '../theme';

/**
 * SeverityBadge — Critical / Serious / Stable chip
 */
export function SeverityBadge({ severity, size = 'md' }) {
  const map = {
    Critical: { bg: colors.criticalBg, text: colors.critical },
    Serious:  { bg: colors.seriousBg,  text: colors.serious },
    Stable:   { bg: colors.stableBg,   text: colors.stable },
  };
  const style = map[severity] ?? map.Stable;
  const isSmall = size === 'sm';
  return (
    <View style={[styles.badge, { backgroundColor: style.bg, paddingHorizontal: isSmall ? 8 : 12, paddingVertical: isSmall ? 2 : 4 }]}>
      <Text style={[isSmall ? typography.labelMd : typography.titleSm, { color: style.text }]}>
        {severity?.toUpperCase()}
      </Text>
    </View>
  );
}

/**
 * SectionLabel — all-caps metadata label
 */
export function SectionLabel({ children, style }) {
  return (
    <Text style={[typography.labelSm, { color: colors.outline, marginBottom: spacing[2] }, style]}>
      {children}
    </Text>
  );
}

/**
 * Divider — tonal background shift (never a line)
 */
export function TonalDivider({ height = spacing[4] }) {
  return <View style={{ height }} />;
}

/**
 * StatusPill — Pending / Viewed / Acknowledged
 */
export function StatusPill({ status }) {
  const map = {
    Pending:      { bg: colors.seriousBg,  text: colors.serious },
    Viewed:       { bg: colors.stableBg,   text: colors.stable },
    Acknowledged: { bg: '#d3f5e4',          text: '#1a6640' },
  };
  const s = map[status] ?? map.Pending;
  return (
    <View style={[styles.badge, { backgroundColor: s.bg, paddingHorizontal: 10, paddingVertical: 3 }]}>
      <Text style={[typography.labelMd, { color: s.text }]}>{status}</Text>
    </View>
  );
}

/**
 * AllergyChip — red removable chip
 */
export function AllergyChip({ label, onRemove }) {
  return (
    <View style={styles.allergyChip}>
      <Text style={[typography.labelMd, { color: colors.error }]}>{label}</Text>
      {onRemove && (
        <Text onPress={onRemove} style={[typography.labelMd, { color: colors.error, marginLeft: 6 }]}>✕</Text>
      )}
    </View>
  );
}

/**
 * ConditionChip — multi-select chip
 */
export function ConditionChip({ label, selected, onPress }) {
  return (
    <Text
      onPress={onPress}
      style={[
        styles.conditionChip,
        selected
          ? { backgroundColor: colors.secondaryContainer, color: colors.onSecondaryContainer }
          : { backgroundColor: colors.surfaceContainerLowest, color: colors.onSurfaceVariant },
      ]}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  allergyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorContainer,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginRight: 8,
    marginBottom: 8,
  },
  conditionChip: {
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
    marginBottom: 8,
    overflow: 'hidden',
    fontSize: 13,
    fontWeight: '500',
  },
});
