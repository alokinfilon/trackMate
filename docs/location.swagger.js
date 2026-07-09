/**
 * @swagger
 * tags:
 *   name: HistoricalSites
 *   description: Historical location tracking and discovery API endpoints
 */

/**
 * @openapi
 * /locations:
 *   get:
 *     summary: Retrieve a paginated list of historical destinations
 *     tags: [HistoricalSites]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter destinations by specific category name (e.g., historical_site)
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Filter destinations by state code or region (e.g., NY)
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Filter destinations by host nation boundaries (e.g., USA)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number sequence offset marker
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Maximum number of visual payloads to deliver per stream block
 *     responses:
 *       200:
 *         description: Success! Returns matching list of paginated historical site nodes.
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
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     totalItems:
 *                       type: integer
 *                       example: 45
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 2
 *                     limit:
 *                       type: integer
 *                       example: 30
 *                 historicalSites:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       location_id:
 *                         type: string
 *                         example: "loc_hist_7710a"
 *                       name:
 *                         type: string
 *                         example: "Fort Stanwix National Monument"
 *                       category:
 *                         type: string
 *                         example: "historical_site"
 *                       overall_rating:
 *                         type: number
 *                         format: float
 *                         example: 4.8
 *                       geography:
 *                         type: object
 *                         properties:
 *                           city:
 *                             type: string
 *                             example: "Rome"
 *                           state:
 *                             type: string
 *                             example: "NY"
 *                           country:
 *                             type: string
 *                             example: "USA"
 *                       logistics:
 *                         type: object
 *                         properties:
 *                           entry_fee:
 *                             type: object
 *                             properties:
 *                               amount:
 *                                 type: number
 *                                 format: float
 *                                 example: 0.00
 *                               currency:
 *                                 type: string
 *                                 example: "USD"
 *                               basis:
 *                                 type: string
 *                                 example: "free_entry"
 *                       media:
 *                         type: object
 *                         properties:
 *                           hero_image_url:
 *                             type: string
 *                             format: uri
 *                             example: "https://wikimedia.org"
 */
