const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  summ: { type: Number, default: 0 },
  info: { type: String },
  city: { type: String },
  mode: { type: String },
  comm: { type: String },
  active: { type: Boolean, default: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
