const db = require('./db');

const migrate = async () => {
    try {
        console.log('⏳ Đang chạy migration...');
        // Add role column if not exists
        await db.query(`
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'users' AND column_name = 'role'
          ) THEN
              ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';
          END IF;
      END $$;
    `);
        console.log('✅ Đã thêm cột "role" vào bảng users.');

        // Update existing nulls
        await db.query("UPDATE users SET role = 'user' WHERE role IS NULL");

        console.log('✅ Migration hoàn tất thành công!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration thất bại:', err);
        process.exit(1);
    }
};

migrate();
