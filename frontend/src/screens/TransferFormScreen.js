import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../theme';
import { LabeledInput, BPInput, VitalInput, SimpleDropdown } from '../components/Inputs';
import { PrimaryButton, SecondaryButton, CategoryButton, ToggleGroup } from '../components/Buttons';
import { MedCard } from '../components/Cards';
import { ConditionChip } from '../components/Badges';
import { getState, setState } from '../store';

const CONDITION_CATEGORIES = [
  { label: 'Cardiac',      emoji: '❤️' },
  { label: 'Neuro',        emoji: '🧠' },
  { label: 'Trauma',       emoji: '🩹' },
  { label: 'Obstetric',    emoji: '🤱' },
  { label: 'Respiratory',  emoji: '🫁' },
  { label: 'Renal',        emoji: '🫘' },
  { label: 'Neonatal',     emoji: '👶' },
  { label: 'Other',        emoji: '⚕️' },
];

const TRANSFER_REASONS = {
  Cardiac:     ['Needs cath lab', 'ICU bed', 'Cardiac surgery', 'Higher care'],
  Neuro:       ['CT/MRI needed', 'Neurosurgery', 'Stroke unit', 'Higher care'],
  Trauma:      ['Surgery needed', 'ICU bed', 'Burns unit', 'Ortho surgery'],
  Obstetric:   ['NICU needed', 'Level 3 care', 'Specialist OB', 'LSCS needed'],
  Respiratory: ['Ventilator needed', 'ICU bed', 'Pulmonology', 'Higher care'],
  Renal:       ['Dialysis needed', 'Nephrology', 'Transplant unit', 'Higher care'],
  Neonatal:    ['NICU bed', 'Paeds surgery', 'Higher neonatal care'],
  Other:       ['Higher care', 'Specialist needed', 'ICU bed'],
};

const INVESTIGATIONS = ['ECG', 'CBC', 'LFT', 'KFT', 'CT', 'MRI', 'Culture', 'Echo', 'Troponin', 'Other'];
const TRANSFER_MODES = ['Ambulance', 'Air', 'Private'];

const STEPS = ['Situation', 'Vitals', 'Condition', 'Medications', 'Summary'];

function ProgressBar({ step, total }) {
  return (
    <View style={styles.progressWrap}>
      <View style={[styles.progressTrack]}>
        <View style={[styles.progressFill, { width: `${((step) / total) * 100}%` }]} />
      </View>
      <Text style={[typography.labelMd, { color: colors.outline }]}>{step}/{total}</Text>
    </View>
  );
}

function StepHeader({ label }) {
  return (
    <Text style={[typography.headlineSm, { color: colors.onSurface, marginBottom: spacing[5] }]}>
      {label}
    </Text>
  );
}

