# MediRelay — UX Specification

## Core UX Philosophy

> A doctor in an emergency should never have to **think** about the app. They should only think about the patient.

Every screen in MediRelay follows three rules:

1. **One primary action per screen** — no decision paralysis
2. **Zero dead ends** — every error tells the doctor exactly what to fix
3. **Minimize typing** — autofocus, dropdowns, toggles, and voice everywhere

---

## Global UX Rules (Apply to Every Screen)

### Touch Targets
- Minimum tap target size: **48x48px** — works with gloves
- Primary action buttons: full width, **56px tall**
- Destructive actions: never next to primary actions

### Typography
- All critical information (allergies, severity): **minimum 18px**
- Body / form labels: **16px**
- Helper text: **14px minimum** — never smaller
- Never rely on color alone to convey meaning — always pair with text or icon

### Input Fields
- Every form screen opens with the **first field autofocused**
- Numeric fields open **numeric keypad** automatically
- Time fields use **native time picker** — no manual typing
- Dropdowns show **most common options first** based on condition category

### Error Handling
- Errors appear **inline below the field** — never as a popup blocking the screen
- Error message always says what to do: "Enter a valid blood pressure e.g. 120/80"
- Required fields marked with a red dot — not just an asterisk
- Form never clears on error — doctor's input is preserved always

### Loading States
- Any action taking over 300ms shows a **spinner on the button itself**
- Never show a full-screen loading overlay — too disorienting in emergencies
- Optimistic UI — show success immediately, sync in background

### Offline Behaviour
- A subtle **orange banner at top** when offline: "Working offline — will sync when connected"
- All form filling works offline
- QR code encodes full record data — works without internet

### Navigation
- **Bottom tab bar** — 3 tabs only: Home, Patients, History
- Back button always visible top-left
- No hamburger menus — everything reachable in max 2 taps from home

---

## Screen 1 — Splash / Auth

### Purpose
Get the doctor into the app as fast as possible. This is not the place to ask for information.

### Layout
```
┌─────────────────────────────┐
│                             │
│         MediRelay           │  ← App name, centered
│    [tagline: one line]      │
│                             │
│   ┌─────────────────────┐   │
│   │   Phone number      │   │  ← Autofocused, numeric keyboard
│   └─────────────────────┘   │
│                             │
│   ┌─────────────────────┐   │
│   │   Send OTP          │   │  ← Full width primary button
│   └─────────────────────┘   │
│                             │
└─────────────────────────────┘
```

### UX Details
- App logo and name at top — minimal, no decorative elements
- Single input field: **phone number** — autofocused on screen open
- Numeric keyboard opens automatically
- "Send OTP" button is disabled until 10 digits are entered — no premature taps
- On OTP screen: **6 boxes side by side** — auto-advances on each digit
- OTP auto-submits when last digit is entered — no "verify" button needed
- "Resend OTP" appears after 30 seconds — countdown shown: "Resend in 28s"
- First login only: asks Name + Role (Doctor / Nurse) + Hospital name — one screen, 3 fields
- After first login: **stays logged in permanently** — doctor never logs in again
- PIN lock optional — set in settings, not forced

### What to Avoid
- No email/password — too slow to type in emergency
- No hospital code entry on every login
- No "Remember me" checkbox — always remembered by default

---

## Screen 2 — Home Dashboard

### Purpose
The doctor's launchpad. Gets them to the right action in one tap.

### Layout
```
┌─────────────────────────────┐
│  Good morning, Dr. Sharma   │  ← Greeting + name
│  City Hospital              │  ← Hospital name
│                        [●]  │  ← Offline indicator (orange if offline)
├─────────────────────────────┤
│                             │
│  ┌─────────────────────┐    │
│  │  + New Transfer     │    │  ← PRIMARY — large, high contrast
│  └─────────────────────┘    │
│                             │
│  ┌──────────┐ ┌──────────┐  │
│  │  Scan QR │ │  Paste   │  │  ← Secondary — side by side
│  │  (recv.) │ │  Link    │  │
│  └──────────┘ └──────────┘  │
│                             │
├─────────────────────────────┤
│  NEEDS ACKNOWLEDGEMENT      │  ← Section header — shown only if items exist
│                             │
│  ┌─────────────────────────┐│
│  │ Ramesh Kumar   CRITICAL ││  ← Incoming transfer card
│  │ Acute MI · 12 min ago   ││
│  │ From: Apollo Hospital   ││
│  └─────────────────────────┘│
│                             │
├─────────────────────────────┤
│  RECENTLY SENT              │
│                             │
│  ┌─────────────────────────┐│
│  │ Priya Mehta    STABLE   ││  ← Sent transfer card
│  │ Fracture · 1hr ago      ││
│  │ To: AIIMS · Acknowledged││
│  └─────────────────────────┘│
│                             │
└─────────────────────────────┘
         [Home] [Patients] [History]   ← Bottom tab bar
```

