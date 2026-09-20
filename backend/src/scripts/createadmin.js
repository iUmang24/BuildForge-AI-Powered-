require("dotenv").config();
const bcrypt = require("bcrypt");
const pool = require("../config/db");

(async () => {
  try {
    const passwordHash = await bcrypt.hash("", 12);

    await pool.query(
      `
      INSERT INTO admins (full_name, email, password_hash)
      VALUES (?, ?, ?)
      `,
      ["Shikhar Sharma", "sharmashikharm@gmail.com", passwordHash]
    );

    console.log("✅ Admin created successfully");
    process.exit();
  } catch (err) {
    console.error("❌ Failed to create admin", err.message);
    process.exit(1);
  }
})();