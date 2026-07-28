const express = require('express');
const router = express.Router();
const appController = require('../controllers/appController');

// Database-backed API endpoints
router.get('/faqs', appController.getFAQs);
router.get('/reviews', appController.getReviews);
router.get('/travel-preferences', appController.getTravelPreferences);

// Static HTML legal endpoints
router.get('/privacy-policy', appController.getPrivacyPolicy);
router.get('/terms', appController.getTermsAndConditions);

module.exports = router;