const express = require("express");
const router = express.Router();
const Hospital = require("../models/Hospital");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const Emergency = require("../models/Emergency");
const jwt = require("jsonwebtoken");

router.get("/", async (req, res) => {
    try {
        let adminHospitals = null;
        let isAdmin = false;

        const authHeader = req.header("Authorization");
        if (authHeader) {
            const token = authHeader.replace("Bearer ", "");
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret");
                if (decoded.role === 'admin') {
                    isAdmin = true;
                    const user = await User.findById(decoded.userId);
                    if (user && user.hospitalIds) {
                        adminHospitals = user.hospitalIds;
                    } else {
                        adminHospitals = [];
                    }
                }
            } catch (err) {
                console.error("Token verification failed in stats:", err.message);
            }
        }

        let hospitalQuery = {};
        let doctorQuery = {};
        let appointmentQuery = {};
        let emergencyQuery = { status: 'incoming' };

        let messageQuery = { receiverModel: 'Hospital', status: { $ne: 'read' } };
        if (isAdmin && adminHospitals !== null) {
            hospitalQuery = { _id: { $in: adminHospitals } };
            doctorQuery = { hospitals: { $in: adminHospitals } };
            appointmentQuery = { hospital: { $in: adminHospitals } };
            emergencyQuery = { ...emergencyQuery, hospitalId: { $in: adminHospitals } };
            messageQuery = { ...messageQuery, receiverId: { $in: adminHospitals } };
        }

        const totalHospitals = await Hospital.countDocuments(hospitalQuery);
        const totalDoctors = await Doctor.countDocuments(doctorQuery);
        const totalAppointments = await Appointment.countDocuments(appointmentQuery);
        let totalPatients = 0;

        if (isAdmin && adminHospitals !== null && adminHospitals.length > 0) {
            // Get unique patients from appointments at admin's hospitals
            const appointmentPatients = await Appointment.distinct('patient', appointmentQuery);
            // Get unique registered patients from emergencies at admin's hospitals
            const emergencyPatients = await Emergency.distinct('userId', {
                ...emergencyQuery,
                userId: { $ne: null }
            });

            // Combine and count unique patients
            const uniquePatients = new Set([
                ...appointmentPatients.map(id => id.toString()),
                ...emergencyPatients.map(id => id.toString())
            ]);
            totalPatients = uniquePatients.size;
        } else {
            // Fallback to global patient count for super-admins or non-admins (if applicable)
            totalPatients = await User.countDocuments({ role: 'patient' });
        }
        const pendingEmergencies = await Emergency.countDocuments(emergencyQuery);
        const unreadMessages = await require('../models/Message').countDocuments(messageQuery);

        res.json({
            totalHospitals,
            totalDoctors,
            totalAppointments,
            totalPatients,
            pendingEmergencies,
            unreadMessages
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ message: "Error fetching statistics" });
    }
});

module.exports = router;
