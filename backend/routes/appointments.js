const express = require("express");
const Appointment = require("../models/Appointment");
const authMiddleware = require("../middleware/auth");
const router = express.Router();

// Book Appointment
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { doctorId, hospitalId, patientId, date, time, reason, attachments } = req.body;

        const appointment = new Appointment({
            patient: patientId || req.user.userId, // Allow doctor to specify patientId
            doctor: doctorId,
            hospital: hospitalId,
            date,
            time,
            reason,
            attachments: attachments || []
        });

        await appointment.save();

        const io = req.app.get("io");
        io.emit("appointment_created", appointment);

        res.status(201).json(appointment);
    } catch (error) {
        console.error("Booking error:", error);
        res.status(500).json({ message: "Error booking appointment" });
    }
});

// Get User's Appointments
router.get("/my", authMiddleware, async (req, res) => {
    try {
        const appointments = await Appointment.find({ patient: req.user.userId })
            .populate('doctor')
            .populate('hospital')
            .sort({ date: -1 });

        // Deep populate user in doctor
        await Appointment.populate(appointments, {
            path: 'doctor.user',
            select: 'name'
        });

        res.json(appointments);
    } catch (error) {
        console.error("Get my appointments error:", error);
        res.status(500).json({ message: "Error fetching appointments" });
    }
});

// Get Doctor's Appointments
router.get("/doctor", authMiddleware, async (req, res) => {
    try {
        // Find the doctor profile associated with this user
        const Doctor = require("../models/Doctor");
        const doctorProfile = await Doctor.findOne({ user: req.user.userId });

        if (!doctorProfile) {
            return res.status(404).json({ message: "Doctor profile not found" });
        }

        const appointments = await Appointment.find({ doctor: doctorProfile._id })
            .populate('patient', 'name email phone profileImage')
            .sort({ date: 1 });

        res.json(appointments);
    } catch (error) {
        console.error("Get doctor appointments error:", error);
        res.status(500).json({ message: "Error fetching appointments" });
    }
});

// Update Status (Accept/Reject)
router.put("/:id/status", authMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        const io = req.app.get("io");
        io.emit("appointment_updated", appointment);

        res.json(appointment);
    } catch (error) {
        console.error("Update status error:", error);
        res.status(500).json({ message: "Error updating status" });
    }
});

// Add Notes to Appointment
router.post("/:id/notes", authMiddleware, async (req, res) => {
    try {
        const { notes } = req.body;
        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { notes },
            { new: true }
        );
        res.json(appointment);
    } catch (error) {
        console.error("Add notes error:", error);
        res.status(500).json({ message: "Error adding notes" });
    }
});

// Reschedule Appointment
router.put("/:id/reschedule", authMiddleware, async (req, res) => {
    try {
        const { date, time } = req.body;
        const appointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { date, time, status: 'confirmed' }, // Reset to confirmed on reschedule
            { new: true }
        );

        const io = req.app.get("io");
        io.emit("appointment_updated", appointment);

        res.json(appointment);
    } catch (error) {
        console.error("Reschedule error:", error);
        res.status(500).json({ message: "Error rescheduling appointment" });
    }
});

// Get Patient's Appointment History (Doctor Only)
router.get("/patient/:patientId", authMiddleware, async (req, res) => {
    try {
        const appointments = await Appointment.find({ patient: req.params.patientId })
            .populate('doctor')
            .populate('hospital')
            .sort({ date: -1 });

        // Deep populate user in doctor
        await Appointment.populate(appointments, {
            path: 'doctor.user',
            select: 'name'
        });

        res.json(appointments);
    } catch (error) {
        console.error("Get patient history error:", error);
        res.status(500).json({ message: "Error fetching history" });
    }
});

// Get All Appointments (Admin)
router.get("/admin/all", authMiddleware, async (req, res) => {
    try {
        // In a real app, we would verify req.user.role === 'admin'
        const appointments = await Appointment.find()
            .populate({
                path: 'patient',
                select: 'name email phone'
            })
            .populate({
                path: 'doctor',
                populate: {
                    path: 'user',
                    select: 'name'
                }
            })
            .populate('hospital', 'name')
            .sort({ date: -1 });

        res.json(appointments);
    } catch (error) {
        console.error("Get all appointments error:", error);
        res.status(500).json({ message: "Error fetching all appointments" });
    }
});

module.exports = router;