### UX Details

**Quick action buttons:**
- "New Transfer" — full width, prominent colour — this is the most common action
- "Scan QR" — opens camera immediately, no intermediate screen
- "Paste Link" — reads clipboard automatically, no manual paste needed

**Incoming transfers section:**
- Only shown if there are unacknowledged transfers — disappears when all are acknowledged
- Cards sorted by time — most recent first
- Severity badge colour: red = Critical, orange = Serious, green = Stable
- Tapping a card opens the record viewer directly

**Recently sent section:**
- Shows last 5 transfers sent by this doctor
- Status shown inline: "Pending" / "Acknowledged" / "Viewed"
- Tapping opens the QR screen for that transfer (to reshare if needed)

**No empty state frustration:**
- If no incoming transfers: section is hidden entirely — not shown as "Nothing here"
- If no sent transfers: show a subtle prompt "Start your first transfer"

---

## Screen 3 — Patient List

### Purpose
Find an existing patient quickly, or register a new one.

### Layout
```
┌─────────────────────────────┐
│  ←  Patients                │
│                             │
│  ┌─────────────────────┐    │
│  │  Search by name/ID  │    │  ← Autofocused
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────────┐│
│  │ Ramesh Kumar  · M · 54  ││  ← Patient card
│  │ O+ · Penicillin allergy ││  ← Allergy shown on list itself
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────────┐│
│  │ Priya Mehta   · F · 32  ││
│  │ B+ · No known allergies ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────┐    │
│  │  + Register Patient │    │  ← Sticky at bottom
│  └─────────────────────┘    │
└─────────────────────────────┘
```

### UX Details
- Search autofocuses on screen open — keyboard up immediately
- Search works on name, phone number, or patient ID
- Results filter in real time as doctor types — no search button
- Allergy shown on the card in the list — doctor can spot it before even opening
- Tapping a patient: opens patient profile with option to start transfer
- "Register Patient" button is sticky at bottom — always visible while scrolling

---

## Screen 4 — Patient Registration Form

### Purpose
Capture static patient info once. Never ask for it again.

### Layout
```
┌─────────────────────────────┐
│  ← Register Patient         │
│                             │
│  IDENTITY                   │
│  Full name          [     ] │
│  Age                [     ] │
│  Sex          [M] [F] [Oth] │
│  Blood group       [  ▼  ] │
│  Phone              [     ] │
│                             │
│  EMERGENCY CONTACT          │
│  Name               [     ] │
│  Phone              [     ] │
│  Relation          [  ▼  ] │
│                             │
│  ALLERGIES                  │
│  [ ] No known allergies     │
│  + Add allergy              │
│                             │
│  CHRONIC CONDITIONS         │
│  [Diabetes] [Hypertension]  │  ← Chip multi-select
│  [Asthma] [Heart Disease]   │
│  [Kidney] [Epilepsy] [None] │
│                             │
│  PERMANENT MEDICATIONS      │
│  [ ] No regular medications │
│  + Add medication           │
│                             │
│  ┌─────────────────────┐    │
│  │   Save Patient      │    │
│  └─────────────────────┘    │
└─────────────────────────────┘
```

### UX Details

**Identity section:**
- Full name: text input, autofocused
- Age: numeric keypad
- Sex: 3 inline toggle buttons — not a dropdown
- Blood group: 8-option dropdown, most common (O+, B+, A+) listed first
- Phone: numeric keypad, auto-formats as typed

**Allergies:**
- "No known allergies" checkbox — when checked, hides add allergy fields
- Add allergy: searchable dropdown (common allergens listed) + reaction text field
- Each allergy shown as a removable chip after adding
- Allergy chip colour: red — visually serious

**Chronic conditions:**
- Shown as tap-to-select chips — no dropdown, no scrolling
- "None" chip deselects all others when tapped

