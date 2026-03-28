import React, { useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { colors, typography, spacing, radius, shadow } from '../theme';
import { AppIcon } from './AppIcon';

/**
 * LabeledInput — standard input with label, error, placeholder hint
 */
export function LabeledInput({
  label, value, onChangeText, placeholder, keyboardType = 'default',
  error, required, autoFocus, multiline, numberOfLines, maxLength, editable = true,
  style,
}) {
  return (
    <View style={[styles.fieldWrap, style]}>
      <View style={styles.labelRow}>
        <Text style={[typography.labelMd, { color: colors.onSurfaceVariant }]}>{label}</Text>
        {required && <View style={styles.requiredDot} />}
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.outline}
        keyboardType={keyboardType}
        autoFocus={autoFocus}
        multiline={multiline}
        numberOfLines={numberOfLines}
        maxLength={maxLength}
        editable={editable}
        style={[
          styles.input,
          multiline && { height: 100, textAlignVertical: 'top', paddingTop: spacing[3] },
          error && styles.inputError,
          !editable && { opacity: 0.6 },
        ]}
      />
      {error ? (
        <Text style={[typography.bodySm, { color: colors.error, marginTop: 4 }]}>{error}</Text>
      ) : null}
    </View>
  );
}

/**
 * BPInput — split BP field [ systolic ] / [ diastolic ]
 */
export function BPInput({ systolic, diastolic, onChangeSystolic, onChangeDiastolic }) {
  return (
    <View style={styles.fieldWrap}>
      <View style={styles.labelRow}>
        <Text style={[typography.labelMd, { color: colors.onSurfaceVariant }]}>Blood Pressure</Text>
        <View style={styles.requiredDot} />
      </View>
      <View style={styles.bpRow}>
        <TextInput
          value={systolic}
          onChangeText={onChangeSystolic}
          placeholder="120"
          placeholderTextColor={colors.outline}
          keyboardType="numeric"
          style={[styles.input, styles.bpField]}
          maxLength={3}
        />
        <Text style={[typography.headlineMd, { color: colors.onSurfaceVariant, paddingHorizontal: spacing[2] }]}>/</Text>
        <TextInput
          value={diastolic}
          onChangeText={onChangeDiastolic}
          placeholder="80"
          placeholderTextColor={colors.outline}
          keyboardType="numeric"
          style={[styles.input, styles.bpField]}
          maxLength={3}
        />
        <Text style={[typography.bodySm, { color: colors.outline, marginLeft: spacing[2] }]}>mmHg</Text>
      </View>
    </View>
  );
}

/**
 * VitalInput — single vital with unit label + range hint
 */
export function VitalInput({ label, value, onChangeText, unit, rangePlaceholder, outOfRange }) {
  return (
    <View style={styles.vitalWrap}>
      <Text style={[typography.labelMd, { color: colors.onSurfaceVariant }]}>{label}</Text>
      <View style={styles.vitalRow}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={rangePlaceholder}
          placeholderTextColor={colors.outline}
          keyboardType="numeric"
          style={[styles.input, styles.vitalInput, outOfRange && styles.inputWarning]}
        />
        {unit ? (
          <Text style={[typography.bodySm, { color: colors.outline, marginLeft: spacing[2] }]}>{unit}</Text>
        ) : null}
      </View>
      {outOfRange ? (
        <View style={styles.warningRow}>
          <AppIcon name="warning" size={14} color={colors.serious} />
          <Text style={[typography.bodySm, { color: colors.serious, marginLeft: spacing[1.5] }]}>Value outside normal range</Text>
        </View>
      ) : null}
    </View>
  );
}

/**
 * SimpleDropdown — tap-to-expand inline picker (no modal)
 */
export function SimpleDropdown({ label, options, value, onChange, required }) {
  const [open, setOpen] = React.useState(false);
  return (
    <View style={styles.fieldWrap}>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={[typography.labelMd, { color: colors.onSurfaceVariant }]}>{label}</Text>
          {required && <View style={styles.requiredDot} />}
        </View>
      ) : null}
      <TouchableOpacity
        onPress={() => setOpen(!open)}
        style={[styles.input, styles.dropdownTrigger]}
        activeOpacity={0.8}
      >
        <Text style={[typography.bodyMd, { color: value ? colors.onSurface : colors.outline, flex: 1 }]}>
          {value || 'Select…'}
        </Text>
        <AppIcon name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.outline} />
      </TouchableOpacity>
      {open && (
        <View style={[styles.dropdownList, shadow.md]}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              onPress={() => { onChange(opt); setOpen(false); }}
              style={[styles.dropdownItem, value === opt && { backgroundColor: colors.secondaryContainer }]}
              activeOpacity={0.75}
            >
              <Text style={[typography.bodyMd, { color: value === opt ? colors.primary : colors.onSurface }]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

/**
 * OTPBoxes — 6 side-by-side digit boxes
 */
export function OTPBoxes({ value, onChange, length = 6 }) {
  const inputs = useRef([]);
  const digits = value.split('').concat(Array(length).fill('')).slice(0, length);

  const handleChange = (text, idx) => {
    const d = [...digits];
    d[idx] = text.slice(-1);
    const joined = d.join('');
    onChange(joined);
    if (text && idx < length - 1) inputs.current[idx + 1]?.focus();
  };

  const handleKey = (e, idx) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  return (
    <View style={styles.otpRow}>
      {digits.map((d, i) => (
        <TextInput
          key={i}
          ref={(r) => { inputs.current[i] = r; }}
          value={d}
          onChangeText={(t) => handleChange(t, i)}
          onKeyPress={(e) => handleKey(e, i)}
          keyboardType="numeric"
          maxLength={1}
          style={styles.otpBox}
          autoFocus={i === 0}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldWrap: { marginBottom: spacing[5] },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing[1.5], gap: 4 },
  requiredDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.error },
  input: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: 16,
    color: colors.onSurface,
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...shadow.sm,
  },
  inputError: { borderColor: colors.error },
  inputWarning: { borderColor: colors.serious },
  bpRow: { flexDirection: 'row', alignItems: 'center' },
  bpField: { flex: 1, textAlign: 'center' },
  vitalWrap: { marginBottom: spacing[4] },
  warningRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  vitalRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing[1.5] },
  vitalInput: { flex: 1 },
  dropdownTrigger: { flexDirection: 'row', alignItems: 'center' },
  dropdownList: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    marginTop: spacing[1],
    overflow: 'hidden',
    maxHeight: 220,
    zIndex: 99,
  },
  dropdownItem: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  otpRow: { flexDirection: 'row', gap: spacing[2], justifyContent: 'center' },
  otpBox: {
    width: 48,
    height: 56,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: colors.onSurface,
    borderWidth: 1.5,
    borderColor: colors.outlineVariant,
  },
});
