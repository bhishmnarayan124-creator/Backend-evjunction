const Notification = require("../models/Notification");

exports.createNotification = async ({
  type,
  title,
  message,
  user = null,
  relatedCar = null,
  forAdmin = true // default admin notification
}) => {
  try {

    const notification = await Notification.create({
      type,
      title,
      message,
      createdBy: user,
      relatedCar,
      forAdmin,
      is_read: false
    });

    // realtime socket notification
    if (global.io && forAdmin) {
      global.io
        .to("admin_room")
        .emit("new_notification", notification);
    }

    return notification;

  } catch (err) {

    console.error(
      "Notification creation failed:",
      err.message
    );

    return null;
  }
};