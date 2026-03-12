const express = require("express");
const Hospital = require("../models/Hospital");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");
const router = express.Router();

// Register a new Hospital
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { name, address, lat, lng, type, departments, totalBeds, availableBeds, phone } = req.body;

        const hospital = new Hospital({
            name,
            address,
            location: {
                type: 'Point',
                coordinates: [parseFloat(lng), parseFloat(lat)] // GeoJSON is [lng, lat]
            },
            type,
            departments: departments || [],
            totalBeds,
            availableBeds,
            phone
        });

        await hospital.save();

        if (req.user && req.user.role === 'admin') {
            await User.findByIdAndUpdate(req.user.userId, {
                $addToSet: { hospitalIds: hospital._id }
            });
        }

        res.status(201).json(hospital);
    } catch (error) {
        console.error("Create hospital error:", error);
        res.status(500).json({ message: "Error creating hospital" });
    }
});

// Update a Hospital
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { name, address, lat, lng, type, departments, totalBeds, availableBeds, phone } = req.body;

        const updateData = {
            name,
            address,
            type,
            departments: departments || [],
            totalBeds,
            availableBeds,
            phone
        };

        if (lat && lng) {
            updateData.location = {
                type: 'Point',
                coordinates: [parseFloat(lng), parseFloat(lat)]
            };
        }

        const hospital = await Hospital.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!hospital) {
            return res.status(404).json({ message: "Hospital not found" });
        }

        res.json(hospital);
    } catch (error) {
        console.error("Update hospital error:", error);
        res.status(500).json({ message: "Error updating hospital" });
    }
});

// Delete a Hospital
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const hospital = await Hospital.findByIdAndDelete(req.params.id);
        if (!hospital) {
            return res.status(404).json({ message: "Hospital not found" });
        }
        res.json({ message: "Hospital deleted successfully" });
    } catch (error) {
        console.error("Delete hospital error:", error);
        res.status(500).json({ message: "Error deleting hospital" });
    }
});

// Get Hospitals (with optional Geospatial Search)
router.get("/", async (req, res) => {
    try {
        const { lat, lng, radius = 5000 } = req.query; // radius in meters

        let query = {};
        if (lat && lng) {
            query.location = {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: parseInt(radius)
                }
            };
        }

        const hospitals = await Hospital.find(query);

        // Transform for frontend (add distance if possible, flatten lat/lng)
        const result = hospitals.map(h => {
            const hObj = h.toObject();
            return {
                ...hObj,
                lat: hObj.location.coordinates[1],
                lng: hObj.location.coordinates[0],
                id: hObj._id
            };
        });

        res.json(result);
    } catch (error) {
        console.error("Get hospitals error:", error);
        res.status(500).json({ message: "Error fetching hospitals" });
    }
});

module.exports = router;
