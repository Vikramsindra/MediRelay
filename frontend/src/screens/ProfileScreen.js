import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius, shadow } from '../theme';
import { AppIcon } from '../components/AppIcon';
import { useStore } from '../store';

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <AppIcon name={icon} size={16} color={colors.outline} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function ActionRow({ icon, label, right, onPress }) {
  return (
    <TouchableOpacity style={styles.actionRow} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.actionLeft}>
        <AppIcon name={icon} size={18} color={colors.onSurfaceVariant} />
        <Text style={styles.actionText}>{label}</Text>
      </View>
      {right ?? <AppIcon name="chevron-right" size={16} color={colors.outline} />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen({ navigation, onLogout }) {
  const { doctor } = useStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const handleConfirmLogout = () => {
    setLogoutModalVisible(false);
    onLogout?.();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Doctor Profile</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ProfileEdit')}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Top profile card */}
        <View style={styles.topCard}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>
              {(doctor?.name || 'D')
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((s) => s[0])
                .join('')
                .toUpperCase()}
            </Text>
          </View>

          <Text style={styles.name}>{doctor?.name || 'Doctor'}</Text>
          <View style={styles.roleHospitalRow}>
            <View style={styles.rolePill}>
              <Text style={styles.rolePillText}>{doctor?.role || 'Doctor'}</Text>
            </View>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.hospitalText}>{doctor?.hospital || 'Hospital'}</Text>
          </View>

          <View style={styles.verifiedPill}>
            <AppIcon name="check" size={12} color="#047857" />
            <Text style={styles.verifiedText}>COUNCIL VERIFIED</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>PERSONAL INFORMATION</Text>
        <View style={styles.sectionCard}>
          <InfoRow icon="users" label="FULL NAME" value={doctor?.name || '—'} />
          <InfoRow icon="link" label="PHONE" value={doctor?.phone ? `+91 ${doctor.phone}` : '—'} />
          <InfoRow icon="home" label="HOSPITAL" value={doctor?.hospital || '—'} />
          <InfoRow icon="clipboard" label="DEPARTMENT" value="General Medicine" />
        </View>

        <Text style={styles.sectionTitle}>ACCOUNT SETTINGS</Text>
        <View style={styles.sectionCard}>
          <ActionRow icon="warning" label="Change Password" />
          <ActionRow
            icon="clock"
            label="Notifications"
            right={(
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ true: '#69e5b2', false: '#d7dce8' }}
                thumbColor={colors.surfaceContainerLowest}
              />
            )}
          />
          <ActionRow icon="check" label="Privacy & Data" />
        </View>

        <Text style={styles.sectionTitle}>SUPPORT</Text>
        <View style={styles.sectionCard}>
          <ActionRow icon="warning" label="Help Center" />
          <ActionRow icon="clipboard" label="Report an Issue" />
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.85}
          onPress={() => setLogoutModalVisible(true)}
        >
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>VERSION 2.4.1 (CLINICAL-CONCIERGE)</Text>
      </ScrollView>

      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.logoutOverlay}>
          <TouchableOpacity
            style={styles.logoutBackdrop}
            activeOpacity={1}
            onPress={() => setLogoutModalVisible(false)}
          />

          <View style={styles.logoutSheet}>
            <View style={styles.logoutHandle} />
            <Text style={styles.logoutSheetTitle}>Log Out?</Text>
            <Text style={styles.logoutSheetMessage}>
              You will need to sign in again to access patient records.
            </Text>

            <TouchableOpacity
              style={styles.logoutConfirmBtn}
              activeOpacity={0.9}
              onPress={handleConfirmLogout}
            >
              <Text style={styles.logoutConfirmText}>Log Out</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutCancelBtn}
              activeOpacity={0.85}
              onPress={() => setLogoutModalVisible(false)}
            >
              <Text style={styles.logoutCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: spacing[10] },
  header: {
    backgroundColor: '#0a1730',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    ...typography.headlineSm,
    color: colors.onPrimary,
    fontWeight: '700',
  },
  editText: {
    ...typography.titleMd,
    color: colors.onPrimary,
    fontWeight: '700',
  },
  topCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[6],
    alignItems: 'center',
    ...shadow.sm,
  },
  avatarWrap: {
    width: 84,
    height: 84,
    borderRadius: 26,
    backgroundColor: '#0f2244',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  avatarText: {
    color: colors.onPrimary,
    fontSize: 34,
    fontWeight: '700',
  },
  name: {
    ...typography.displayMd,
    color: colors.onSurface,
    fontSize: 28,
    marginBottom: spacing[2],
  },
  roleHospitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  rolePill: {
    backgroundColor: colors.secondaryContainer,
    borderRadius: radius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
  },
  rolePillText: {
    ...typography.labelMd,
    color: colors.onSecondaryContainer,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  dot: {
    marginHorizontal: spacing[2],
    color: '#b6bcc8',
    fontSize: 18,
  },
  hospitalText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: '#dff3ea',
    borderWidth: 1,
    borderColor: '#aadac7',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: radius.full,
  },
  verifiedText: {
    ...typography.labelMd,
    color: '#047857',
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  sectionTitle: {
    ...typography.labelSm,
    color: '#2f3f63',
    letterSpacing: 2,
    marginTop: spacing[6],
    marginBottom: spacing[3],
    paddingHorizontal: spacing[5],
  },
  sectionCard: {
    marginHorizontal: spacing[5],
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.xl,
    paddingVertical: spacing[2],
    ...shadow.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  infoIconWrap: {
    width: 26,
    alignItems: 'center',
  },
  infoLabel: {
    ...typography.labelMd,
    color: '#8a94a9',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  infoValue: {
    ...typography.headlineSm,
    color: colors.onSurface,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3.5],
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  actionText: {
    ...typography.headlineSm,
    color: colors.onSurface,
  },
  logoutBtn: {
    marginHorizontal: spacing[5],
    marginTop: spacing[7],
    borderColor: '#d00000',
    borderWidth: 2,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    height: 64,
    backgroundColor: colors.surfaceContainerLowest,
  },
  logoutText: {
    ...typography.headlineSm,
    color: '#d00000',
    fontWeight: '700',
  },
  versionText: {
    marginTop: spacing[8],
    marginBottom: spacing[4],
    textAlign: 'center',
    color: '#7a8294',
    ...typography.labelMd,
    letterSpacing: 1.5,
  },
  logoutOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  logoutBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.54)',
  },
  logoutSheet: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[3],
    paddingBottom: spacing[7],
  },
  logoutHandle: {
    width: 72,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: '#d7dce5',
    alignSelf: 'center',
    marginBottom: spacing[7],
  },
  logoutSheetTitle: {
    ...typography.displaySm,
    textAlign: 'center',
    color: '#0c1730',
    fontWeight: '700',
    marginBottom: spacing[3],
  },
  logoutSheetMessage: {
    ...typography.headlineSm,
    textAlign: 'center',
    color: '#6d7a95',
    lineHeight: 40,
    marginBottom: spacing[7],
  },
  logoutConfirmBtn: {
    height: 64,
    borderRadius: 18,
    backgroundColor: '#cb1017',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
    ...shadow.sm,
  },
  logoutConfirmText: {
    ...typography.displaySm,
    color: '#ffffff',
    fontWeight: '700',
  },
  logoutCancelBtn: {
    height: 64,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#d2d9e4',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutCancelText: {
    ...typography.displaySm,
    color: '#2b3a59',
    fontWeight: '700',
  },
});
