const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { auth, authorize } = require('../middleware/auth');
const caseController = require('../controllers/caseController');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.post('/', auth, authorize('patient'), upload.single('medicalFile'), caseController.createCase);
router.get('/', auth, caseController.getCases);
router.post('/:id/respond', auth, authorize('doctor'), upload.single('prescriptionFile'), caseController.respondToCase);
router.post('/:id/close', auth, authorize(['doctor', 'admin']), caseController.closeCase);
router.get('/stats', auth, authorize('admin'), caseController.getStats);

module.exports = router;
