const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const { auth, authorize } = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/doctors', auth, authController.getDoctors);

// Admin-only route to create doctors or other staff
router.post('/create-user', auth, authorize('admin'), authController.createUser);

// Admin doctor management
router.get('/all-doctors', auth, authorize('admin'), authController.getAllDoctors);
router.put('/approve-doctor/:id', auth, authorize('admin'), authController.approveDoctor);

module.exports = router;
