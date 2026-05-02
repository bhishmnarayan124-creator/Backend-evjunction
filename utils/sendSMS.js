const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendSMS = async (phone) => {
  try {
    // ✅ Validate phone
    if (!phone) {
      throw new Error("Phone number required");
    }

    // ✅ Normalize phone number format
    let formattedPhone = phone.toString().trim();

    // Handle different formats:
    // 8078671752
    // 918078671752
    // +918078671752
    if (!formattedPhone.startsWith("+")) {
      if (formattedPhone.startsWith("91")) {
        formattedPhone = `+${formattedPhone}`;
      } else {
        formattedPhone = `+91${formattedPhone}`;
      }
    }

    console.log("📲 Sending OTP to:", formattedPhone);

    // ✅ Send OTP using Twilio Verify
    const response = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({
        to: formattedPhone,
        channel: "sms",
      });

    console.log("✅ OTP SENT STATUS:", response.status);

    return response;

  } catch (error) {
    console.error("❌ SMS error:", error.message || error);
    throw new Error("OTP sending failed");
  }
};

module.exports = sendSMS;