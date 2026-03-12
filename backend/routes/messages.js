const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const multer = require("multer");
const path = require("path");

// Configure Multer for chat attachments
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, "chat-" + Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Upload a file attachment for chat
router.post('/upload', upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const fileUrl = `/uploads/${req.file.filename}`;
        const fileType = req.file.mimetype;

        res.json({ fileUrl, fileType });
    } catch (error) {
        console.error("File upload error:", error);
        res.status(500).json({ message: "Error uploading file" });
    }
});

// Get conversations for a hospital (grouped by user)
router.get('/hospital/:hospitalId/conversations', async (req, res) => {
    try {
        const { hospitalId } = req.params;

        const messages = await Message.find({
            $or: [
                { receiverId: hospitalId },
                { senderId: hospitalId }
            ]
        }).sort({ timestamp: -1 }).populate('senderId', 'name').populate('receiverId', 'name');

        const conversationsMap = new Map();

        messages.forEach(msg => {
            const isUserSender = msg.senderModel === 'User';
            const userId = isUserSender ? msg.senderId._id.toString() : msg.receiverId._id.toString();
            const userName = isUserSender ? msg.senderId.name : msg.receiverId.name;

            if (!conversationsMap.has(userId)) {
                conversationsMap.set(userId, {
                    userId,
                    patientName: userName,
                    lastMessage: msg.content,
                    time: msg.timestamp,
                    unread: 0,
                    status: "online", // Placeholder
                    type: "general" // Placeholder
                });
            }

            // If the message is TO the hospital, and it's not read, increment unread count
            const isMsgToHospital = msg.receiverModel === 'Hospital' && msg.receiverId._id.toString() === hospitalId;
            if (isMsgToHospital && msg.status !== 'read') {
                conversationsMap.get(userId).unread += 1;
            }
        });

        res.json(Array.from(conversationsMap.values()));
    } catch (err) {
        console.error('Error fetching conversations:', err);
        res.status(500).json({ message: 'Server error fetching conversations.' });
    }
});

// Get messages between a user and a hospital
router.get('/:userId/:hospitalId', async (req, res) => {
    try {
        const { userId, hospitalId } = req.params;

        const messages = await Message.find({
            $or: [
                { senderId: userId, receiverId: hospitalId },
                { senderId: hospitalId, receiverId: userId }
            ]
        }).sort({ timestamp: 1 });

        res.json(messages);
    } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).json({ message: 'Server error fetching messages.' });
    }
});

// Update message status to 'read' (Optional enhancement)
router.put('/read', async (req, res) => {
    try {
        const { senderId, receiverId } = req.body;
        await Message.updateMany(
            { senderId, receiverId, status: { $ne: 'read' } },
            { $set: { status: 'read' } }
        );
        res.json({ message: 'Messages updated to read.' });
    } catch (err) {
        console.error('Error updating message status:', err);
        res.status(500).json({ message: 'Server error updating message status.' });
    }
});

module.exports = router;
