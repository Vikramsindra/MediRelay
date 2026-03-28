# MediRelay — Form Fields Reference

## Overview

Two forms power the core of MediRelay:

- **Patient Form** — filled during admission, no time pressure
- **Transfer Form** — filled during emergency, must be fast

---

## 👤 Patient Form

> Filled once during admission or registration. Pre-fills most of the transfer form automatically.

### Identity

| Field | Type | Notes |
|---|---|---|
| Full Name | Text | |
| Age | Number | |
| Sex | Single select | M / F / Other |
| Blood Group | Single select | A+ A- B+ B- O+ O- AB+ AB- |
| Phone | Number | |

### Emergency Contact

| Field | Type | Notes |
|---|---|---|
| Contact Name | Text | |
| Contact Phone | Number | |
| Relation | Single select | Spouse / Parent / Child / Sibling / Other |

### Allergies

> Checkbox: "No known allergies" — hides fields below if checked

| Field | Type | Notes |
|---|---|---|
| Allergen Name | Searchable dropdown | "Penicillin", "Aspirin", etc. |
| Reaction | Short text | "Anaphylaxis", "Rash" |

*Repeatable — add multiple allergies*

### Chronic Conditions

| Field | Type | Options |
|---|---|---|
| Conditions | Multi-select | Diabetes / Hypertension / Asthma / Heart Disease / Kidney Disease / Epilepsy / None / Other |

### Permanent Medications

> Checkbox: "No regular medications" — hides fields below if checked

| Field | Type | Notes |
|---|---|---|
| Medicine Name | Searchable dropdown | Drug database |
| Dose | Short text | "25mg" |
| Route | Single select | Oral / IV / IM / Subcutaneous |
| Frequency | Single select | OD / BD / TDS / QID / SOS |

*Repeatable — add multiple medications*

---

**Estimated time to fill: 5 minutes**
**Total inputs: ~15**

---

## 🚨 Transfer Form

> Filled during emergency. Every field is justified. Doctor should complete this in under 3 minutes.

### Auto-Filled (Doctor does nothing)

| Field | Source |
|---|---|
| Patient details | Selected from search |
| Sending hospital | Doctor's logged-in profile |
| Doctor name | Doctor's logged-in profile |
| Timestamp | System auto |

---

### Section 1 — Situation
*Target: 30 seconds*

| Field | Type | Notes |
|---|---|---|
| Chief Complaint | Short text + voice | "Chest pain since 2hrs" |
| Condition Category | Single select (large tap buttons) | Cardiac / Neuro / Trauma / Obstetric / Respiratory / Renal / Neonatal / Other |
| Severity Level | Single select | 🔴 Critical / 🟠 Serious / 🟢 Stable |
| Reason for Transfer | Dropdown + custom | Common reasons per category + "Other" |

---

### Section 2 — Vitals
*Target: 45 seconds*
*Only vitals relevant to the selected condition category are shown*

| Field | Type | Shown For |
|---|---|---|
| Blood Pressure | Text ("120/80") | All |
| Heart Rate | Number | All |
| SpO2 | Number (%) | All |
| Temperature | Number | All |
| Respiratory Rate | Number | All |
| GCS | Number (3–15) | Neuro / Trauma only |
| Blood Sugar | Number (mg/dL) | Diabetic patients / Relevant cases |

---

### Section 3 — Condition-Specific Fields
*Target: 30 seconds*
*Only shown based on condition category selected in Section 1*
*Max 3–4 fields per condition*

#### ❤️ Cardiac

| Field | Type | Notes |
|---|---|---|
| Symptom Onset Time | Time picker | ⏱️ CRITICAL for thrombolysis |
| ECG Done | Toggle (Yes/No) | |
| ECG Findings | Short text | Shown only if ECG Done = Yes |
| Thrombolysis Given | Toggle (Yes/No) | |

#### 🧠 Neuro

| Field | Type | Notes |
|---|---|---|
| Symptom Onset Time | Time picker | ⏱️ CRITICAL for tPA window |
| Stroke Type | Single select | Ischemic / Hemorrhagic / Unknown |
| CT Done | Toggle (Yes/No) | |
| CT Findings | Short text | Shown only if CT Done = Yes |
| Seizure Active | Toggle (Yes/No) | |

#### 🤰 Obstetric

| Field | Type | Notes |
|---|---|---|
| Gestational Age | Number (weeks) | |
| Rh Factor | Single select | ⚠️ CRITICAL — Positive / Negative |
| Fetal Heart Rate | Number | |
| Reason High Risk | Dropdown | Eclampsia / PPH / Placenta Previa / Preterm / Other |

