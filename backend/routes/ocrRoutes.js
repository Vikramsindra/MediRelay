const express = require("express");
const multer = require("multer");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");

const { extractTextFromImage } = require("../services/ocrService.js");

const router = express.Router();

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname || "") || ".jpg";
        cb(null, `ocr-${Date.now()}${ext}`);
    },
});

const upload = multer({ storage });

router.post("/extract", upload.single("image"), async (req, res) => {
    try {
        if (!req.file?.path) {
            return res.status(400).json({
                success: false,
                message: "Image file is required",
            });
        }

        const result = await extractTextFromImage(req.file.path);

        try {
            await fsp.unlink(req.file.path);
        } catch (_error) {
            // Ignore upload temp cleanup failures.
        }

        const responsePayload = {
            success: true,
            data: {
                rawText: String(result?.rawText || ""),
                parsed: result?.parsed && typeof result.parsed === "object" ? result.parsed : {},
            },
        };

        console.log("[OCR][ROUTE] Final response payload summary:");
        console.log(JSON.stringify({
            success: responsePayload.success,
            data: {
                rawTextCharCount: responsePayload.data.rawText.length,
                rawTextPreview: responsePayload.data.rawText.slice(0, 220),
                parsed: responsePayload.data.parsed,
            },
        }, null, 2));

        return res.status(200).json(responsePayload);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error?.message || "OCR extraction failed",
        });
    }
});

module.exports = router;