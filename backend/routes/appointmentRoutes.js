const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { auth, authorize } = require('../middleware/auth');

router.post('/', auth, authorize('patient'), appointmentController.createAppointment);
router.get('/', auth, appointmentController.getAppointments);
router.put('/:id/status', auth, appointmentController.updateStatus);

module.exports = router;
