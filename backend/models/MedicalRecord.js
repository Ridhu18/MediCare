const mongoose = require("mongoose");

const medicalRecordSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: false
    },
    appointment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: false
    },
    diagnosis: {
        type: String,
        required: true
    },
    medicines: [{
        name: String,
        dosage: String,
        duration: String,
        instructions: String
    }],
    allergies: [String],
    notes: String,
    attachments: [{
        name: String,
        url: String,
        fileType: String,
        uploadedAt: { type: Date, default: Date.now }
    }],
    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);
