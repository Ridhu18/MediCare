const express = require("express");
const Doctor = require("../models/Doctor");
const User = require("../models/User");
const router = express.Router();

// Register a Doctor (Link existing user to hospital)
// Register a Doctor (Link existing user to hospital)
router.post("/", async (req, res) => {
    try {
        let { userId, name, email, phone, hospitalIds, specialization, experience, consultationFee } = req.body;

        // If no userId provided, find or create user by email
        if (!userId && email) {
            let user = await User.findOne({ email });
            if (!user) {
                // Determine a default password or handle it. 
                // For admin added doctors, we might set a default password like "doctor123"
                // Ideally, we'd email them a setup link, but for MVP:
                const bcrypt = require("bcryptjs");
                const hashedPassword = await bcrypt.hash("doctor123", 10);

                user = new User({
                    name,
                    email,
                    phone,
                    password: hashedPassword,
                    role: 'doctor'
                });
                await user.save();
                console.log(`Created new user for doctor: ${email}`);
            } else {
                // Ensure user has doctor role
                if (user.role !== 'doctor') {
                    user.role = 'doctor';
                    await user.save();
                }
            }
            userId = user._id;
        }

        if (!userId) {
            console.log("Validation Failed: User ID missing after lookup");
            return res.status(400).json({ message: "User identification (userId or email) is required." });
        }

        // Check if doctor profile already exists for this user
        let doctor = await Doctor.findOne({ user: userId });
        if (doctor) {
            console.log("Updating existing doctor:", doctor._id);
            doctor.hospitals = [...new Set([...doctor.hospitals, ...hospitalIds])];
            doctor.specialization = specialization || doctor.specialization;
            doctor.experience = experience || doctor.experience;
            doctor.consultationFee = consultationFee || doctor.consultationFee;
            await doctor.save();
            return res.status(200).json(doctor);
        }

        console.log("Creating new doctor for user:", userId);
        // Create new doctor profile
        doctor = new Doctor({
            user: userId,
            hospitals: hospitalIds, // Expect array of IDs
            specialization: specialization && specialization.trim() !== "" ? specialization : "General",
            experience: experience && experience.trim() !== "" ? experience : "0",
            consultationFee: consultationFee || 0
        });


        await doctor.save();
        res.status(201).json(doctor);
    } catch (error) {
        console.error("Create doctor error:", error);
        res.status(500).json({ message: "Error adding doctor", error: error.message });
    }
});

// Get doctors by Hospital
router.get("/", async (req, res) => {
    try {
        const { hospitalId } = req.query;
        let query = {};
        if (hospitalId) {
            query.hospitals = hospitalId; // Finds docs where hospitals array contains hospitalId
        }

        const doctors = await Doctor.find(query).populate('user', 'name email phone profileImage').populate('hospitals', 'name');
        res.json(doctors);
    } catch (error) {
        console.error("Get doctors error:", error);
        res.status(500).json({ message: "Error fetching doctors" });
    }
});

const authMiddleware = require("../middleware/auth");

// Get Current Doctor Profile
router.get("/me", authMiddleware, async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ user: req.user.userId })
            .populate('user', 'name email phone profileImage')
            .populate('hospitals', 'name');

        if (!doctor) {
            return res.status(404).json({ message: "Doctor profile not found" });
        }
        res.json(doctor);
    } catch (error) {
        console.error("Get doctor profile error:", error);
        res.status(500).json({ message: "Error fetching profile" });
    }
});

// Update Doctor Profile
router.put("/me", authMiddleware, async (req, res) => {
    try {
        const { specialization, experience, consultationFee, availability, bio, address, qualification, licenseNumber, department } = req.body;

        const doctor = await Doctor.findOneAndUpdate(
            { user: req.user.userId },
            {
                specialization,
                experience,
                consultationFee,
                availability, // Array of strings e.g. ["Mon 09:00-17:00"]
                bio,
                address,
                qualification,
                licenseNumber,
                department
            },
            { new: true }
        );

        if (!doctor) {
            return res.status(404).json({ message: "Doctor profile not found" });
        }
        res.json(doctor);
    } catch (error) {
        console.error("Update doctor profile error:", error);
        res.status(500).json({ message: "Error updating profile" });
    }
});

// Delete Doctor (Admin)
router.delete("/:id", async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) {
            return res.status(404).json({ message: "Doctor profile not found" });
        }

        const userId = doctor.user;
        if (userId) {
            const user = await User.findById(userId);
            if (user && user.role === 'doctor') {
                await User.findByIdAndDelete(userId);
                console.log(`Deleted user ${userId} associated with doctor ${req.params.id}`);
            }
        }

        await Doctor.findByIdAndDelete(req.params.id);
        res.json({ message: "Doctor deleted successfully" });
    } catch (error) {
        console.error("Delete doctor error:", error);
        res.status(500).json({ message: "Error deleting doctor" });
    }
});

// Update Doctor (Admin)
router.put("/:id", async (req, res) => {
    try {
        const { name, email, phone, specialization, experience, hospitalIds, department, consultationFee } = req.body;
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) {
            return res.status(404).json({ message: "Doctor profile not found" });
        }

        // Update associated User details
        if (doctor.user) {
            await User.findByIdAndUpdate(doctor.user, {
                name,
                email,
                phone
            });
        }

        // Update Doctor specific details
        doctor.specialization = specialization || doctor.specialization;
        doctor.experience = experience || doctor.experience;
        doctor.department = department || doctor.department;
        doctor.hospitals = hospitalIds || doctor.hospitals;
        doctor.consultationFee = consultationFee || doctor.consultationFee;

        await doctor.save();
        
        // Return populated doctor
        const updatedDoctor = await Doctor.findById(doctor._id)
            .populate('user', 'name email phone profileImage')
            .populate('hospitals', 'name');
            
        res.json(updatedDoctor);
    } catch (error) {
        console.error("Update doctor error:", error);
        res.status(500).json({ message: "Error updating doctor", error: error.message });
    }
});

module.exports = router;
