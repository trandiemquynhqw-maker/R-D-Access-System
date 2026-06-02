const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyQRData, generateQRData, logActivity } = require('../utils/helpers');
const qrcode = require('qrcode');

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.user_id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

exports.register = async (req, res) => {
  try {
    const { username, email, password, full_name, role, department, employee_code } = req.body;

    // Check if user exists
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      username,
      email,
      password_hash,
      full_name,
      role: role || 'engineer',
      department,
      employee_code,
    });

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token,
    });

    // Log the registration
    await logActivity(user.user_id, 'user_registration', `New user registered: ${user.username}`);
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    console.log(`[LoginDebug] Attempting login for username: "${username}"`);
    const user = await User.findByUsername(username);
    if (!user) {
      console.log(`[LoginDebug] User "${username}" not found in database`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log(`[LoginDebug] User found: ${user.username}, status: ${user.status}`);

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      console.log(`[LoginDebug] Password mismatch for user: ${username}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({ message: 'User account is inactive' });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        employee_code: user.employee_code,
      },
      token,
    });

    // Log the login
    await logActivity(user.user_id, 'user_login', `User logged in: ${user.username}`);
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        department: user.department,
        employee_code: user.employee_code,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { full_name, department, avatar_url } = req.body;

    const user = await User.update(req.user.id, {
      full_name,
      department,
      ...(avatar_url !== undefined && { avatar_url })
    });

    await logActivity(req.user.id, 'profile_update', 'Cập nhật thông tin hồ sơ cá nhân');

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};

exports.qrLogin = async (req, res) => {
  try {
    const { qrData } = req.body;
    if (!qrData) {
      return res.status(400).json({ message: 'QR Data is required' });
    }

    const data = verifyQRData(qrData);
    if (!data || (!data.userId && !data.username)) {
      return res.status(401).json({ message: 'Invalid QR Code' });
    }

    let user;
    if (data.userId) {
      user = await User.findById(data.userId);
    }
    
    // Fallback if userId search didn't find the user (e.g. stale UUID from previous seeds)
    if (!user && data.username) {
      user = await User.findByUsername(data.username);
      if (!user) {
        user = await User.findByEmployeeCode(data.username);
      }
    }

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'User account is inactive' });
    }

    const token = generateToken(user);
    
    res.json({
      message: 'QR Login successful',
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'QR Login failed', error: error.message });
  }
};

exports.getMyQR = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const qrData = generateQRData(user.user_id, user.username);
    const qrImage = await qrcode.toDataURL(qrData);
    
    res.json({
      qrImage,
      message: 'QR generated successfully'
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate QR', error: error.message });
  }
};

