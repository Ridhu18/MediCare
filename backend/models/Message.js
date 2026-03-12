const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'senderModel'
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'receiverModel'
    },
    senderModel: {
        type: String,
        required: true,
        enum: ['User', 'Hospital']
    },
    receiverModel: {
        type: String,
        required: true,
        enum: ['User', 'Hospital']
    },
    content: {
        type: String,
        default: ""
    },
    fileUrl: {
        type: String,
        default: ""
    },
    fileType: {
        type: String,
        default: "" // e.g. "image/png", "application/pdf"
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read'],
        default: 'sent'
    }
});

// Index for quicker queries
messageSchema.index({ senderId: 1, receiverId: 1 });

module.exports = mongoose.model("Message", messageSchema);
