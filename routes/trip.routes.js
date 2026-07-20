const express = require('express');
const router = express.Router();

// 1. Ensure this path points exactly to your controller file
const tripController = require('../controllers/trip.controller'); 

// 2. Ensure this middleware is imported correctly from our fixed middleware file
const verifyUserAuth = require('../middleware/auth.middleware'); 

// --- Core Data Operations ---
router.post('/', verifyUserAuth, tripController.createTrip);
router.get('/', verifyUserAuth, tripController.getUserTrips);

// --- Analytics Operations ---
// 🎯 CRUCIAL: Placed ABOVE /:id routes so Express doesn't mistake 'analytics' for a trip ID parameter!
router.get('/analytics/chart-stats', verifyUserAuth, tripController.getTripChartStats);

// --- Update Operations ---
router.put('/:id/update-details', verifyUserAuth, tripController.updateTripDetails);
router.patch('/:id/update-status', verifyUserAuth, tripController.updateTripStatus);

module.exports = router;
