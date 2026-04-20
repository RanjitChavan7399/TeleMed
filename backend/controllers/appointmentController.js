const Appointment = require('../models/Appointment');

exports.createAppointment = async (req, res) => {
    try {
        const { doctorId, date, time, reason } = req.body;
        
        if (!doctorId || !date || !time) {
             return res.status(400).json({ success: false, error: "doctorId, date, and time are required." });
        }

        const appointment = new Appointment({
            doctor: doctorId,
            patient: req.user._id,
            date: date,
            time: time,
            reason: reason || "",
            status: "Scheduled"
        });

        await appointment.save();

        res.status(201).json({ success: true, data: appointment });
    } catch (error) {
        console.error("APPOINTMENT CREATE ERROR:", error);
        res.status(500).json({ success: false, error: error.message || "Internal Server Error" });
    }
};

exports.getDoctorAppointments = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const appointments = await Appointment.find({ doctor: doctorId })
            .populate('patient', 'name email')
            .sort({ date: 1, time: 1 });

        res.status(200).json({ success: true, data: appointments });
    } catch (error) {
        console.error("APPOINTMENT GET DOC ERROR:", error);
        res.status(500).json({ success: false, error: error.message || "Internal Server Error" });
    }
};

exports.getAppointments = async (req, res) => {
    try {
        let filter = {};
        if (req.user.role === 'patient') {
            filter.patient = req.user._id;
        } else if (req.user.role === 'doctor') {
            filter.doctor = req.user._id;
        }
        const appointments = await Appointment.find(filter)
            .populate('patient', 'name email')
            .populate('doctor', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: appointments });
    } catch (error) {
        console.error("GET APPOINTMENTS ERROR:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const appointmentId = req.params.id;

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) return res.status(404).json({ success: false, error: "Appointment not found" });

        if (req.user.role === 'patient' && status !== 'Cancelled') {
             return res.status(403).json({ success: false, error: "Patients can only cancel appointments." });
        }

        appointment.status = status;
        await appointment.save();

        res.status(200).json({ success: true, data: appointment });
    } catch (error) {
        console.error("UPDATE APPOINTMENT STATUS ERROR:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};
