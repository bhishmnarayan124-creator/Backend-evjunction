const axios = require("axios");

const sendSMS = async (phone, otp) => {
  try {
    const response = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        route: "q",
        message: `Your EVJunction OTP is ${otp}. Valid for 10 minutes.`,
        language: "english",
        numbers: phone,
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("SMS sent:", response.data);

    return response.data;

  } catch (error) {
    console.error(
      "SMS error:",
      error.response?.data || error.message
    );

    throw new Error("SMS sending failed");
  }
};

module.exports = sendSMS;