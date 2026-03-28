import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../theme';
import { LabeledInput, BPInput, VitalInput, SimpleDropdown } from '../components/Inputs';
import { PrimaryButton, SecondaryButton, CategoryButton, ToggleGroup } from '../components/Buttons';
import { MedCard } from '../components/Cards';
import { ConditionChip } from '../components/Badges';
import { AppIcon } from '../components/AppIcon';
import { getState, setState } from '../store';
import { createTransfer } from '../api/transfers';
import { extractTransferDetailsFromImage } from '../api/ocr';
import { getStoredDoctorId } from '../storage/authStorage';

const CONDITION_CATEGORIES = [
  { label: 'Cardiac' },
  { label: 'Neuro' },
  { label: 'Trauma' },
  { label: 'Obstetric' },
  { label: 'Respiratory' },
  { label: 'Renal' },
  { label: 'Neonatal' },
  { label: 'Other' },
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
const TRANSFER_MODES = ['Ambulance', 'Air', 'Private Vehicle'];
const MED_ROUTES = ['Oral', 'IV', 'IM'];

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

function normalizeMedicationRoute(route) {
  const value = String(route || '').trim().toLowerCase();
  if (value === 'oral') return 'Oral';
  if (value === 'iv') return 'IV';
  if (value === 'im') return 'IM';
  return '';
}

function parseBp(value) {
  const bp = String(value || '').trim();
  if (!bp.includes('/')) return { sys: '', dia: '' };
  const [sysRaw, diaRaw] = bp.split('/');
  return {
    sys: String(sysRaw || '').replace(/\D/g, ''),
    dia: String(diaRaw || '').replace(/\D/g, ''),
  };
}

function hasText(value) {
  return String(value || '').trim().length > 0;
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

  // Section 3 – Condition specific
  // Cardiac
  const [cardiacOnsetTime, setCardiacOnsetTime] = useState('');
  const [cardiacEcgDone, setCardiacEcgDone] = useState('');
  const [cardiacEcgFindings, setCardiacEcgFindings] = useState('');
  const [cardiacThrombolysis, setCardiacThrombolysis] = useState('');

  // Neuro
  const [neuroOnsetTime, setNeuroOnsetTime] = useState('');
  const [neuroStrokeType, setNeuroStrokeType] = useState('');
  const [neuroCtDone, setNeuroCtDone] = useState('');
  const [neuroCtFindings, setNeuroCtFindings] = useState('');
  const [neuroSeizureActive, setNeuroSeizureActive] = useState('');

  // Obstetric
  const [obsGestationalAge, setObsGestationalAge] = useState('');
  const [obsRhFactor, setObsRhFactor] = useState('');
  const [obsFetalHr, setObsFetalHr] = useState('');
  const [obsHighRiskReason, setObsHighRiskReason] = useState('');

  // Respiratory
  const [respOxygenRequired, setRespOxygenRequired] = useState('');
  const [respOnVentilator, setRespOnVentilator] = useState('');
  const [respVentilatorSettings, setRespVentilatorSettings] = useState('');

  // Renal
  const [renalUrineOutput, setRenalUrineOutput] = useState('');
  const [renalOnDialysis, setRenalOnDialysis] = useState('');
  const [renalCreatinine, setRenalCreatinine] = useState('');

  // Trauma
  const [traumaMechanism, setTraumaMechanism] = useState('');
  const [traumaMajorInjuries, setTraumaMajorInjuries] = useState('');
  const [traumaSurgeryNeeded, setTraumaSurgeryNeeded] = useState('');

  // Neonatal
  const [neoGestationalAge, setNeoGestationalAge] = useState('');
  const [neoBirthWeight, setNeoBirthWeight] = useState('');
  const [neoApgarScore, setNeoApgarScore] = useState('');
  const [neoDeliveryType, setNeoDeliveryType] = useState('');
  const [otherClinicalDetails, setOtherClinicalDetails] = useState('');

  // Section 4 – Medications
  const [activeMeds, setActiveMeds] = useState(patient?.medications ?? []);
  const [medDraft, setMedDraft] = useState({ name: '', dose: '', route: '', frequency: '' });

  // Section 5 – Summary
  const [summary, setSummary] = useState('');
  const [investigations, setInvestigations] = useState([]);
  const [receivingHospital, setReceivingHospital] = useState('');
  const [transferMode, setTransferMode] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractStatus, setExtractStatus] = useState('');

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

  const handleAddMedication = () => {
    const name = String(medDraft.name || '').trim();
    const dose = String(medDraft.dose || '').trim();
    const route = normalizeMedicationRoute(medDraft.route);
    const frequency = String(medDraft.frequency || '').trim();

    if (!name || !dose || !route) {
      setSubmitError('Medication name, dose, and route are required.');
      return;
    }

    setActiveMeds((prev) => [
      ...prev,
      {
        name,
        dose,
        route,
        frequency,
        mustNotStop: false,
      },
    ]);

    setMedDraft({ name: '', dose: '', route: '', frequency: '' });
    setSubmitError('');
  };

  const handleSubmit = async () => {
    // Check drug conflicts
    const allergenNames = patient?.allergies?.map((a) => a.allergen.toLowerCase()) ?? [];
    const conflict = activeMeds.find((m) =>
      allergenNames.some((al) => m.name.toLowerCase().includes(al.slice(0, 5))),
    );

    try {
      setSubmitError('');

      const doctorId = state?.doctor?.userId || await getStoredDoctorId();
      const doctorName = state?.doctor?.name || 'Doctor';
      const sendingHospital = state?.doctor?.hospital || 'Unknown Hospital';

      if (!doctorId) {
        setSubmitError('Login required. Please login again.');
        return;
      }

      if (!patient?.id) {
        setSubmitError('Patient not found. Please reload and try again.');
        return;
      }

      const { transfer, qrPayload } = await createTransfer({
        patientId: patient.id,
        sendingHospital,
        receivingHospital,
        doctorName,
        chiefComplaint,
        conditionCategory: category,
        severity,
        reasonForTransfer: transferReason || 'Higher care',
        vitals: {
          bp: bpSys && bpDia ? `${bpSys}/${bpDia}` : '',
          hr: hr ? Number(hr) : undefined,
          spo2: spo2 ? Number(spo2) : undefined,
          temp: temp ? Number(temp) : undefined,
          rr: rr ? Number(rr) : undefined,
          gcs: gcs ? Number(gcs) : undefined,
          bloodSugar: bsl ? Number(bsl) : undefined,
        },
        activeMedications: activeMeds.map((med) => ({
          name: String(med?.name || '').trim(),
          dose: String(med?.dose || '').trim(),
          route: normalizeMedicationRoute(med?.route),
          frequency: String(med?.frequency || '').trim(),
          mustNotStop: Boolean(med?.mustNotStop),
          lastGivenAt: med?.lastGivenAt ? String(med.lastGivenAt).trim() : undefined,
        })).filter((med) => med.name && med.dose && med.route),
        clinicalSummary: summary,
        pendingInvestigations: investigations,
        modeOfTransfer: transferMode,
      });

      setState((s) => ({
        ...s,
        transfers: [transfer, ...s.transfers],
        draftTransfer: transfer,
      }));

      if (conflict) {
        navigation.navigate('DrugConflict', { transferId: transfer.id, conflict, allergen: conflict.name });
      } else {
        navigation.navigate('QRDisplay', { transferId: transfer.id, qrPayload });
      }
    } catch (error) {
      setSubmitError(error?.message || 'Failed to create transfer');
    }
  };

  const handleExtractFromImage = async () => {
    try {
      setSubmitError('');
      setExtractStatus('');

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setSubmitError('Media library permission is required to select an image.');
        return;
      }

      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (picked.canceled || !picked.assets?.[0]) {
        return;
      }

      setIsExtracting(true);
      const extracted = await extractTransferDetailsFromImage(picked.assets[0]);
      const raw = String(extracted?.rawText || '').trim();
      const parsed = extracted?.parsed && typeof extracted.parsed === 'object' ? extracted.parsed : {};

      const parsedChiefComplaint = String(parsed?.chiefComplaint || '').trim();
      const parsedCategory = String(parsed?.conditionCategory || '').trim();
      const parsedSeverity = String(parsed?.severity || '').trim();
      const parsedReason = String(parsed?.reasonForTransfer || '').trim();
      const parsedSummary = String(parsed?.clinicalSummary || '').trim();
      const parsedReceivingHospital = String(parsed?.receivingHospital || '').trim();

      if (parsedChiefComplaint && !hasText(chiefComplaint)) {
        setChiefComplaint(parsedChiefComplaint.slice(0, 120));
      }

      if (!hasText(category) && parsedCategory && CONDITION_CATEGORIES.some((c) => c.label === parsedCategory)) {
        setCategory(parsedCategory);
      }

      if (!hasText(severity) && parsedSeverity && ['Critical', 'Serious', 'Stable'].includes(parsedSeverity)) {
        setSeverity(parsedSeverity);
      }

      if (parsedReason && !hasText(transferReason)) {
        setTransferReason(parsedReason);
      }

      if (!hasText(summary)) {
        if (parsedSummary) {
          setSummary(parsedSummary.slice(0, 900));
        } else if (raw) {
          setSummary(raw.slice(0, 900));
        }
      }

      if (parsedReceivingHospital && !hasText(receivingHospital)) {
        setReceivingHospital(parsedReceivingHospital);
      }

      const parsedVitals = parsed?.vitals && typeof parsed.vitals === 'object' ? parsed.vitals : {};
      const { sys, dia } = parseBp(parsedVitals?.bp);
      if (!hasText(bpSys) && sys) setBpSys(sys);
      if (!hasText(bpDia) && dia) setBpDia(dia);
      if (!hasText(hr) && parsedVitals?.hr != null) setHr(String(parsedVitals.hr));
      if (!hasText(spo2) && parsedVitals?.spo2 != null) setSpo2(String(parsedVitals.spo2));
      if (!hasText(temp) && parsedVitals?.temp != null) setTemp(String(parsedVitals.temp));
      if (!hasText(rr) && parsedVitals?.rr != null) setRr(String(parsedVitals.rr));
      if (!hasText(gcs) && parsedVitals?.gcs != null) setGcs(String(parsedVitals.gcs));
      if (!hasText(bsl) && parsedVitals?.bloodSugar != null) setBsl(String(parsedVitals.bloodSugar));

      const parsedMeds = Array.isArray(parsed?.activeMedications) ? parsed.activeMedications : [];
      const mappedMeds = parsedMeds.map((med) => ({
        name: String(med?.name || '').trim(),
        dose: String(med?.dose || '').trim(),
        route: normalizeMedicationRoute(med?.route),
        frequency: String(med?.frequency || '').trim(),
        mustNotStop: Boolean(med?.mustNotStop),
      })).filter((med) => med.name || med.dose || med.route || med.frequency);

      if (mappedMeds.length > 0 && (!Array.isArray(activeMeds) || activeMeds.length === 0)) {
        setActiveMeds(mappedMeds);
      }

      const parsedInvestigations = Array.isArray(parsed?.pendingInvestigations)
        ? parsed.pendingInvestigations
          .map((item) => String(item || '').trim())
          .filter(Boolean)
        : [];
      const recognizedInvestigations = parsedInvestigations.filter((item) => INVESTIGATIONS.includes(item));
      if (recognizedInvestigations.length > 0 && (!Array.isArray(investigations) || investigations.length === 0)) {
        setInvestigations(recognizedInvestigations);
      }

      setExtractStatus('Details extracted from image. Please review and adjust before submitting.');
    } catch (error) {
      setSubmitError(error?.message || 'Failed to extract details from image');
    } finally {
      setIsExtracting(false);
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
          }} style={styles.backBtn}>
            <AppIcon name="back" size={18} color={colors.primary} />
            <Text style={[typography.titleMd, { color: colors.primary, marginLeft: spacing[1.5] }]}>Back</Text>
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

          <View style={styles.extractWrap}>
            <SecondaryButton
              label={isExtracting ? 'Extracting From Image...' : 'Extract Details From Image'}
              onPress={handleExtractFromImage}
              disabled={isExtracting}
            />
            {extractStatus ? (
              <Text style={[typography.bodySm, { color: '#1a6640', marginTop: spacing[2] }]}>
                {extractStatus}
              </Text>
            ) : null}
          </View>

          {/* ── STEP 1: Situation ── */}
          {currentStep === 0 && (
            <View>
              <StepHeader label="Situation" />
              <Text style={[typography.labelSm, { color: colors.outline, marginBottom: spacing[3] }]}>
                CONDITION CATEGORY
              </Text>
              <View style={styles.categoryGrid}>
                {CONDITION_CATEGORIES.map((c) => (
                  <View key={c.label} style={styles.categoryButtonWrapper}>
                    <CategoryButton
                      label={c.label}
                      selected={category === c.label}
                      onPress={() => { setCategory(c.label); setTransferReason(''); }}
                    />
                  </View>
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

              {/* CARDIAC */}
              {category === 'Cardiac' && (
                <View>
                  <LabeledInput label="Symptom Onset Time" value={cardiacOnsetTime} 
                    onChangeText={setCardiacOnsetTime} placeholder="e.g. 10:30 AM" />
                  <Text style={styles.conditionFieldLabel}>ECG Done</Text>
                  <ToggleGroup options={['Yes', 'No']} value={cardiacEcgDone} onChange={setCardiacEcgDone} />
                  {cardiacEcgDone === 'Yes' && (
                    <LabeledInput label="ECG Findings" value={cardiacEcgFindings} 
                      onChangeText={setCardiacEcgFindings} placeholder="Describe ECG findings…" 
                      multiline numberOfLines={3} />
                  )}
                  <Text style={styles.conditionFieldLabel}>Thrombolysis Given</Text>
                  <ToggleGroup options={['Yes', 'No']} value={cardiacThrombolysis} onChange={setCardiacThrombolysis} />
                </View>
              )}

              {/* NEURO */}
              {category === 'Neuro' && (
                <View>
                  <LabeledInput label="Symptom Onset Time" value={neuroOnsetTime} 
                    onChangeText={setNeuroOnsetTime} placeholder="e.g. 10:30 AM" />
                  <Text style={styles.conditionFieldLabel}>Stroke Type</Text>
                  <ToggleGroup options={['Ischemic', 'Hemorrhagic', 'Unknown']} 
                    value={neuroStrokeType} onChange={setNeuroStrokeType} />
                  <Text style={styles.conditionFieldLabel}>CT Done</Text>
                  <ToggleGroup options={['Yes', 'No']} value={neuroCtDone} onChange={setNeuroCtDone} />
                  {neuroCtDone === 'Yes' && (
                    <LabeledInput label="CT Findings" value={neuroCtFindings} 
                      onChangeText={setNeuroCtFindings} placeholder="Describe CT findings…" 
                      multiline numberOfLines={3} />
                  )}
                  <Text style={styles.conditionFieldLabel}>Seizure Active</Text>
                  <ToggleGroup options={['Yes', 'No']} value={neuroSeizureActive} onChange={setNeuroSeizureActive} />
                </View>
              )}

              {/* OBSTETRIC */}
              {category === 'Obstetric' && (
                <View>
                  <VitalInput label="Gestational Age" value={obsGestationalAge} 
                    onChangeText={setObsGestationalAge} unit="weeks" rangePlaceholder="24–42" />
                  <Text style={styles.conditionFieldLabel}>Rh Factor</Text>
                  <ToggleGroup options={['Positive', 'Negative']} value={obsRhFactor} onChange={setObsRhFactor} />
                  <VitalInput label="Fetal Heart Rate" value={obsFetalHr} 
                    onChangeText={setObsFetalHr} unit="bpm" rangePlaceholder="120–160" />
                  <SimpleDropdown label="High Risk Reason" 
                    options={['Eclampsia', 'Placenta Previa', 'Abruption', 'Preeclampsia', 'Other']}
                    value={obsHighRiskReason} onChange={setObsHighRiskReason} />
                </View>
              )}

              {/* RESPIRATORY */}
              {category === 'Respiratory' && (
                <View>
                  <LabeledInput label="Oxygen Required" value={respOxygenRequired} 
                    onChangeText={setRespOxygenRequired} placeholder="e.g. 4L via mask" />
                  <Text style={styles.conditionFieldLabel}>On Ventilator</Text>
                  <ToggleGroup options={['Yes', 'No']} value={respOnVentilator} onChange={setRespOnVentilator} />
                  {respOnVentilator === 'Yes' && (
                    <LabeledInput label="Ventilator Settings" value={respVentilatorSettings} 
                      onChangeText={setRespVentilatorSettings} placeholder="e.g. AC/VC 500/16" 
                      multiline numberOfLines={2} />
                  )}
                </View>
              )}

              {/* RENAL */}
              {category === 'Renal' && (
                <View>
                  <VitalInput label="Urine Output" value={renalUrineOutput} 
                    onChangeText={setRenalUrineOutput} unit="ml/hr" rangePlaceholder="0–200" />
                  <Text style={styles.conditionFieldLabel}>On Dialysis</Text>
                  <ToggleGroup options={['Yes', 'No']} value={renalOnDialysis} onChange={setRenalOnDialysis} />
                  <VitalInput label="Last Creatinine" value={renalCreatinine} 
                    onChangeText={setRenalCreatinine} unit="mg/dL" rangePlaceholder="0.7–1.3" />
                </View>
              )}

              {/* TRAUMA */}
              {category === 'Trauma' && (
                <View>
                  <SimpleDropdown label="Mechanism of Injury" 
                    options={['RTA', 'Fall', 'Assault', 'Penetrating', 'Crush', 'Burn', 'Other']}
                    value={traumaMechanism} onChange={setTraumaMechanism} />
                  <LabeledInput label="Major Injuries" value={traumaMajorInjuries} 
                    onChangeText={setTraumaMajorInjuries} placeholder="Describe major injuries…" 
                    multiline numberOfLines={3} />
                  <Text style={styles.conditionFieldLabel}>Surgery Needed</Text>
                  <ToggleGroup options={['Yes', 'No']} value={traumaSurgeryNeeded} onChange={setTraumaSurgeryNeeded} />
                </View>
              )}

              {/* NEONATAL */}
              {category === 'Neonatal' && (
                <View>
                  <VitalInput label="Gestational Age" value={neoGestationalAge} 
                    onChangeText={setNeoGestationalAge} unit="weeks" rangePlaceholder="24–42" />
                  <VitalInput label="Birth Weight" value={neoBirthWeight} 
                    onChangeText={setNeoBirthWeight} unit="grams" rangePlaceholder="500–5000" />
                  <VitalInput label="APGAR Score" value={neoApgarScore} 
                    onChangeText={setNeoApgarScore} unit="/10" rangePlaceholder="0–10" />
                  <Text style={styles.conditionFieldLabel}>Delivery Type</Text>
                  <ToggleGroup options={['Normal', 'LSCS']} value={neoDeliveryType} onChange={setNeoDeliveryType} />
                </View>
              )}

              {/* OTHER */}
              {!['Cardiac', 'Neuro', 'Obstetric', 'Respiratory', 'Renal', 'Trauma', 'Neonatal'].includes(category) && category && (
                <View>
                  <LabeledInput label="Clinical Details" value={otherClinicalDetails} 
                    onChangeText={setOtherClinicalDetails} placeholder="Describe clinical details…" 
                    multiline numberOfLines={4} />
                </View>
              )}
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
                    frequency={m.frequency} mustNotStop={m.mustNotStop} showMustNotStopBadge={false}
                  />
                  <TouchableOpacity
                    onPress={() => setActiveMeds((arr) => arr.filter((_, j) => j !== i))}
                    style={styles.removeMedBtn}
                  >
                    <AppIcon name="close" size={16} color={colors.outline} />
                  </TouchableOpacity>
                  {/* Must not stop toggle */}
                  <TouchableOpacity
                    onPress={() => setActiveMeds((arr) => arr.map((med, j) =>
                      j === i ? { ...med, mustNotStop: !med.mustNotStop } : med
                    ))}
                    style={styles.mustNotStopToggle}
                  >
                    <View style={styles.mustNotStopRow}>
                      {m.mustNotStop ? <AppIcon name="warning" size={14} color={colors.error} /> : null}
                      <Text style={[typography.labelMd, { color: m.mustNotStop ? colors.error : colors.outline, marginLeft: m.mustNotStop ? spacing[1.5] : 0 }]}> 
                        {m.mustNotStop ? 'Must NOT stop' : 'Mark must not stop'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}

              <LabeledInput
                label="Drug Name"
                value={medDraft.name}
                onChangeText={(text) => setMedDraft((prev) => ({ ...prev, name: text }))}
                placeholder="e.g. Aspirin"
              />
              <LabeledInput
                label="Dose"
                value={medDraft.dose}
                onChangeText={(text) => setMedDraft((prev) => ({ ...prev, dose: text }))}
                placeholder="e.g. 75 mg"
              />
              <SimpleDropdown
                label="Route"
                options={MED_ROUTES}
                value={medDraft.route}
                onChange={(value) => setMedDraft((prev) => ({ ...prev, route: value }))}
              />
              <LabeledInput
                label="Frequency"
                value={medDraft.frequency}
                onChangeText={(text) => setMedDraft((prev) => ({ ...prev, frequency: text }))}
                placeholder="e.g. Once daily"
              />
              <SecondaryButton label="+ Add Medication" onPress={handleAddMedication} />
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
                placeholder="Tap to type or use mic to dictate..."
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

          {submitError ? (
            <Text style={[typography.bodySm, { color: colors.error, marginBottom: spacing[3] }]}>
              {submitError}
            </Text>
          ) : null}

          <PrimaryButton
            label={currentStep < STEPS.length - 1 ? `Next: ${STEPS[currentStep + 1]}` : 'Submit & Generate QR'}
            iconName={currentStep < STEPS.length - 1 ? 'chevron-right' : undefined}
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
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  progressWrap: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    paddingHorizontal: spacing[5], marginBottom: spacing[2],
  },
  progressTrack: {
    flex: 1, height: 4, backgroundColor: colors.surfaceContainerHighest, borderRadius: radius.full, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: radius.full },
  scroll: { paddingHorizontal: spacing[5], paddingTop: spacing[4] },
  extractWrap: { marginBottom: spacing[4] },
  categoryGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: spacing[3],
    justifyContent: 'space-between',
  },
  categoryButtonWrapper: {
    width: '31%',
    aspectRatio: 1,
  },
  conditionFieldLabel: {
    ...typography.labelSm,
    color: colors.outline,
    marginTop: spacing[3],
    marginBottom: spacing[2],
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing[4] },
  removeMedBtn: { position: 'absolute', top: spacing[3], right: spacing[3] },
  mustNotStopToggle: {
    alignSelf: 'flex-start',
    marginTop: 0,
    marginBottom: spacing[3],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.full,
  },
  mustNotStopRow: { flexDirection: 'row', alignItems: 'center' },
});
