require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

// ✅ Import routes
const AuthRouter = require("./Routes/authRoute");
const HorseBetRoute = require("./Routes/HorseBetRoute");
const HorsesRoute = require("./Routes/Horses");
const PaymentRoutes = require("./Routes/PaymentRoutes");
const UserManagementRoute = require("./Routes/userManagementRoute");
const LuckyDrawRoute = require("./Routes/LuckyDrawRoute");
const RaceTimerRoute = require("./Routes/RaceTimerRoute");
const WithdrawRoute = require("./Routes/WithdrawRoute");
const ApkRoutes = require("./Routes/APKRoutes");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Ensure Razorpay checkout page exists
const razorpayDir = path.join(__dirname, "public", "razorpay");
const checkoutFile = path.join(razorpayDir, "checkout.html");

if (!fs.existsSync(razorpayDir)) fs.mkdirSync(razorpayDir, { recursive: true });

if (!fs.existsSync(checkoutFile)) {
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Razorpay Checkout</title>
</head>
<body>
  <h2 style="text-align:center;">Razorpay Checkout Loading...</h2>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <script>
    const query = new URLSearchParams(window.location.search);
    const orderId = query.get("order_id");
    const amount = query.get("amount");
    const key = query.get("key");
    const userName = query.get("name") || "User";

    if (!orderId || !amount || !key) {
      document.body.innerHTML = "<h3 style='color:red;text-align:center;'>Missing payment details</h3>";
    } else {
      const options = {
        key,
        amount,
        currency: "INR",
        name: "Horse Racing Game",
        description: "Wallet Deposit",
        order_id: orderId,
        handler: function (response) {
          fetch("/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response)
          })
          .then(res => res.json())
          .then(data => {
            if (data.success){
              if (window.Unity) Unity.call("success");
              else alert("✅ Payment successful! Wallet updated.");
            } else {
              if (window.Unity) Unity.call("failure");
              else alert("❌ Payment failed.");
            }
          })
          .catch(err => {
            console.log(err);
            if (window.Unity) Unity.call("failure");
            else alert("❌ Verification failed");
          });
        },
        prefill: { name: userName },
        theme: { color: "#3399cc" }
      };
      const rzp = new Razorpay(options);
      rzp.open();
    }
  </script>
</body>
</html>
  `;
  fs.writeFileSync(checkoutFile, htmlContent, "utf8");
  console.log("✅ Razorpay checkout.html auto-created");
}

// ✅ Serve Razorpay page
app.use("/razorpay", express.static(razorpayDir));

// ✅ Routes
app.use("/", AuthRouter);
app.use("/", HorseBetRoute);
app.use("/", HorsesRoute);
app.use("/", PaymentRoutes);
app.use("/", WithdrawRoute);
app.use("/", UserManagementRoute);
app.use("/", LuckyDrawRoute);
app.use("/", RaceTimerRoute);
app.use("/", ApkRoutes);

// ✅ MongoDB connection
mongoose
  .connect(process.env.mongodb_url)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Start server
const PORT = process.env.port || 5000;
const BASE_URL =
  process.env.NODE_ENV === "production"
    ? process.env.SERVER_URL
    : `http://localhost:${PORT}`;

const server = http.createServer(app);
server.listen(PORT, () => console.log(`🚀 Server running on ${BASE_URL}`));
