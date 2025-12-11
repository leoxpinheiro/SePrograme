const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for images

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error(err));

// Routes
const Event = require('./models/Event');
const Guest = require('./models/Guest');

// --- Events API ---
app.get('/api/events', async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const newEvent = new Event(req.body);
    const savedEvent = await newEvent.save();
    res.json(savedEvent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Guests API ---
app.get('/api/events/:id/guests', async (req, res) => {
  try {
    const guests = await Guest.find({ event: req.params.id });
    res.json(guests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/guests', async (req, res) => {
  try {
    const newGuest = new Guest(req.body);
    const savedGuest = await newGuest.save();
    res.json(savedGuest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Check-in API ---
app.patch('/api/guests/:guestId/entries/:entryId', async (req, res) => {
  try {
    const { checkedIn } = req.body;
    const guest = await Guest.findById(req.params.guestId);
    if (!guest) return res.status(404).json({ error: "Guest not found" });

    const entry = guest.entries.id(req.params.entryId);
    if (!entry) return res.status(404).json({ error: "Entry not found" });

    entry.checkedIn = checkedIn;
    if (checkedIn) entry.checkInTime = new Date();
    else entry.checkInTime = null;

    await guest.save();
    res.json(guest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));