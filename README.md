# MediRelay

> **Fast, structured, life-saving patient transfer records — from one hospital to another.**

---

## 📖 About the Project

MediRelay is a full-stack healthcare application designed to streamline **inter-hospital patient transfers**. In emergency scenarios, critical patient information must move between doctors quickly, accurately, and completely. MediRelay solves this by:

1. **Pre-registering patients** — Doctors fill out a detailed patient profile (identity, allergies, chronic conditions, medications) _once_ during admission, with no time pressure.
2. **Rapid transfer records** — When a transfer is needed, the doctor selects the patient, and the form auto-fills known data. The doctor only adds the _emergency-specific_ details (vitals, chief complaint, active medications, clinical summary). The entire transfer form is designed to be completed in **under 3 minutes**.
3. **Shareable reports** — Each transfer generates a unique **share link** (and optionally a QR code) that the receiving hospital can open to see the full structured record — with critical items like allergies and must-not-stop medications displayed prominently at the top.

### Why MediRelay?

| Problem | MediRelay Solution |
|---|---|
| Paper-based referral slips are illegible, incomplete, or lost | Structured digital record with validation |
| Receiving doctor has no context about the patient | Full patient history + transfer details in one view |
| Critical info (allergies, must-not-stop meds) is buried in notes | Priority-ordered display — critical info shown first |
| Transfer documentation takes too long in emergencies | Auto-fill from patient profile + voice input support |
| No audit trail of transfers | Timestamped records with status tracking |

---

## 🛠️ Tech Stack

### Backend

| Technology | Version | Why It's Used |
|---|---|---|
| **Node.js** | — | JavaScript runtime for the server. Chosen for its non-blocking I/O model, ideal for handling concurrent API requests from multiple hospitals. |
| **Express.js** | v5.2 | Minimal, unopinionated web framework. Provides routing, middleware, and HTTP utilities without unnecessary overhead. Express v5 brings improved async error handling. |
| **MongoDB** | — | NoSQL document database. Patient and transfer records are naturally document-shaped (nested objects like allergies, medications, vitals). MongoDB handles these without complex joins. |
| **Mongoose** | v9.3 | ODM (Object Data Modeling) for MongoDB. Provides schema validation, type casting, query building, and population of referenced documents — ensuring data integrity at the application layer. |
| **dotenv** | v17.3 | Loads environment variables from `.env` files. Keeps secrets (MongoDB URI) out of source code. |
| **CORS** | v2.8 | Enables Cross-Origin Resource Sharing so the React Native frontend can communicate with the backend API from any origin. |

### Frontend

| Technology | Version | Why It's Used |
|---|---|---|
| **React Native** | v0.81 | Cross-platform mobile framework. Write once, deploy on both Android and iOS. Doctors use mobile devices at the bedside, so a native mobile experience is essential. |
| **Expo** | SDK 54 | Managed workflow for React Native. Simplifies build, development, and deployment. Provides access to device APIs (camera for QR scanning) without native code setup. |
| **React Navigation** | v6 | Standard navigation library for React Native. Provides stack navigation (screen-to-screen flow) and bottom tab navigation (main app sections). |
| **expo-camera** | v17 | Camera access for QR code scanning. Receiving doctors can scan the QR code to instantly pull up the transfer record. |
| **react-native-svg** | v15 | SVG rendering in React Native. Used for icons, QR code display, and visual elements. |

### Architecture

```
┌─────────────────────┐         ┌─────────────────────┐
│   React Native App  │  HTTP   │   Express.js API     │
│   (Expo SDK 54)     │ ──────> │   (Node.js)          │
│                     │         │                      │
│  • Patient forms    │         │  /api/v1/patients    │
│  • Transfer forms   │         │  /api/v1/transfers   │
│  • QR scanner       │         │                      │
│  • Report viewer    │         │                      │
└─────────────────────┘         └──────────┬───────────┘
                                           │
                                           │ Mongoose ODM
                                           │
                                    ┌──────▼──────┐
                                    │   MongoDB    │
                                    │  (Cloud)     │
                                    └─────────────┘
```

---

## 📂 Project Structure

```
MediRelay/
├── backend/
│   ├── app.js                    # Entry point — starts server & connects DB
│   ├── server.js                 # Express app setup, middleware, route mounting
│   ├── config/
│   │   └── db.js                 # MongoDB connection using Mongoose
│   ├── models/
│   │   ├── PatientModel.js       # Patient schema (identity, allergies, meds)
│   │   └── trasferRecord.js      # Transfer record schema (refs Patient by ObjectId)
│   ├── routes/
│   │   ├── patientRoutes.js      # CRUD + search for patients
│   │   └── transferRoutes.js     # Create, update, fetch, share transfers
│   ├── .env                      # Environment variables (MONGODB_URI)
│   └── package.json
│
├── frontend/                     # React Native (Expo) mobile app
│   ├── App.js
│   ├── src/                      # Screens, components, navigation
│   ├── assets/
│   └── package.json
│
└── README.md
```

---

## 🗃️ Database Models (Schemas)

