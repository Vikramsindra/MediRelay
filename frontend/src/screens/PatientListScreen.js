import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius, shadow } from '../theme';
import { PatientCard } from '../components/Cards';
import { PrimaryButton } from '../components/Buttons';
import { useStore } from '../store';

export default function PatientListScreen({ navigation, route }) {
  const { patients } = useStore();
  const mode = route?.params?.mode; // 'transfer' | undefined
  const [query, setQuery] = useState('');

  const filtered = patients.filter((p) => {
    const q = query.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.phone?.includes(q) ||
      p.id?.toLowerCase().includes(q)
    );
  });

  const handleSelect = (patient) => {
    if (mode === 'transfer') {
      navigation.navigate('TransferForm', { patientId: patient.id });
    } else {
      navigation.navigate('PatientProfile', { patientId: patient.id });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[typography.titleMd, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[typography.headlineSm, { color: colors.onSurface }]}>Patients</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name, phone or ID…"
          placeholderTextColor={colors.outline}
          autoFocus
          style={[styles.searchInput, shadow.sm]}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
            <Text style={{ color: colors.outline, fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={[typography.bodyMd, { color: colors.outline, marginTop: spacing[3] }]}>
              No patients found
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <PatientCard
            name={item.name}
            age={item.age}
            sex={item.sex}
            bloodGroup={item.bloodGroup}
            allergies={item.allergies}
            onPress={() => handleSelect(item)}
          />
        )}
      />

      {/* Sticky register button */}
      <View style={styles.stickyBottom}>
        <PrimaryButton
          label="+ Register New Patient"
          onPress={() => navigation.navigate('PatientRegistration')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
    backgroundColor: colors.background,
  },
  backBtn: { width: 60 },
  searchWrap: {
    marginHorizontal: spacing[5],
    marginBottom: spacing[4],
    position: 'relative',
  },
  searchInput: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: 16,
    color: colors.onSurface,
    paddingRight: 40,
  },
  clearBtn: {
    position: 'absolute',
    right: spacing[3],
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[4],
  },
  empty: { alignItems: 'center', paddingTop: spacing[12] },
  emptyIcon: { fontSize: 40 },
  stickyBottom: {
    padding: spacing[5],
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
  },
});