#### 🫁 Respiratory

| Field | Type | Notes |
|---|---|---|
| Oxygen Required | Short text | "4L via mask" |
| On Ventilator | Toggle (Yes/No) | |
| Ventilator Settings | Short text | Shown only if On Ventilator = Yes |

#### 🩸 Renal

| Field | Type | Notes |
|---|---|---|
| Urine Output | Number (ml/hr) | |
| On Dialysis | Toggle (Yes/No) | |
| Last Creatinine | Number (mg/dL) | |

#### 🚑 Trauma

| Field | Type | Notes |
|---|---|---|
| Mechanism of Injury | Dropdown | RTA / Fall / Assault / Burns / Other |
| Major Injuries | Short text | |
| Surgery Needed | Toggle (Yes/No) | |

#### 👶 Neonatal

| Field | Type | Notes |
|---|---|---|
| Gestational Age | Number (weeks) | |
| Birth Weight | Number (grams) | |
| APGAR Score | Number (1–10) | |
| Delivery Type | Single select | Normal / LSCS |

---

### Section 4 — Active Medications
*Target: 30 seconds*

> These are medications being given **right now** during this admission — not permanent meds from patient profile.

| Field | Type | Notes |
|---|---|---|
| Medicine Name | Searchable dropdown | Drug database |
| Dose | Short text | |
| Route | Single select | Oral / IV / IM |
| Last Given At | Time picker | Important for receiver |
| Must Not Stop | Toggle ⚠️ | Shown first on receiver side |

*Repeatable — add multiple medications*

---

### Section 5 — Handoff Note
*Target: 30 seconds*

| Field | Type | Notes |
|---|---|---|
| Clinical Summary | Voice input + text fallback | 150 words max |
| Pending Investigations | Multi-select checklist | ECG / CBC / LFT / KFT / CT / MRI / Culture / Biopsy / Echo / Other |
| Receiving Hospital | Short text or search | |
| Mode of Transfer | Single select | Ambulance / Air / Private Vehicle |

---

### Auto-Generated on Submit

| Field | Value |
|---|---|
| Report ID | TR-XXXX |
| QR Code | Encoded record data |
| Short Link | medirelay.app/r/TR-XXXX |
| Status | Draft → Submitted → Acknowledged |

---

## ⏱️ Transfer Form Time Breakdown

| Section | Action | Time |
|---|---|---|
| — | Search and select patient | 10 sec |
| Section 1 | Situation (4 fields) | 30 sec |
| Section 2 | Vitals (5–6 number inputs) | 45 sec |
| Section 3 | Condition-specific (3–4 fields) | 30 sec |
| Section 4 | Active medications | 30 sec |
| Section 5 | Handoff note (voice dictated) | 30 sec |
| **Total** | | **~3 minutes** |

---

## 🚨 Receiver View — Priority Order

These fields are shown **large, above everything else**, the moment Doctor 2 opens the record:

```
1. ⚠️  ALLERGIES
       Penicillin → Anaphylaxis
       Aspirin → Rash

2. 🛑  MUST-NOT-STOP MEDICATIONS
       Metoprolol 25mg Oral — last given 2h ago
       Insulin 10U SC — last given 4h ago

3. 🔴  REASON FOR TRANSFER
       Needs cath lab — Acute MI

4. ⏱️  SYMPTOM ONSET TIME
       10:30 AM (2 hours ago)

5. 🔴  SEVERITY
       CRITICAL

6. 📋  VITALS
       BP: 140/90 | HR: 92 | SpO2: 94% | Temp: 98.6

        ↓ rest of record below ↓

7.     Full active medications list
8.     Condition-specific findings
9.     Clinical summary
10.    Pending investigations
```

---

## 🗂️ Field-to-Model Mapping

| Field | Patient Model | Transfer Model |
|---|---|---|
| Name, age, sex, blood group | ✅ | ❌ |
| Allergies | ✅ | ❌ |
| Chronic conditions | ✅ | ❌ |
| Permanent medications | ✅ | ❌ |
| Emergency contact | ✅ | ❌ |
| Chief complaint | ❌ | ✅ |
| Vitals | ❌ | ✅ |
| Active medications | ❌ | ✅ |
| Condition-specific fields | ❌ | ✅ |
| Clinical summary | ❌ | ✅ |
| Pending investigations | ❌ | ✅ |
| QR code / short link | ❌ | ✅ |
| Acknowledgement | ❌ | ✅ |