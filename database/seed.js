require('dotenv').config(); 
const program = require('commander');
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const dns = require('dns');

// Forces clean public DNS routing for MongoDB Atlas cloud clusters
dns.setServers(['8.8.8.8', '1.1.1.1']);

program
    .version('1.0.0')
    .command('seed <filePath>')
    .alias('s')
    .description('Clear historical sites collection and automatically upload data from a JSON file')
    .action(filePath => executeMigration(filePath));

const executeMigration = async (filePath) => {
    try {
        const absolutePath = path.join(process.cwd(), filePath);
        console.info('Reading target JSON file at:', absolutePath);
        
        const fileContent = await fs.readFile(absolutePath, 'utf-8');
        const parsedJSON = JSON.parse(fileContent);

        // Flexibly extracts an array if root level is an object wrapper or raw array
        let dataArray = Array.isArray(parsedJSON) ? parsedJSON : parsedJSON.locations || parsedJSON.products;

        if (!dataArray || dataArray.length === 0) {
            throw new Error('Target JSON file does not contain a valid array of items.');
        }

        // ✨ DATA CLEANING STEP: Maps flat coordinates to explicit Mongoose GeoJSON format
        dataArray = dataArray.map((item, index) => {
            if (!item.geography) {
                item.geography = {};
            }

            // Always enforce required GeoJSON Point type
            item.geography.type = "Point";

            // If coordinates array doesn't exist yet, construct it from properties
            if (!item.geography.coordinates) {
                if (item.geography.latitude !== undefined && item.geography.longitude !== undefined) {
                    // CRITICAL: GeoJSON requires [longitude, latitude] sequence order
                    item.geography.coordinates = [
                        Number(item.geography.longitude), 
                        Number(item.geography.latitude)
                    ];
                } else if (item.latitude !== undefined && item.longitude !== undefined) {
                    item.geography.coordinates = [Number(item.longitude), Number(item.latitude)];
                } else {
                    console.warn(`⚠️ Warning: Item at index ${index} (${item.name || 'Unknown'}) is missing latitude/longitude!`);
                }
            }

            // Clean coordinate arrays into pure numbers to ensure no typing failures
            if (item.geography.coordinates) {
                item.geography.coordinates = item.geography.coordinates.map(Number);
            }

            return item;
        });

        const connectionString = process.env.MONGO_URI;
        if (!connectionString) {
            throw new Error('MONGO_URI is missing from your environment variables (.env file).');
        }
        
        console.info('Connecting to MongoDB cluster...');
        await mongoose.connect(connectionString);
        console.info('Connected to MongoDB database cluster successfully.');

        // Points cleanly to your location model layout
        const HistoricalSite = require('../models/location');

        await HistoricalSite.deleteMany({});
        console.info('Database old records cleared successfully.');

        console.info(`Streaming payloads to Atlas cluster...`);
        
        const insertResult = await HistoricalSite.insertMany(dataArray);
        console.info(`🎯 Migration Completed! Successfully seeded ${insertResult.length} historical sites.`);

        try {
            const cache = require('memory-cache');
            cache.clear();
            console.info('🚀 Local RAM cache flushed successfully!');
        } catch (e) {
            // Silence cache error if package isn't used
        }

    } catch (error) {
        console.error('An error occurred during execution:', error.message);
    } finally {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
            console.info('Database connection sockets shut down gracefully.');
        }
    }
};

program.parse(process.argv);
