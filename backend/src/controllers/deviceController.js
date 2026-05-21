const Device = require('../models/Device');
const QuickRegistration = require('../models/QuickRegistration');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { logActivity } = require('../utils/helpers');
const qrcode = require('qrcode');

exports.createDevice = async (req, res) => {
  try {
    const { device_type, brand, model_name, serial_number, mac_address, description, image_url } = req.body;

    if (!image_url) {
      return res.status(400).json({ message: 'Bạn bắt buộc phải chụp ảnh thiết bị!' });
    }

    // Check if device already exists
    const existing = await Device.findBySerialNumber(serial_number);
    if (existing) {
      return res.status(400).json({ message: 'Thiết bị với số Serial này đã tồn tại' });
    }

    // Create device with approved status
    const device = await Device.create({
      owner_id: req.user.id,
      device_type,
      brand,
      model_name,
      serial_number,
      image_url,
      status: 'approved',
      registered_via: 'web'
    });

    res.status(201).json({
      message: 'Thiết bị đã được đăng ký và phê duyệt tự động',
      device,
    });

    // Log activity
    await logActivity(req.user.id, 'device_creation', `Đã đăng ký thiết bị mới: ${brand} ${model_name} (${serial_number})`, { device_id: device.device_id });
    
    // Notify the user
    try {
      const notif = await Notification.create({
        user_id: req.user.id,
        title: 'Đăng ký thiết bị thành công',
        message: `Thiết bị ${brand} ${model_name} của bạn đã được hệ thống ghi nhận.`,
        type: 'success'
      });

      req.io.to(`user_${req.user.id}`).emit('notification', {
        id: notif.id,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        created_at: notif.created_at,
        read: false
      });
    } catch (err) {
      console.error('Failed to create notification', err);
    }
  } catch (error) {
    res.status(500).json({ message: 'Đăng ký thiết bị thất bại', error: error.message });
  }
};

exports.getMyDevices = async (req, res) => {
  try {
    const devices = await Device.findByOwner(req.user.id);
    res.json({ devices });
  } catch (error) {
    res.status(500).json({ message: 'Lấy danh sách thiết bị thất bại', error: error.message });
  }
};

exports.getApprovedDevices = async (req, res) => {
  try {
    const devices = await Device.findAll({ owner_id: req.user.id, status: 'approved' });
    res.json({ devices });
  } catch (error) {
    res.status(500).json({ message: 'Lấy danh sách thiết bị đã duyệt thất bại', error: error.message });
  }
};

exports.getAllDevices = async (req, res) => {
  try {
    const devices = await Device.findAll();
    res.json({ devices });
  } catch (error) {
    res.status(500).json({ message: 'Lấy toàn bộ thiết bị thất bại', error: error.message });
  }
};

exports.updateDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const device = await Device.findById(id);
    if (!device) {
      return res.status(404).json({ message: 'Không tìm thấy thiết bị' });
    }

    if (device.owner_id !== req.user.id && req.user.role !== 'manager' && req.user.role !== 'admin' && req.user.role !== 'security') {
      return res.status(403).json({ message: 'Forbidden: Cannot update this device' });
    }

    const updated = await Device.update(id, updateData);

    // Log Audit
    await AuditLog.create({
      actor_id: req.user.id,
      action: 'UPDATE',
      target_table: 'devices',
      target_id: id,
      old_value: device,
      new_value: updated,
      reason: `Cập nhật thông tin thiết bị: ${updated.brand} ${updated.model_name}`
    });

    await logActivity(req.user.id, 'device_update', `Cập nhật thông tin thiết bị: ${updated.brand} ${updated.model_name}`, { device_id: id });
    res.json({ message: 'Cập nhật thiết bị thành công', device: updated });
  } catch (error) {
    res.status(500).json({ message: 'Cập nhật thiết bị thất bại', error: error.message });
  }
};

exports.deleteDevice = async (req, res) => {
  try {
    const { id } = req.params;

    const device = await Device.findById(id);
    if (!device) {
      return res.status(404).json({ message: 'Không tìm thấy thiết bị' });
    }

    if (device.owner_id !== req.user.id && req.user.role !== 'manager' && req.user.role !== 'admin' && req.user.role !== 'security') {
      return res.status(403).json({ message: 'Forbidden: Cannot delete this device' });
    }

    await Device.delete(id);

    // Log Audit
    await AuditLog.create({
      actor_id: req.user.id,
      action: 'DELETE',
      target_table: 'devices',
      target_id: id,
      old_value: device,
      new_value: null,
      reason: `Xóa thiết bị: ${device.brand} ${device.model_name} (${device.serial_number})`
    });

    await logActivity(req.user.id, 'device_deletion', `Xóa thiết bị: ${device.brand} ${device.model_name} (${device.serial_number})`, { device_id: id });

    res.json({ message: 'Xóa thiết bị thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Xóa thiết bị thất bại', error: error.message });
  }
};

// Approval requests (Quick Registration)
exports.getPendingRequests = async (req, res) => {
  try {
    const requests = await QuickRegistration.findPending();
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: 'Lấy danh sách yêu cầu chờ duyệt thất bại', error: error.message });
  }
};

