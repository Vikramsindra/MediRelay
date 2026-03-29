import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius, shadow } from '../theme';
import { AppIcon } from '../components/AppIcon';
import { useStore, setState } from '../store';

export default function ProfileEditScreen({ navigation }) {
  const { doctor } = useStore();

  const [fullName, setFullName] = useState(doctor?.name || 'Dr. Julian Thorne');
  const [hospitalName, setHospitalName] = useState(doctor?.hospital || "St. Mary's General Hospital");
  const [department, setDepartment] = useState('Emergency Medicine');

  const handleSave = () => {
    setState((s) => ({
      ...s,
      doctor: {
        ...s.doctor,
        name: fullName,
        hospital: hospitalName,
      },
    }));
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.headerSide}>Cancel</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Doctor Profile</Text>

        <TouchableOpacity onPress={handleSave} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.headerSide}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarEmoji}>👨‍⚕️</Text>
            <TouchableOpacity style={styles.cameraBadge}>
              <AppIcon name="camera" size={18} color={colors.onSurface} />
            </TouchableOpacity>
          </View>
          <Text style={styles.editPhotoText}>Edit photo</Text>
        </View>

        {/* Editable form card */}
        <View style={styles.formCard}>
          <Text style={styles.label}>FULL NAME</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Full name"
              placeholderTextColor={colors.outline}
            />
          </View>

          <Text style={styles.label}>HOSPITAL NAME</Text>
          <View style={styles.inputWrapRow}>
            <AppIcon name="link" size={18} color="#7a86a0" />
            <TextInput
              style={[styles.input, { paddingHorizontal: spacing[2], flex: 1 }]}
              value={hospitalName}
              onChangeText={setHospitalName}
              placeholder="Hospital"
              placeholderTextColor={colors.outline}
            />
          </View>

          <Text style={styles.label}>DEPARTMENT</Text>
          <View style={styles.inputWrapRow}>
            <TextInput
              style={[styles.input, { flex: 1, paddingLeft: 0 }]}
              value={department}
              onChangeText={setDepartment}
              placeholder="Department"
              placeholderTextColor={colors.outline}
            />
            <AppIcon name="chevron-down" size={18} color="#7a86a0" />
          </View>
        </View>

        {/* Locked fields */}
        <View style={styles.lockCard}>
          <View style={styles.lockLeft}>
            <AppIcon name="link" size={18} color="#8e9ab0" />
            <View style={{ marginLeft: spacing[3] }}>
              <Text style={styles.lockLabel}>PHONE NUMBER</Text>
              <Text style={styles.lockValue}>+1(555) 0123-4567</Text>
            </View>
          </View>
          <Text style={styles.lockIcon}>🔒</Text>
        </View>

        <View style={styles.lockCard}>
          <View style={styles.lockLeft}>
            <AppIcon name="clipboard" size={18} color="#8e9ab0" />
            <View style={{ marginLeft: spacing[3] }}>
              <Text style={styles.lockLabel}>COUNCIL REG. NO.</Text>
              <Text style={styles.lockValue}>MED-99420-TX</Text>
            </View>
          </View>
          <Text style={styles.lockIcon}>🔒</Text>
        </View>

        <Text style={styles.supportHint}>Contact support to change locked verification fields.</Text>

        <TouchableOpacity style={styles.changePasswordCard} activeOpacity={0.85}>
          <View style={styles.lockLeft}>
            <View style={styles.changeIconWrap}>
              <AppIcon name="clock" size={18} color={colors.onSurface} />
            </View>
            <Text style={styles.changePasswordText}>Change Password</Text>
          </View>
          <AppIcon name="chevron-right" size={18} color="#7a86a0" />
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Fixed save button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn} activeOpacity={0.9}>
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#e7eaf1' },
  header: {
    backgroundColor: '#081b3b',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    paddingBottom: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadow.sm,
  },
  headerSide: {
    ...typography.headlineSm,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '700',
  },
  headerTitle: {
    ...typography.headlineMd,
    color: colors.onPrimary,
    fontWeight: '700',
  },
  scroll: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
    paddingBottom: spacing[6],
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  avatarWrap: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 6,
    borderColor: '#9aa7c3',
    backgroundColor: '#2b7d8d',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
    position: 'relative',
  },
  avatarEmoji: {
    fontSize: 78,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 42,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.full,
    padding: spacing[3],
    ...shadow.sm,
  },
  editPhotoText: {
    ...typography.headlineSm,
    color: '#0b5a33',
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.xl,
    padding: spacing[5],
    marginBottom: spacing[5],
    ...shadow.sm,
  },
  label: {
    ...typography.labelSm,
    color: '#7685a0',
    marginBottom: spacing[2],
    letterSpacing: 1,
  },
  inputWrap: {
    backgroundColor: '#e8ecf8',
    borderRadius: radius.lg,
    paddingHorizontal: spacing[4],
    marginBottom: spacing[5],
    height: 80 / 1.6,
    justifyContent: 'center',
  },
  inputWrapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8ecf8',
    borderRadius: radius.lg,
    paddingHorizontal: spacing[4],
    marginBottom: spacing[5],
    height: 80 / 1.6,
  },
  input: {
    ...typography.headlineSm,
    color: '#111827',
  },
  lockCard: {
    backgroundColor: '#edf1f9',
    borderRadius: radius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    marginBottom: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lockLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  lockLabel: {
    ...typography.labelSm,
    color: '#90a0ba',
    letterSpacing: 0.9,
    marginBottom: 2,
  },
  lockValue: {
    ...typography.headlineSm,
    color: '#596b8b',
  },
  lockIcon: {
    fontSize: 16,
    opacity: 0.5,
  },
  supportHint: {
    ...typography.bodyMd,
    color: '#7f8faa',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: spacing[2],
    marginBottom: spacing[6],
  },
  changePasswordCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.xl,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    marginBottom: spacing[6],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadow.sm,
  },
  changeIconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: '#e8ecf8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  changePasswordText: {
    ...typography.displayMd,
    color: '#111827',
    fontSize: 21 / 1.2,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surfaceContainerLowest,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[5],
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
  saveBtn: {
    height: 78 / 1.4,
    borderRadius: radius.lg,
    backgroundColor: '#0b1f43',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.md,
  },
  saveBtnText: {
    ...typography.displayMd,
    color: colors.onPrimary,
    fontSize: 24 / 1.2,
    fontWeight: '700',
  },
});
