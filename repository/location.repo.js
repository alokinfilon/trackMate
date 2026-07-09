const HistoricalSite = require("../models/location"); 


exports.getAllSavedLocations = async () => {
    return await HistoricalSite.find();
};


exports.savedLocationByObjectId = async (id) => {
    return await HistoricalSite.findById(id);
};


exports.verifyAndGetLocationById = async (customId) => {
    const targetId = customId && typeof customId === 'object' ? customId.location_id : customId;
    
    return await HistoricalSite.findOne({ location_id: String(targetId) });
};


exports.removeSavedLocation = async (id) => {
    return await HistoricalSite.findByIdAndDelete(id);
};
