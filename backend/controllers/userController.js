const User = require('../models/User');

exports.getDoctors = async (req, res) => {
    try {
        const doctors = await User.find({ role: 'doctor' }).select('_id name');
        
        // Ensure returning standardized json
        res.status(200).json({ success: true, data: doctors });
    } catch (error) {
        console.error("GET DOCTORS ERROR:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};
