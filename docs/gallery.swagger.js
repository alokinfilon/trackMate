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