/**
 * @openapi
 * /locations/{id}:
 *   get:
 *     summary: Get a single historical destination by its unique location ID
 *     tags: [HistoricalSites]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The unique string identifier of the location to retrieve
 *         schema:
 *           type: string
 *           example: "loc_hist_7710a"
 *     responses:
 *       200:
 *         description: Successfully retrieved the complete historical site profile details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 historicalSite:
 *                   type: object
 *                   properties:
 *                     location_id:
 *                       type: string
 *                       example: "loc_hist_7710a"
 *                     name:
 *                       type: string
 *                       example: "Fort Stanwix National Monument"
 *                     category:
 *                       type: string
 *                       example: "historical_site"
 *                     description:
 *                       type: string
 *                       example: "A meticulously reconstructed 18th-century star fort known as the 'fort that never surrendered'..."
 *                     overall_rating:
 *                       type: number
 *                       format: float
 *                       example: 4.8
 *                     geography:
 *                       type: object
 *                       properties:
 *                         type:
 *                           type: string
 *                           example: "Point"
 *                         coordinates:
 *                           type: array
 *                           items:
 *                             type: number
 *                           example: [-75.4561, 43.2106]
 *                         address:
 *                           type: string
 *                           example: "112 East Park Street"
 *                         city:
 *                           type: string
 *                           example: "Rome"
 *                         state:
 *                           type: string
 *                           example: "NY"
 *                         country:
 *                           type: string
 *                           example: "USA"
 *                     logistics:
 *                       type: object
 *                       properties:
 *                         entry_fee:
 *                           type: object
 *                           properties:
 *                             amount:
 *                               type: number
 *                               format: float
 *                               example: 0.00
 *                             currency:
 *                               type: string
 *                               example: "USD"
 *                             basis:
 *                               type: string
 *                               example: "free_entry"
 *                         opening_hours:
 *                           type: object
 *                           properties:
 *                             weekdays:
 *                               type: string
 *                               example: "09:00 - 16:30"
 *                             weekends:
 *                               type: string
 *                               example: "09:00 - 17:00"
 *                         best_time_to_visit:
 *                           type: string
 *                           example: "Summer months (for live historical reenactments)"
 *                         crowd_level_indicator:
 *                           type: string
 *                           example: "Medium"
 *                     sub_locations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           sub_loc_id:
 *                             type: string
 *                             example: "sub_01"
 *                           name:
 *                             type: string
 *                             example: "The Gregg Barracks Exhibit"
 *                           type:
 *                             type: string
 *                             example: "indoor_exhibit"
 *                           description:
 *                             type: string
 *                             example: "Recreated indoor quarters detailing the harsh winter conditions..."
 *                           price:
 *                             type: object
 *                             properties:
 *                               amount:
 *                                 type: number
 *                                 format: float
 *                                 example: 0.00
 *                               currency:
 *                                 type: string
 *                                 example: "USD"
 *                               basis:
 *                                 type: string
 *                                 example: "free_admission"
 *                     historical_context:
 *                       type: object
 *                       properties:
 *                         historical_era:
 *                           type: string
 *                           example: "Colonial / American Revolutionary War"
 *                         year_established:
 *                           type: integer
 *                           example: 1758
 *                         architectural_style:
 *                           type: string
 *                           example: "Vauban-style star fort"
 *                         guided_tours_available:
 *                           type: boolean
 *                           example: true
 *                         tour_cost:
 *                           type: string
 *                           example: "Free"
 *                     trivia_and_culture:
 *                       type: object
 *                       properties:
 *                         quick_facts:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: 
 *                             - "The fort successfully withstood a prolonged 21-day siege..."
 *                         famous_visitors:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: 
 *                             - "Marquis de Lafayette"
 *                         hidden_gem:
 *                           type: string
 *                           example: "The outdoor ditch features an intricate spiked wooden palisade system..."
 *                     reviews:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           review_id:
 *                             type: string
 *                             example: "rev_001"
 *                           username:
 *                             type: string
 *                             example: "RevolutionaryRambler"
 *                           rating:
 *                             type: integer
 *                             example: 5
 *                           date:
 *                             type: string
 *                             format: date-time
 *                             example: "2026-06-11T00:00:00.000Z"
 *                           comment:
 *                             type: string
 *                             example: "The park rangers here stay completely in character."
 *                     amenities:
 *                       type: object
 *                       properties:
 *                         has_restrooms:
 *                           type: boolean
 *                           example: true
 *                         has_drinking_water:
 *                           type: boolean
 *                           example: true
 *                         has_parking:
 *                           type: boolean
 *                           example: true
 *                         parking_capacity:
 *                           type: string
 *                           example: "Medium"
 *                         has_visitor_center:
 *                           type: boolean
 *                           example: true
 *                         has_gift_shop:
 *                           type: boolean
 *                           example: true
 *                         is_wheelchair_accessible:
 *                           type: boolean
 *                           example: true
 *                         is_pet_friendly:
 *                           type: boolean
 *                           example: false
 *                     media:
 *                       type: object
 *                       properties:
 *                         hero_image_url:
 *                           type: string
 *                           format: uri
 *                           example: "https://wikimedia.org"
 *                         gallery:
 *                           type: array
 *                           items:
 *                             type: string
 *                             format: uri
 *                           example: []
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-07-09T16:00:00.000Z"
 *                     updatedAt:

 *                           type: string
 *                           format: date-time
 *                           example: 2026-06-06T09:36:46Z
 *                     images:
 *                       type: array
 *                       items:
 *                         type: string
 *                         format: uri
 *                       example:
 *                         - https://unsplash.com
 *                     thumbnail:
 *                       type: string
 *                       format: uri
 *                       example: https://unsplash.com
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Product profile not found.
 */