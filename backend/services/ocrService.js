const Tesseract = require('tesseract.js');
const Groq = require('groq-sdk');
const sharp = require('sharp');
const fs = require('fs');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

const logStep = (step, meta) => {
    const stamp = new Date().toISOString();
    if (meta === undefined) {
        console.log(`[OCR][${stamp}] ${step}`);
        return;
    }

    console.log(`[OCR][${stamp}] ${step}:`, meta);
};

const compactOcrText = (text) => {
    const lines = String(text || '')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line, index, arr) => !(line === '' && arr[index - 1] === ''));

    return lines.join('\n').trim();
};

const preprocessImage = async (imagePath) => {
    const processedPath = imagePath.replace(/\.(png|jpg|jpeg|webp)$/i, '_processed.png');

    await sharp(imagePath)
        .resize({ width: 2000, withoutEnlargement: false })
        .grayscale()
        .normalize()
        .sharpen()
        .png()
        .toFile(processedPath);

    return processedPath;
};

const safeParseJSON = (text) => {
    try {
        return JSON.parse(text);
    } catch (_err) {
        return null;
    }
};

const normalizeTransferParsed = (parsed) => {
    const source = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    const vitalsSource = source.vitals && typeof source.vitals === 'object' && !Array.isArray(source.vitals)
        ? source.vitals
        : {};

    return {
        chiefComplaint: source.chiefComplaint ?? null,
        reasonForTransfer: source.reasonForTransfer ?? null,
        conditionCategory: source.conditionCategory ?? null,
        severity: source.severity ?? null,
        vitals: {
            bp: vitalsSource.bp ?? null,
            hr: vitalsSource.hr ?? null,
            spo2: vitalsSource.spo2 ?? null,
            temp: vitalsSource.temp ?? null,
            rr: vitalsSource.rr ?? null,
            gcs: vitalsSource.gcs ?? null,
            bloodSugar: vitalsSource.bloodSugar ?? null,
        },
        activeMedications: Array.isArray(source.activeMedications) ? source.activeMedications : [],
        pendingInvestigations: Array.isArray(source.pendingInvestigations) ? source.pendingInvestigations : [],
        clinicalSummary: source.clinicalSummary ?? null,
        sendingHospital: source.sendingHospital ?? null,
        receivingHospital: source.receivingHospital ?? null,
        doctorName: source.doctorName ?? null,
    };
};

const extractRawText = async (imagePath) => {
    logStep('1/8 Received image path', imagePath);
    logStep('2/8 Preprocessing image started');
    const processedPath = await preprocessImage(imagePath);
    logStep('2/8 Preprocessing image completed', processedPath);

    logStep('3/8 Tesseract OCR started');
    const { data: { text } } = await Tesseract.recognize(
        processedPath,
        'eng',
        {
            logger: (m) => {
                if (m.status === 'recognizing text') {
                    process.stdout.write(`\rOCR: ${Math.round(m.progress * 100)}%`);
                }
            },
            tessedit_pageseg_mode: 6,
            tessedit_ocr_engine_mode: 3,
            preserve_interword_spaces: 1,
        }
    );
    process.stdout.write('\n');
    logStep('3/8 Tesseract OCR completed');

    logStep('4/8 Cleaning temporary processed image');
    fs.unlink(processedPath, () => {});
    logStep('4/8 Temporary image cleanup queued');

    const trimmed = text.trim();
    const compacted = compactOcrText(trimmed);
    logStep('5/8 Raw OCR text prepared', {
        originalCharCount: trimmed.length,
        compactedCharCount: compacted.length,
    });
    return compacted;
};

const structureWithGroq = async (rawText) => {
    const systemPrompt = `You are a medical data extraction assistant.
Return only valid JSON with no markdown.
If any field is missing, keep scalar values as null and arrays as [].`;

        const userPrompt = `Extract only transfer-form details from OCR text into this exact JSON shape:
{
  "chiefComplaint": null,
  "reasonForTransfer": null,
  "conditionCategory": null,
  "severity": null,
  "vitals": {
    "bp": null,
    "hr": null,
    "spo2": null,
    "temp": null,
    "rr": null,
    "gcs": null,
    "bloodSugar": null
  },
  "activeMedications": [],
  "pendingInvestigations": [],
  "clinicalSummary": null,
  "sendingHospital": null,
  "receivingHospital": null,
  "doctorName": null
}

OCR text:\n"""${rawText}"""`;

    logStep('6/8 Sending OCR text to Groq for structuring', { charCount: rawText.length });
    const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
        temperature: 0,
        max_tokens: 1500,
    });
    logStep('6/8 Groq response received');

    const rawJson = String(response?.choices?.[0]?.message?.content || '').trim();
    const cleaned = rawJson.replace(/```json|```/g, '').trim();
    logStep('7/8 Parsing Groq JSON response');
    const parsed = safeParseJSON(cleaned);

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Groq did not return valid JSON');
    }

    const normalized = normalizeTransferParsed(parsed);
    logStep('7/8 JSON parsed and normalized successfully');
    return normalized;
};

const extractTextFromImage = async (imagePath) => {
    logStep('0/8 OCR request received');
    if (!process.env.GROQ_API_KEY) {
        logStep('CONFIG ERROR GROQ_API_KEY is not set');
        throw new Error('GROQ_API_KEY is not set');
    }

    const rawText = await extractRawText(imagePath);
    const parsed = await structureWithGroq(rawText);
    logStep('8/8 Final structured JSON to be sent');
    console.log(JSON.stringify(parsed, null, 2));

    return { rawText, parsed };
};

module.exports = { extractTextFromImage };