const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();

// ==========================
// 🔧 Middleware
// ==========================
app.use(express.json());
app.use(cors());

// ==========================
// 🗄️ PostgreSQL Connection
// ==========================
const pool = new Pool({
  user: "markwaldron",
  host: "localhost",
  database: "taskapp",
  password: "", // leave blank if using default Homebrew setup
  port: 5432,
});

const JWT_SECRET = "supersecretkey";

// ====================================
// Middleware to authenticate requests
// ====================================
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send("No token");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).send("Invalid token");
  }
};

// ==========================
// 🧪 Test Route
// ==========================
app.get("/", (req, res) => {
  res.send("Server + DB working!");
});

// =========================
// Sign Up Route
// =========================

app.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send("Email and password required");
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email",
      [email, hashedPassword]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating user");
  }
});

// ==========================
// 🔐 Login Route
// ==========================
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).send("Invalid credentials");
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).send("Invalid credentials");
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET);

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).send("Login error");
  }
});

  // ==========================
  // PROJECTS ROUTE
  // ==========================
  app.get("/projects", authMiddleware, async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT * FROM projects WHERE user_id = $1 ORDER BY id ASC",
        [req.user.id],
      );

      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error fetching projects");
    }
  });

  app.post("/projects", authMiddleware, async (req, res) => {
    const { name } = req.body;

    if (!name) {
      return res.status(400).send("Project name required");
    }

    try {
      const result = await pool.query(
        "INSERT INTO projects (name, user_id) VALUES ($1, $2) RETURNING *",
        [name, req.user.id],
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error creating project");
    }
  });

// ==========================
// 📥 GET ALL TASKS
// ==========================
app.get("/tasks", authMiddleware, async (req, res) => {
  const { project_id } = req.query;

  try {
    const result = await pool.query(
      `
      SELECT * FROM tasks
      WHERE project_id = $1
      ORDER BY id ASC
      `,
      [project_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching tasks");
  }
});

// ==========================
// 📤 CREATE TASK
// ==========================
app.post("/tasks", authMiddleware, async (req, res) => {
  const { title, project_id } = req.body;

  if (!title || !project_id) {
    return res
      .status(400)
      .send("Title and project_id are required");
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO tasks (title, project_id)
      VALUES ($1, $2)
      RETURNING *
      `,
      [title, project_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating task");
  }
});

// ==========================
// ✏️ UPDATE TASK
// ==========================
app.put("/tasks/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { title, completed } = req.body;

  // ✅ Validation
  if (title === undefined || completed === undefined) {
    return res
      .status(400)
      .send("Both title and completed fields are required");
  }

  try {
    const result = await pool.query(
      "UPDATE tasks SET title = $1, completed = $2 WHERE id = $3 RETURNING *",
      [title, completed, id]
    );

    // ✅ Not found check
    if (result.rows.length === 0) {
      return res.status(404).send("Task not found");
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating task");
  }
});

// ==========================
// 🗑️ DELETE TASK
// ==========================
app.delete("/tasks/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM tasks WHERE id = $1 RETURNING *",
      [id]
    );

    // ✅ Not found check
    if (result.rows.length === 0) {
      return res.status(404).send("Task not found");
    }

    res.send("Task deleted successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting task");
  }
});

// ==========================
// 🚀 Start Server
// ==========================
app.listen(4000, "127.0.0.1", () => {
  console.log("🔥 SERVER STARTED ON 4000");
});