const express = require("express");
const router = express.Router();
const Emergency = require("../models/Emergency");

// Create a new emergency case (SOS)
router.post("/", async (req, res) => {
    try {
        const { patientName, userId, phone, emergencyType, priority, location } = req.body;
        const newEmergency = new Emergency({
            patientName,
            userId,
            phone,
            emergencyType,
            priority,
            location,
        });
        const savedEmergency = await newEmergency.save();
        res.status(201).json(savedEmergency);
    } catch (error) {
        console.error("Error creating emergency:", error);
        res.status(500).json({ message: "Error creating emergency case" });
    }
});

// Get all emergency cases (Admin)
router.get("/", async (req, res) => {
    try {
        const emergencies = await Emergency.find()
            .sort({ createdAt: -1 })
            .populate('userId', 'name email')
            .populate('hospitalId', 'name');
        res.json(emergencies);
    } catch (error) {
        console.error("Error fetching emergencies:", error);
        res.status(500).json({ message: "Error fetching emergency cases" });
    }
});

// Get emergency history for a user
router.get("/my/:userId", async (req, res) => {
    try {
        const emergencies = await Emergency.find({ userId: req.params.userId })
            .sort({ createdAt: -1 })
            .populate('hospitalId', 'name');
        res.json(emergencies);
    } catch (error) {
        console.error("Error fetching user emergency history:", error);
        res.status(500).json({ message: "Error fetching history" });
    }
});

// Update emergency status or assign ambulance
router.put("/:id", async (req, res) => {
    try {
        const updatedEmergency = await Emergency.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: Date.now() },
            { new: true }
        );
        res.json(updatedEmergency);
    } catch (error) {
        console.error("Error updating emergency:", error);
        res.status(500).json({ message: "Error updating emergency case" });
    }
});

module.exports = router;
