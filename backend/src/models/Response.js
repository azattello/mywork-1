const mongoose = require("mongoose");

const responseSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },
    specialist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: { type: String },
    price: { type: Number },
    deadline: { type: Date }, // Срок выполнения
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Один специалист может оставить только один отклик на заявку
responseSchema.index({ application: 1, specialist: 1 }, { unique: true });

module.exports = mongoose.model("Response", responseSchema);
