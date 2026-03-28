const TransferRecord = require("../models/TransferRecord");
const generateQR = require("../utils/generateQR");
const crypto = require("crypto");

exports.createTransfer = async (req, res) => {
    try {
        const newTransfer = new TransferRecord(req.body);

        // 1. Generate a short, unique Share ID (e.g., TR-a1b2c3)
        const shortId = crypto.randomBytes(3).toString("hex");
        newTransfer.shareId = `TR-${shortId}`;

        // 2. Create the link that the QR code will open
        // In production, replace localhost with your actual domain
        const shareLink = `http://localhost:8080/api/v1/transfers/scan/${newTransfer.shareId}`;

        // 3. Generate the QR Code Base64 string
        newTransfer.qrCode = await generateQR(shareLink);

        await newTransfer.save();

        res.status(201).json({
            success: true,
            message: "Transfer created with QR code",
            data: newTransfer
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};