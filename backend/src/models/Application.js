const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    // Бюджет: фиксированный или диапазон
    summ: { type: Number, default: 0 }, // Для совместимости
    budgetMin: { type: Number, default: 0 },
    budgetMax: { type: Number, default: 0 },
    budgetType: {
      type: String,
      enum: ["fixed", "range"],
      default: "fixed",
    },
    // Категории
    categories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    }],
    // Описание
    info: { type: String },
    description: { type: String },
    
    // Фото заказа (можно загрузить несколько фото для примера)
    photos: [
      {
        url: String,
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    
    // Место работы
    city: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'City'
    },
    workMode: {
      type: String,
      enum: ["online", "offline"],
      default: "online",
    },
    address: { type: String }, // Адрес для офлайн работы
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    // Сроки
    deadline: { type: Date },
    active: { type: Boolean, default: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Статусы: open | in_progress | closed
    status: {
      type: String,
      enum: ["open", "in_progress", "closed"],
      default: "open",
    },
    proposalStatus: {
      type: String,
      enum: ["active", "closed"],
      default: "active",
    },
    currentSpecialist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // Proposed specialist selected by client, waiting for specialist confirmation
    proposedSpecialist: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    pendingSpecialistConfirmation: { type: Boolean, default: false },
    workCompleted: { type: Boolean, default: false },
    workAccepted: { type: Boolean, default: false },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
    cancelReason: { type: String },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Виртуальные поля для связей
applicationSchema.virtual("responses", {
  ref: "Response",
  localField: "_id",
  foreignField: "application",
});

applicationSchema.virtual("review", {
  ref: "Review",
  localField: "_id",
  foreignField: "application",
  justOne: true,
});

module.exports = mongoose.model("Application", applicationSchema);