**Permanent medications:**
- "No regular medications" checkbox — same pattern as allergies
- Add medication: drug name searchable dropdown → dose text → route selector → frequency selector
- Each medication shown as a card with an X to remove

**Save behaviour:**
- Validates all required fields before saving
- On success: navigates to patient profile, shows "Patient registered" toast
- Patient is immediately available for transfer

---

## Screen 5 — Transfer Form

### Purpose
Capture everything needed for a safe handoff in under 3 minutes.

### Layout — Top Level
```
┌─────────────────────────────┐
│  ← New Transfer             │
│  Ramesh Kumar  · M · 54     │  ← Selected patient
│  ████████░░░░░░  60%        │  ← Progress bar
│                             │
│  ▼ Section 1: Situation  ✓  │  ← Completed, collapsed
│  ▼ Section 2: Vitals     ✓  │  ← Completed, collapsed
│  ▼ Section 3: Condition     │  ← Currently open
│    [form fields here]       │
│  ▷ Section 4: Medications   │  ← Not yet reached
│  ▷ Section 5: Summary       │  ← Not yet reached
│                             │
│  ┌─────────────────────┐    │
│  │   Next Section →    │    │  ← Advances to next section
│  └─────────────────────┘    │
└─────────────────────────────┘
```

### Section 1 — Situation (target: 30 seconds)

```
Condition category:
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Cardiac │ │  Neuro  │ │ Trauma  │   ← Large tap buttons, 2 rows
└─────────┘ └─────────┘ └─────────┘
┌──────────┐ ┌──────────┐ ┌───────┐
│ Obstetric│ │Respiratory│ │ Renal │
└──────────┘ └──────────┘ └───────┘
┌──────────┐ ┌──────────┐
│ Neonatal │ │  Other   │
└──────────┘ └──────────┘

Severity:
[ 🔴 Critical ]  [ 🟠 Serious ]  [ 🟢 Stable ]

Chief complaint:
┌─────────────────────────────┐
│ Chest pain since 2 hours    │  ← Short text + 🎤 mic icon
└─────────────────────────────┘

Reason for transfer:
[ Needs cath lab ▼ ]  ← Dropdown, options change per condition
```

**UX details:**
- Condition category buttons are large — full finger tap area
- Selected condition highlights in blue, others dim slightly
- Severity is a 3-option inline toggle — one tap
- Chief complaint mic icon: tap and hold to dictate, release to stop
- Reason for transfer dropdown pre-populates with top 5 reasons for selected condition

### Section 2 — Vitals (target: 45 seconds)

```
BP          [ 120 ] / [ 80 ]   ← Two separate number fields
Heart rate  [    88    ] bpm
SpO2        [    96    ] %
Temperature [    98.6  ] °F
Resp. rate  [    18    ] /min

--- shown only for Neuro / Trauma ---
GCS         [    14    ] /15

--- shown only if patient is diabetic ---
Blood sugar [   180    ] mg/dL
```

**UX details:**
- Each field opens numeric keypad automatically on focus
- Normal range shown as placeholder: "60–100 bpm"
- Out-of-range values highlighted in amber — not blocked, just flagged
- BP split into two fields with "/" separator between — matches how doctors write it
- GCS and blood sugar fields only appear if relevant — no scrolling past irrelevant fields
- After last vitals field, "Next Section" button auto-scrolls into view

### Section 3 — Condition-Specific Fields (target: 30 seconds)

> Fields shown here depend entirely on the condition category selected in Section 1.
> Max 4 fields per condition. All are toggles, dropdowns, or time pickers — no free text.

**Cardiac:**
```
Symptom onset time   [ 10:30 AM ⏱ ]   ← Time picker, opens native picker
ECG done             [ Yes ] [ No ]
ECG findings         [              ]   ← Short text, shown if ECG = Yes
Thrombolysis given   [ Yes ] [ No ]
```

**Neuro:**
```
Symptom onset time   [ 10:30 AM ⏱ ]
Stroke type     [ Ischemic ] [ Hemorrhagic ] [ Unknown ]
CT done              [ Yes ] [ No ]
CT findings          [              ]   ← Shown if CT = Yes
Seizure active       [ Yes ] [ No ]
```

