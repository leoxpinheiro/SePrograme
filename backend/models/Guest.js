const mongoose = require('mongoose');

const GuestEntrySchema = new mongoose.Schema({
  name: { type: String, required: true },
  gender: { type: String, enum: ['M', 'F'], default: 'M' },
  checkedIn: { type: Boolean, default: false },
  checkInTime: { type: Date }
});

const GuestSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  entries: [GuestEntrySchema],
  isFake: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Guest', GuestSchema);