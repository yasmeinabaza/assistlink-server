import express from "express";
import db from "../db/db.js";
import adminAuth from "../middleware/auth.js";

const router = express.Router();

// GET all users (admin only)
router.get("/", adminAuth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, email, phone, role, status, care_center_id, created_at
       FROM users ORDER BY id`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database error" });
  }
});

// GET user by ID
router.get("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const result = await db.query(
      `SELECT id, name, email, phone, role, status, care_center_id, created_at
       FROM users WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database error" });
  }
});

// UPDATE user (admin only)
router.put("/:id", adminAuth, async (req, res) => {
  const { name, email, phone, role, status, careCenterId } = req.body;
  const id = req.params.id;

  try {
    const result = await db.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           role = COALESCE($4, role),
           status = COALESCE($5, status),
           care_center_id = COALESCE($6, care_center_id)
       WHERE id = $7
       RETURNING id, name, email, phone, role, status, care_center_id`,
      [name, email, phone, role, status, careCenterId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database error" });
  }
});

// DELETE user (admin only)
router.delete("/:id", adminAuth, async (req, res) => {
  const id = req.params.id;

  try {
    const result = await db.query("DELETE FROM users WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database error" });
  }
});

// GET patients only
router.get("/patients", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, email, phone, role, status, care_center_id, created_at
       FROM users WHERE role = 'patient' ORDER BY id`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database error" });
  }
});

export default router;