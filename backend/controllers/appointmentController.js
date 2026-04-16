const Appointment = require('../models/Appointment');

exports.createAppointment = async (req, res) => {
    try {
        const { doctor, date, time, reason } = req.body;
        const newAppointment = new Appointment({
            patient: req.user._id,
            doctor,
            date,
            time,
            reason
        });
        await newAppointment.save();
        res.status(201).json(newAppointment);
    } catch (error) {
        console.error("APPOINTMENT CREATE ERROR:", error);
        res.status(500).json({ error: error.message });
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
        // admin sees all
        const appointments = await Appointment.find(filter)
            .populate('patient', 'name email')
            .populate('doctor', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json(appointments);
    } catch (error) {
        console.error("APPOINTMENT GET ERROR:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const appointmentId = req.params.id;

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) return res.status(404).json({ error: "Appointment not found" });

        // Ensure authorization (doctor or admin usually)
        if (req.user.role === 'patient' && status !== 'Cancelled') {
             return res.status(403).json({ error: "Patients can only cancel appointments." });
        }

        appointment.status = status;
        await appointment.save();

        res.status(200).json(appointment);
    } catch (error) {
        console.error("APPOINTMENT UPDATE ERROR:", error);
        res.status(500).json({ error: error.message });
    }
};
