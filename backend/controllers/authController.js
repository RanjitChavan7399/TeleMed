const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email already registered" });
        }

        // Allow patient or doctor. Default to patient. Reject admin self-registration.
        const assignedRole = role === 'doctor' ? 'doctor' : 'patient';
        // Doctors need admin approval before they can login
        const isApproved = assignedRole === 'doctor' ? false : true;
        
        const user = new User({ name, email, password, role: assignedRole, isApproved });
        await user.save();

        const token = jwt.sign(
            { _id: user._id.toString() },
            process.env.JWT_SECRET || "secret_key"
        );

        res.status(201).json({ user, token });

    } catch (error) {
        console.error("REGISTER ERROR:", error);
        res.status(500).json({ error: error.message });
    }
};
exports.login = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user || !(await user.comparePassword(req.body.password))) {
            return res.status(400).send({ error: 'Invalid login credentials' });
        }
        
        // Prevent unapproved doctors from logging in
        if (user.role === 'doctor' && !user.isApproved) {
            return res.status(403).send({ error: 'Your account is pending admin approval.' });
        }

        const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET || 'secret_key');
        res.send({ user, token });
    } catch (e) {
        res.status(500).send();
    }
};

exports.getDoctors = async (req, res) => {
    try {
        const doctors = await User.find({ role: 'doctor', isApproved: true }).select('name email');
        res.status(200).json(doctors);
    } catch (error) {
         res.status(500).json({ error: error.message });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const validRoles = ['patient', 'doctor', 'admin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: "Invalid role specified" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email already registered" });
        }

        const user = new User({ name, email, password, role });
        await user.save();

        res.status(201).json({ 
            message: "User created successfully", 
            user: { _id: user._id, name: user.name, email: user.email, role: user.role } 
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAllDoctors = async (req, res) => {
    try {
        const doctors = await User.find({ role: 'doctor' }).select('-password');
        res.status(200).json(doctors);
    } catch (error) {
         res.status(500).json({ error: error.message });
    }
};

exports.approveDoctor = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || user.role !== 'doctor') {
            return res.status(404).json({ error: "Doctor not found" });
        }
        user.isApproved = true;
        await user.save();
        res.status(200).json({ message: "Doctor approved" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
