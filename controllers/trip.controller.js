const mongoose = require("mongoose"); // 🎯 Crucial import for ObjectId conversions
const Trip = require('../models/trip.model');

// Function A: Create and add a new trip record
exports.createTrip = async (req, res) => {
  try {
    const { location_id, sublocation, price, number_of_people, start_date, end_date } = req.body;
    
    // Convert string ID from req.user.id into a real MongoDB ObjectId
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const total_price = Number(price) * Number(number_of_people);

    const newTrip = new Trip({
      userId,
      location_id,
      sublocation,
      status: 'upcoming', 
      price,
      number_of_people,
      total_price,
      start_date,
      end_date
    });

    const savedTrip = await newTrip.save();

    return res.status(201).json({
      success: true,
      message: 'Trip confirmed and recorded!',
      data: savedTrip
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'MongoDB execution failed while trying to save the record.',
      error: error.message
    });
  }
};

// Function B: Dynamic trip fetching with status query filters
exports.getUserTrips = async (req, res) => {
  try {
    const { status } = req.query;
    
    // Safe conversion matching your user model architecture
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const queryCriteria = { userId };

    if (status) {
      queryCriteria.status = status;
    }

    const trips = await Trip.find(queryCriteria).sort({ start_date: 1 });

    return res.status(200).json({
      success: true,
      count: trips.length,
      data: trips
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'MongoDB database error occurred on data search operations.',
      error: error.message
    });
  }
};

// Function C: Let users modify their booking details (re-calculates total price)
exports.updateTripDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { sublocation, price, number_of_people, start_date, end_date } = req.body;
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const trip = await Trip.findOne({ _id: id, userId });
    if (!trip) {
      return res.status(404).json({ success: false, error: "Trip record not found or access denied." });
    }

    const finalPrice = price !== undefined ? Number(price) : trip.price;
    const finalPeopleCount = number_of_people !== undefined ? Number(number_of_people) : trip.number_of_people;

    if (sublocation !== undefined) trip.sublocation = sublocation;
    if (price !== undefined) trip.price = finalPrice;
    if (number_of_people !== undefined) trip.number_of_people = finalPeopleCount;
    if (start_date !== undefined) trip.start_date = start_date;
    if (end_date !== undefined) trip.end_date = end_date;

    trip.total_price = finalPrice * finalPeopleCount;

    const updatedTrip = await trip.save();
    return res.status(200).json({
      success: true,
      message: "Trip options modified and pricing re-calculated successfully!",
      data: updatedTrip
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "MongoDB details update failed.", error: error.message });
  }
};

// Function D: Handles changing the trip status exclusively
exports.updateTripStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; 
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const trip = await Trip.findOne({ _id: id, userId });
    if (!trip) {
      return res.status(404).json({ success: false, error: "Trip record not found or access denied." });
    }

    if (status !== undefined) {
      trip.status = status; 
    }

    const updatedTrip = await trip.save();
    return res.status(200).json({
      success: true,
      message: `Trip operational status shifted to '${status}' successfully!`,
      data: updatedTrip
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "MongoDB status shift failed.", error: error.message });
  }
};

// Function E: Aggregates trip counts by status for frontend charting components
exports.getTripChartStats = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // Grouping analytics pipeline matched cleanly to your model format
    const stats = await Trip.aggregate([
      { 
        $match: { userId: userId } 
      },
      { 
        $group: { 
          _id: "$status", 
          count: { $sum: 1 } 
        } 
      }
    ]);

    const initialStats = {
      upcoming: 0,
      "partially completed": 0,
      completed: 0,
      cancelled: 0
    };

    stats.forEach(item => {
      if (initialStats[item._id] !== undefined) {
        initialStats[item._id] = item.count;
      }
    });

    return res.status(200).json({
      success: true,
      message: "Trip charting data compiled successfully!",
      chartData: initialStats
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "MongoDB aggregation pipeline analytics failure.",
      error: error.message
    });
  }
};
