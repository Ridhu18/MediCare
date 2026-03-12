const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");
const multer = require("multer");
const path = require("path");

// Configure Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, "avatar-" + Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Error: Images Only!"));
    }
});

const router = express.Router();

// Signup
router.post("/signup", async (req, res) => {
    try {
        const { name, email, phone, password, role, hospitalIds } = req.body;

        // Check existing user
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const userData = {
            name,
            email,
            phone,
            password: hashedPassword,
            role: role || "patient",
        };

        if (role === 'admin' && hospitalIds && hospitalIds.length > 0) {
            userData.hospitalIds = hospitalIds;
        }

        const user = new User(userData);

        await user.save();

        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Login
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Generate Token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET || "default_secret",
            { expiresIn: "24h" }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                hospitalIds: user.hospitalIds
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get Current User Profile
router.get("/me", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Update User Profile
router.put("/me", authMiddleware, async (req, res) => {
    try {
        const {
            name,
            phone,
            address,
            healthId,
            dateOfBirth,
            bloodGroup,
            weight,
            height,
            allergies,
            medications,
            conditions,
            emergencyContacts
        } = req.body;

        // Build update object
        const updateFields = {};
        if (name) updateFields.name = name;
        if (phone) updateFields.phone = phone;
        if (address) updateFields.address = address;
        if (healthId) updateFields.healthId = healthId;
        if (dateOfBirth) updateFields.dateOfBirth = dateOfBirth;
        if (bloodGroup) updateFields.bloodGroup = bloodGroup;
        if (weight) updateFields.weight = weight;
        if (height) updateFields.height = height;
        if (allergies) updateFields.allergies = allergies;
        if (medications) updateFields.medications = medications;
        if (conditions) updateFields.conditions = conditions;
        if (emergencyContacts) updateFields.emergencyContacts = emergencyContacts;

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { $set: updateFields },
            { new: true }
        ).select("-password");

        res.json(user);
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Upload Profile Image
router.post("/avatar", authMiddleware, upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const imageUrl = `/uploads/${req.file.filename}`;

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { profileImage: imageUrl },
            { new: true }
        ).select("-password");

        res.json({ message: "Profile image updated", profileImage: imageUrl, user });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Generate ABHA ID
router.post("/generate-abha", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.healthId && user.healthId !== "Not Linked") {
            return res.status(400).json({ message: "ABHA Health ID already generated" });
        }

        const generatePart = (length) => Math.floor(Math.random() * Math.pow(10, length)).toString().padStart(length, '0');

        let abhaId;
        let isUnique = false;
        let attempts = 0;

        // Ensure unique ABHA ID across all users
        while (!isUnique && attempts < 10) {
            abhaId = `${generatePart(2)}-${generatePart(4)}-${generatePart(4)}-${generatePart(4)}`;
            const existingUser = await User.findOne({ healthId: abhaId });

            if (!existingUser) {
                isUnique = true;
            }
            attempts++;
        }

        if (!isUnique) {
            return res.status(500).json({ message: "Failed to generate unique ABHA ID. Please try again." });
        }

        user.healthId = abhaId;
        await user.save();

        res.json({ message: "ABHA Health ID generated successfully", healthId: abhaId });
    } catch (error) {
        console.error("Generate ABHA ID error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
