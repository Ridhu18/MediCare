const express = require("express");
const router = express.Router();
const Ambulance = require("../models/Ambulance");

// Get all ambulances
router.get("/", async (req, res) => {
    try {
        const ambulances = await Ambulance.find();
        res.json(ambulances);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update ambulance status/location
router.put("/:id", async (req, res) => {
    try {
        const ambulance = await Ambulance.findOne({ ambulanceId: req.params.id });
        if (!ambulance) return res.status(404).json({ message: "Ambulance not found" });

        if (req.body.status) ambulance.status = req.body.status;
        if (req.body.currentLocation) ambulance.currentLocation = req.body.currentLocation;

        const updatedAmbulance = await ambulance.save();
        res.json(updatedAmbulance);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
