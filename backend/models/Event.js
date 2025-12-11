const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  photoUrl: { type: String },
  date: { type: Date, required: true },
  attractions: { type: String },
  priceLabel1: { type: String, default: 'Mulher' },
  priceValue1: { type: String, default: '0,00' },
  priceLabel2: { type: String, default: 'Homem' },
  priceValue2: { type: String, default: '0,00' },
  rules: { type: String },
  capacity: { type: Number, default: 200 },
  address: { type: String },
  tableLink: { type: String },
  whatsappPhrase: { type: String },
  showListPublicly: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', EventSchema);