**Obstetric:**
```
Gestational age      [  32  ] weeks
Rh factor       [ Positive ] [ Negative ]
Fetal heart rate     [  148  ] bpm
High risk reason     [ Eclampsia ▼ ]
```

**Respiratory:**
```
Oxygen required      [ 4L via mask  ]
On ventilator        [ Yes ] [ No ]
Ventilator settings  [              ]   ← Shown if ventilator = Yes
```

**Renal:**
```
Urine output         [  30  ] ml/hr
On dialysis          [ Yes ] [ No ]
Last creatinine      [  2.4 ] mg/dL
```

**Trauma:**
```
Mechanism of injury  [ RTA ▼ ]
Major injuries       [              ]
Surgery needed       [ Yes ] [ No ]
```

**Neonatal:**
```
Gestational age      [  34  ] weeks
Birth weight         [ 1800 ] grams
APGAR score          [   7  ] /10
Delivery type        [ Normal ] [ LSCS ]
```

### Section 4 — Active Medications (target: 30 seconds)

```
┌─────────────────────────────┐
│ Metoprolol · 25mg · Oral    │  ← Pre-loaded from patient profile
│ Last given: —      [⚠ Must not stop] │
└─────────────────────────────┘

┌─────────────────────────────┐
│ + Add medication            │
└─────────────────────────────┘
```

**UX details:**
- Permanent medications from patient profile auto-load here as a starting point
- Doctor can remove any that are not currently active
- "Must not stop" toggle is shown per medication — large, obvious
- Any medication with "Must not stop" = ON gets a red border on its card
- Adding new medication: drug name searchable dropdown → dose → route → last given time
- "Last given" uses time picker — not free text

### Section 5 — Handoff Summary (target: 30 seconds)

```
Clinical summary:
┌─────────────────────────────┐
│                             │
│   Tap 🎤 to dictate         │  ← Large mic button centred
│   or type below             │
│                             │
│ [                         ] │
│ [                         ] │  ← Text area, 150 word limit
│ [                         ] │
│  148 / 150 words            │  ← Live word count
└─────────────────────────────┘

Pending investigations:
[ECG] [CBC] [LFT] [KFT] [CT]  ← Chip multi-select
[MRI] [Culture] [Echo] [Other]

Receiving hospital:
┌─────────────────────────────┐
│ Search hospital name        │
└─────────────────────────────┘

Mode of transfer:
[ Ambulance ] [ Air ] [ Private ]

┌─────────────────────────────┐
│   Submit & Generate QR  →   │  ← Final primary action
└─────────────────────────────┘
```

**UX details:**
- Mic button is large and centred — primary input method
- Tap mic once to start, tap again to stop — no hold required
- Transcription appears in text area as doctor speaks — editable after
- Word count shown live — turns amber at 130 words, red at 150
- Pending investigations are chips — multi-tap to select
- Receiving hospital: searchable, shows recently used hospitals first
- "Submit & Generate QR" is disabled until all required fields are filled

---

## Screen 6 — Drug Conflict Warning

### Purpose
Catch dangerous allergy-drug conflicts before the patient leaves.

### When it appears
Only if a conflict is detected on submit. Otherwise skipped entirely.

### Layout
```
┌─────────────────────────────┐
│  ⚠️  Conflict Detected       │
│                             │
│  ┌─────────────────────────┐│
│  │ Allergy: Penicillin     ││  ← Conflict card
│  │ Medication: Amoxicillin ││
│  │ Risk: Anaphylaxis       ││
│  └─────────────────────────┘│
│                             │
│  ┌─────────────────────┐    │
│  │  Fix Medication     │    │  ← Primary — goes back to meds section
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │  Override with Note │    │  ← Secondary — doctor can justify
│  └─────────────────────┘    │
└─────────────────────────────┘
```

### UX Details
- This screen cannot be dismissed by tapping outside — must make a choice
- "Fix Medication" takes doctor back to Section 4 with the conflicting medication highlighted
- "Override with Note" opens a short text field: "Reason for override" — required
- Override note is stored with the record and visible to the receiver

---

## Screen 7 — QR Display Screen (Sender)

### Purpose
Give the sender something shareable in as many ways as possible.

