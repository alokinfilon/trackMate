/**
 * @swagger
 * tags:
 *   name: Trips
 *   description: Trip booking, trip updates, and trip analytics
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Trip:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         userId:
 *           type: string
 *         location_id:
 *           type: string
 *         sublocation:
 *           type: array
 *           items:
 *             type: string
 *         status:
 *           type: string
 *           enum: [upcoming, partially completed, completed, cancelled]
 *         price:
 *           type: number
 *         number_of_people:
 *           type: integer
 *         total_price:
 *           type: number
 *         start_date:
 *           type: string
 *           format: date-time
 *         end_date:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateTripRequest:
 *       type: object
 *       required:
 *         - location_id
 *         - price
 *         - number_of_people
 *         - start_date
 *         - end_date
 *       properties:
 *         location_id:
 *           type: string
 *         sublocation:
 *           type: array
 *           items:
 *             type: string
 *         price:
 *           type: number
 *         number_of_people:
 *           type: integer
 *         start_date:
 *           type: string
 *           format: date-time
 *         end_date:
 *           type: string
 *           format: date-time
 *     UpdateTripDetailsRequest:
 *       type: object
 *       properties:
 *         sublocation:
 *           type: array
 *           items:
 *             type: string
 *         price:
 *           type: number
 *         number_of_people:
 *           type: integer
 *         start_date:
 *           type: string
 *           format: date-time
 *         end_date:
 *           type: string
 *           format: date-time
 *     UpdateTripStatusRequest:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [upcoming, partially completed, completed, cancelled]
 *
 * /api/trips:
 *   post:
 *     summary: Create a trip booking
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *       - basicAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTripRequest'
 *     responses:
 *       201:
 *         description: Trip created successfully
 *       401:
 *         description: Unauthorized
 *   get:
 *     summary: Get trips for the authenticated user
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *       - basicAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [upcoming, partially completed, completed, cancelled]
 *         description: Filter trips by status
 *     responses:
 *       200:
 *         description: Trip list returned successfully
 *       401:
 *         description: Unauthorized
 *
 * /api/trips/analytics/chart-stats:
 *   get:
 *     summary: Get trip counts by status
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *       - basicAuth: []
 *     responses:
 *       200:
 *         description: Aggregated chart data returned successfully
 *       401:
 *         description: Unauthorized
 *
 * /api/trips/{id}/update-details:
 *   put:
 *     summary: Update trip details
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *       - basicAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTripDetailsRequest'
 *     responses:
 *       200:
 *         description: Trip updated successfully
 *       404:
 *         description: Trip not found
 *       401:
 *         description: Unauthorized
 *
 * /api/trips/{id}/update-status:
 *   patch:
 *     summary: Update trip status
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *       - basicAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTripStatusRequest'
 *     responses:
 *       200:
 *         description: Trip status updated successfully
 *       404:
 *         description: Trip not found
 *       401:
 *         description: Unauthorized
 */
