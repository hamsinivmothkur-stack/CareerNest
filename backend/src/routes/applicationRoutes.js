const express = require('express');
const router = express.Router();
const {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  updateApplicationStatus,
  deleteApplication,
  getDashboardStats,
} = require('../controllers/applicationController');
const { protect } = require('../middleware/authMiddleware');

// All application routes are protected
router.use(protect);

router.get('/stats/dashboard', getDashboardStats);

router.route('/')
  .get(getApplications)
  .post(createApplication);

router.route('/:id')
  .get(getApplicationById)
  .put(updateApplication)
  .delete(deleteApplication);

router.patch('/:id/status', updateApplicationStatus);

module.exports = router;
