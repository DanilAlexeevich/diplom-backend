const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Тестовый маршрут
app.get("/", (req, res) => {
  res.send("Backend работает!");
});

// Получить все товары
app.get("/products", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Добавить товар
app.post("/products", async (req, res) => {
  try {
    const { name, price, status } = req.body;

    const result = await pool.query(
      `INSERT INTO products(name, price, status) 
       VALUES($1, $2, $3) 
       RETURNING *`,
      [name, price, status],
    );

    res.status(201).json({ success: true, product: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
