const express = require("express");
const router = express.Router();
const passport = require("../middleware/passport");
const notificationController = require("../controllers/notification.controller");

router.use(passport.authenticate(["jwt", "basic"], { session: false }));

router.get("/", notificationController.listNotifications);
router.post("/device-tokens", notificationController.registerDeviceToken);
router.delete("/device-tokens/:token", notificationController.removeDeviceToken);
router.patch("/read-all", notificationController.markAllNotificationsRead);
router.patch("/:notificationId/read", notificationController.markNotificationRead);
router.patch("/:notificationId/accept", notificationController.acceptInvite);
router.patch("/:notificationId/decline", notificationController.declineInvite);

module.exports = router;
