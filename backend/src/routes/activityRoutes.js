const express = require('express');
const activityController = require('../controllers/activityController');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// Managers and security can see all recent activity (Audit Trail)
router.get('/', requireRole('manager', 'security', 'admin'), activityController.getRecentActivity);

// Users can see their own activity
router.get('/me', activityController.getMyActivity);

// Database Audit Logs for Auditor and Admin
router.get('/audit-logs', requireRole('admin', 'auditor'), activityController.getAuditLogs);

module.exports = router;
