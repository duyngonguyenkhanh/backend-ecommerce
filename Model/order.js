const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const orderSchema = new Schema({
  products: [
    {
      product: { type: Object, required: true },
      quantity: { type: Number, required: true },
    },
  ],
  user: {
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User",
      },
    fullname: {
        type: String,
        required: true
      },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
  },
});

module.exports = mongoose.model("Order", orderSchema);
