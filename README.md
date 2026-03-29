# MediRelay

MediRelay is a mobile-first patient transfer handoff system for inter-hospital referrals.

It helps sending teams create structured transfer records quickly and helps receiving teams review critical information first.

## Problem

<<<<<<< HEAD
MediRelay is a smart patient transfer system designed to eliminate errors caused by unstructured, paper-based medical handoffs between hospitals. During patient transfers, critical information such as allergies, medications, and diagnoses is often incomplete, unclear, or difficult to interpret—leading to serious medical risks.
MediRelay solves this by providing a structured, digital transfer record that can be generated quickly by the sending team and accessed instantly by the receiving team via a QR code or shareable link.
The system supports multi-modal input, allowing doctors to enter data manually or upload medical reports (images/PDFs), which are processed using OCR to extract relevant clinical information. All patient records are linked using a unique ABHA ID, ensuring continuity of care and eliminating duplicate records across multiple hospitals.
With features like critical information prioritization, transfer history tracking, and real-time data accessibility, MediRelay enables doctors to make faster, safer, and more informed decisions during emergency handoffs.
=======
In many referrals, key details are passed as paper notes that are incomplete or hard to read. This delays decisions and increases risk.

MediRelay addresses this by standardizing the transfer handoff into a consistent, scannable record.
>>>>>>> fecece6 (feat: added readme file)

## What The App Does

- Creates structured transfer records from a guided multi-step form
- Prioritizes critical information at the top of the receiver view:
  - allergies
  - must-not-stop medications
  - transfer severity and reason
- Generates shareable transfer access via:
  - QR payload
  - share link
- Allows receiving team acknowledgement with arrival note and discrepancy flag
- Maintains transfer history (sent and received views)
- Supports OCR-assisted extraction from referral images to pre-fill transfer fields
- Supports QR input using:
  - live camera scan
  - image upload from device gallery
  - pasted link/code

## Tech Stack

### Backend

- Node.js
- Express 5
- MongoDB + Mongoose
- Groq SDK + Tesseract.js + Sharp (OCR pipeline)
- Multer (file upload)

### Frontend

- React Native 0.81
- Expo SDK 54
- React Navigation
- expo-camera (live scanning + decode-from-image)
- expo-image-picker, expo-clipboard, expo-sharing, expo-file-system

## Repository Structure

```text
MediRelay/
  backend/
    app.js
    server.js
    config/
      db.js
    models/
      PatientModel.js
      transferRecord.js
    routes/
      patientRoutes.js
      transferRoutes.js
      userRoutes.js
      ocrRoutes.js
    services/
      ocrService.js
  frontend/
    App.js
    src/
      api/
      screens/
      components/
      navigation/
      storage/
      store/
      theme/
```

## Data Models

### Patient

Stores long-lived patient profile details:

- identity and demographics
- ABHA ID (optional)
- allergies
- chronic conditions
- permanent medications

### TransferRecord

Stores each transfer event snapshot:

- patient reference + embedded patient snapshot
- sending/receiving hospital and doctor
- chief complaint, category, severity, reason for transfer
- vitals
- active medications (including must-not-stop)
- clinical summary
- pending investigations
- share ID and status (`draft`, `submitted`, `acknowledged`)

## API Overview

Base URL:

```text
http://localhost:8080/api/v1
```

### Patient APIs

- `POST /patients` create patient
- `GET /patients?doctorId=<id>` list patients for doctor
- `GET /patients/search?search=<query>&doctorId=<id>` search
- `GET /patients/:id?doctorId=<id>` get patient details

### Transfer APIs

- `POST /transfers` create transfer
- `GET /transfers?doctorId=<id>` transfer history by doctor
- `GET /transfers?patientId=<id>` transfer history by patient
- `GET /transfers/:id` get transfer by ID
- `GET /transfers/share/:shareId` get transfer by share ID
- `PATCH /transfers/:id` update transfer (for acknowledgement/status updates)

### OCR API

- `POST /ocr/extract-transfer` extract structured transfer details from uploaded image

## Current Transfer Workflow

1. Doctor logs in and selects a patient.
2. Sending team fills structured transfer form (or pre-fills via OCR).
3. App submits transfer and generates QR/share route.
4. Receiving team opens transfer via scan, gallery QR upload, or link paste.
5. Receiver marks as reviewed/acknowledged with arrival context.

## Setup

## Prerequisites

- Node.js 18+
- MongoDB Atlas or local MongoDB
- Expo Go app on phone or simulator/emulator

### 1) Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env` with:

```env
MONGODB_URI=<your_mongodb_connection_string>
GROQ_API_KEY=<your_groq_api_key>
PORT=8080
BACKEND_URL=http://localhost:8080
```

Start backend:

```bash
npm start
```

### 2) Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env` (or copy from `frontend/.env.example`):

```env
EXPO_PUBLIC_API_BASE_URL=http://<your-local-ip>:8080
```

Start app:

```bash
npx expo start
```

## Notes

- Use local network IP for `EXPO_PUBLIC_API_BASE_URL` when running on a physical device.
- QR scanning supports camera and gallery image decode.
- Share endpoint returns transfer JSON; mobile app provides the clinical receiver UI.

## Known Focus Areas

- Continue tightening validation constraints for all handoff fields.
- Expand reporting and analytics for transfer acknowledgement and discrepancies.
- Add broader integration options for external hospital systems.

## License

ISC
