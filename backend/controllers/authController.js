const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, error: "All fields are required" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, error: "Email already registered" });
        }

        const assignedRole = role === 'doctor' ? 'doctor' : 'patient';
        const isApproved = assignedRole === 'doctor' ? false : true;
        
        const user = new User({ name, email, password, role: assignedRole, isApproved });
        await user.save();

        const token = jwt.sign(
            { _id: user._id.toString() },
            process.env.JWT_SECRET || "secret_key"
        );

        res.status(201).json({ success: true, data: { user, token } });
    } catch (error) {
        console.error("REGISTER ERROR:", error);
        res.status(500).json({ success: false, error: error.message || "Internal Server Error" });
    }
};

exports.login = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user || !(await user.comparePassword(req.body.password))) {
            return res.status(400).json({ success: false, error: 'Invalid login credentials' });
        }
        
        if (user.role === 'doctor' && !user.isApproved) {
            return res.status(403).json({ success: false, error: 'Your account is pending admin approval.' });
        }

        const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET || 'secret_key');
        res.status(200).json({ success: true, data: { user, token } });
    } catch (error) {
        console.error("LOGIN ERROR:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
};

exports.getDoctors = async (req, res) => {
    try {
        const doctors = await User.find({ role: 'doctor', isApproved: true }).select('name email');
        res.status(200).json({ success: true, data: doctors });
    } catch (error) {
        console.error("GET DOCTORS ERROR:", error);
        res.status(500).json({ success: false, error: error.message || "Internal Server Error" });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ success: false, error: "All fields are required" });
        }

        const validRoles = ['patient', 'doctor', 'admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ success: false, error: "Invalid role specified" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, error: "Email already registered" });
        }

        const user = new User({ name, email, password, role });
        await user.save();

        res.status(201).json({ 
            success: true, 
            data: { message: "User created successfully", user: { _id: user._id, name: user.name, email: user.email, role: user.role } } 
        });
    } catch (error) {
        console.error("CREATE USER ERROR:", error);
        res.status(500).json({ success: false, error: error.message || "Internal Server Error" });
    }
};

exports.getAllDoctors = async (req, res) => {
    try {
        const doctors = await User.find({ role: 'doctor' }).select('-password');
        res.status(200).json({ success: true, data: doctors });
    } catch (error) {
        console.error("GET ALL DOCTORS ERROR:", error);
        res.status(500).json({ success: false, error: error.message || "Internal Server Error" });
    }
};

exports.approveDoctor = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || user.role !== 'doctor') {
            return res.status(404).json({ success: false, error: "Doctor not found" });
        }
        user.isApproved = true;
        await user.save();
        res.status(200).json({ success: true, data: { message: "Doctor approved" } });
    } catch (error) {
        console.error("APPROVE DOCTOR ERROR:", error);
        res.status(500).json({ success: false, error: error.message || "Internal Server Error" });
    }
};
