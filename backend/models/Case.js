const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    description: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Reviewed', 'Closed'], default: 'Pending' },
    patientFileUrl: { type: String },
    doctorResponse: { type: String },
    prescriptionFileUrl: { type: String },
    uploadDate: { type: Date, default: Date.now },
    closedDate: { type: Date },
    lifecycleLog: [{ action: String, timestamp: { type: Date, default: Date.now } }]
});

module.exports = mongoose.model('Case', caseSchema);
