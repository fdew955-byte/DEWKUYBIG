const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'orders.json');

app.use(express.json({ limit: '100kb' }));

// Allow the GitHub Pages site to call this API.
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

function readOrders() {
  try {
    if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeOrders(orders) {
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(orders, null, 2), 'utf8');
  fs.renameSync(tmp, DATA_FILE);
}

app.get('/api/orders', (req, res) => {
  res.json(readOrders());
});

app.post('/api/orders', (req, res) => {
  const { username, type, detail, amount, time } = req.body || {};
  if (!username || !type) {
    return res.status(400).json({ ok: false, message: 'ข้อมูลออเดอร์ไม่ครบ' });
  }

  const orders = readOrders();
  const order = {
    id: crypto.randomUUID(),
    username: String(username),
    type: String(type),
    detail: detail == null ? '' : String(detail),
    amount: Number(amount || 0),
    status: 'รอชำระเงิน',
    time: time || new Date().toLocaleString('th-TH')
  };

  orders.unshift(order);
  writeOrders(orders);
  res.status(201).json({ ok: true, order });
});

app.patch('/api/orders/:id', (req, res) => {
  const orders = readOrders();
  const index = orders.findIndex(o => String(o.id) === String(req.params.id));
  if (index < 0) return res.status(404).json({ ok: false, message: 'ไม่พบออเดอร์' });

  if (req.body && req.body.status != null) {
    orders[index].status = String(req.body.status);
  }
  writeOrders(orders);
  res.json({ ok: true, order: orders[index] });
});

app.delete('/api/orders/:id', (req, res) => {
  const orders = readOrders();
  const next = orders.filter(o => String(o.id) !== String(req.params.id));
  if (next.length === orders.length) {
    return res.status(404).json({ ok: false, message: 'ไม่พบออเดอร์' });
  }
  writeOrders(next);
  res.json({ ok: true });
});
app.get('/', (req, res) => {
  res.send('DEWKUYBIG Backend ทำงานปกติ ✅');
});     

app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`DEWKUYBIG order backend running on port ${PORT}`);
});
