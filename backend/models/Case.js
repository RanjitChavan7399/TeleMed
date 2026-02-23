const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    description: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Reviewed', 'Closed'], default: 'Pending' },
    patientFile: { type: String }, // Path to uploaded file
    doctorResponse: { type: String },
    prescriptionFile: { type: String }, // Path to doctor's prescription
    uploadDate: { type: Date, default: Date.now },
    closedDate: { type: Date },
    lifecycleLog: [{ action: String, timestamp: { type: Date, default: Date.now } }]
});

module.exports = mongoose.model('Case', caseSchema);
