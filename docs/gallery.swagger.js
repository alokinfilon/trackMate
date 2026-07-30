/**
 * @swagger
 * tags:
 *   name: Gallery
 *   description: Trip photo uploads, collections, and image retrieval
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Accessibility:
 *       type: string
 *       enum: [public, shared, private]
 *       description: Controls who can view the photo or collection
 *       example: shared
 *
 *     GalleryImage:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "674c3d4e5f6789012347"
 *         userId:
 *           type: string
 *           example: "674a1b2c3d4e5f6789012345"
 *         tripId:
 *           type: string
 *           example: "674a1b2c3d4e5f6789012345"
 *         collectionId:
 *           type: string
 *           nullable: true
 *           example: "674b2c3d4e5f6789012346"
 *         imageUrl:
 *           type: string
 *           example: "https://res.cloudinary.com/demo/image/upload/v123/trackmate_gallery/photo.jpg"
 *         caption:
 *           type: string
 *           example: "Sunset at the fort"
 *         accessibility:
 *           $ref: '#/components/schemas/Accessibility'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     PhotoCollection:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "674b2c3d4e5f6789012346"
 *         userId:
 *           type: string
 *           example: "674a1b2c3d4e5f6789012345"
 *         tripId:
 *           type: string
 *           example: "674a1b2c3d4e5f6789012345"
 *         name:
 *           type: string
 *           example: "Fort Sunset Shots"
 *         description:
 *           type: string
 *           example: "Evening photos from day 2"
 *         accessibility:
 *           $ref: '#/components/schemas/Accessibility'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CollectionShare:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "6a6b1f29bcc69eab166711bc"
 *         collectionId:
 *           type: string
 *           example: "6a69e485c05f23afda19b8ec"
 *         userId:
 *           type: object
 *           properties:
 *             email:
 *               type: string
 *               example: "rinkal@gmail.com"
 *             id:
 *               type: string
 *               example: "6a68a228f5f132049253655f"
 *         sharedBy:
 *           type: string
 *           example: "6a4cc121e8afd7c00e146393"
 *         role:
 *           type: string
 *           enum: [viewer, editor]
 *           example: editor
 *         status:
 *           type: string
 *           enum: [pending, accepted, declined, revoked, expired]
 *           example: pending
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CollectionPermissions:
 *       type: object
 *       properties:
 *         canView:
 *           type: boolean
 *           example: true
 *         canAdd:
 *           type: boolean
 *           example: true
 *         canEdit:
 *           type: boolean
 *           example: true
 *         canDelete:
 *           type: boolean
 *           example: false
 *
 *     CreateCollectionRequest:
 *       type: object
 *       required:
 *         - tripId
 *         - name
 *       properties:
 *         tripId:
 *           type: string
 *           description: MongoDB ObjectId of the trip
 *           example: "674a1b2c3d4e5f6789012345"
 *         name:
 *           type: string
 *           example: "Fort Sunset Shots"
 *         description:
 *           type: string
 *           example: "Evening photos from day 2"
 *         accessibility:
 *           $ref: '#/components/schemas/Accessibility'
 *
 *     UpdateCollectionRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "Day 2 Photos"
 *         description:
 *           type: string
 *           example: "Updated description"
 *         accessibility:
 *           $ref: '#/components/schemas/Accessibility'
 *
 *     ShareCollectionRequest:
 *       type: object
 *       required:
 *         - identifier
 *       properties:
 *         identifier:
 *           type: string
 *           description: User email or mobile number
 *           example: "rinkal@gmail.com"
 *         role:
 *           type: string
 *           enum: [viewer, editor]
 *           example: editor
 *
 *     AssignImageCollectionRequest:
 *       type: object
 *       properties:
 *         collectionId:
 *           type: string
 *           nullable: true
 *           description: Collection ID to assign, or null to remove from collection
 *           example: "674b2c3d4e5f6789012346"
 *
 *     GallerySuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *         data:
 *           type: object
 *
 *     GalleryErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           example: "Trip not found or access denied."
 *
 *     CollectionMemberListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         count:
 *           type: integer
 *           example: 2
 *         data:
 *           type: array
 *           items:
 *             oneOf:
 *               - $ref: '#/components/schemas/CollectionShare'
 *               - type: object
 *                 properties:
 *                   userId:
 *                     type: string
 *                     example: "6a4cc121e8afd7c00e146393"
 *                   role:
 *                     type: string
 *                     example: owner
 *                   accessType:
 *                     type: string
 *                     example: owner
 *                   status:
 *                     type: string
 *                     example: accepted
 */

/**
 * @swagger
 * /api/gallery/collections:
 *   post:
 *     summary: Create a photo collection for a trip
 *     tags: [Gallery]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCollectionRequest'
 *     responses:
 *       201:
 *         description: Collection created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Photo collection created successfully.
 *                 data:
 *                   $ref: '#/components/schemas/PhotoCollection'
 *       400:
 *         description: Invalid request payload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GalleryErrorResponse'
 *       401:
 *         description: Missing or invalid JWT
 *       404:
 *         description: Trip not found or access denied
 *       409:
 *         description: Collection name already exists for this trip
 *
 *   get:
 *     summary: List photo collections
 *     tags: [Gallery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tripId
 *         schema:
 *           type: string
 *         description: Optional trip ID filter
 *         example: "674a1b2c3d4e5f6789012345"
 *     responses:
 *       200:
 *         description: Collections retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 1
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PhotoCollection'
 *       401:
 *         description: Missing or invalid JWT
 */

