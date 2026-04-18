const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/doctors', userController.getDoctors);

module.exports = router;
