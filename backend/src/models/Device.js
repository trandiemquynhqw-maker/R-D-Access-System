const pool = require('../config/database');

class Device {
  static async findById(id) {
    const result = await pool.query('SELECT * FROM devices WHERE device_id = $1', [id]);
    return result.rows[0];
  }

  static async findBySerialNumber(serial_number) {
    const result = await pool.query('SELECT * FROM devices WHERE serial_number = $1', [serial_number]);
    return result.rows[0];
  }

  static async findByOwner(owner_id) {
    const result = await pool.query('SELECT * FROM devices WHERE owner_id = $1', [owner_id]);
    return result.rows;
  }

  static async create(deviceData) {
    const { owner_id, device_type, brand, model_name, serial_number, image_url, qr_code_url, status, registered_via, approved_by } = deviceData;
    const finalStatus = status || 'approved';
    const approvedAt = (finalStatus === 'approved') ? 'NOW()' : 'NULL';

    const result = await pool.query(
      `INSERT INTO devices (owner_id, device_type, brand, model_name, serial_number, image_url, qr_code_url, status, registered_via, approved_by, approved_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, ${approvedAt}) RETURNING *`,
      [owner_id, device_type, brand, model_name, serial_number, image_url, qr_code_url, finalStatus, registered_via || 'web', approved_by]
    );
    return result.rows[0];
  }

  static async findAll(filters = {}) {
    let query = 'SELECT * FROM devices WHERE 1=1';
    const values = [];

    if (filters.owner_id) {
      query += ' AND owner_id = $' + (values.length + 1);
      values.push(filters.owner_id);
    }

    if (filters.status) {
      query += ' AND status = $' + (values.length + 1);
      values.push(filters.status);
    }

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updateData)) {
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }

    values.push(id);
    const query = `UPDATE devices SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE device_id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM devices WHERE device_id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
}

module.exports = Device;