### Layout
```
┌─────────────────────────────┐
│  ← Transfer Created         │
│                             │
│  Ramesh Kumar               │  ← Patient name
│  Acute MI · CRITICAL        │  ← Diagnosis + severity
│                             │
│  ┌─────────────────────┐    │
│  │                     │    │
│  │      [QR CODE]      │    │  ← Large, high contrast, centred
│  │                     │    │
│  └─────────────────────┘    │
│                             │
│  medirelay.app/r/TR-4821    │  ← Short link, tap to copy
│                             │
│  ┌──────────┐ ┌──────────┐  │
│  │  Share   │ │  Print   │  │  ← Share opens native share sheet
│  └──────────┘ └──────────┘  │
│                             │
│  Status: Pending review...  │  ← Live — updates when receiver opens
│                             │
│  ┌─────────────────────┐    │
│  │  Back to Home       │    │
│  └─────────────────────┘    │
└─────────────────────────────┘
```

### UX Details
- QR code is maximum size — takes up most of the screen width
- High contrast black and white — readable in bright light and on dimmed screens
- Short link is tappable — copies to clipboard with "Copied" toast
- Share button opens native OS share sheet — WhatsApp, SMS, etc.
- Status updates in real time via Socket.io:
  - "Pending review" → "Record opened" → "Acknowledged"
- When acknowledged: status turns green, doctor gets a soft haptic + sound notification
- Doctor can come back to this screen from History tab at any time

---

## Screen 8 — QR Scanner / Link Entry (Receiver)

### Purpose
Get the receiving doctor into the record as fast as possible.

### Layout
```
┌─────────────────────────────┐
│  ← Receive Transfer         │
│                             │
│  ┌─────────────────────────┐│
│  │                         ││
│  │    [CAMERA VIEWFINDER]  ││  ← Opens immediately, no extra tap
│  │                         ││
│  │   Point at QR code      ││
│  └─────────────────────────┘│
│                             │
│          ── or ──           │
│                             │
│  ┌─────────────────────┐    │
│  │  Paste link         │    │  ← Auto-reads clipboard on screen open
│  └─────────────────────┘    │
└─────────────────────────────┘
```

### UX Details
- Camera opens immediately — no "allow camera" friction after first grant
- QR scanning is instant — no button to press after scanning
- "Paste link" field auto-reads clipboard — if a MediRelay link is on clipboard, it pre-fills
- If doctor opens the app after tapping a WhatsApp link — app auto-detects and opens that record
- No login required to view a record — app opens record view directly after scanning

---

## Screen 9 — Record Viewer (Receiver)

### Purpose
Give the receiving doctor everything they need in 90 seconds, most critical first.

