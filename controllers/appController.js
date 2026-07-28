const path = require('path');
const FAQ = require('../models/faq');
const Review = require('../models/review');
const TravelPreference = require('../models/travelPreference');
const HistoricalSite = require('../models/location');

// 1. Get FAQs with optional category filter & keyword search
exports.getFAQs = async (req, res) => {
    try {
        const { category, search } = req.query;
        let query = {};

        if (category) {
            query.category = category;
        }
        if (search) {
            query.$or = [
                { question: { $regex: search, $options: 'i' } },
                { answer: { $regex: search, $options: 'i' } }
            ];
        }

        const faqs = await FAQ.find(query).lean();
        res.status(200).json({ success: true, count: faqs.length, faqs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Get Reviews with sorting (by likes or rating) & pagination
exports.getReviews = async (req, res) => {
    try {
        const { sort = 'latest', limit = 10, page = 1 } = req.query;
        let sortCriteria = { posted_date: -1 }; // default latest

        if (sort === 'likes') sortCriteria = { likes: -1 };
        if (sort === 'highest_rating') sortCriteria = { rating: -1 };

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const reviews = await Review.find({})
            .sort(sortCriteria)
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const total = await Review.countDocuments();

        res.status(200).json({
            success: true,
            count: reviews.length,
            pagination: { total, page: parseInt(page), limit: parseInt(limit) },
            reviews
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Get Travel Preferences formatted as an easy-to-use key-value object for frontend forms
exports.getTravelPreferences = async (req, res) => {
    try {
        const preferences = await TravelPreference.find({}).lean();
        
        // Transforms array into a clean object like: { fav_country: [...], travel_budget: [...] }
        const formattedPreferences = preferences.reduce((acc, curr) => {
            acc[curr.category] = curr.options;
            return acc;
        }, {});

        res.status(200).json({ success: true, preferences: formattedPreferences });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. Serve Privacy Policy HTML
exports.getPrivacyPolicy = (req, res) => {
    res.sendFile(path.join(__dirname, '../data', 'privacy_policy.html'));
};

// 5. Serve Terms and Conditions HTML
exports.getTermsAndConditions = (req, res) => {
    res.sendFile(path.join(__dirname, '../data', 'term_and_condition.html'));
};