const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require("mongoose");
require("dotenv").config();
const Hospital = require("./models/Hospital");
const User = require("./models/User");
const Doctor = require("./models/Doctor");
const Ward = require("./models/Ward");
const Ambulance = require("./models/Ambulance");
const bcrypt = require("bcryptjs");

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log(err));

const seedData = async () => {
    try {

        await Hospital.deleteMany({});
        await Doctor.deleteMany({});
        await Ward.deleteMany({});
        await Ambulance.deleteMany({});


        console.log("Cleared old data");


        const hospitals = [
            {
                name: "City General Hospital",
                address: "123 Main Street, Downtown",
                location: { type: "Point", coordinates: [77.5946, 12.9716] },
                type: "Government",
                departments: ["Emergency", "Cardiology", "Neurology", "Orthopedics"],
                totalBeds: 50,
                availableBeds: 12,
                phone: "+91 11 2345 6789",
                rating: 4.5
            },
            {
                name: "Apollo Medical Center",
                address: "456 Health Avenue",
                location: { type: "Point", coordinates: [77.6245, 12.9352] },
                type: "Private",
                departments: ["Emergency", "Cardiology", "Oncology", "Pediatrics"],
                totalBeds: 80,
                availableBeds: 8,
                phone: "+91 11 9876 5432",
                rating: 4.8
            }
        ];

        const createdHospitals = await Hospital.insertMany(hospitals);
        console.log("Hospitals Created");

        // 2. Create a Doctor User
        const hashedPassword = await bcrypt.hash("password123", 10);

        let doctorUser = await User.findOne({ email: "doctor@example.com" });
        if (!doctorUser) {
            doctorUser = await User.create({
                name: "Dr. Rajesh Kumar",
                email: "doctor@example.com",
                password: hashedPassword,
                phone: "9876543210",
                role: "doctor"
            });
            console.log("Doctor User Created");
        }

        // 2.5 Create Admin User
        let adminUser = await User.findOne({ email: "admin@hospital.com" });
        if (!adminUser) {
            const adminHash = await bcrypt.hash("admin123", 10);
            adminUser = await User.create({
                name: "Hospital Admin",
                email: "admin@hospital.com",
                password: adminHash,
                phone: "9999999999",
                role: "admin"
            });
            console.log("Admin User Created");
        }

        // 3. Link Doctor to First Hospital
        await Doctor.create({
            user: doctorUser._id,
            hospital: createdHospitals[0]._id, // City General
            specialization: "Cardiologist",
            experience: "10 Years",
            consultationFee: 500,
            availability: ["Mon", "Wed", "Fri"],
            patientsServed: 1200,
            rating: 4.9
        });

        console.log("Doctor Profile Created");

        // 4. Create Wards
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

        await Ward.insertMany(initialWards);
        console.log("Wards Seeded");

        // 5. Create Ambulances
        const initialAmbulances = [
            {
                ambulanceId: "AMB-001",
                vehicleNumber: "KA-01-AB-1234",
                driver: "Rajesh K",
                status: "dispatched",
                currentLocation: "En route to Koramangala",
            },
            {
                ambulanceId: "AMB-002",
                vehicleNumber: "KA-01-CD-5678",
                driver: "Sunil M",
                status: "dispatched",
                currentLocation: "Near Indiranagar",
            },
            {
                ambulanceId: "AMB-003",
                vehicleNumber: "KA-01-EF-9012",
                driver: "Ramesh P",
                status: "dispatched",
                currentLocation: "HSR Layout",
            },
            {
                ambulanceId: "AMB-004",
                vehicleNumber: "KA-01-GH-3456",
                driver: "Venkat S",
                status: "available",
            },
            {
                ambulanceId: "AMB-005",
                vehicleNumber: "KA-01-IJ-7890",
                driver: "Krishna R",
                status: "available",
            },
            {
                ambulanceId: "AMB-006",
                vehicleNumber: "KA-01-KL-2345",
                driver: "Prakash N",
                status: "returning",
                currentLocation: "5 min to base",
            },
        ];

        await Ambulance.insertMany(initialAmbulances);
        console.log("Ambulances Seeded");

        process.exit();
    } catch (error) {
        console.error("Error seeding data:", error);
        process.exit(1);
    }
};

seedData();
