require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");
const stripe = require("stripe")(
  "sk_test_51PKbFz057vnn9ydrL5SlZ3Hp8nJQVvHSm4XLgbdEJ3x2lcV4c1XM0sntBUmXPjmYgmjf2ghdn9xoTT5Hz4BJyDBL00PsTosXUy"
);

app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose
  .connect(
    "mongodb+srv://shambhavigupta230:0aydYeyAF42hmW8n@cluster0.taa1cmv.mongodb.net/task?retryWrites=true&w=majority&appName=Cluster0",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Define a schema and model for the orders
const orderSchema = new mongoose.Schema({
  email: String,
  transactionId: String,
  paymentStatus: String,
  items: [
    {
      name: String,
      image: String,
      price: Number,
      quantity: Number,
    },
  ],
});

const Order = mongoose.model("Order", orderSchema);

// Checkout API
app.post("/api/create-checkout-session", async (req, res) => {
  const { products, email } = req.body;

  const lineItems = products.map((product) => ({
    price_data: {
      currency: "inr",
      product_data: {
        name: product.dish,
        images: [product.imgdata],
      },
      unit_amount: product.price * 100,
    },
    quantity: product.qnty,
  }));

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/cancel",
      metadata: { email: email },
    });

    // Save order details in the database
    const newOrder = new Order({
      email: email,
      transactionId: session.id,
      paymentStatus: "completed",
      items: products.map((product) => ({
        name: product.dish,
        image: product.imgdata,
        price: product.price,
        quantity: product.qnty,
      })),
    });

    await newOrder.save();

    res.json({ id: session.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(7000, () => {
  console.log("server start");
});
