const Case = require('../models/Case');
const fs = require('fs');
const path = require('path');

exports.createCase = async (req, res) => {
    try {
        const newCase = new Case({
            patient: req.user._id,
            description: req.body.description,
	    patientFileUrl: req.body.fileUrl,
            status: "Pending"
        });

        await newCase.save();

        res.status(201).json(newCase);
    } catch (error) {
        console.error("CREATE CASE ERROR:", error);
        res.status(500).json({ error: error.message });
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

const { deleteFileFromS3 } = require('../utils/s3Upload');

exports.respondToCase = async (req, res) => {
    try {
        const caseData = await Case.findById(req.params.id);

        if (!caseData) {
            return res.status(404).json({ error: "Case not found" });
        }

        // 🔹 Delete old patient file from S3
	if (caseData.patientFileUrl) {
	    await deleteFileFromS3(caseData.patientFileUrl);
	}
        // 🔹 Update case
        caseData.doctor = req.user._id;
        caseData.doctorResponse = req.body.response;
        caseData.status = "Reviewed";

        // Save prescription S3 URL (already added in route)
        if (req.body.prescriptionFileUrl) {
            caseData.prescriptionFileUrl = req.body.prescriptionFileUrl;
        }

        await caseData.save();

        console.log(`[LOG] Doctor ${req.user.name} responded to case ${req.params.id}`);

        res.json(caseData);

    } catch (error) {
        console.error("RESPOND ERROR:", error);
        res.status(500).json({ error: error.message });
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
