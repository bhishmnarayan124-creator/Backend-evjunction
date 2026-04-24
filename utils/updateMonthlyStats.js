const MonthlyStats = require("../models/MonthlyStats");

exports.updateMonthlyStats = async (field, value = 1) => {
  try {

    console.log("MonthlyStats update triggered");

    const now = new Date();

    const month = now.toLocaleString("default", {
      month: "short"
    });

    const monthNumber = now.getMonth() + 1;

    const year = now.getFullYear();

    console.log("Updating stats:", {
      field,
      value,
      month,
      year
    });

    const result = await MonthlyStats.updateOne(
      { month, year },

      {
        $inc: { [field]: value },

        // ⚠️ DO NOT include same field here
        $setOnInsert: {
          month,
          monthNumber,
          year
        }
      },

      { upsert: true }
    );

    console.log("MonthlyStats DB result:", result);

  } catch (error) {

    console.error(
      "Monthly stats update error:",
      error.message
    );

  }
};