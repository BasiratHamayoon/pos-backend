const express = require('express');
const { generateReport, getReports, getReportById, deleteReport } = require('../controllers/reportController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/').post(protect, generateReport).get(protect, getReports);
router.route('/:id').get(protect, getReportById).delete(protect, deleteReport);

module.exports = router;