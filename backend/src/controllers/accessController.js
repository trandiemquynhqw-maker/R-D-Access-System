const Session = require('../models/Session');
const SessionDevice = require('../models/SessionDevice');
const AccessLog = require('../models/AccessLog');
const AuditLog = require('../models/AuditLog');
const Device = require('../models/Device');
const User = require('../models/User');
const { logActivity } = require('../utils/helpers');

exports.checkIn = async (req, res) => {
  try {
    const { device_ids, face_image_url, entry_photo, auth_method, ip_address, force_close_old } = req.body;
    const final_face_image = face_image_url || entry_photo;

    // Fetch full user for broadcasting (includes avatar_url)
    const fullUser = await User.findById(req.user.id);

    // Check if user already has active session
    const activeSession = await Session.findActiveByUser(req.user.id);
    if (activeSession) {
      // Determine if session is from a previous day
      const checkInDate = new Date(activeSession.check_in_at);
      const now = new Date();
      
      const isPreviousDay = checkInDate.getFullYear() < now.getFullYear() ||
                            checkInDate.getMonth() < now.getMonth() ||
                            checkInDate.getDate() < now.getDate();

      if (isPreviousDay) {
        if (!force_close_old) {
          return res.status(409).json({ 
            requires_force_close: true, 
            message: 'Bạn đã quên check-out ngày hôm qua, bạn muốn đóng phiên cũ và check-in mới không?',
            session_id: activeSession.session_id
          });
        } else {
          // Force close the old session
          await Session.forceClose(activeSession.session_id, req.user.id, 'Hệ thống tự động đóng do quên check-out qua ngày');
          
          await AccessLog.create({
            event_type: 'forgotten_checkout_resolved',
            user_id: req.user.id,
            session_id: activeSession.session_id,
            result: 'success',
            ip_address: ip_address || req.ip
          });
          
          await logActivity(req.user.id, 'forgotten_checkout_resolved', 'Tự động đóng phiên cũ bị quên check-out qua ngày', { session_id: activeSession.session_id });
        }
      } else {
        return res.status(400).json({ message: 'Bạn đang trong phòng (Session đã tồn tại)' });
      }
    }

    // 1. Create Session
    const session = await Session.create({
      user_id: req.user.id,
      face_image_url: final_face_image || null,
      auth_method: auth_method || 'qr_scan',
      notes: ''
    });

    // 2. Link Devices
    if (device_ids && device_ids.length > 0) {
      for (const device_id of device_ids) {
        await SessionDevice.create({
          session_id: session.session_id,
          device_id: device_id,
          scan_status: 'matched'
        });
      }
    }

    // 3. Log Event
    await AccessLog.create({
      event_type: 'check_in',
      user_id: req.user.id,
      session_id: session.session_id,
      auth_method: auth_method || 'qr_scan',
      result: 'success',
      ip_address: ip_address || req.ip
    });

    await logActivity(req.user.id, 'check_in', `Người dùng thực hiện Check-in vào cơ sở`, { session_id: session.session_id, device_count: device_ids?.length || 0 });

    res.status(201).json({
      message: 'Check-in thành công',
      session,
    });

    // Broadcast real-time update
    req.io.emit('occupancy_update');

    const broadcastData = {
      type: 'check_in',
      user: fullUser?.full_name || req.user.username,
      avatar_url: fullUser?.avatar_url,
      device: `CHECKED-IN (${device_ids?.length || 0} devices)`,
      image_url: final_face_image,
      status: 'valid',
      time: new Date().toISOString()
    };

    req.io.emit('activity_update', broadcastData);
    req.io.emit('kiosk_scan_update', { ...broadcastData, image_url: null });
  } catch (error) {
    res.status(500).json({ message: 'Check-in thất bại', error: error.message });
  }
};

exports.checkOut = async (req, res) => {
  try {
    const { notes, ip_address, exit_photo } = req.body;
    // Fetch full user for broadcasting (includes avatar_url)
    const fullUser = await User.findById(req.user.id);

    const activeSession = await Session.findActiveByUser(req.user.id);
    if (!activeSession) {
      return res.status(400).json({ message: 'Bạn đang không ở trong phòng' });
    }

    // 1. Update Session
    const session = await Session.checkOut(activeSession.session_id, notes, exit_photo);

    // 2. Log Event
    await AccessLog.create({
      event_type: 'check_out',
      user_id: req.user.id,
      session_id: session.session_id,
      result: 'success',
      ip_address: ip_address || req.ip
    });

    await logActivity(req.user.id, 'check_out', `Người dùng thực hiện Check-out khỏi cơ sở`, { session_id: session.session_id });

    res.json({ message: 'Check-out thành công', session });

    // Broadcast real-time update
    req.io.emit('occupancy_update');
    
    const broadcastData = {
      type: 'check_out',
      user: fullUser?.full_name || req.user.username,
      avatar_url: fullUser?.avatar_url,
      device: 'CHECKED-OUT (Facility Exit)',
      image_url: exit_photo,
      status: 'checkout',
      time: new Date().toISOString()
    };

    req.io.emit('activity_update', broadcastData);
    req.io.emit('kiosk_scan_update', { ...broadcastData, image_url: null });
  } catch (error) {
    res.status(500).json({ message: 'Check-out thất bại', error: error.message });
  }
};

