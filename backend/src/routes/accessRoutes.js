const express = require('express');
const accessController = require('../controllers/accessController');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// All access routes require authentication
router.use(authMiddleware);

// Check-in/out routes
router.post('/check-in', accessController.checkIn);
router.post('/check-out', accessController.checkOut);
router.get('/status', accessController.getCurrentStatus);

// History routes
router.get('/history', accessController.getAccessHistory);

// Dashboard routes (Security staff only)
router.get('/dashboard/activity', accessController.getRecentActivity);
router.get('/dashboard/occupancy', accessController.getCurrentOccupancy);

// Personal Analytics
router.get('/personal-stats', accessController.getPersonalStats);

// Security Verification
router.get('/verify/:identifier', requireRole(['security', 'manager', 'admin']), accessController.verifyCheckIn);

// Admin Session Management
router.get('/admin/sessions', requireRole(['admin']), accessController.getAdminSessions);
router.post('/admin/sessions/:id/force-close', requireRole(['admin']), accessController.forceCloseSession);

// Auditor Sessions
router.get('/auditor/sessions', requireRole(['admin', 'auditor']), accessController.getAuditorSessions);

module.exports = router;
