import express from "express";
import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));

app.get("/days/:date", async (req, res) => {
  try {
    const { date } = req.params;

    const result = await pool.query(
      "SELECT * FROM daily_logs WHERE date = $1",
      [date]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/days", async (req, res) => {
  const { user_id, date, note, color, done = false } = req.body;

  try {
    await pool.query(
      `
      INSERT INTO daily_logs (user_id, date, note, color, done)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (date)
      DO UPDATE SET
        note = EXCLUDED.note,
        color = EXCLUDED.color,
        done = EXCLUDED.done
      `,
      [user_id, date, note, color, done]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

app.get("/days", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT date, color, done FROM daily_logs"
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});