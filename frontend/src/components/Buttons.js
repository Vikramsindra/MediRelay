import React from 'react';
import {
  TouchableOpacity, Text, StyleSheet, ActivityIndicator, View,
} from 'react-native';
import { colors, typography, spacing, radius, touchTarget, shadow } from '../theme';
import { AppIcon } from './AppIcon';

/**
 * PrimaryButton — full-width 56px CTA
 */
export function PrimaryButton({ label, onPress, disabled, loading, icon, iconName, iconColor }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[styles.primary, (disabled || loading) && styles.primaryDisabled]}
    >
      {loading ? (
        <ActivityIndicator color={colors.onPrimary} size="small" />
      ) : (
        <View style={styles.row}>
          {iconName ? <AppIcon name={iconName} size={18} color={iconColor ?? colors.onPrimary} /> : null}
          {icon && <Text style={styles.primaryIcon}>{icon}</Text>}
          <Text style={[typography.titleMd, { color: colors.onPrimary }]}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

/**
 * SecondaryButton — ghost / tonal variant
 */
export function SecondaryButton({ label, onPress, disabled, icon, iconName }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[styles.secondary, disabled && styles.secondaryDisabled]}
    >
      <View style={styles.row}>
        {iconName ? <AppIcon name={iconName} size={16} color={disabled ? colors.outline : colors.primary} /> : null}
        {icon && <Text style={styles.secondaryIcon}>{icon}</Text>}
        <Text style={[typography.titleMd, { color: disabled ? colors.outline : colors.primary }]}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

/**
 * EmergencyCTA — oversized padding, leading icon
 */
export function EmergencyCTA({ label, icon, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.emergency, shadow.md]}>
      {icon && <Text style={styles.emergencyIcon}>{icon}</Text>}
      <Text style={[typography.headlineSm, { color: colors.onPrimary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

/**
 * IconButton — square/circle icon tap target ≥48px
 */
export function IconButton({ icon, onPress, bg, size = 48 }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.iconButton,
        { width: size, height: size, backgroundColor: bg ?? colors.surfaceContainerLowest },
      ]}
      activeOpacity={0.75}
    >
      <Text style={{ fontSize: 20 }}>{icon}</Text>
    </TouchableOpacity>
  );
}

/**
 * ToggleGroup — inline multi-option toggle (e.g. Sex, Severity)
 */
export function ToggleGroup({ options, value, onChange, colorMap }) {
  return (
    <View style={styles.toggleRow}>
      {options.map((opt) => {
        const selected = value === opt;
        const customColor = colorMap?.[opt];
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => onChange(opt)}
            style={[
              styles.toggleItem,
              selected && {
                backgroundColor: customColor ?? colors.primary,
                borderColor: customColor ?? colors.primary,
              },
              !selected && { borderColor: colors.outlineVariant },
            ]}
            activeOpacity={0.8}
          >
            <Text
              style={[
                typography.titleSm,
                { color: selected ? colors.onPrimary : colors.onSurfaceVariant },
              ]}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/**
 * CategoryButton — large tap button for condition categories
 */
export function CategoryButton({ label, selected, onPress, emoji }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.categoryBtn,
        selected && { backgroundColor: colors.primary, borderColor: colors.primary },
        !selected && { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant },
      ]}
    >
      <Text
        style={[typography.labelMd, { color: selected ? colors.onPrimary : colors.onSurface, textAlign: 'center' }]}
        numberOfLines={2}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  primary: {
    height: touchTarget.primary,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
  },
  primaryDisabled: { opacity: 0.45 },
  secondary: {
    height: touchTarget.min,
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[5],
  },
  secondaryDisabled: { opacity: 0.45 },
  emergency: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    gap: spacing[2],
  },
  emergencyIcon: { fontSize: 22 },
  primaryIcon: { fontSize: 18, marginRight: spacing[2] },
  secondaryIcon: { fontSize: 16, marginRight: spacing[1.5] },
  iconButton: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleRow: { flexDirection: 'row', gap: spacing[2], flexWrap: 'wrap' },
  toggleItem: {
    flex: 1,
    minHeight: touchTarget.min,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    paddingHorizontal: spacing[3],
  },
  categoryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1.5,
    padding: spacing[2],
    minHeight: 64,
    flex: 1,
  },
  categoryEmoji: { fontSize: 20, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
});
