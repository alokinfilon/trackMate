const Notification = require("../models/notification");
const DeviceToken = require("../models/deviceToken");
const Collection = require("../models/collection.model");
const CollectionShare = require("../models/collectionShare");
const { admin } = require("./firebase");

function stringifyData(data = {}) {
  const result = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    result[key] = typeof value === "string" ? value : JSON.stringify(value);
  });
  return result;
}

async function sendPushToUser(userId, { title, message, data = {} }) {
  if (!admin || typeof admin.getApps !== "function" || admin.getApps().length === 0) {
    return { skipped: true, reason: "firebase-not-initialized" };
  }

  const devices = await DeviceToken.find({ userId, isActive: true }).select("token");
  const tokens = devices.map((device) => device.token).filter(Boolean);

  if (tokens.length === 0) {
    return { skipped: true, reason: "no-device-tokens" };
  }

  const response = await admin.messaging().sendEachForMulticast({
    tokens,
    notification: {
      title,
      body: message,
    },
    data: stringifyData(data),
  });

  return response;
}

async function createNotification(payload) {
  const notification = await Notification.create({
    userId: payload.userId,
    actorId: payload.actorId || null,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    entityType: payload.entityType || "collection",
    entityId: payload.entityId || null,
    collectionId: payload.collectionId || null,
    shareId: payload.shareId || null,
    metadata: payload.metadata || {},
  });

  await sendPushToUser(payload.userId, {
    title: payload.title,
    message: payload.message,
    data: {
      notificationId: String(notification._id),
      type: payload.type,
      entityType: payload.entityType || "collection",
      entityId: payload.entityId ? String(payload.entityId) : "",
      collectionId: payload.collectionId ? String(payload.collectionId) : "",
      shareId: payload.shareId ? String(payload.shareId) : "",
      state: notification.state,
      metadata: payload.metadata || {},
    },
  }).catch((error) => {
    console.warn("Firebase push failed:", error.message);
  });

  return notification;
}

async function getCollectionParticipants(collectionId) {
  const collection = await Collection.findById(collectionId);
  if (!collection) {
    return null;
  }

  const shares = await CollectionShare.find({
    collectionId,
    status: "accepted",
  }).select("userId role status");

  return {
    collection,
    ownerId: collection.userId,
    participantIds: [
      String(collection.userId),
      ...shares.map((share) => String(share.userId)),
    ],
  };
}

async function notifyCollectionParticipants({
  collectionId,
  actorId,
  type,
  title,
  message,
  metadata = {},
  entityType = "collection",
  entityId = null,
}) {
  const context = await getCollectionParticipants(collectionId);
  if (!context) {
    return [];
  }

  const recipientIds = [...new Set(context.participantIds)].filter(
    (recipientId) => String(recipientId) !== String(actorId)
  );

  const notifications = [];
  for (const recipientId of recipientIds) {
    notifications.push(
      await createNotification({
        userId: recipientId,
        actorId,
        type,
        title,
        message,
        entityType,
        entityId: entityId || collectionId,
        collectionId,
        metadata,
      })
    );
  }

  return notifications;
}

async function notifyCollectionOwner({
  collectionId,
  actorId,
  type,
  title,
  message,
  metadata = {},
  entityType = "collection",
  entityId = null,
}) {
  const context = await getCollectionParticipants(collectionId);
  if (!context) {
    return null;
  }

  if (String(context.ownerId) === String(actorId)) {
    return null;
  }

  return createNotification({
    userId: context.ownerId,
    actorId,
    type,
    title,
    message,
    entityType,
    entityId: entityId || collectionId,
    collectionId,
    metadata,
  });
}

async function notifyCollectionInvite({
  recipientId,
  actorId,
  collectionId,
  shareId,
  role,
  collectionName,
  accessibility,
}) {
  return createNotification({
    userId: recipientId,
    actorId,
    type: "collection_invite",
    title: "Collection invite",
    message: `You were invited to ${collectionName || "a collection"}.`,
    entityType: "collection",
    entityId: collectionId,
    collectionId,
    shareId,
    metadata: {
      role,
      accessibility,
      status: "pending",
    },
  });
}

async function notifyInviteDecision({
  ownerId,
  actorId,
  collectionId,
  shareId,
  decision,
  collectionName,
}) {
  return createNotification({
    userId: ownerId,
    actorId,
    type: decision === "accepted" ? "collection_invite_accepted" : "collection_invite_declined",
    title: decision === "accepted" ? "Invite accepted" : "Invite declined",
    message: `Your invite for ${collectionName || "a collection"} was ${decision}.`,
    entityType: "collection",
    entityId: collectionId,
    collectionId,
    shareId,
    metadata: {
      decision,
    },
  });
}

async function notifyAccessRevoked({
  recipientId,
  actorId,
  collectionId,
  shareId,
  collectionName,
}) {
  return createNotification({
    userId: recipientId,
    actorId,
    type: "collection_access_revoked",
    title: "Access revoked",
    message: `Access to ${collectionName || "a collection"} was revoked.`,
    entityType: "collection",
    entityId: collectionId,
    collectionId,
    shareId,
    metadata: {},
  });
}

module.exports = {
  createNotification,
  notifyCollectionParticipants,
  notifyCollectionOwner,
  notifyCollectionInvite,
  notifyInviteDecision,
  notifyAccessRevoked,
  sendPushToUser,
  getCollectionParticipants,
};
