const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();
console.log("MONGO_URI =", process.env.MONGO_URI);
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const hospitalRoutes = require("./routes/hospitals");
const doctorRoutes = require("./routes/doctors");
const appointmentRoutes = require("./routes/appointments");
const statsRoutes = require("./routes/stats");
const emergencyRoutes = require("./routes/emergencies");
const wardRoutes = require("./routes/wards");
const ambulanceRoutes = require("./routes/ambulances");
const medicalRecordRoutes = require("./routes/medicalRecords");
const messageRoutes = require("./routes/messages");
const http = require("http");
const { Server } = require("socket.io");
const Message = require("./models/Message");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Attach io to app so it's accessible in routes
app.set("io", io);

// Socket.io logic
io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join a specific room based on patient and hospital IDs
    socket.on("join_room", (room) => {
        socket.join(room);
        console.log(`User with ID: ${socket.id} joined room: ${room}`);
    });

    socket.on("send_message", async (data) => {
        // data should include: senderId, receiverId, senderModel, receiverModel, content, fileUrl, fileType, room
        try {
            const newMessage = new Message({
                senderId: data.senderId,
                receiverId: data.receiverId,
                senderModel: data.senderModel,
                receiverModel: data.receiverModel,
                content: data.content || "",
                fileUrl: data.fileUrl || "",
                fileType: data.fileType || "",
                timestamp: new Date(),
                status: 'sent'
            });
            await newMessage.save();

            // Emit to everyone in the room including the sender
            io.to(data.room).emit("receive_message", newMessage);
        } catch (error) {
            console.error("Error saving message:", error);
        }
    });

    socket.on("disconnect", () => {
        console.log("User disconnected", socket.id);
    });
});
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/emergencies", emergencyRoutes);
app.use("/api/wards", wardRoutes);
app.use("/api/ambulances", ambulanceRoutes);
app.use("/api/medical-records", medicalRecordRoutes);
app.use("/api/messages", messageRoutes);
app.use("/uploads", express.static("uploads"));

// Database Connection
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("MongoDB connection error:", err));

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