### 1. Patient Model (`PatientModel.js`)

> Stores the **permanent** patient profile. Created once during admission.

| Field | Type | Required | Notes |
|---|---|---|---|
| `fullName` | String | ✅ | Patient's full name |
| `age` | Number | ✅ | |
| `sex` | String (enum) | ✅ | `M` / `F` / `Other` |
| `bloodGroup` | String (enum) | — | `A+`, `A-`, `B+`, `B-`, `O+`, `O-`, `AB+`, `AB-` |
| `phone` | String | — | |
| `emergencyContact.name` | String | — | |
| `emergencyContact.phone` | String | — | |
| `emergencyContact.relation` | String | — | |
| `noKnownAllergies` | Boolean | — | Default: `false` |
| `allergies[]` | Array of Objects | — | Each: `{ allergen, reaction }` |
| `chronicConditions[]` | Array of Strings | — | e.g. `["Diabetes", "Hypertension"]` |
| `noRegularMedications` | Boolean | — | Default: `false` |
| `permanentMedications[]` | Array of Objects | — | Each: `{ name, dose, route, frequency }` |
| `createdAt` | Date | auto | Mongoose timestamps |
| `updatedAt` | Date | auto | Mongoose timestamps |

---

### 2. Transfer Record Model (`trasferRecord.js`)

> Stores each **transfer event**. References the Patient model by ObjectId.

| Field | Type | Required | Notes |
|---|---|---|---|
| **Patient Reference** | | | |
| `patient` | ObjectId (ref → `Patient`) | ✅ | References the Patient collection. Populated on read queries. |
| **Meta Info** | | | |
| `sendingHospital` | String | ✅ | Hospital initiating the transfer |
| `receivingHospital` | String | — | Destination hospital |
| `doctorName` | String | ✅ | Sending doctor's name |
| `timestamp` | Date | — | Default: `Date.now` |
| **Section 1 — Situation** | | | |
| `chiefComplaint` | String | ✅ | e.g. "Chest pain since 2hrs" |
| `conditionCategory` | String (enum) | ✅ | `Cardiac` / `Neuro` / `Trauma` / `Obstetric` / `Respiratory` / `Renal` / `Neonatal` / `Other` |
| `severity` | String (enum) | ✅ | `Critical` / `Serious` / `Stable` |
| `reasonForTransfer` | String | ✅ | |
| **Section 2 — Vitals** | | | |
| `vitals.bp` | String | — | Blood pressure (e.g. "120/80") |
| `vitals.hr` | Number | — | Heart rate |
| `vitals.spo2` | Number | — | Oxygen saturation % |
| `vitals.temp` | Number | — | Temperature |
| `vitals.rr` | Number | — | Respiratory rate |
| `vitals.gcs` | Number | — | Glasgow Coma Scale (3–15) |
| `vitals.bloodSugar` | Number | — | mg/dL |
| **Section 3 — Condition Details** | | | |
| `conditionDetails` | Object | — | Dynamic fields based on `conditionCategory`. Default: `{}` |
| **Section 4 — Active Medications** | | | |
| `activeMedications[]` | Array of Objects | — | Each: `{ name✅, dose✅, route✅ (Oral/IV/IM), lastGivenAt, mustNotStop }` |
| **Section 5 — Handoff Note** | | | |
| `clinicalSummary` | String | — | Max 150 characters |
| `pendingInvestigations[]` | Array of Strings | — | e.g. `["ECG", "CBC", "CT"]` |
| `modeOfTransfer` | String (enum) | — | `Ambulance` / `Air` / `Private Vehicle` |
| **Sharing** | | | |
| `reportId` | String | — | e.g. "TR-XXXX" |
| `shareId` | String | — | Unique share identifier for link/QR |
| `qrCode` | String | — | Encoded QR code data |
| **Status** | | | |
| `status` | String (enum) | — | `draft` / `submitted` / `acknowledged`. Default: `draft` |
| `createdAt` | Date | auto | Mongoose timestamps |
| `updatedAt` | Date | auto | Mongoose timestamps |

#### Entity Relationship

```
┌──────────────────┐       ┌────────────────────────┐
│     Patient      │       │    TransferRecord       │
├──────────────────┤       ├────────────────────────┤
│ _id (ObjectId)   │◄──────│ patient (ObjectId ref)  │
│ fullName         │       │ sendingHospital         │
│ age              │       │ receivingHospital       │
│ sex              │       │ doctorName              │
│ bloodGroup       │       │ chiefComplaint          │
│ phone            │       │ conditionCategory       │
│ emergencyContact │       │ severity                │
│ allergies[]      │       │ reasonForTransfer       │
│ chronicConditions│       │ vitals                  │
│ permanentMeds[]  │       │ activeMedications[]     │
│ ...              │       │ clinicalSummary         │
└──────────────────┘       │ shareId                 │
       1 ──────────── *    │ status                  │
    (One patient can       │ ...                     │
     have many transfers)  └────────────────────────┘
```

---

## 🔌 API Reference

**Base URL:** `http://localhost:8080/api/v1`

---

### Patient APIs (`/api/v1/patients`)

