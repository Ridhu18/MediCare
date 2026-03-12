const express = require("express");
const router = express.Router();
const Ward = require("../models/Ward");

// Get all wards
router.get("/", async (req, res) => {
    try {
        const wards = await Ward.find();
        res.json(wards);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update ward beds
router.put("/:id", async (req, res) => {
    try {
        const ward = await Ward.findById(req.params.id);
        if (!ward) return res.status(404).json({ message: "Ward not found" });

        if (req.body.occupiedBeds !== undefined) ward.occupiedBeds = req.body.occupiedBeds;
        if (req.body.reservedBeds !== undefined) ward.reservedBeds = req.body.reservedBeds;
        if (req.body.maintenanceBeds !== undefined) ward.maintenanceBeds = req.body.maintenanceBeds;

        const updatedWard = await ward.save();
        res.json(updatedWard);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// For seeding/initial setup - create multiple wards
router.post("/seed", async (req, res) => {
    try {
        const initialWards = [
            {
                name: "General Ward A",
                type: "general",
                totalBeds: 50,
                occupiedBeds: 38,
                reservedBeds: 5,
                maintenanceBeds: 2,
            },
            {
                name: "General Ward B",
                type: "general",
                totalBeds: 50,
                occupiedBeds: 42,
                reservedBeds: 3,
                maintenanceBeds: 1,
            },
            {
                name: "ICU",
                type: "icu",
                totalBeds: 20,
                occupiedBeds: 18,
                reservedBeds: 1,
                maintenanceBeds: 0,
            },
            {
                name: "Emergency Ward",
                type: "emergency",
                totalBeds: 30,
                occupiedBeds: 22,
                reservedBeds: 4,
                maintenanceBeds: 1,
            },
            {
                name: "Pediatric Ward",
                type: "pediatric",
                totalBeds: 25,
                occupiedBeds: 15,
                reservedBeds: 2,
                maintenanceBeds: 1,
            },
            {
                name: "Maternity Ward",
                type: "maternity",
                totalBeds: 20,
                occupiedBeds: 12,
                reservedBeds: 3,
                maintenanceBeds: 0,
            },
        ];

        await Ward.deleteMany({});
        const createdWards = await Ward.insertMany(initialWards);
        res.status(201).json(createdWards);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
