import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius, shadow } from '../theme';
import { PatientCard } from '../components/Cards';
import { PrimaryButton } from '../components/Buttons';
import { AppIcon } from '../components/AppIcon';
import { getState, setState, useStore } from '../store';
import { searchPatients } from '../api/patients';

export default function PatientListScreen({ navigation, route }) {
  const { patients, doctor } = useStore();
  const mode = route?.params?.mode; // 'transfer' | undefined
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    const doctorId = doctor?.userId || getState()?.doctor?.userId;
    if (!doctorId) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        setSearchError('');
        const results = await searchPatients(query.trim(), doctorId);
        if (cancelled) return;
        setSearchResults(results);
        if (!query.trim()) {
          setState((s) => ({ ...s, patients: results }));
        }
      } catch (error) {
        if (cancelled) return;
        setSearchResults([]);
        setSearchError(error?.message || 'Unable to fetch patients');
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, doctor?.userId]);

  const filtered = useMemo(() => {
    if (!query.trim()) return patients;
    return searchResults;
  }, [patients, query, searchResults]);

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
          <View style={styles.backRow}>
            <AppIcon name="back" size={18} color={colors.primary} />
            <Text style={[typography.titleMd, { color: colors.primary, marginLeft: spacing[1.5] }]}>Back</Text>
          </View>
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
            <AppIcon name="close" size={16} color={colors.outline} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          query.trim().length > 0 ? (
            <View style={styles.searchMetaRow}>
              {isSearching ? (
                <Text style={[typography.bodySm, { color: colors.outline }]}>Searching...</Text>
              ) : null}
              {searchError ? (
                <Text style={[typography.bodySm, { color: colors.error }]}>{searchError}</Text>
              ) : null}
            </View>
          ) : null
        }
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
  backBtn: { width: 72 },
  backRow: { flexDirection: 'row', alignItems: 'center' },
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
  searchMetaRow: {
    marginBottom: spacing[3],
    gap: spacing[1],
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
