const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET || 'secret_key');
        res.status(201).send({ user, token });
    } catch (e) {
        res.status(400).send(e);
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
