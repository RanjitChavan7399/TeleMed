const Case = require('../models/Case');
const fs = require('fs');
const path = require('path');

exports.createCase = async (req, res) => {
    try {
        const newCase = new Case({
            ...req.body,
            patient: req.user._id,
            patientFile: req.file ? req.file.path : null
        });
        await newCase.save();
        console.log(`[LOG] New case created by patient: ${req.user.name}. File: ${newCase.patientFile}`);
        res.status(201).send(newCase);
    } catch (e) {
        res.status(400).send(e);
    }
};

exports.getCases = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'patient') query.patient = req.user._id;
        // Doctors and Admins can see all cases for now, or we could filter
        const cases = await Case.find(query).populate('patient', 'name email').populate('doctor', 'name email');
        res.send(cases);
    } catch (e) {
        res.status(500).send();
    }
};

exports.respondToCase = async (req, res) => {
    try {
        const updates = {
            doctor: req.user._id,
            doctorResponse: req.body.response,
            status: 'Reviewed',
            prescriptionFile: req.file ? req.file.path : null
        };
        const updatedCase = await Case.findOneAndUpdate(
            { _id: req.params.id },
            updates,
            { new: true }
        );
        console.log(`[LOG] Doctor ${req.user.name} responded to case ${req.params.id}`);
        res.send(updatedCase);
    } catch (e) {
        res.status(400).send(e);
    }
};

exports.closeCase = async (req, res) => {
    try {
        const targetCase = await Case.findById(req.params.id);
        if (!targetCase) return res.status(404).send();

        targetCase.status = 'Closed';
        targetCase.closedDate = new Date();
        targetCase.lifecycleLog.push({ action: 'Case Closed' });

        // Lifecycle Automation: Delete or Archive files
        const archiveDir = path.join(__dirname, '../../archive');
        if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir);

        if (targetCase.patientFile) {
            const fileName = path.basename(targetCase.patientFile);
            const oldPath = path.join(__dirname, '../../', targetCase.patientFile);
            const newPath = path.join(archiveDir, fileName);
            
            if (fs.existsSync(oldPath)) {
                fs.renameSync(oldPath, newPath);
                console.log(`[LIFECYCLE] Patient file archived: ${fileName}`);
                targetCase.lifecycleLog.push({ action: `File archived: ${fileName}` });
                targetCase.patientFile = `archive/${fileName}`;
            }
        }

        await targetCase.save();
        res.send(targetCase);
    } catch (e) {
        res.status(500).send(e);
    }
};

exports.getStats = async (req, res) => {
    try {
        const totalCases = await Case.countDocuments();
        const closedCases = await Case.countDocuments({ status: 'Closed' });
        const pendingCases = await Case.countDocuments({ status: 'Pending' });
        res.send({ totalCases, closedCases, pendingCases });
    } catch (e) {
        res.status(500).send();
    }
};
