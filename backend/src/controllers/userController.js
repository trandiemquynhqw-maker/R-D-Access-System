const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { logActivity } = require('../utils/helpers');

exports.getAllUsers = async (req, res) => {
  try {
    const filters = {
      role: req.query.role,
      status: req.query.status
    };
    const users = await User.findAll(filters);
    console.log(`[UserManagement] Found ${users.length} users`);
    
    // Remove password hashes from response
    const sanitizedUsers = users.map(user => {
      const { password_hash, ...sanitized } = user;
      return sanitized;
    });

    res.json(sanitizedUsers);
  } catch (error) {
    console.error('[UserManagement Error] getAllUsers:', error);
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, role } = req.body;

    const oldUser = await User.findById(id);
    if (!oldUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = await User.update(id, { status, role });

    // Log in AuditLog
    const { password_hash: _ph1, ...sanitizedOldUser } = oldUser;
    const { password_hash: _ph2, ...sanitizedNewUser } = user;
    await AuditLog.create({
      actor_id: req.user.id,
      action: 'UPDATE',
      target_table: 'users',
      target_id: id,
      old_value: sanitizedOldUser,
      new_value: sanitizedNewUser,
      reason: `Cập nhật người dùng ${user.username}: status=${status}, role=${role}`
    });

    // Log the change
    await logActivity(req.user.id, 'user_update', `Cập nhật người dùng ${user.username}: status=${status}, role=${role}`, { target_user_id: id, status, role });

    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const oldUser = await User.findById(id);
    if (!oldUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.delete(id);

    // Log in AuditLog
    const { password_hash: _ph, ...sanitizedOldUser } = oldUser;
    await AuditLog.create({
      actor_id: req.user.id,
      action: 'DELETE',
      target_table: 'users',
      target_id: id,
      old_value: sanitizedOldUser,
      new_value: null,
      reason: `Xóa người dùng: ${oldUser.username}`
    });

    // Log the deletion
    await logActivity(req.user.id, 'user_deletion', `Xóa người dùng: ${oldUser.username}`, { target_user_id: id });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete user', error: error.message });
  }
};
