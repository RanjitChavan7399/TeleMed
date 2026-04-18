const dynamoDb = require('../config/dynamo');
const { PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const Appointment = require('../models/Appointment'); // Keep for old methods if not migrated yet

const TABLE_NAME = "Appointments";

exports.createAppointment = async (req, res) => {
    try {
        const { doctor, date, time, reason } = req.body;
        
        if (!doctor || !date || !time) {
             return res.status(400).json({ error: "doctorId, date, and time are required." });
        }

        const appointmentId = Date.now().toString();

        const item = {
            doctorId: doctor.toString(),
            appointmentId: appointmentId,
            patientId: req.user._id.toString(),
            date: date,
            time: time,
            reason: reason || "",
            status: "booked"
        };

        await dynamoDb.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: item
        }));

        res.status(201).json(item);
    } catch (error) {
        console.error("APPOINTMENT CREATE ERROR:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.getDoctorAppointments = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const data = await dynamoDb.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: "doctorId = :did",
            ExpressionAttributeValues: { ":did": doctorId }
        }));

        res.status(200).json(data.Items || []);
    } catch (error) {
        console.error("APPOINTMENT GET DOC ERROR:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Kept untouched as per minimal changes instruction if required to not break patients
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

        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const appointmentId = req.params.id;

        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) return res.status(404).json({ error: "Appointment not found" });

        if (req.user.role === 'patient' && status !== 'Cancelled') {
             return res.status(403).json({ error: "Patients can only cancel appointments." });
        }

        appointment.status = status;
        await appointment.save();

        res.status(200).json(appointment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
