const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const MedicalRecord = require("../models/MedicalRecord");
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const Hospital = require("../models/Hospital");
const authMiddleware = require("../middleware/auth");
const router = express.Router();

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Create Medical Record (Supports Doctor creating for patient, or Patient self-upload)
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { appointmentId, patientId, diagnosis, medicines, allergies, notes, attachments } = req.body;

        // Check if user is a doctor
        const doctorProfile = await Doctor.findOne({ user: req.user.userId });
        
        // If not a doctor, verify they are uploading for themselves
        if (!doctorProfile) {
            if (req.user.userId !== patientId) {
                return res.status(403).json({ message: "Only doctors or the patient themselves can create medical records." });
            }
        }

        const medicalRecord = new MedicalRecord({
            patient: patientId,
            doctor: doctorProfile?._id || null, // Optional for self-uploads
            appointment: appointmentId || null, // Optional for self-uploads
            diagnosis: diagnosis || "Self-Uploaded Document",
            medicines: medicines || [],
            allergies: allergies || [],
            notes: notes || "",
            attachments: attachments || []
        });

        await medicalRecord.save();

        // Mark appointment as completed (if exists)
        if (appointmentId) {
            const updatedApt = await Appointment.findByIdAndUpdate(appointmentId, { status: 'completed' }, { new: true });
            const io = req.app.get("io");
            if (io) io.emit("appointment_updated", updatedApt);
        }

        res.status(201).json(medicalRecord);
    } catch (error) {
        console.error("Create medical record error:", error);
        res.status(500).json({ message: "Error creating medical record", error: error.message });
    }
});

// File Upload Route
router.post("/upload", authMiddleware, upload.single("file"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        const fileUrl = `/uploads/${req.file.filename}`;
        res.json({
            name: req.file.originalname,
            url: fileUrl,
            fileType: req.file.mimetype
        });
    } catch (error) {
        res.status(500).json({ message: "FileUpload error", error: error.message });
    }
});

// Get My Medical Records (Patient)
router.get("/my", authMiddleware, async (req, res) => {
    try {
        const records = await MedicalRecord.find({ patient: req.user.userId })
            .populate({
                path: 'doctor',
                populate: { path: 'user', select: 'name' }
            })
            .populate({
                path: 'appointment',
                populate: { path: 'hospital', select: 'name' }
            })
            .sort({ date: -1 });
        res.json(records);
    } catch (error) {
        console.error("Get my records error:", error);
        res.status(500).json({ message: "Error fetching medical records" });
    }
});

// Get Single Medical Record Detail
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const record = await MedicalRecord.findById(req.params.id)
            .populate({
                path: 'doctor',
                populate: { path: 'user', select: 'name' }
            })
            .populate({
                path: 'appointment',
                populate: { path: 'hospital', select: 'name' }
            });

        if (!record) {
            return res.status(404).json({ message: "Medical record not found" });
        }

        // Basic authorization check: Patient who owns it or a Doctor can see it
        // In a stricter app, we'd check if THIS specific doctor has a relationship with the patient
        const isOwner = record.patient.toString() === req.user.userId;
        const Doctor = require("../models/Doctor");
        const isDoctor = await Doctor.exists({ user: req.user.userId });

        if (!isOwner && !isDoctor) {
            return res.status(403).json({ message: "Not authorized to view this record" });
        }

        res.json(record);
    } catch (error) {
        console.error("Get record detail error:", error);
        res.status(500).json({ message: "Error fetching medical record detail" });
    }
});

// Get Patient's Records (Doctor Only)
router.get("/patient/:patientId", authMiddleware, async (req, res) => {
    try {
        const doctorProfile = await Doctor.findOne({ user: req.user.userId });
        if (!doctorProfile) {
            return res.status(403).json({ message: "Only doctors can view patient records." });
        }

        const records = await MedicalRecord.find({ patient: req.params.patientId })
            .populate({
                path: 'doctor',
                populate: { path: 'user', select: 'name' }
            })
            .populate({
                path: 'appointment',
                populate: { path: 'hospital', select: 'name' }
            })
            .sort({ date: -1 });
        res.json(records);
    } catch (error) {
        console.error("Get patient records error:", error);
        res.status(500).json({ message: "Error fetching medical records" });
    }
});

// Get Medical Record by Appointment ID
router.get("/appointment/:appointmentId", authMiddleware, async (req, res) => {
    try {
        const record = await MedicalRecord.findOne({ appointment: req.params.appointmentId })
            .populate({
                path: 'doctor',
                populate: { path: 'user', select: 'name' }
            })
            .populate({
                path: 'appointment',
                populate: { path: 'hospital', select: 'name' }
            });

        if (!record) {
            return res.status(404).json({ message: "Medical record not found for this appointment" });
        }

        res.json(record);
    } catch (error) {
        console.error("Get record by appointment error:", error);
        res.status(500).json({ message: "Error fetching medical record" });
    }
});

// Delete Medical Record (Only if self-uploaded by patient)
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const record = await MedicalRecord.findById(req.params.id);
        
        if (!record) {
            return res.status(404).json({ message: "Medical record not found" });
        }

        // Check if the record belongs to the user and is a self-upload (doctor is null)
        const isOwner = record.patient.toString() === req.user.userId;
        const isSelfUpload = !record.doctor;

        if (!isOwner) {
            return res.status(403).json({ message: "You are not authorized to delete this record" });
        }

        if (!isSelfUpload) {
            return res.status(403).json({ message: "Only self-uploaded records can be deleted by the patient" });
        }

        await MedicalRecord.findByIdAndDelete(req.params.id);
        res.json({ message: "Medical record deleted successfully" });
    } catch (error) {
        console.error("Delete record error:", error);
        res.status(500).json({ message: "Error deleting medical record" });
    }
});

module.exports = router;
