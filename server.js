const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
const BOOKINGS_FILE = path.join(__dirname, 'bookings.json');

app.use(express.json());
app.use(express.static(path.join(__dirname)));

async function readBookings(){
  try {
    const data = await fs.readFile(BOOKINGS_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}
async function writeBookings(bookings){
  await fs.writeFile(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
}

app.get('/api/bookings', async (req, res) => {
  const bookings = await readBookings();
  res.json(bookings);
});

app.post('/api/bookings', async (req, res) => {
  const { name, email, service, date, address } = req.body;
  if (!name || !email || !service || !date || !address) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const bookings = await readBookings();
  const booking = {
    id: Date.now(),
    createdAt: new Date().toISOString(),
    ...req.body
  };
  bookings.push(booking);
  await writeBookings(bookings);
  res.status(201).json({ ok: true, booking });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});