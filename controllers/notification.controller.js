const Notification = require("../models/notification");
const DeviceToken = require("../models/deviceToken");
const CollectionShare = require("../models/collectionShare");
const Collection = require("../models/collection.model");
const { notifyInviteDecision } = require("../utils/notification.service");

async function listNotifications(req, res) {
  try {
    const userId = req.user.id;
    const { state, type, limit = 25, page = 1 } = req.query;
    const query = { userId };

    if (state) {
      query.state = state;
    }

    if (type) {
      query.type = type;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .populate("actorId", "email mobile full_name")
        .populate("collectionId", "name accessibility tripId")
        .populate("shareId", "role status"),
      Notification.countDocuments({ userId, state: "unread" }),
    ]);

    return res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function markNotificationRead(req, res) {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId: req.user.id },
      { $set: { state: "read", readAt: new Date() } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, error: "Notification not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
      data: notification,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function registerDeviceToken(req, res) {
  try {
    const { token, platform = "unknown" } = req.body || {};

    if (!token) {
      return res.status(400).json({ success: false, error: "token is required." });
    }

    const deviceToken = await DeviceToken.findOneAndUpdate(
      { token },
      {
        userId: req.user.id,
        token,
        platform,
        isActive: true,
        lastSeenAt: new Date(),
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: "Device token registered successfully.",
      data: deviceToken,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function removeDeviceToken(req, res) {
  try {
    const { token } = req.params;

    const deleted = await DeviceToken.findOneAndUpdate(
      { token, userId: req.user.id },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!deleted) {
      return res.status(404).json({ success: false, error: "Device token not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Device token removed successfully.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function acceptInvite(req, res) {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findOne({
      _id: notificationId,
      userId: req.user.id,
      type: "collection_invite",
    });

    if (!notification) {
      return res.status(404).json({ success: false, error: "Invite not found." });
    }

    const share = await CollectionShare.findById(notification.shareId);
    if (!share) {
      return res.status(404).json({ success: false, error: "Share record not found." });
    }

    if (String(share.userId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, error: "This invite is not for you." });
    }

    if (share.status === "accepted") {
      return res.status(200).json({
        success: true,
        message: "Invite already accepted.",
      });
    }

    if (share.status !== "pending") {
      return res.status(409).json({
        success: false,
        error: `Invite cannot be accepted in its current state (${share.status}).`,
      });
    }

    share.status = "accepted";
    await share.save();

    notification.state = "actioned";
    notification.readAt = new Date();
    await notification.save();

    const collection = await Collection.findById(share.collectionId).select("name");
    await notifyInviteDecision({
      ownerId: share.sharedBy,
      actorId: req.user.id,
      collectionId: share.collectionId,
      shareId: share._id,
      decision: "accepted",
      collectionName: collection?.name,
    });

    return res.status(200).json({
      success: true,
      message: "Invite accepted successfully.",
      data: share,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function declineInvite(req, res) {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findOne({
      _id: notificationId,
      userId: req.user.id,
      type: "collection_invite",
    });

    if (!notification) {
      return res.status(404).json({ success: false, error: "Invite not found." });
    }

    const share = await CollectionShare.findById(notification.shareId);
    if (!share) {
      return res.status(404).json({ success: false, error: "Share record not found." });
    }

    if (String(share.userId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, error: "This invite is not for you." });
    }

    if (share.status === "accepted") {
      return res.status(409).json({
        success: false,
        error: "Accepted invites cannot be declined.",
      });
    }

    share.status = "declined";
    await share.save();

    notification.state = "actioned";
    notification.readAt = new Date();
    await notification.save();

    const collection = await Collection.findById(share.collectionId).select("name");
    await notifyInviteDecision({
      ownerId: share.sharedBy,
      actorId: req.user.id,
      collectionId: share.collectionId,
      shareId: share._id,
      decision: "declined",
      collectionName: collection?.name,
    });

    return res.status(200).json({
      success: true,
      message: "Invite declined successfully.",
      data: share,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function markAllNotificationsRead(req, res) {
  try {
    const userId = req.user.id;
    await Notification.updateMany(
      { userId, state: "unread" },
      { $set: { state: "read", readAt: new Date() } }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  registerDeviceToken,
  removeDeviceToken,
  acceptInvite,
  declineInvite,
};
