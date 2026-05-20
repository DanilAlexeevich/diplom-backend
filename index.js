const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Тестовый маршрут
app.get("/", (req, res) => {
  res.send("Backend работает! ✅");
});

// Получить все товары
app.get("/products", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Создание / обновление товара
app.post("/products", async (req, res) => {
  try {
    const { ref, name, price, status, category, description } = req.body;

    if (!ref || !name) {
      return res.status(400).json({ error: "ref и name обязательны" });
    }

    const result = await pool.query(`
      INSERT INTO products (ref, name, price, status, category, description)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (ref) 
      DO UPDATE SET 
        name = EXCLUDED.name,
        price = EXCLUDED.price,
        status = EXCLUDED.status,
        category = EXCLUDED.category,
        description = EXCLUDED.description,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `, [ref, name, price, status, category, description]);

    res.json({ 
      success: true, 
      message: "Товар сохранён",
      product: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Удаление товара
app.delete("/products/:ref", async (req, res) => {
  try {
    const { ref } = req.params;
    const result = await pool.query("DELETE FROM products WHERE ref = $1 RETURNING *", [ref]);
    
    if (result.rowCount > 0) {
      res.json({ success: true, message: "Товар удалён" });
    } else {
      res.status(404).json({ success: false, message: "Товар не найден" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
