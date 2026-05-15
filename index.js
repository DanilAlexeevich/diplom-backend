const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Главный маршрут — добавление или обновление товара
app.post("/products", async (req, res) => {
  try {
    const { name, price, status, ref } = req.body;

    if (!ref) {
      return res.status(400).json({ error: "ref (идентификатор из 1С) обязателен" });
    }

    const result = await pool.query(`
      INSERT INTO products (ref, name, price, status)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (ref) 
      DO UPDATE SET 
        name = EXCLUDED.name,
        price = EXCLUDED.price,
        status = EXCLUDED.status,
        created_at = CURRENT_TIMESTAMP
      RETURNING *;
    `, [ref, name, price, status]);

    res.json({ 
      success: true, 
      message: "Товар успешно сохранён",
      product: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/products", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
