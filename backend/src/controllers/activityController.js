const ActivityLog = require('../models/ActivityLog');
const AuditLog = require('../models/AuditLog');
const { logActivity } = require('../utils/helpers');

exports.getRecentActivity = async (req, res) => {
  try {
    // Only managers, security, admin can see audit trail
    if (req.user.role !== 'manager' && req.user.role !== 'security' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    const limit = req.query.limit || 50;
    const activity = await ActivityLog.findRecent(limit);

    res.json({
      activity,
      count: activity.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch activity logs', error: error.message });
  }
};

exports.getMyActivity = async (req, res) => {
  try {
    const limit = req.query.limit || 50;
    const activity = await ActivityLog.findByUser(req.user.id, limit);

    res.json({
      activity,
      count: activity.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch your activity logs', error: error.message });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'auditor') {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    const { target_table } = req.query;
    const auditLogs = await AuditLog.findAll({ target_table });

    await logActivity(req.user.id, 'auditor_view_audit_logs', 'Đối soát viên tra cứu nhật ký thay đổi hệ thống (Audit Logs)');

    res.json({
      auditLogs,
      count: auditLogs.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch audit logs', error: error.message });
  }
};
