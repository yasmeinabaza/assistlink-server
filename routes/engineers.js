import express from "express";
import db from "../db/db.js";
import adminAuth from "../middleware/auth.js";

const router = express.Router();

// GET all engineers
router.get("/", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT e.*, u.name, u.email, u.phone
       FROM engineers e
       JOIN users u ON e.user_id = u.id
       ORDER BY e.id`
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database error" });
  }
});

// GET engineer by ID
router.get("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const result = await db.query(
      `SELECT e.*, u.name, u.email, u.phone
       FROM engineers e
       JOIN users u ON e.user_id = u.id
       WHERE e.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Engineer not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database error" });
  }
});

// CREATE engineer (admin only)
router.post("/", adminAuth, async (req, res) => {
  const { userId, specialization, status } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO engineers (user_id, specialization, status)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, specialization, status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database error" });
  }
});

// UPDATE engineer (admin only)
router.put("/:id", adminAuth, async (req, res) => {
  const id = req.params.id;
  const { specialization, status } = req.body;

  try {
    const result = await db.query(
      `UPDATE engineers
       SET specialization = COALESCE($1, specialization),
           status = COALESCE($2, status)
       WHERE id = $3
       RETURNING *`,
      [specialization, status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Engineer not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database error" });
  }
});

// DELETE engineer (admin only)
router.delete("/:id", adminAuth, async (req, res) => {
  const id = req.params.id;

  try {
    const result = await db.query("DELETE FROM engineers WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Engineer not found" });
    }
    res.json({ message: "Engineer deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database error" });
  }
});

export default router;