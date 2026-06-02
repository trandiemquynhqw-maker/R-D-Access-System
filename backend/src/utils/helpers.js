const jwt = require('jsonwebtoken');
const ActivityLog = require('../models/ActivityLog');

// Generate QR code data for employee
const generateQRData = (userId, username) => {
  return JSON.stringify({
    userId,
    username,
    timestamp: new Date().toISOString(),
  });
};

// Verify QR data
const verifyQRData = (qrData) => {
  try {
    const data = JSON.parse(qrData);
    if (data) {
      if (!data.username && (data.employeeCode || data.employee_code)) {
        data.username = data.employeeCode || data.employee_code;
      }
    }
    return data;
  } catch (error) {
    if (typeof qrData === 'string' && qrData.trim().length > 0) {
      const trimmed = qrData.trim();
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        try {
          const urlObj = new URL(trimmed);
          const params = urlObj.searchParams;
          const userId = params.get('userId') || params.get('user_id');
          const username = params.get('username') || params.get('employeeCode') || params.get('employee_code');
          if (userId || username) {
            return { userId, username };
          }
        } catch (e) {
          // Ignore URL parsing error
        }
      }
      return { username: trimmed };
    }
    return null;
  }
};

// Generate JWT token
const generateJWT = (userId, username, role) => {
  return jwt.sign({ id: userId, username, role }, process.env.JWT_SECRET || 'secret', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

/**
 * Log user activity to database
 * @param {number} userId - ID of the user performing the action
 * @param {string} type - Activity type (e.g. 'login', 'check_in')
 * @param {string} description - Human readable description
 * @param {object} metadata - Optional extra data
 */
const logActivity = async (userId, type, description, metadata = {}) => {
  try {
    return await ActivityLog.create({
      user_id: userId,
      activity_type: type,
      description,
      metadata
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

module.exports = {
  generateQRData,
  verifyQRData,
  generateJWT,
  logActivity,
};

