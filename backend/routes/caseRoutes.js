const express = require('express');
const router = express.Router();
const multer = require('multer');
const { auth, authorize } = require('../middleware/auth');
const caseController = require('../controllers/caseController');
const { uploadFileToS3 } = require('../utils/s3Upload');

const upload = multer({ dest: 'temp/' });

// Create case (Patient uploads medical file)
router.post('/', 
    auth, 
    authorize('patient'), 
    upload.single('medicalFile'), 
    async (req, res) => {
        try {
            if (req.file) {
                const fileUrl = await uploadFileToS3(req.file);
                req.body.fileUrl = fileUrl;
            }

            await caseController.createCase(req, res);
        } catch (error) {
            console.error("CASE CREATE ERROR:", error);
            res.status(500).json({ error: error.message });
        }
});

// Get cases
router.get('/', auth, caseController.getCases);

// Doctor responds with prescription file
router.post('/:id/respond', 
    auth, 
    authorize('doctor'), 
    upload.single('prescriptionFile'), 
    async (req, res) => {
        try {
            if (req.file) {
                const fileUrl = await uploadFileToS3(req.file);
                req.body.prescriptionFileUrl = fileUrl;
            }

            await caseController.respondToCase(req, res);
        } catch (error) {
            console.error("RESPOND ERROR:", error);
            res.status(500).json({ error: error.message });
        }
});

// Close case
router.post('/:id/close', auth, authorize(['doctor', 'admin']), caseController.closeCase);

// Admin stats
router.get('/stats', auth, authorize('admin'), caseController.getStats);

module.exports = router;
