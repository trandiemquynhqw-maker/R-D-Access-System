const bcrypt = require('bcryptjs');
const pool = require('../config/database');

async function seedDatabase() {
  try {
    console.log('Seeding database V2 with sample data...');

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const securityPassword = await bcrypt.hash('security123', 10);
    const engineerPassword = await bcrypt.hash('engineer123', 10);
    const auditorPassword = await bcrypt.hash('auditor123', 10);

    // Insert sample users
    const userQuery = `
      INSERT INTO users (username, email, password_hash, full_name, role, department, employee_code, status)
      VALUES 
        ('security', 'security@rnd.com', $1, 'Bảo vệ Cổng', 'security', 'An Ninh', 'EMP001', 'active'),
        ('admin', 'admin@rnd.com', $2, 'Quản trị viên', 'admin', 'Công nghệ', 'EMP002', 'active'),
        ('engineer1', 'engineer1@rnd.com', $3, 'Kỹ sư Một', 'engineer', 'R&D', 'EMP003', 'active'),
        ('engineer2', 'engineer2@rnd.com', $3, 'Kỹ sư Hai', 'engineer', 'R&D', 'EMP004', 'active'),
        ('auditor', 'auditor@rnd.com', $4, 'ANZ Auditor One', 'auditor', 'ANZ Compliance', 'AUD001', 'active')
      RETURNING user_id, username;
    `;

    const userResult = await pool.query(userQuery, [securityPassword, adminPassword, engineerPassword, auditorPassword]);
    console.log('✓ Sample users created');

    const users = {};
    userResult.rows.forEach(u => users[u.username] = u.user_id);

    // Insert sample devices
    const deviceQuery = `
      INSERT INTO devices (owner_id, device_type, brand, model_name, serial_number, status, image_url)
      VALUES 
        ($1, 'Laptop', 'Apple', 'MacBook Pro', 'SN12345', 'approved', 'https://example.com/mbp.jpg'),
        ($1, 'Phone', 'Apple', 'iPhone 14', 'SN12346', 'approved', 'https://example.com/iphone.jpg'),
        ($2, 'Laptop', 'Dell', 'XPS 15', 'SN12347', 'approved', 'https://example.com/dell.jpg'),
        ($2, 'Tablet', 'Apple', 'iPad Pro', 'SN12348', 'approved', 'https://example.com/ipad.jpg')
    `;

    await pool.query(deviceQuery, [users['engineer1'], users['engineer2']]);
    console.log('✓ Sample devices created');

    console.log('✓ Database seeding V2 completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding V2 failed:', error);
    process.exit(1);
  }
}

seedDatabase();