exports.approveDevice = async (req, res) => {
  try {
    const { id } = req.params; // request_id
    const { comments } = req.body;

    if (req.user.role !== 'manager' && req.user.role !== 'admin' && req.user.role !== 'security') {
      return res.status(403).json({ message: 'Forbidden: Unauthorized access' });
    }

    const request = await QuickRegistration.findById(id);
    if (!request) return res.status(404).json({ message: 'Yêu cầu không tồn tại' });

    // 1. Create the actual device
    const device = await Device.create({
      owner_id: request.requester_id,
      device_type: request.device_type,
      brand: request.brand,
      model_name: request.model_name,
      serial_number: request.serial_number,
      status: 'approved',
      registered_via: 'kiosk_quick',
      approved_by: req.user.id
    });

    // 2. Update quick registration status
    await QuickRegistration.updateStatus(id, {
      status: 'approved',
      reviewed_by: req.user.id,
      device_id: device.device_id
    });

    // Log Audit
    await AuditLog.create({
      actor_id: req.user.id,
      action: 'APPROVE',
      target_table: 'quick_registrations',
      target_id: id,
      old_value: request,
      new_value: { status: 'approved', device_id: device.device_id, comments },
      reason: comments || 'Phê duyệt yêu cầu đăng ký thiết bị nhanh'
    });

    res.json({ message: 'Phê duyệt thiết bị thành công', device });

    // Broadcast to kiosk
    req.io.emit('quick_register_confirm_update', {
      serial_number: request.serial_number,
      device: device
    });

    // Log activity
    await logActivity(req.user.id, 'device_approval', `Phê duyệt yêu cầu đăng ký thiết bị cho người dùng ID: ${request.requester_id}`, { request_id: id, device_id: device.device_id });

  } catch (error) {
    res.status(500).json({ message: 'Phê duyệt thất bại', error: error.message });
  }
};

exports.rejectDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    if (req.user.role !== 'manager' && req.user.role !== 'admin' && req.user.role !== 'security') {
      return res.status(403).json({ message: 'Forbidden: Unauthorized access' });
    }

    const request = await QuickRegistration.findById(id);
    if (!request) return res.status(404).json({ message: 'Yêu cầu không tồn tại' });

    await QuickRegistration.updateStatus(id, {
      status: 'rejected',
      reviewed_by: req.user.id,
      reject_reason: comments
    });

    // Log Audit
    await AuditLog.create({
      actor_id: req.user.id,
      action: 'REJECT',
      target_table: 'quick_registrations',
      target_id: id,
      old_value: request,
      new_value: { status: 'rejected', reject_reason: comments },
      reason: comments || 'Từ chối đăng ký thiết bị nhanh'
    });

    res.json({ message: 'Từ chối thiết bị thành công' });

    // Broadcast to kiosk
    req.io.emit('quick_register_reject_update', {
      serial_number: request.serial_number,
      reason: comments
    });

    // Log activity
    await logActivity(req.user.id, 'device_rejection', `Từ chối yêu cầu đăng ký thiết bị ID: ${id}`, { reason: comments });

  } catch (error) {
    res.status(500).json({ message: 'Từ chối thất bại', error: error.message });
  }
};

exports.getDeviceQR = async (req, res) => {
  try {
    const { id } = req.params;
    const device = await Device.findById(id);
    if (!device) {
      return res.status(404).json({ message: 'Không tìm thấy thiết bị' });
    }

    const qrData = JSON.stringify({ deviceId: device.device_id });
    const qrImage = await qrcode.toDataURL(qrData);

    res.json({ qrImage, message: 'Đã tạo mã QR thiết bị' });
  } catch (error) {
    res.status(500).json({ message: 'Tạo mã QR thất bại', error: error.message });
  }
};

exports.confirmQuickRegister = async (req, res) => {
  try {
    const { user_id, device_type, brand, model_name, serial_number, image_url } = req.body;

    // Check if device already exists
    const existingDevice = await Device.findBySerialNumber(serial_number);
    if (existingDevice) {
      return res.status(400).json({ message: 'Thiết bị với số Serial này đã tồn tại trong hệ thống' });
    }

    // 1. Create a QuickRegistration record (status: approved)
    const request = await QuickRegistration.create({
      requester_id: user_id,
      device_type,
      brand,
      serial_number,
      model_name
    });

    // 2. Create the actual Device
    const device = await Device.create({
      owner_id: user_id,
      device_type,
      brand,
      model_name,
      serial_number,
      image_url,
      status: 'approved',
      registered_via: 'kiosk_quick',
      approved_by: req.user.id
    });

    // 3. Update the QuickRegistration record with device_id and status
    await QuickRegistration.updateStatus(request.request_id, {
      status: 'approved',
      reviewed_by: req.user.id,
      device_id: device.device_id
    });

    res.status(201).json({
      message: 'Thiết bị đã được phê duyệt và kích hoạt tức thì!',
      device,
      request
    });

    // Log activity
    await logActivity(req.user.id, 'device_approval', `Phê duyệt nhanh thiết bị cho người dùng ID: ${user_id}`, { device_id: device.device_id });
    
  } catch (error) {
    console.error('Quick confirm error:', error);
    res.status(500).json({ message: 'Phê duyệt nhanh thất bại', error: error.message });
  }
};

