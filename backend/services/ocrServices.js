// ─────────────────────────────────────────────
// 📦 Imports
// ─────────────────────────────────────────────
const Tesseract = require('tesseract.js');
const { GoogleGenAI } = require('@google/genai');
const fsPromises = require('fs/promises');

// ─────────────────────────────────────────────
// 🔐 Gemini Initialization
// ─────────────────────────────────────────────
const genAI = new GoogleGenAI({
    apiKey: process.env.API_KEY,
});

// ─────────────────────────────────────────────
// 🧠 Safe JSON Parser
// ─────────────────────────────────────────────
const safeParseJSON = (text) => {
    try {
        return JSON.parse(text);
    } catch (err) {
        console.error('\n❌ JSON Parse Error:', err.message);
        console.error('\n⚠️ Raw Response:\n', text);
        return null;
    }
};

// ─────────────────────────────────────────────
// 🧾 Step 1: OCR
// ─────────────────────────────────────────────
const extractRawText = async (imagePath) => {
    const { data: { text } } = await Tesseract.recognize(
        imagePath,
        'eng',
        {
            logger: (m) => {
                if (m.status === 'recognizing text') {
                    process.stdout.write(`\rOCR: ${Math.round(m.progress * 100)}%`);
                }
            }
        }
    );

    console.log('\n\n📄 ===== OCR EXTRACTED TEXT =====\n');
    console.log(text.trim());
    console.log('\n================================\n');

    // Cleanup image
    try {
        await fsPromises.unlink(imagePath);
    } catch (err) {
        console.error('Cleanup error:', err.message);
    }

    return text.trim();
};

// ─────────────────────────────────────────────
// 🤖 Step 2: Gemini Structuring
// ─────────────────────────────────────────────
const extractGeminiText = (response) => {
    if (!response) return null;

    const search = (value) => {
        if (!value) return null;
        if (typeof value === 'string') return value.trim() ? value : null;
        if (Array.isArray(value)) {
            for (const item of value) {
                const found = search(item);
                if (found) return found;
            }
            return null;
        }
        if (typeof value === 'object') {
            if (typeof value.text === 'string' && value.text.trim()) return value.text;
            if (value.content) {
                const found = search(value.content);
                if (found) return found;
            }
            if (value.output) {
                const found = search(value.output);
                if (found) return found;
            }
            if (value.results) {
                const found = search(value.results);
                if (found) return found;
            }
            if (value.candidates) {
                const found = search(value.candidates);
                if (found) return found;
            }
            for (const nested of Object.values(value)) {
                const found = search(nested);
                if (found) return found;
            }
        }
        return null;
    };

    return search(response);
};

const tryGenerateContent = async (model, prompt) => {
    const response = await genAI.models.generateContent({
        model,
        contents: [
            {
                role: "user",
                parts: [{ text: prompt }]
            }
        ],
    });

    const raw = extractGeminiText(response);
    if (!raw) {
        console.error(`⚠️ No text found in Gemini response for model ${model}`);
        console.error(JSON.stringify(response, null, 2));
        throw new Error(`No text returned for model ${model}`);
    }

    console.log(`\n🤖 ===== GEMINI RAW RESPONSE (${model}) =====\n`);
    console.log(raw);
    console.log('\n=================================\n');

    const cleaned = raw.replace(/```json|```/g, '').trim();
    return safeParseJSON(cleaned);
};

const structureWithGemini = async (rawText) => {
    const prompt = `
You are a medical data extraction assistant.

Return ONLY valid JSON.
Do NOT include markdown or explanation.

Extract structured data from:

"""${rawText}"""
`;

    const modelsToTry = [
        "gemini-1.5-flash",
        "gemini-1.5",
        "gemini-1.0",
        "gemini-1.5-proto",
    ];

    for (const model of modelsToTry) {
        try {
            return await tryGenerateContent(model, prompt);
        } catch (err) {
            const message = err?.message?.toString?.() ?? '';
            if (message.includes('not found') || message.includes('NOT_FOUND')) {
                console.warn(`⚠️ Model ${model} unavailable, trying next fallback.`);
                continue;
            }
            console.error('❌ Gemini Error:', message);
            return null;
        }
    }

    console.error('❌ Gemini Error: no compatible model available');
    return null;
};

// ─────────────────────────────────────────────
// 🚀 Main Function
// ─────────────────────────────────────────────
const extractTextFromImage = async (imagePath) => {
    const rawText = await extractRawText(imagePath);
    console.log('✅ OCR done');

    const parsed = await structureWithGemini(rawText);
    console.log('✅ Gemini structuring done');

    return { rawText, parsed };
};

// ─────────────────────────────────────────────
// 🧪 Test Runner
// ─────────────────────────────────────────────
const testRun = async () => {
    try {
        const result = await extractTextFromImage('./image.png');

        console.log('\n📦 ===== FINAL OUTPUT =====\n');

        console.log('📄 Raw Text:\n');
        console.log(result.rawText);

        console.log('\n✅ Parsed JSON:\n');
        console.log(JSON.stringify(result.parsed, null, 2));

        console.log('\n===========================\n');

    } catch (err) {
        console.error('❌ Error:', err.message);
    }
};

testRun();

// ─────────────────────────────────────────────
// 📦 Export
// ─────────────────────────────────────────────
module.exports = { extractTextFromImage };
