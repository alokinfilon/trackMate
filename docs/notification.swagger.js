/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: In-app notifications, Firebase device tokens, and collection invite responses
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     DeviceTokenRequest:
 *       type: object
 *       required:
 *         - token
 *       properties:
 *         token:
 *           type: string
 *           example: "fcm-device-token"
 *         platform:
 *           type: string
 *           enum: [android, ios, web, unknown]
 *           example: android
 *
 *     NotificationItem:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "66a6ab3b1e1f9f0012345678"
 *         userId:
 *           type: string
 *           example: "66a6ab3b1e1f9f0012345677"
 *         actorId:
 *           type: object
 *           nullable: true
 *         type:
 *           type: string
 *           example: collection_invite
 *         title:
 *           type: string
 *           example: Collection invite
 *         message:
 *           type: string
 *           example: You were invited to Europe trip.
 *         entityType:
 *           type: string
 *           example: collection
 *         entityId:
 *           type: string
 *           nullable: true
 *         collectionId:
 *           type: string
 *           nullable: true
 *         shareId:
 *           type: string
 *           nullable: true
 *         metadata:
 *           type: object
 *         state:
 *           type: string
 *           enum: [unread, read, actioned]
 *           example: unread
 *         readAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     NotificationListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         count:
 *           type: integer
 *           example: 2
 *         unreadCount:
 *           type: integer
 *           example: 1
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/NotificationItem'
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: List the current user's notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *           enum: [unread, read, actioned]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification inbox retrieved successfully
 *       401:
 *         description: Missing or invalid JWT
 *
 * /api/notifications/device-tokens:
 *   post:
 *     summary: Register a Firebase device token for push notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeviceTokenRequest'
 *     responses:
 *       200:
 *         description: Device token registered successfully
 *
 * /api/notifications/device-tokens/{token}:
 *   delete:
 *     summary: Disable a Firebase device token
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Device token removed successfully
 *
 * /api/notifications/{notificationId}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 *
 * /api/notifications/{notificationId}/accept:
 *   patch:
 *     summary: Accept a collection invite
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invite accepted successfully
 *
 * /api/notifications/{notificationId}/decline:
 *   patch:
 *     summary: Decline a collection invite
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invite declined successfully
 */
