import express from "express";
import bcrypt from "bcrypt";
import db from "../db/db.js";

console.log("✅ Auth routes loaded!"); 


const router = express.Router();

// SIGNUP - POST /api/auth/signup

router.post("/signup", async (req, res) => {
  const { name, email, password, phone, dateOfBirth, role, careCenterId } = req.body;

  try {
    const exists = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (exists.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    //hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    //insert user
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, phone, date_of_birth, role, care_center_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
       RETURNING id, name, email, phone, role, status, care_center_id`,
      [name, email, passwordHash, phone, dateOfBirth, role || 'patient', careCenterId || null]
    );

    //return user
    res.status(201).json({ message: "User created successfully", user: result.rows[0] });

  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error during signup" });
  }
});


// LOGIN - POST /api/auth/login

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    //find user
    const result = await db.query(
      `SELECT u.*, c.name as care_center_name, c.location as care_center_location
       FROM users u
       LEFT JOIN care_centers c ON u.care_center_id = c.id
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];

    //check if active
    if (user.status !== 'active') {
      return res.status(401).json({ message: "Account is inactive" });
    }

    //compare password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    //remove password hash from response
    delete user.password_hash;

    //return user
    res.json({ 
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        careCenterId: user.care_center_id,
        careCenterName: user.care_center_name,
        careCenterLocation: user.care_center_location
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

export default router;