/**
 * @swagger
 * /api/gallery/collections/{collectionId}:
 *   get:
 *     summary: Get a collection with its photos
 *     tags: [Gallery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionId
 *         required: true
 *         schema:
 *           type: string
 *         example: "674b2c3d4e5f6789012346"
 *     responses:
 *       200:
 *         description: Collection and photos retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     collection:
 *                       $ref: '#/components/schemas/PhotoCollection'
 *                     permissions:
 *                       $ref: '#/components/schemas/CollectionPermissions'
 *                     photos:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/GalleryImage'
 *                     photoCount:
 *                       type: integer
 *                       example: 3
 *       401:
 *         description: Missing or invalid JWT
 *       404:
 *         description: Collection not found or access denied
 *
 *   patch:
 *     summary: Update collection metadata
 *     tags: [Gallery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionId
 *         required: true
 *         schema:
 *           type: string
 *         example: "674b2c3d4e5f6789012346"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCollectionRequest'
 *     responses:
 *       200:
 *         description: Collection updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/PhotoCollection'
 *       401:
 *         description: Missing or invalid JWT
 *       404:
 *         description: Collection not found or access denied
 *
 *   delete:
 *     summary: Delete a collection (photos remain in trip gallery)
 *     tags: [Gallery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionId
 *         required: true
 *         schema:
 *           type: string
 *         example: "674b2c3d4e5f6789012346"
 *     responses:
 *       200:
 *         description: Collection deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Collection deleted. Photos were kept in the trip gallery.
 *       401:
 *         description: Missing or invalid JWT
 *       404:
 *         description: Collection not found or access denied
 *
 *   post:
 *     summary: Invite a user to a collection
 *     tags: [Gallery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionId
 *         required: true
 *         schema:
 *           type: string
 *         example: "674b2c3d4e5f6789012346"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ShareCollectionRequest'
 *     responses:
 *       200:
 *         description: Collection invite created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Collection invite sent successfully.
 *                 data:
 *                   $ref: '#/components/schemas/CollectionShare'
 *       400:
 *         description: Invalid identifier, invalid role, or collection not shareable
 *       403:
 *         description: Only the owner can share this collection
 *       404:
 *         description: User or collection not found
 *       409:
 *         description: Shared user already has accepted access
 *
 * /api/gallery/collections/{collectionId}/members:
 *   get:
 *     summary: List collection members
 *     tags: [Gallery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionId
 *         required: true
 *         schema:
 *           type: string
 *         example: "674b2c3d4e5f6789012346"
 *     responses:
 *       200:
 *         description: Collection members retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CollectionMemberListResponse'
 *       403:
 *         description: Only the owner can view collection members
 *       404:
 *         description: Collection not found
 *
 * /api/gallery/collections/{collectionId}/members/{memberId}:
 *   delete:
 *     summary: Revoke access for a shared member
 *     tags: [Gallery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionId
 *         required: true
 *         schema:
 *           type: string
 *         example: "674b2c3d4e5f6789012346"
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *         example: "6a68a228f5f132049253655f"
 *     responses:
 *       200:
 *         description: Access revoked successfully
 *       403:
 *         description: Only the owner can revoke access
 *       404:
 *         description: Shared member not found
 */

/**
 * @swagger
 * /api/gallery/images/{imageId}:
 *   get:
 *     summary: Fetch a single image by ID
 *     tags: [Gallery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *         example: "674c3d4e5f6789012347"
 *     responses:
 *       200:
 *         description: Image retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/GalleryImage'
 *       401:
 *         description: Missing or invalid JWT
 *       404:
 *         description: Image not found or access denied
 *
 *   delete:
 *     summary: Delete an image from Cloudinary and the database
 *     tags: [Gallery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *         example: "674c3d4e5f6789012347"
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Image deleted from Cloudinary and database.
 *       401:
 *         description: Missing or invalid JWT
 *       404:
 *         description: Image not found or not owned by the user
 *       502:
 *         description: Cloudinary deletion failed
 */

/**
 * @swagger
 * /api/gallery/images/{imageId}/collection:
 *   patch:
 *     summary: Assign or remove an image from a collection
 *     tags: [Gallery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *         example: "674c3d4e5f6789012347"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssignImageCollectionRequest'
 *     responses:
 *       200:
 *         description: Image collection updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/GalleryImage'
 *       400:
 *         description: Collection and image must belong to the same trip
 *       401:
 *         description: Missing or invalid JWT
 *       404:
 *         description: Image or collection not found
 */

/**
 * @swagger
 * /api/gallery/{tripId}:
 *   post:
 *     summary: Upload an image to a trip gallery
 *     tags: [Gallery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the trip
 *         example: "674a1b2c3d4e5f6789012345"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: JPG, PNG, or WEBP image (max 5MB)
 *               caption:
 *                 type: string
 *                 example: "Sunset at the fort"
 *               accessibility:
 *                 $ref: '#/components/schemas/Accessibility'
 *               collectionId:
 *                 type: string
 *                 description: Optional collection to attach the photo to
 *                 example: "674b2c3d4e5f6789012346"
 *     responses:
 *       201:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/GalleryImage'
 *       400:
 *         description: Missing file, invalid format, or invalid payload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GalleryErrorResponse'
 *       401:
 *         description: Missing or invalid JWT
 *       404:
 *         description: Trip not found or access denied
 *
 *   get:
 *     summary: Get all visible photos for a trip
 *     tags: [Gallery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *         example: "674a1b2c3d4e5f6789012345"
 *     responses:
 *       200:
 *         description: Trip gallery retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 2
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/GalleryImage'
 *       401:
 *         description: Missing or invalid JWT
 *       404:
 *         description: Trip not found
 */