#### 1. Create Patient

```
POST /patients
```

**Request Body:**

```json
{
  "fullName": "Rahul Sharma",
  "age": 45,
  "sex": "M",
  "bloodGroup": "B+",
  "phone": "9876543210",
  "doctorId": "665abc123def456789abcdef",
  "emergencyContact": {
    "name": "Priya Sharma",
    "phone": "9876543211",
    "relation": "Spouse"
  },
  "noKnownAllergies": false,
  "allergies": [
    { "allergen": "Penicillin", "reaction": "Anaphylaxis" }
  ],
  "chronicConditions": ["Diabetes", "Hypertension"],
  "noRegularMedications": false,
  "permanentMedications": [
    { "name": "Metformin", "dose": "500mg", "route": "Oral", "frequency": "BD" }
  ]
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": { /* full patient object with _id */ }
}
```

---

#### 2. Get All Patients (by Doctor)

```
GET /patients?doctorId=<doctorId>
```

**Response:** `200 OK`

```json
{
  "success": true,
  "count": 5,
  "data": [ /* array of patient objects */ ]
}
```

---

#### 3. Search Patients

```
GET /patients/search?search=<query>&doctorId=<doctorId>
```

Searches across `fullName`, `phone`, `bloodGroup`, `emergencyContact.name`, and `emergencyContact.phone`. Returns max 20 results.

---

#### 4. Get Patients by Doctor ID (with optional name search)

```
GET /patients/doctor/:doctorId?search=<optional name>
```

---

#### 5. Get Single Patient

```
GET /patients/:id
```

---

### Transfer APIs (`/api/v1/transfers`)

#### 1. Create Transfer

```
POST /transfers
```

**Request Body:**

```json
{
  "patientId": "665abc123def456789abcdef",
  "sendingHospital": "City General Hospital",
  "receivingHospital": "Apollo Cardiac Center",
  "doctorName": "Dr. Mehta",
  "chiefComplaint": "Acute chest pain since 2 hours",
  "conditionCategory": "Cardiac",
  "severity": "Critical",
  "reasonForTransfer": "Needs cath lab — Acute MI",
  "vitals": {
    "bp": "140/90",
    "hr": 92,
    "spo2": 94,
    "temp": 98.6,
    "rr": 20
  },
  "activeMedications": [
    {
      "name": "Aspirin",
      "dose": "325mg",
      "route": "Oral",
      "lastGivenAt": "10:30 AM",
      "mustNotStop": true
    }
  ],
  "clinicalSummary": "45M with acute STEMI, thrombolysis given, needs PCI",
  "pendingInvestigations": ["ECG", "Troponin", "Echo"],
  "modeOfTransfer": "Ambulance"
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": { /* full transfer object with populated patient */ },
  "link": "http://localhost:8080/api/v1/transfers/share/<shareId>"
}
```

---

#### 2. Get All Transfers (optionally filter by patient)

```
GET /transfers?patientId=<optional patientId>
```

Returns all transfers sorted by newest first. Patient data is populated automatically.

---

#### 3. Get Single Transfer

```
GET /transfers/:id
```

Returns the transfer with full patient data populated.

---

#### 4. Get Transfer by Share Link

```
GET /transfers/share/:shareId
```

Used by the **receiving hospital** to view the transfer record via a shared link or QR code. Patient data is populated automatically.

---

#### 5. Update Transfer

```
PATCH /transfers/:id
```

**Request Body:** Any subset of transfer fields to update.

**Response:** `200 OK` with the updated transfer.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+)
- **MongoDB** (local or cloud — e.g. MongoDB Atlas)
- **Expo CLI** (for the mobile app)

### Backend Setup

```bash
cd backend
npm install

# Create .env file
echo "MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>" > .env

# Start the server
node app.js
```

The server runs on `http://localhost:8080`.

### Frontend Setup

```bash
cd frontend
npm install

# Start the Expo dev server
npx expo start
```

Scan the QR code with Expo Go (Android/iOS) to run the app on your device.

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

When the receiving doctor opens a transfer record, critical information is shown **first**:

```
1. ⚠️  ALLERGIES
       Penicillin → Anaphylaxis

2. 🛑  MUST-NOT-STOP MEDICATIONS
       Aspirin 325mg Oral — last given 2h ago

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
| Name, age, sex, blood group | ✅ | ❌ (referenced via ObjectId) |
| Allergies | ✅ | ❌ (referenced via ObjectId) |
| Chronic conditions | ✅ | ❌ (referenced via ObjectId) |
| Permanent medications | ✅ | ❌ (referenced via ObjectId) |
| Emergency contact | ✅ | ❌ (referenced via ObjectId) |
| Chief complaint | ❌ | ✅ |
| Vitals | ❌ | ✅ |
| Active medications | ❌ | ✅ |
| Condition-specific fields | ❌ | ✅ |
| Clinical summary | ❌ | ✅ |
| Pending investigations | ❌ | ✅ |
| QR code / short link | ❌ | ✅ |
| Status tracking | ❌ | ✅ |

---

## 📄 License

ISC
