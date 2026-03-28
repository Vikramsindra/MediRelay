const express = require("express");
const router = express.Router();

const Transfer = require("../models/trasferRecord.js");

// ==============================
// 🆕 Create Transfer (Draft)
// ==============================
router.post("/", async (req, res) => {
    try {
        const transfer = await Transfer.create({
            ...req.body,
            status: "draft"
        });

        res.status(201).json({
            success: true,
            data: transfer
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// ==============================
// ✏️ Update Transfer
// ==============================
router.patch("/:id", async (req, res) => {
    try {
        const transfer = await Transfer.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!transfer) {
            return res.status(404).json({
                success: false,
                message: "Transfer not found"
            });
        }

        res.status(200).json({
            success: true,
            data: transfer
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// ==============================
// 🚀 Submit Transfer (Generate QR)
// ==============================
router.post("/submit", async (req, res) => {
    try {
        const { transferId } = req.body;

        const transfer = await Transfer.findById(transferId);

        if (!transfer) {
            return res.status(404).json({
                success: false,
                message: "Transfer not found"
            });
        }

        // Generate IDs (simple version)
        transfer.reportId = "TR-" + Date.now();
        transfer.shareId = Math.random().toString(36).substring(2, 8);

        transfer.status = "submitted";

        await transfer.save();

        res.status(200).json({
            success: true,
            reportId: transfer.reportId,
            shareId: transfer.shareId,
            link: `http://localhost:8080/transfers/share/${transfer.shareId}`
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// ==============================
// 🔗 Get Transfer by Share ID
// ==============================
router.get("/share/:shareId", async (req, res) => {
    try {
        const transfer = await Transfer.findOne({
            shareId: req.params.shareId
        });

        if (!transfer) {
            return res.status(404).json({
                success: false,
                message: "Transfer not found"
            });
        }

        res.status(200).json({
            success: true,
            data: transfer
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// ==============================
// ✅ Acknowledge Transfer
// ==============================
router.post("/:id/acknowledge", async (req, res) => {
    try {
        const { condition, note, discrepancy } = req.body;

        const transfer = await Transfer.findById(req.params.id);

        if (!transfer) {
            return res.status(404).json({
                success: false,
                message: "Transfer not found"
            });
        }

        transfer.status = "acknowledged";
        transfer.acknowledgement = {
            condition,
            note,
            discrepancy,
            time: new Date()
        };

        await transfer.save();

        res.status(200).json({
            success: true,
            message: "Transfer acknowledged",
            data: transfer
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// ==============================
// 📥 Incoming Transfers
// ==============================
router.get("/incoming", async (req, res) => {
    try {
        const transfers = await Transfer.find({
            status: "submitted"
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: transfers
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// ==============================
// 📤 Sent Transfers
// ==============================
router.get("/sent", async (req, res) => {
    try {
        const transfers = await Transfer.find()
            .sort({ createdAt: -1 })
            .limit(5);

        res.status(200).json({
            success: true,
            data: transfers
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// ==============================
// 📜 Transfer History
// ==============================
router.get("/history", async (req, res) => {
    try {
        const { type } = req.query;

        let query = {};

        // Simple filtering (can improve later)
        if (type === "sent") {
            query = {}; // add doctor filter later
        }

        if (type === "received") {
            query = {}; // add hospital filter later
        }

        const transfers = await Transfer.find(query)
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: transfers
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;