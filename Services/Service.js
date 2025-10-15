const axios = require("axios");

const RAZORPAY_API_KEY = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_API_SECRET = process.env.RAZORPAY_KEY_SECRET;
const RAZORPAYX_BASE_URL = "https://api.razorpay.com/v1";


// Axios instance with auth
const razorpay = axios.create({
  baseURL: RAZORPAYX_BASE_URL,
  auth: {
    username: RAZORPAY_API_KEY,
    password: RAZORPAY_API_SECRET,
  },
});

// ------------------- Create Contact -------------------
exports.createContact = async (user) => {
  try {
    let name = (user.name || "").trim();

    // ✅ Razorpay requires at least 3 valid characters (letters/spaces)
    if (!name || name.length < 3) {
      name = `User_${user._id.toString().slice(-6)}`; // fallback name
    }

    // Remove invalid chars
    name = name.replace(/[^a-zA-Z0-9\s]/g, "");

    console.log("Creating Razorpay contact for:", name);

    const response = await razorpay.post("/contacts", {
      name,
      email: user.email || `user${Date.now()}@example.com`,
      contact: user.phone || "",
      type: "customer",
      reference_id: `user_${user._id}`,
    });

    return response.data;
  } catch (error) {
    console.error("❌ Razorpay createContact Error:", error.response?.data || error);
    throw new Error(
      error.response?.data?.error?.description ||
      "Razorpay contact creation failed"
    );
  }
};


// ------------------- Create Fund Account -------------------
exports.createFundAccount = async (contactId, accountDetails) => {
  try {
    let fundData;

    if (accountDetails.upi_id) {
      fundData = {
        contact_id: contactId,
        account_type: "vpa",
        vpa: { address: accountDetails.upi_id },
      };
    } else {
      fundData = {
        contact_id: contactId,
        account_type: "bank_account",
        bank_account: {
          name: accountDetails.account_holder_name,
          ifsc: accountDetails.ifsc,
          account_number: accountDetails.account_number,
        },
      };
    }

    const response = await razorpay.post("/fund_accounts", fundData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error?.description || "Fund account creation failed");
  }
};

// ------------------- Create Payout -------------------
exports.createPayout = async (fundAccountId, amount, mode = "IMPS") => {
  try {
    // const response = await razorpay.post("/payouts", {
    //   account_number: process.env.RAZORPAYX_VIRTUAL_ACC, // Your business virtual account number
    //   fund_account_id: fundAccountId,
    //   amount: Math.round(amount * 100), // Convert to paise
    //   currency: "INR",
    //   mode,
    //   purpose: "payout",
    //   queue_if_low_balance: true,
    //   narration: "User withdrawal",
    // });
    const response = await razorpay.post("/payouts", {
  fund_account_id: fundAccountId,
  amount: Math.round(amount * 100), // in paise
  currency: "INR",
  mode: mode, // "IMPS", "NEFT", etc.
  purpose: "payout",
  queue_if_low_balance: true,
  narration: `User withdrawal - ${Date.now()}`,
});


    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error?.description || "Payout creation failed");
  }
};
