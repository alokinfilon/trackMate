/**
 * @swagger
 * tags:
 *   name: App
 *   description: Shared app content such as FAQs, reviews, preferences, privacy policy, and terms
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     FAQ:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         question:
 *           type: string
 *         answer:
 *           type: string
 *         category:
 *           type: string
 *         slug:
 *           type: string
 *     Review:
 *       type: object
 *       properties:
 *         user_name:
 *           type: string
 *         posted_date:
 *           type: string
 *           format: date-time
 *         review:
 *           type: string
 *         rating:
 *           type: number
 *         likes:
 *           type: number
 *         user_image:
 *           type: string
 *     TravelPreferenceCategory:
 *       type: object
 *       properties:
 *         category:
 *           type: string
 *         options:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               label:
 *                 type: string
 *     UserPreferences:
 *       type: object
 *       additionalProperties:
 *         type: array
 *         items:
 *           type: string
 *
 * /api/faqs:
 *   get:
 *     summary: Get FAQs
 *     tags: [App]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: FAQ list returned successfully
 *
 * /api/reviews:
 *   get:
 *     summary: Get reviews
 *     tags: [App]
 *     parameters:
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [latest, likes, highest_rating]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Review list returned successfully
 *
 * /api/travel-preferences:
 *   get:
 *     summary: Get available travel preference categories
 *     tags: [App]
 *     responses:
 *       200:
 *         description: Preference categories returned successfully
 *
 * /api/privacy-policy:
 *   get:
 *     summary: Get the privacy policy HTML page
 *     tags: [App]
 *     responses:
 *       200:
 *         description: Privacy policy returned successfully
 *
 * /api/terms:
 *   get:
 *     summary: Get the terms and conditions HTML page
 *     tags: [App]
 *     responses:
 *       200:
 *         description: Terms returned successfully
 *
 * /auth/profile:
 *   get:
 *     summary: Get the authenticated user's profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *       - basicAuth: []
 *     responses:
 *       200:
 *         description: Profile returned successfully
 *   put:
 *     summary: Update the authenticated user's profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *       - basicAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               country:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *
 * /auth/preferences:
 *   get:
 *     summary: Get saved user preferences
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *       - basicAuth: []
 *     responses:
 *       200:
 *         description: Preferences returned successfully
 *   put:
 *     summary: Update saved user preferences
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *       - basicAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserPreferences'
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 *
 * /auth/auth0-sync:
 *   post:
 *     summary: Sync an Auth0 user into the local database
 *     tags: [Auth]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idToken:
 *                 type: string
 *               accessToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Auth0 user synced successfully
 */
