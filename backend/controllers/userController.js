const User = require('../models/User');

exports.getDoctors = async (req, res) => {
    try {
        const doctors = await User.find({ role: 'doctor' }).select('_id name');
        
        // Ensure returning clean json
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
