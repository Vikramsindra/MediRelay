# Route Parameters & Boolean/String Mismatch Analysis

## Overview
This document identifies all places where route params are used, particularly focusing on boolean values that could be passed as strings through the navigation stack.

---

## 1. UNUSED BOOLEAN PARAMETER

### Issue: `_goToMeds` boolean not being used

**File:** [src/screens/DrugConflictScreen.js](src/screens/DrugConflictScreen.js#L82)
**Line:** 82
```javascript
navigation.navigate('TransferForm', {
  patientId: transfer?.patientId,
  _goToMeds: true,  // ⚠️ Boolean value passed here
})
```

**File:** [src/screens/TransferFormScreen.js](src/screens/TransferFormScreen.js#L61)
**Line:** 61
```javascript
const { patientId } = route.params ?? {};  // ⚠️ _goToMeds is NOT extracted!
```

**Expected:** TransferFormScreen should extract `_goToMeds` and skip directly to step 3 (Medications)
**Current Behavior:** Parameter is ignored; flow always starts from step 0

---

## 2. STRING-TO-BOOLEAN CONVERSIONS (Already Handled)

These locations have proper string-to-boolean coercion logic already in place:

### MedCard Component
**File:** [src/components/Cards.js](src/components/Cards.js#L118)
**Line:** 116-118
```javascript
export function MedCard({ name, dose, route, frequency, mustNotStop, lastGiven }) {
  // Coerce mustNotStop to boolean in case it comes through as string
  const isMustStop = typeof mustNotStop === 'string' ? mustNotStop === 'true' : !!mustNotStop;
```

**Risk:** The `mustNotStop` prop receives medication objects from transfer data where this property could have been serialized as a string.

### TransferFormScreen
**File:** [src/screens/TransferFormScreen.js](src/screens/TransferFormScreen.js#L93)
**Line:** 93-95
```javascript
const ensureBooleanMeds = (meds) => (meds || []).map(m => ({
  ...m,
  mustNotStop: typeof m.mustNotStop === 'string' ? m.mustNotStop === 'true' : !!m.mustNotStop
}));
```

**Usage:** Line 96 - applied to initial medications from patient profile
```javascript
const [activeMeds, setActiveMeds] = useState(ensureBooleanMeds(patient?.medications ?? []));
```

**Additional Issue:** Line 318 - toggles medication's mustNotStop but also coerces inline:
**File:** [src/screens/TransferFormScreen.js](src/screens/TransferFormScreen.js#L318-L322)
**Lines:** 318-322
```javascript
onPress={() => setActiveMeds((arr) => arr.map((med, j) => {
  const isMustStop = typeof med.mustNotStop === 'string' ? med.mustNotStop === 'true' : !!med.mustNotStop;
  return j === i ? { ...med, mustNotStop: !isMustStop } : med;
}))}
```

### RecordViewerScreen
**File:** [src/screens/RecordViewerScreen.js](src/screens/RecordViewerScreen.js#L17-L22)
**Lines:** 17-22
```javascript
// Ensure activeMeds have proper boolean values
const ensureBooleanMeds = (meds) => (meds || []).map(m => ({
  ...m,
  mustNotStop: typeof m.mustNotStop === 'string' ? m.mustNotStop === 'true' : !!m.mustNotStop
}));
```

**Usage:** Line 32 - applied to medications from transfer record
```javascript
const activeMeds = ensureBooleanMeds(transfer?.activeMeds ?? patient?.medications ?? []);
```

---

## 3. ROUTE PARAMS EXTRACTION PATTERNS

### Simple String Parameters (Safe)

| File | Line | Pattern | Usage |
|------|------|---------|-------|
| [DrugConflictScreen.js](src/screens/DrugConflictScreen.js#L13) | 13 | `const { transferId, conflict } = route.params ?? {};` | Read from params |
| [TransferFormScreen.js](src/screens/TransferFormScreen.js#L61) | 61 | `const { patientId } = route.params ?? {};` | Read from params |
| [RecordViewerScreen.js](src/screens/RecordViewerScreen.js#L15) | 15 | `const { transferId } = route.params ?? {};` | Read from params |
| [QRDisplayScreen.js](src/screens/QRDisplayScreen.js#L46) | 46 | `const { transferId } = route.params ?? {};` | Read from params |
| [QRScannerScreen.js](src/screens/QRScannerScreen.js#L28) | 28 | `const mode = route?.params?.mode;` | Checked against 'paste' string |

---

## 4. NAVIGATION.NAVIGATE() CALLS PASSING DATA

All locations where params are passed through navigation stack:

### HomeScreen
**File:** [src/screens/HomeScreen.js](src/screens/HomeScreen.js#L70)
**Line:** 70
```javascript
navigation.navigate('PatientList', { mode: 'transfer' })  // String param
```

**File:** [src/screens/HomeScreen.js](src/screens/HomeScreen.js#L96)
**Line:** 96
```javascript
navigation.navigate('QRScanner', { mode: 'paste' })  // String param
```

**File:** [src/screens/HomeScreen.js](src/screens/HomeScreen.js#L118)
**Lines:** Inline navigation in TransferCard onPress
```javascript
onPress={() => navigation.navigate('RecordViewer', { transferId: t.id })}
```

**File:** [src/screens/HomeScreen.js](src/screens/HomeScreen.js#L137)
**Lines:** Inline navigation in TransferCard onPress
```javascript
onPress={() => navigation.navigate('QRDisplay', { transferId: t.id })}
```

### HistoryScreen
**File:** [src/screens/HistoryScreen.js](src/screens/HistoryScreen.js#L86-L87)
**Lines:** 86-87
```javascript
if (t.direction === 'sent') navigation.navigate('QRDisplay', { transferId: t.id });
else navigation.navigate('RecordViewer', { transferId: t.id });
```

### DrugConflictScreen
**File:** [src/screens/DrugConflictScreen.js](src/screens/DrugConflictScreen.js#L80-L84)
**Lines:** 80-84
```javascript
navigation.navigate('TransferForm', {
  patientId: transfer?.patientId,
  _goToMeds: true,  // ⚠️ BOOLEAN LITERAL - could become string in native nav stack
})
```

**File:** [src/screens/DrugConflictScreen.js](src/screens/DrugConflictScreen.js#L96)
**Line:** 96
```javascript
navigation.navigate('QRDisplay', { transferId });
```

### QRScannerScreen
**File:** [src/screens/QRScannerScreen.js](src/screens/QRScannerScreen.js#L35)
**Line:** 35
```javascript
navigation.navigate('RecordViewer', { transferId: 'TR-4819' });
```

**File:** [src/screens/QRScannerScreen.js](src/screens/QRScannerScreen.js#L42)
**Line:** 42
```javascript
navigation.navigate('RecordViewer', { transferId: id });
```

### TransferFormScreen
**File:** [src/screens/TransferFormScreen.js](src/screens/TransferFormScreen.js#L156-L158)
**Lines:** 156-158
```javascript
navigation.navigate('DrugConflict', { transferId, conflict, allergen: conflict.name });
```

**File:** [src/screens/TransferFormScreen.js](src/screens/TransferFormScreen.js#L160)
**Line:** 160
```javascript
navigation.navigate('QRDisplay', { transferId });
```

### PatientListScreen
**File:** [src/screens/PatientListScreen.js](src/screens/PatientListScreen.js#L28-L30)
**Lines:** 28-30
```javascript
navigation.navigate('TransferForm', { patientId: patient.id });
```

---

## 5. JSX PROPS USING ROUTE PARAMS

### Controlled Conditional Rendering
**File:** [src/screens/DrugConflictScreen.js](src/screens/DrugConflictScreen.js#L62)
**Line:** 62
```javascript
{showOverride && (  // Local state, not from params
```

**File:** [src/screens/DrugConflictScreen.js](src/screens/DrugConflictScreen.js#L86)
**Line:** 86
```javascript
{!showOverride ? (  // Local state, not from params
```

### Button Disabled Props
**File:** [src/screens/DrugConflictScreen.js](src/screens/DrugConflictScreen.js#L98)
**Line:** 98
```javascript
disabled={!overrideNote}  // Local state-based
```

**File:** [src/screens/RecordViewerScreen.js](src/screens/RecordViewerScreen.js#L242)
**Line:** 242
```javascript
disabled={!arrivalCondition}  // Local state-based
```

**File:** [src/screens/TransferFormScreen.js](src/screens/TransferFormScreen.js#L389)
**Line:** 389
```javascript
disabled={!canProceed()}  // Computed from local state
```

**File:** [src/screens/QRScannerScreen.js](src/screens/QRScannerScreen.js#L93)
**Line:** 93
```javascript
disabled={pasteValue.length < 5}  // Local state-based
```

### Medication Cards with mustNotStop Props
**File:** [src/screens/TransferFormScreen.js](src/screens/TransferFormScreen.js#L305-L307)
**Lines:** 305-307
```javascript
<MedCard
  name={m.name} dose={m.dose} route={m.route}
  frequency={m.frequency} mustNotStop={m.mustNotStop}  // ⚠️ Could be string if from transfer
/>
```

**File:** [src/screens/RecordViewerScreen.js](src/screens/RecordViewerScreen.js#L118-L120)
**Lines:** 118-120
```javascript
<MedCard key={i} name={m.name} dose={m.dose} route={m.route}
  frequency={m.frequency} mustNotStop={false} />
```

**File:** [src/screens/RecordViewerScreen.js](src/screens/RecordViewerScreen.js#L123-L127)
**Lines:** 123-127
```javascript
<MedCard key={i} name={m.name} dose={m.dose} route={m.route}
  frequency={m.frequency} mustNotStop={m.mustNotStop} />  // ⚠️ Could be string from transfer
```

---

## 6. CONDITIONAL LOGIC BASED ON PARAMS

### String Comparison
**File:** [src/screens/QRScannerScreen.js](src/screens/QRScannerScreen.js#L28)
**Line:** 28
```javascript
const mode = route?.params?.mode; // 'paste' or undefined (camera)
const [scanning, setScanning] = useState(mode !== 'paste');
```

This is safe - comparing against string literal.

---

## Summary of Issues Found

### 🔴 CRITICAL
1. **`_goToMeds: true` not consumed** - [DrugConflictScreen.js:82](src/screens/DrugConflictScreen.js#L82) passes boolean that TransferFormScreen never uses

### 🟡 MODERATE
1. **String-to-boolean serialization risk** - `mustNotStop` property in medication objects could become strings when passed through navigation stack
   - Mitigated by defensive coercion in [Cards.js:118](src/components/Cards.js#L118), [TransferFormScreen.js:93](src/screens/TransferFormScreen.js#L93), and [RecordViewerScreen.js:20](src/screens/RecordViewerScreen.js#L20)
   - But should be standardized - either always use booleans or document the string format

### 🟢 LOW
1. **Mode parameter handling** - Currently works but depends on string comparison; consider enum-based approach

---

## Recommendations

1. **Implement `_goToMeds` handler** in TransferFormScreen to jump to Medications step
2. **Standardize medication serialization** - Ensure `mustNotStop` is always a boolean in transit/storage
3. **Create route params types** - Define TypeScript interfaces or JSDoc types for each screen's route params
4. **Consider using a router state machine** for better navigation parameter management
5. **Add unit tests** for string-to-boolean coercion logic to prevent regressions