export default function TransferFormScreen({ navigation, route }) {
  const { patientId } = route.params ?? {};
  const state = getState();
  const patient = state.patients.find((p) => p.id === patientId) ?? state.patients[0];

  const [currentStep, setCurrentStep] = useState(0);

  // Section 1 – Situation
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [transferReason, setTransferReason] = useState('');

  // Section 2 – Vitals
  const [bpSys, setBpSys] = useState('');
  const [bpDia, setBpDia] = useState('');
  const [hr, setHr] = useState('');
  const [spo2, setSpo2] = useState('');
  const [temp, setTemp] = useState('');
  const [rr, setRr] = useState('');
  const [gcs, setGcs] = useState('');
  const [bsl, setBsl] = useState('');

  // Section 3 – Condition specific (generic fields shown)
  const [condField1, setCondField1] = useState('');
  const [condField2, setCondField2] = useState('');
  const [condBool1, setCondBool1] = useState('');
  const [condBool2, setCondBool2] = useState('');

  // Section 4 – Medications
  const [activeMeds, setActiveMeds] = useState(patient?.medications ?? []);

  // Section 5 – Summary
  const [summary, setSummary] = useState('');
  const [investigations, setInvestigations] = useState([]);
  const [receivingHospital, setReceivingHospital] = useState('');
  const [transferMode, setTransferMode] = useState('');

  const isNeuro = category === 'Neuro';
  const isDiabetic = patient?.conditions?.includes('Diabetes');

  const toggleInvestigation = (inv) => {
    setInvestigations((prev) =>
      prev.includes(inv) ? prev.filter((i) => i !== inv) : [...prev, inv],
    );
  };

  const canProceed = () => {
    if (currentStep === 0) return !!category && !!severity && !!chiefComplaint;
    if (currentStep === 1) return !!bpSys && !!bpDia && !!hr && !!spo2;
    if (currentStep === 4) return !!summary && !!receivingHospital && !!transferMode;
    return true;
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep((s) => s + 1);
    else handleSubmit();
  };

  const handleSubmit = () => {
    // Check drug conflicts
    const allergenNames = patient?.allergies?.map((a) => a.allergen.toLowerCase()) ?? [];
    const conflict = activeMeds.find((m) =>
      allergenNames.some((al) => m.name.toLowerCase().includes(al.slice(0, 5))),
    );

    const transferId = 'TR-' + Date.now();
    const newTransfer = {
      id: transferId,
      patientId: patient.id,
      patientName: patient.name,
      direction: 'sent',
      conditionCategory: category,
      severity,
      diagnosis: chiefComplaint,
      to: receivingHospital,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      vitals: { bpSys, bpDia, hr, spo2, temp, rr },
      summary,
      investigations,
      transferMode,
      activeMeds,
    };

    setState((s) => ({
      ...s,
      transfers: [newTransfer, ...s.transfers],
      draftTransfer: newTransfer,
    }));

    if (conflict) {
      navigation.navigate('DrugConflict', { transferId, conflict, allergen: conflict.name });
    } else {
      navigation.navigate('QRDisplay', { transferId });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        {/* Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => {
            if (currentStep > 0) setCurrentStep((s) => s - 1);
            else navigation.goBack();
          }}>
            <Text style={[typography.titleMd, { color: colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={[typography.titleMd, { color: colors.onSurface }]}>New Transfer</Text>
            <Text style={[typography.bodySm, { color: colors.outline }]}>
              {patient?.name} · {patient?.sex} · {patient?.age}y
            </Text>
          </View>
          <View style={{ width: 60 }} />
        </View>

        <ProgressBar step={currentStep + 1} total={STEPS.length} />

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── STEP 1: Situation ── */}
          {currentStep === 0 && (
            <View>
              <StepHeader label="Situation" />
              <Text style={[typography.labelSm, { color: colors.outline, marginBottom: spacing[3] }]}>
                CONDITION CATEGORY
              </Text>
              <View style={styles.categoryGrid}>
                {CONDITION_CATEGORIES.map((c) => (
                  <CategoryButton
                    key={c.label}
                    label={c.label}
                    emoji={c.emoji}
                    selected={category === c.label}
                    onPress={() => { setCategory(c.label); setTransferReason(''); }}
                  />
                ))}
              </View>

              <Text style={[typography.labelSm, { color: colors.outline, marginTop: spacing[5], marginBottom: spacing[3] }]}>
                SEVERITY
              </Text>
              <ToggleGroup
                options={['Critical', 'Serious', 'Stable']}
                value={severity}
                onChange={setSeverity}
                colorMap={{ Critical: colors.critical, Serious: colors.serious, Stable: colors.stable }}
              />

              <View style={{ marginTop: spacing[5] }}>
                <LabeledInput
                  label="Chief Complaint"
                  value={chiefComplaint}
                  onChangeText={setChiefComplaint}
                  placeholder="e.g. Chest pain since 2 hours"
                  required
                />
              </View>

              {category ? (
                <SimpleDropdown
                  label="Reason for Transfer"
                  options={TRANSFER_REASONS[category] ?? TRANSFER_REASONS.Other}
                  value={transferReason}
                  onChange={setTransferReason}
                />
              ) : null}
            </View>
          )}

          {/* ── STEP 2: Vitals ── */}
          {currentStep === 1 && (
            <View>
              <StepHeader label="Vitals" />
              <BPInput systolic={bpSys} diastolic={bpDia}
                onChangeSystolic={setBpSys} onChangeDiastolic={setBpDia} />
              <VitalInput label="Heart Rate" value={hr} onChangeText={setHr}
                unit="bpm" rangePlaceholder="60–100"
                outOfRange={hr && (Number(hr) < 40 || Number(hr) > 180)} />
              <VitalInput label="SpO₂" value={spo2} onChangeText={setSpo2}
                unit="%" rangePlaceholder="95–100"
                outOfRange={spo2 && Number(spo2) < 90} />
              <VitalInput label="Temperature" value={temp} onChangeText={setTemp}
                unit="°F" rangePlaceholder="97–99" />
              <VitalInput label="Resp. Rate" value={rr} onChangeText={setRr}
                unit="/min" rangePlaceholder="12–20" />
              {(isNeuro || category === 'Trauma') && (
                <VitalInput label="GCS" value={gcs} onChangeText={setGcs}
                  unit="/15" rangePlaceholder="13–15"
                  outOfRange={gcs && Number(gcs) < 13} />
              )}
              {isDiabetic && (
                <VitalInput label="Blood Sugar" value={bsl} onChangeText={setBsl}
                  unit="mg/dL" rangePlaceholder="70–140"
                  outOfRange={bsl && (Number(bsl) < 60 || Number(bsl) > 400)} />
              )}
            </View>
          )}

          {/* ── STEP 3: Condition-specific ── */}
          {currentStep === 2 && (
            <View>
              <StepHeader label={category ? `${category} Details` : 'Condition Details'} />
              <LabeledInput label="Onset Time" value={condField1} onChangeText={setCondField1}
                placeholder="e.g. 10:30 AM" />
              <ToggleGroup
                options={['Yes', 'No']}
                value={condBool1}
                onChange={setCondBool1}
              />
              {condBool1 === 'Yes' && (
                <LabeledInput label="Findings" value={condField2} onChangeText={setCondField2}
                  placeholder="Describe findings…" multiline numberOfLines={3} />
              )}
              <ToggleGroup
                options={['Yes', 'No']}
                value={condBool2}
                onChange={setCondBool2}
              />
            </View>
          )}

          {/* ── STEP 4: Medications ── */}
          {currentStep === 3 && (
            <View>
              <StepHeader label="Active Medications" />
              <Text style={[typography.bodySm, { color: colors.outline, marginBottom: spacing[4] }]}>
                Pre-loaded from patient profile. Remove any not currently active.
              </Text>
              {activeMeds.map((m, i) => (
                <View key={i} style={{ position: 'relative' }}>
                  <MedCard
                    name={m.name} dose={m.dose} route={m.route}
                    frequency={m.frequency} mustNotStop={m.mustNotStop}
                  />
                  <TouchableOpacity
                    onPress={() => setActiveMeds((arr) => arr.filter((_, j) => j !== i))}
                    style={styles.removeMedBtn}
                  >
                    <Text style={{ color: colors.outline, fontSize: 16 }}>✕</Text>
                  </TouchableOpacity>
                  {/* Must not stop toggle */}
                  <TouchableOpacity
                    onPress={() => setActiveMeds((arr) => arr.map((med, j) =>
                      j === i ? { ...med, mustNotStop: !med.mustNotStop } : med
                    ))}
                    style={styles.mustNotStopToggle}
                  >
                    <Text style={[typography.labelMd, { color: m.mustNotStop ? colors.error : colors.outline }]}>
                      {m.mustNotStop ? '⚠ Must NOT stop' : 'Mark must not stop'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
              <SecondaryButton label="+ Add Medication" onPress={() => {}} />
            </View>
          )}

          {/* ── STEP 5: Summary ── */}
          {currentStep === 4 && (
            <View>
              <StepHeader label="Handoff Summary" />
              <LabeledInput
                label="Clinical Summary"
                value={summary}
                onChangeText={(t) => setSummary(t.slice(0, 900))}
                placeholder="Tap to type or use 🎤 to dictate…"
                multiline
                numberOfLines={5}
                required
              />
              <Text style={[typography.labelMd, {
                color: summary.length > 800 ? colors.error : colors.outline,
                textAlign: 'right', marginTop: -spacing[3], marginBottom: spacing[4],
              }]}>
                {summary.length} / 900 chars
              </Text>

              <Text style={[typography.labelSm, { color: colors.outline, marginBottom: spacing[3] }]}>
                PENDING INVESTIGATIONS
              </Text>
              <View style={styles.chipWrap}>
                {INVESTIGATIONS.map((inv) => (
                  <ConditionChip
                    key={inv}
                    label={inv}
                    selected={investigations.includes(inv)}
                    onPress={() => toggleInvestigation(inv)}
                  />
                ))}
              </View>

              <LabeledInput
                label="Receiving Hospital"
                value={receivingHospital}
                onChangeText={setReceivingHospital}
                placeholder="Search hospital name…"
                required
              />

              <Text style={[typography.labelSm, { color: colors.outline, marginBottom: spacing[3] }]}>
                MODE OF TRANSFER
              </Text>
              <ToggleGroup
                options={TRANSFER_MODES}
                value={transferMode}
                onChange={setTransferMode}
              />
              <View style={{ height: spacing[6] }} />
            </View>
          )}

          <View style={{ height: spacing[4] }} />

          <PrimaryButton
            label={currentStep < STEPS.length - 1 ? `Next: ${STEPS[currentStep + 1]} →` : 'Submit & Generate QR'}
            onPress={handleNext}
            disabled={!canProceed()}
          />
          <View style={{ height: spacing[8] }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: spacing[2],
  },
  progressWrap: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    paddingHorizontal: spacing[5], marginBottom: spacing[2],
  },
  progressTrack: {
    flex: 1, height: 4, backgroundColor: colors.surfaceContainerHighest, borderRadius: radius.full, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: radius.full },
  scroll: { paddingHorizontal: spacing[5], paddingTop: spacing[4] },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing[4] },
  removeMedBtn: { position: 'absolute', top: spacing[3], right: spacing[3] },
  mustNotStopToggle: {
    alignSelf: 'flex-start',
    marginTop: -spacing[2],
    marginBottom: spacing[3],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.full,
  },
});