### Layout
```
┌─────────────────────────────┐
│  Ramesh Kumar  · M · 54     │
│  O+ · From: Apollo Hospital │
│                             │
│ ┌─────────────────────────┐ │
│ │ ⚠ ALLERGIES             │ │  ← RED card, always at top
│ │ Penicillin → Anaphylaxis│ │
│ │ Aspirin → Rash          │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ 🛑 MUST NOT STOP        │ │  ← RED border card
│ │ Metoprolol 25mg Oral    │ │
│ │ Last given: 2h ago      │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ 🔴 CRITICAL             │ │  ← Severity + reason
│ │ Needs cath lab — Acute MI│ │
│ │ Onset: 10:30 AM (2h ago)│ │
│ └─────────────────────────┘ │
│                             │
│  ── scroll for full record ──│
│                             │
│  VITALS                     │
│  BP: 140/90  HR: 92         │
│  SpO2: 94%   Temp: 98.6     │
│                             │
│  ACTIVE MEDICATIONS         │
│  Metoprolol 25mg Oral  [!]  │
│  Aspirin 75mg Oral          │
│                             │
│  CONDITION FINDINGS         │
│  ECG: ST elevation V1-V4    │
│  Thrombolysis: Not given    │
│                             │
│  CLINICAL SUMMARY           │
│  Patient presented with...  │
│                             │
│  PENDING INVESTIGATIONS     │
│  [Troponin] [Echo]          │
│                             │
│ ┌─────────────────────────┐ │
│ │  Mark as Reviewed  ✓   │ │  ← Sticky at bottom always
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### UX Details

**Critical banner section (top — non-scrollable):**
- Allergies, must-not-stop meds, severity+reason are pinned to top
- These 3 cards are always visible — they do NOT scroll away
- Everything below them scrolls independently
- If no allergies: shows "No known allergies" in green — never blank

**Scrollable section below:**
- Vitals displayed as a 2-column grid — scannable at a glance
- Medications: any with "must not stop" have a red [!] badge
- Condition findings: only shows relevant fields — no empty rows
- Clinical summary: full text, expandable if long
- Sending doctor's name and contact number shown at bottom — doctor can call directly

**"Mark as Reviewed" button:**
- Sticky at bottom — always visible regardless of scroll position
- Tapping opens the acknowledgement panel (slides up from bottom)

---

## Screen 10 — Acknowledgement Panel

### Purpose
Close the loop — confirm the patient arrived and flag any issues.

### Layout (slides up as bottom sheet)
```
┌─────────────────────────────┐
│  Acknowledge Transfer       │
│                             │
│  Patient condition on arrival:
│  [ Stable ] [Deteriorated] [Critical]
│                             │
│  Arrival note (optional):   │
│  ┌─────────────────────┐    │
│  │                     │    │  ← Short text or voice
│  └─────────────────────┘    │
│                             │
│  Flag discrepancy? (optional)│
│  ┌─────────────────────┐    │
│  │ e.g. Med was stopped│    │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │  Confirm & Submit   │    │
│  └─────────────────────┘    │
└─────────────────────────────┘
```

### UX Details
- Panel slides up from bottom — record still visible behind it
- Arrival condition is required — cannot submit without it
- Arrival note and discrepancy flag are optional — no friction
- On submit: sender gets real-time notification
- Panel closes, record now shows "Acknowledged" badge
- Timestamp of acknowledgement saved automatically

---

## Screen 11 — Transfer History

### Purpose
See all past transfers — sent and received — in one timeline.

### Layout
```
┌─────────────────────────────┐
│  History                    │
│  [Sent ▼]  [Received]       │  ← Filter tabs
│                             │
│  Today                      │
│  ┌─────────────────────────┐│
│  │ Ramesh Kumar    10:45am ││
│  │ Acute MI · Acknowledged ││
│  │ To: AIIMS               ││
│  └─────────────────────────┘│
│                             │
│  Yesterday                  │
│  ┌─────────────────────────┐│
│  │ Priya Mehta     3:20pm  ││
│  │ Fracture · Acknowledged ││
│  │ To: City Hospital       ││
│  └─────────────────────────┘│
└─────────────────────────────┘
```

### UX Details
- Grouped by date — today, yesterday, then by date
- Each card shows patient name, diagnosis, status, destination/source
- Status badge: Pending / Viewed / Acknowledged
- Tapping a sent card: opens the QR screen (to reshare)
- Tapping a received card: opens the record viewer (read-only)
- Pull to refresh — syncs any offline records

---

## Navigation Map Summary

```
Splash / OTP
    ↓
Home Dashboard
    ├── [New Transfer] ──────→ Patient Search
    │                               ↓
    │                         Transfer Form (5 sections)
    │                               ↓
    │                         Drug Conflict Check (if needed)
    │                               ↓
    │                         QR Display Screen
    │
    ├── [Scan QR / Paste Link] → QR Scanner
    │                               ↓
    │                         Record Viewer
    │                               ↓
    │                         Acknowledgement Panel
    │
    ├── [Tab: Patients] ──────→ Patient List
    │                               ├── Select patient → Patient Profile
    │                               └── + Register → Patient Form
    │
    └── [Tab: History] ───────→ Transfer History
                                    ├── Sent card → QR Screen
                                    └── Received card → Record Viewer
```

---

## UX Anti-Patterns to Avoid

| Anti-pattern | Why | What to do instead |
|---|---|---|
| Full screen loading spinner | Disorienting in emergency | Spinner on the button only |
| Popup error dialogs | Blocks the screen | Inline error below the field |
| Confirmation dialogs on every action | Extra tap = frustration | Only on irreversible destructive actions |
| Clearing form on error | Forces re-entry | Preserve all input, just highlight error |
| Hamburger menu | 3+ taps to reach anything | Bottom tab bar, max 2 taps |
| Mandatory fields not marked clearly | Doctor guesses | Red dot on every required field |
| Timeout / auto-logout | Doctor returns mid-emergency | Stay logged in, PIN optional |
| Small tap targets | Gloves, shaky hands | 48px minimum, 56px for primary actions |
| Color-only error indication | Accessibility + sunlight | Color + icon + text always |
| Long dropdowns | Slow scrolling | Searchable dropdown, common options first |