/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: API for managing user authentication
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the user
 *         email:
 *           type: string
 *           description: The user's email address (optional if registered via mobile)
 *         mobile:
 *           type: string
 *           description: The user's mobile number (optional if registered via email)
 *         password:
 *           type: string
 *           description: The user's hashed password
 *       example:
 *         id: "60d0fe4f5311236168a109ca"
 *         email: johndoe@example.com
 *         mobile: "+1234567890"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     NewUser:
 *       type: object
 *       required:
 *         - identifier
 *         - password
 *         - confirmPassword
 *       properties:
 *         identifier:
 *           type: string
 *           description: Accepts either a valid email address or a mobile number
 *           example: "johndoe@example.com"
 *         password:
 *           type: string
 *           description: The user's password
 *         confirmPassword:
 *           type: string
 *           description: The user's password confirmation
 *       example:
 *         identifier: "johndoe@example.com"
 *         password: john123
 *         confirmPassword: john123
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     cart:
 *      type: object
 *      required:
 *        - productId
 *        - quantity
 *      properties:
 *        productId:
 *          type: string
 *          description: The unique ID of the product
 *        quantity:
 *          type: integer
 *          description: Quantity to change (positive adds, negative subtracts)
 *      example:
 *        productId: "60d0fe4f5311236168a109ca"
 *        quantity: 1
 *         
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewUser'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - password
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Accepts either a valid email address or a mobile number
 *                 example: "+1234567890"
 *               password:
 *                 type: string
 *                 example: john123
 *     responses:
 *       200:
 *         description: User logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: JWT token
 *                 refreshToken:
 *                   type: string
 *                   description: A refresh token
 *                 userId:
 *                   type: string
 *                   description: Unique ID of the authenticated user
 */

/**
 * @swagger
 * /auth/token/refresh:
 *   post:
 *     summary: Refresh a user's token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: New JWT token
 *                 refreshToken:
 *                   type: string
 *                   description: A refresh token
 *                 userId:
 *                   type: string
 *                   description: Unique ID of the user
 */

/**
 * @swagger
 * /auth/whoami:
 *   get:
 *     summary: Get the authenticated user's details
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *       - basicAuth: []
 *     responses:
 *       200:
 *         description: The authenticated user's details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
