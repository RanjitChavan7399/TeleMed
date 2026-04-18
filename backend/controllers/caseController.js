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

        res.status(201).json({ success: true, data: newCase });
    } catch (error) {
        console.error("CREATE CASE ERROR:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getCases = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'patient') {
            query.patient = req.user._id;
        } else if (req.user.role === 'doctor') {
            query.doctor = req.user._id;
        }
        
        const cases = await Case.find(query).populate('patient', 'name email').populate('doctor', 'name email');
        res.status(200).json({ success: true, data: cases });
    } catch (error) {
        console.error("GET CASES ERROR:", error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

const { deleteFileFromS3 } = require('../utils/s3Upload');

exports.respondToCase = async (req, res) => {
    try {
        const caseData = await Case.findById(req.params.id);

        if (!caseData) {
            return res.status(404).json({ success: false, error: "Case not found" });
        }

        if (caseData.patientFileUrl) {
	    await deleteFileFromS3(caseData.patientFileUrl);
	}

        caseData.doctor = req.user._id;
        caseData.doctorResponse = req.body.response;
        caseData.status = "Reviewed";

        if (req.body.prescriptionFileUrl) {
            caseData.prescriptionFileUrl = req.body.prescriptionFileUrl;
        }

        await caseData.save();

        console.log(`[LOG] Doctor ${req.user.name} responded to case ${req.params.id}`);

        res.status(200).json({ success: true, data: caseData });

    } catch (error) {
        console.error("RESPOND ERROR:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.closeCase = async (req, res) => {
    try {
        const targetCase = await Case.findById(req.params.id);
        if (!targetCase) return res.status(404).json({ success: false, error: "Case not found" });

        targetCase.status = 'Closed';
        targetCase.closedDate = new Date();
        targetCase.lifecycleLog.push({ action: 'Case Closed' });

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
        res.status(200).json({ success: true, data: targetCase });
    } catch (error) {
        console.error("CLOSE CASE ERROR:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getStats = async (req, res) => {
    try {
        const totalCases = await Case.countDocuments();
        const closedCases = await Case.countDocuments({ status: 'Closed' });
        const pendingCases = await Case.countDocuments({ status: 'Pending' });
        res.status(200).json({ success: true, data: { totalCases, closedCases, pendingCases } });
    } catch (error) {
        console.error("GET STATS ERROR:", error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};
