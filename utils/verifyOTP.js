const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const verifyOTP = async (phone, code) => {
  try {

    if (!phone || !code) {
      throw new Error("Phone and OTP required");
    }

    // ✅ Normalize phone number safely
    let formattedPhone = phone.toString().trim();

    // Handle formats:
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

    console.log("📲 Verifying OTP for:", formattedPhone);

    const response = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({
        to: formattedPhone,
        code: code,
      });

    console.log("OTP VERIFY STATUS:", response.status);

    return response.status === "approved";

  } catch (error) {

    console.error(
      "❌ OTP verify error:",
      error.message || error
    );

    return false;
  }
};

module.exports = verifyOTP;