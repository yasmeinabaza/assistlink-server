import express from "express";
import db from "../db/db.js";
import adminAuth from "../middleware/auth.js";

const router = express.Router();

// GET all care centers
router.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM care_centers ORDER BY id");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database error" });
  }
});

// GET care center by ID
router.get("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const result = await db.query("SELECT * FROM care_centers WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Care center not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database error" });
  }
});

// CREATE care center (admin only)
router.post("/", adminAuth, async (req, res) => {
  const { name, location, phone, email, address, description } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO care_centers (name, location, phone, email, address, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, location, phone, email, address, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database error" });
  }
});

// UPDATE care center (admin only)
router.put("/:id", adminAuth, async (req, res) => {
  const id = req.params.id;
  const { name, location, phone, email, address, description } = req.body;

  try {
    const result = await db.query(
      `UPDATE care_centers
       SET name = COALESCE($1, name),
           location = COALESCE($2, location),
           phone = COALESCE($3, phone),
           email = COALESCE($4, email),
           address = COALESCE($5, address),
           description = COALESCE($6, description)
       WHERE id = $7
       RETURNING *`,
      [name, location, phone, email, address, description, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Care center not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database error" });
  }
});

// DELETE care center (admin only)
router.delete("/:id", adminAuth, async (req, res) => {
  const id = req.params.id;

  try {
    const result = await db.query("DELETE FROM care_centers WHERE id = $1 RETURNING id", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Care center not found" });
    }
    res.json({ message: "Care center deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database error" });
  }
});

export default router;