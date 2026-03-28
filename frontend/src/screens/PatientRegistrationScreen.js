import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../theme';
import { LabeledInput, SimpleDropdown } from '../components/Inputs';
import { PrimaryButton } from '../components/Buttons';
import { ConditionChip, AllergyChip } from '../components/Badges';
import { setState, getState } from '../store';

const BLOOD_GROUPS = ['O+', 'O-', 'B+', 'B-', 'A+', 'A-', 'AB+', 'AB-'];
const RELATIONS = ['Spouse', 'Parent', 'Child', 'Sibling', 'Friend', 'Other'];
const CHRONIC_CONDITIONS = [
  'Diabetes', 'Hypertension', 'Asthma', 'Heart Disease',
  'Kidney Disease', 'Epilepsy', 'None',
];
const COMMON_ALLERGENS = ['Penicillin', 'Aspirin', 'Sulfa drugs', 'NSAIDs', 'Latex', 'Iodine', 'Other'];

export default function PatientRegistrationScreen({ navigation }) {
  // Identity
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [phone, setPhone] = useState('');

  // Emergency contact
  const [ecName, setEcName] = useState('');
  const [ecPhone, setEcPhone] = useState('');
  const [ecRelation, setEcRelation] = useState('');

  // Allergies
  const [noAllergies, setNoAllergies] = useState(false);
  const [allergies, setAllergies] = useState([]);
  const [allergenDraft, setAllergenDraft] = useState('');
  const [reactionDraft, setReactionDraft] = useState('');

  // Conditions
  const [conditions, setConditions] = useState([]);

  // Medications
  const [noMeds, setNoMeds] = useState(false);
  const [medications, setMedications] = useState([]);
  const [medDraft, setMedDraft] = useState({ name: '', dose: '', route: '', frequency: '' });

  // Errors
  const [errors, setErrors] = useState({});

  const toggleCondition = (c) => {
    if (c === 'None') { setConditions([]); return; }
    setConditions((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  };

  const addAllergy = () => {
    if (!allergenDraft) return;
    setAllergies((a) => [...a, { allergen: allergenDraft, reaction: reactionDraft }]);
    setAllergenDraft('');
    setReactionDraft('');
  };

  const addMedication = () => {
    if (!medDraft.name) return;
    setMedications((m) => [...m, { ...medDraft, mustNotStop: false }]);
    setMedDraft({ name: '', dose: '', route: '', frequency: '' });
  };

  const validate = () => {
    const e = {};
    if (!name) e.name = 'Enter patient full name';
    if (!age) e.age = 'Enter age';
    if (!sex) e.sex = 'Select sex';
    if (!bloodGroup) e.bloodGroup = 'Select blood group';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const newPatient = {
      id: 'P' + Date.now(),
      name, age: Number(age), sex, bloodGroup, phone,
      emergencyContact: { name: ecName, phone: ecPhone, relation: ecRelation },
      allergies: noAllergies ? [] : allergies,
      conditions,
      medications: noMeds ? [] : medications,
    };
    setState((s) => ({ ...s, patients: [...s.patients, newPatient] }));
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[typography.titleMd, { color: colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[typography.headlineSm, { color: colors.onSurface }]}>Register Patient</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Identity */}
          <SectionHeader label="IDENTITY" />
          <LabeledInput label="Full Name" value={name} onChangeText={setName}
            placeholder="Patient's full name" required autoFocus error={errors.name} />
          <LabeledInput label="Age" value={age} onChangeText={(t) => setAge(t.replace(/\D/g, ''))}
            placeholder="e.g. 45" keyboardType="numeric" required error={errors.age} />

          {/* Sex toggle */}
          <View style={styles.fieldWrap}>
            <View style={styles.labelRow}>
              <Text style={[typography.labelMd, { color: colors.onSurfaceVariant }]}>Sex</Text>
              <View style={styles.requiredDot} />
            </View>
            <View style={styles.toggleRow}>
              {['M', 'F', 'Other'].map((opt) => (
                <TouchableOpacity key={opt} onPress={() => setSex(opt)}
                  style={[styles.toggleBtn, sex === opt && styles.toggleBtnSelected]}>
                  <Text style={[typography.titleSm, { color: sex === opt ? colors.onPrimary : colors.onSurfaceVariant }]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.sex ? <Text style={styles.errorText}>{errors.sex}</Text> : null}
          </View>

          <SimpleDropdown label="Blood Group" options={BLOOD_GROUPS} value={bloodGroup}
            onChange={setBloodGroup} required />
          <LabeledInput label="Phone" value={phone} onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))}
            placeholder="Mobile number" keyboardType="phone-pad" />

          {/* Emergency Contact */}
          <SectionHeader label="EMERGENCY CONTACT" />
          <LabeledInput label="Name" value={ecName} onChangeText={setEcName} placeholder="Contact name" />
          <LabeledInput label="Phone" value={ecPhone}
            onChangeText={(t) => setEcPhone(t.replace(/\D/g, '').slice(0, 10))}
            placeholder="Contact number" keyboardType="phone-pad" />
          <SimpleDropdown label="Relation" options={RELATIONS} value={ecRelation} onChange={setEcRelation} />

          {/* Allergies */}
          <SectionHeader label="ALLERGIES" />
          <TouchableOpacity onPress={() => setNoAllergies(!noAllergies)} style={styles.checkRow}>
            <View style={[styles.checkbox, noAllergies && styles.checkboxChecked]}>
              {noAllergies && <Text style={{ color: colors.onPrimary, fontSize: 12 }}>✓</Text>}
            </View>
            <Text style={[typography.bodyMd, { color: colors.onSurface }]}>No known allergies</Text>
          </TouchableOpacity>

          {!noAllergies && (
            <>
              <View style={styles.chipWrap}>
                {allergies.map((a, i) => (
                  <AllergyChip
                    key={i}
                    label={`${a.allergen}${a.reaction ? ` → ${a.reaction}` : ''}`}
                    onRemove={() => setAllergies((arr) => arr.filter((_, j) => j !== i))}
                  />
                ))}
              </View>
              <SimpleDropdown label="" options={COMMON_ALLERGENS}
                value={allergenDraft} onChange={setAllergenDraft} />
              <LabeledInput label="Reaction" value={reactionDraft} onChangeText={setReactionDraft}
                placeholder="e.g. Anaphylaxis" />
              <TouchableOpacity onPress={addAllergy} style={styles.addBtn}>
                <Text style={[typography.titleSm, { color: colors.primary }]}>+ Add Allergy</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Chronic Conditions */}
          <SectionHeader label="CHRONIC CONDITIONS" />
          <View style={styles.chipWrap}>
            {CHRONIC_CONDITIONS.map((c) => (
              <ConditionChip
                key={c}
                label={c}
                selected={conditions.includes(c)}
                onPress={() => toggleCondition(c)}
              />
            ))}
          </View>

          {/* Medications */}
          <SectionHeader label="PERMANENT MEDICATIONS" />
          <TouchableOpacity onPress={() => setNoMeds(!noMeds)} style={styles.checkRow}>
            <View style={[styles.checkbox, noMeds && styles.checkboxChecked]}>
              {noMeds && <Text style={{ color: colors.onPrimary, fontSize: 12 }}>✓</Text>}
            </View>
            <Text style={[typography.bodyMd, { color: colors.onSurface }]}>No regular medications</Text>
          </TouchableOpacity>

          {!noMeds && (
            <>
              {medications.map((m, i) => (
                <View key={i} style={styles.medRow}>
                  <Text style={[typography.titleSm, { color: colors.onSurface, flex: 1 }]}>
                    {m.name} · {m.dose} · {m.route}
                  </Text>
                  <TouchableOpacity onPress={() => setMedications((arr) => arr.filter((_, j) => j !== i))}>
                    <Text style={{ color: colors.error }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <LabeledInput label="Drug Name" value={medDraft.name}
                onChangeText={(t) => setMedDraft((d) => ({ ...d, name: t }))} placeholder="e.g. Metoprolol" />
              <LabeledInput label="Dose" value={medDraft.dose}
                onChangeText={(t) => setMedDraft((d) => ({ ...d, dose: t }))} placeholder="e.g. 25mg" />
              <LabeledInput label="Route" value={medDraft.route}
                onChangeText={(t) => setMedDraft((d) => ({ ...d, route: t }))} placeholder="e.g. Oral" />
              <LabeledInput label="Frequency" value={medDraft.frequency}
                onChangeText={(t) => setMedDraft((d) => ({ ...d, frequency: t }))} placeholder="e.g. Twice daily" />
              <TouchableOpacity onPress={addMedication} style={styles.addBtn}>
                <Text style={[typography.titleSm, { color: colors.primary }]}>+ Add Medication</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={{ height: spacing[8] }} />
          <PrimaryButton label="Save Patient" onPress={handleSave} />
          <View style={{ height: spacing[8] }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SectionHeader({ label }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[typography.labelSm, { color: colors.outline }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: spacing[3],
  },
  scroll: { paddingHorizontal: spacing[5], paddingTop: spacing[2] },
  sectionHeader: {
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.sm,
    marginBottom: spacing[4],
    marginTop: spacing[2],
  },
  fieldWrap: { marginBottom: spacing[5] },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing[1.5], gap: 4 },
  requiredDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.error },
  toggleRow: { flexDirection: 'row', gap: spacing[2] },
  toggleBtn: {
    flex: 1, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLowest,
  },
  toggleBtnSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  errorText: { color: colors.error, fontSize: 13, marginTop: 4 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], marginBottom: spacing[4] },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    borderColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.primary },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing[3] },
  addBtn: {
    paddingVertical: spacing[3], alignItems: 'center',
    borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.primary,
    marginBottom: spacing[4],
  },
  medRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md, padding: spacing[3], marginBottom: spacing[2],
  },
});
