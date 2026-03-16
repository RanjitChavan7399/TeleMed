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

        const user = new User({ name, email, password, role });
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
        const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET || 'secret_key');
        res.send({ user, token });
    } catch (e) {
        res.status(500).send();
    }
};