exports.getCurrentStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const activeSession = await Session.findActiveByUser(req.user.id);

    if (!activeSession) {
      return res.json({
        status: 'checked_out',
        user,
        session: null,
      });
    }

    // Check if session is from a previous day
    const checkInDate = new Date(activeSession.check_in_at);
    const now = new Date();
    const isPreviousDay = checkInDate.getFullYear() < now.getFullYear() ||
                          checkInDate.getMonth() < now.getMonth() ||
                          checkInDate.getDate() < now.getDate();

    if (isPreviousDay) {
      return res.json({
        status: 'overdue_session',
        message: 'Bạn đã quên check-out ngày hôm qua, bạn muốn đóng phiên cũ và check-in mới không?',
        user,
        session: activeSession,
      });
    }

    // Get device details from session_devices
    const devices = await SessionDevice.findBySession(activeSession.session_id);

    res.json({
      status: 'checked_in',
      user,
      session: activeSession,
      devices,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lấy trạng thái thất bại', error: error.message });
  }
};

// Dashboard / Monitoring endpoints
exports.getRecentActivity = async (req, res) => {
  try {
    if (req.user.role !== 'security' && req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Unauthorized access' });
    }

    const limit = parseInt(req.query.limit) || 50;
    const activity = await AccessLog.getRecentActivity(limit);

    res.json({
      activity,
      count: activity.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lấy nhật ký hoạt động thất bại', error: error.message });
  }
};

exports.getCurrentOccupancy = async (req, res) => {
  try {
    if (req.user.role !== 'security' && req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Unauthorized access' });
    }

    const sessions = await Session.findAll({ status: 'in' });

    res.json({
      occupancy: sessions.length,
      sessions,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lấy số lượng người hiện tại thất bại', error: error.message });
  }
};

exports.getAccessHistory = async (req, res) => {
  try {
    const { user_id, limit } = req.query;

    let query_user_id = req.user.id;
    if (req.user.role === 'manager' || req.user.role === 'security' || req.user.role === 'admin') {
      query_user_id = user_id || req.user.id;
    }

    const sessions = await Session.findAll({ user_id: query_user_id });
    
    // Map sessions to match the frontend expectations of personal stats chronology
    const history = sessions.map(s => ({
      id: s.session_id,
      status: s.status === 'in' ? 'checked_in' : 'checked_out',
      check_in_time: s.check_in_at,
      check_out_time: s.check_out_at,
      notes: s.notes,
      devices: s.devices
    }));

    res.json({
      history: history.slice(0, limit || 100),
      count: history.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lấy lịch sử truy cập thất bại', error: error.message });
  }
};

exports.getPersonalStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = require('../config/database');
    
    const totalStaysResult = await pool.query(
      'SELECT COUNT(*) FROM sessions WHERE user_id = $1 AND status != \'in\'',
      [userId]
    );

    const durationsResult = await pool.query(
      `SELECT 
        EXTRACT(EPOCH FROM (check_out_at - check_in_at))/3600 as duration_hours,
        check_in_at as check_in_time
       FROM sessions 
       WHERE user_id = $1 AND status != 'in'
       ORDER BY check_in_at DESC`,
      [userId]
    );

    const recentActivity = await AccessLog.findAll({ user_id: userId });

    const durations = durationsResult.rows
      .map(r => parseFloat(r.duration_hours))
      .filter(h => !isNaN(h) && h !== null);
      
    const avgDuration = durations.length > 0 ? (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2) : 0;

    res.json({
      totalStays: parseInt(totalStaysResult.rows[0].count),
      avgDurationHours: parseFloat(avgDuration),
      durations: durationsResult.rows.slice(0, 7),
      recentActivity: recentActivity.slice(0, 10)
    });
  } catch (error) {
    res.status(500).json({ message: 'Lấy thống kê cá nhân thất bại', error: error.message });
  }
};

exports.verifyCheckIn = async (req, res) => {
  try {
    const { identifier } = req.params;
    let user = null;
    let scannedDevice = null;
    const pool = require('../config/database');

    // 1. Try to parse as JSON (Device QR)
    try {
      if (identifier.startsWith('{')) {
        const qrData = JSON.parse(identifier);
        if (qrData.deviceId) {
          scannedDevice = await Device.findById(qrData.deviceId);
          if (scannedDevice) {
            user = await User.findById(scannedDevice.owner_id);
          }
        }
      }
    } catch (e) {}

    // 2. Try to find user by code/username/qr
    if (!user) {
      user = await User.findByUsername(identifier);
      if (!user) {
        user = await User.findByEmployeeCode(identifier);
      }
      if (!user) {
        // Search by qr_code_url (contains the identifier) or direct match
        const userByQR = await pool.query(
          'SELECT * FROM users WHERE qr_code_url LIKE $1 OR employee_code = $2',
          [`%${identifier}%`, identifier]
        );
        user = userByQR.rows[0];
      }
    }

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng hoặc thiết bị' });
    }

    const activeSession = await Session.findActiveByUser(user.user_id);
    const userDevices = await Device.findByOwner(user.user_id);
    const approvedDevices = userDevices.filter(d => d.status === 'approved');

    res.json({
      user,
      session: activeSession || null,
      approvedDevices,
      verificationResult: {
        isInside: !!activeSession,
        deviceMatch: scannedDevice ? approvedDevices.some(d => d.device_id === scannedDevice.device_id) : null,
        scannedDevice
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Xác thực thất bại', error: error.message });
  }
};

exports.getAdminSessions = async (req, res) => {
  try {
    const { status } = req.query;
    const sessions = await Session.findAll({ status });
    
    // Add overdue flag
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const processedSessions = sessions.map(s => ({
      ...s,
      is_overdue: s.status === 'in' && new Date(s.check_in_at) < startOfToday
    }));

    res.json({
      sessions: processedSessions,
      count: processedSessions.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Lấy danh sách phiên thất bại', error: error.message });
  }
};

exports.forceCloseSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const oldSession = await Session.findById(id);
    if (!oldSession) {
      return res.status(404).json({ message: 'Không tìm thấy phiên làm việc' });
    }

    const session = await Session.forceClose(id, req.user.id, notes || 'Forced close by Admin');

    // Log Audit
    await AuditLog.create({
      actor_id: req.user.id,
      action: 'FORCE_CLOSE',
      target_table: 'sessions',
      target_id: id,
      old_value: oldSession,
      new_value: session,
      reason: notes || 'Đóng phiên bắt buộc bởi Admin'
    });

    await logActivity(req.user.id, 'force_close_session', `Quản trị viên đã đóng phiên thủ công cho người dùng`, { session_id: id });

    res.json({
      message: 'Đã đóng phiên thành công',
      session
    });

    // Broadcast update
    req.io.emit('occupancy_update');
  } catch (error) {
    res.status(500).json({ message: 'Đóng phiên thất bại', error: error.message });
  }
};

exports.getAuditorSessions = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'auditor') {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    const { startDate, endDate, startHour, endHour, employeeSearch, deviceSearch } = req.query;
    const pool = require('../config/database');

    let query = `
      SELECT 
        s.*, 
        u.full_name, u.username, u.employee_code, u.avatar_url,
        s.face_image_url as entry_photo,
        s.exit_face_image_url as exit_photo,
        COALESCE(
          (SELECT json_agg(json_build_object('brand', d2.brand, 'model_name', d2.model_name, 'serial_number', d2.serial_number, 'device_type', d2.device_type))
           FROM session_devices sd 
           JOIN devices d2 ON sd.device_id = d2.device_id 
           WHERE sd.session_id = s.session_id), 
          '[]'::json
        ) as devices
      FROM sessions s
      JOIN users u ON s.user_id = u.user_id
      WHERE 1=1
    `;
    const values = [];

    if (startDate) {
      query += ` AND s.check_in_at >= $${values.length + 1}`;
      values.push(startDate);
    }

    if (endDate) {
      query += ` AND s.check_in_at <= $${values.length + 1}`;
      values.push(endDate);
    }

    if (employeeSearch) {
      query += ` AND (u.full_name ILIKE $${values.length + 1} OR u.username ILIKE $${values.length + 1} OR u.employee_code ILIKE $${values.length + 1})`;
      values.push(`%${employeeSearch}%`);
    }

    query += ' ORDER BY s.check_in_at DESC';
    const result = await pool.query(query, values);
    let sessions = result.rows;

    if (startHour || endHour) {
      sessions = sessions.filter(s => {
        const checkInDate = new Date(s.check_in_at);
        const hours = String(checkInDate.getHours()).padStart(2, '0');
        const minutes = String(checkInDate.getMinutes()).padStart(2, '0');
        const checkInTimeStr = `${hours}:${minutes}`;

        if (startHour && checkInTimeStr < startHour) return false;
        if (endHour && checkInTimeStr > endHour) return false;
        return true;
      });
    }

    if (deviceSearch) {
      const searchLower = deviceSearch.toLowerCase();
      sessions = sessions.filter(s => {
        if (s.auth_method.toLowerCase().includes(searchLower)) return true;
        if (s.devices && Array.isArray(s.devices)) {
          return s.devices.some(d => 
            (d.brand && d.brand.toLowerCase().includes(searchLower)) ||
            (d.model_name && d.model_name.toLowerCase().includes(searchLower)) ||
            (d.serial_number && d.serial_number.toLowerCase().includes(searchLower)) ||
            (d.device_type && d.device_type.toLowerCase().includes(searchLower))
          );
        }
        return false;
      });
    }

    await logActivity(req.user.id, 'auditor_access', 'Đối soát viên tra cứu lịch sử ra vào');

    res.json({
      sessions,
      count: sessions.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Lấy lịch sử đối soát thất bại', error: error.message });
  }
};

