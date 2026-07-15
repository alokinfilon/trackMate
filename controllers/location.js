const HistoricalSite = require("../models/location"); 
const cache = require("memory-cache");

exports.getHistoricalSites = async (req, res) => {
    try {
        const { category, page = 1, limit = 20, state, country } = req.query;

        const cacheKey = `__express__sites_${category || 'all'}_state_${state || 'all'}_page_${page}_limit_${limit}`;
        const cachedBody = cache.get(cacheKey);
        
        if (cachedBody) {
            console.log("Serving instantly from RAM cache memory store!");
            return res.status(200).json(cachedBody);
        }
        
        const queryFilter = {};

        if (category) {
            const categoryList = Array.isArray(category)
                ? category
                : category.split(',');

            queryFilter.category = { $in: categoryList };
        }

        if (state) {
            queryFilter['geography.state'] = { $regex: state, $options: 'i' };
        }
        if (country) {
            queryFilter['geography.country'] = { $regex: country, $options: 'i' };
        }

        const parsedLimit = parseInt(limit);
        const skipIndex = (parseInt(page) - 1) * parsedLimit;

        const historicalSites = await HistoricalSite.find(queryFilter)
            .select('location_id name category description overall_rating geography.city geography.state geography.country geography.address media.hero_image_url media.gallery logistics.entry_fee logistics.basis opening_hours.weekday  opening_hours.weekends best_time_to_visit crowd_level_indicator historical_context.historical_era    historical_context.year_established  historical_context.architectural_style    historical_context.guided_tours_available   historical_context.tour_cost  trivia_and_culture.quick_facts    trivia_and_culture.famous_visitors    trivia_and_culture.hidden_gem  sub_locations')
            .sort({ overall_rating: -1 }) 
            .skip(skipIndex)
            .limit(parsedLimit)
            .lean();

        const totalMatchingSites = await HistoricalSite.countDocuments(queryFilter);

        const responseData = {
            success: true,
            count: historicalSites.length,
            pagination: {
                totalItems: totalMatchingSites,
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalMatchingSites / parsedLimit),
                limit: parsedLimit
            },
            historicalSites
        };

        cache.put(cacheKey, responseData, 5000);

        res.status(200).json(responseData);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getHistoricalSiteById = async (req, res) => {
    try {
        const historicalSite = await HistoricalSite.findOne({ location_id: req.params.id }).lean();

        if (!historicalSite) {
            return res.status(404).json({
                success: false,
                message: "Historical site profile not found."
            });
        }

        res.status(200).json({
            success: true,
            historicalSite
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
