require('dotenv').config();
const program = require('commander');
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const dns = require('dns');

dns.setServers(['8.8.8.8', '1.1.1.1']);

program
    .version('1.0.0')
    .command('seed <filePath>')
    .alias('s')
    .description('Clear specific collection and automatically upload data from a JSON file')
    .action(filePath => executeMigration(filePath));

const executeMigration = async (filePath) => {
    try {
        const absolutePath = path.join(process.cwd(), filePath);
        console.info('Reading target JSON file at:', absolutePath);
        
        const fileContent = await fs.readFile(absolutePath, 'utf-8');
        const parsedJSON = JSON.parse(fileContent);

        let dataArray;
        let TargetModel;
        const fileName = path.basename(filePath).toLowerCase();

        // Dynamically assign model and parse payload based on the file name
        if (fileName.includes('location')) {
            TargetModel = require('../models/location');
            dataArray = Array.isArray(parsedJSON) ? parsedJSON : parsedJSON.locations;
            
            dataArray = dataArray.map((item, index) => {
                if (!item.geography) item.geography = {};
                item.geography.type = "Point";
                if (!item.geography.coordinates) {
                    if (item.geography.latitude !== undefined && item.geography.longitude !== undefined) {
                        item.geography.coordinates = [Number(item.geography.longitude), Number(item.geography.latitude)];
                    } else if (item.latitude !== undefined && item.longitude !== undefined) {
                        item.geography.coordinates = [Number(item.longitude), Number(item.latitude)];
                    }
                }
                if (item.geography.coordinates) {
                    item.geography.coordinates = item.geography.coordinates.map(Number);
                }
                return item;
            });

        } else if (fileName.includes('faq')) {
            TargetModel = require('../models/faq');
            dataArray = Array.isArray(parsedJSON) ? parsedJSON : parsedJSON.faq;

        } else if (fileName.includes('review')) {
            TargetModel = require('../models/review');
            dataArray = Array.isArray(parsedJSON) ? parsedJSON : parsedJSON.reviews;

        } else if (fileName.includes('travel_preference')) {
            TargetModel = require('../models/travelPreference');
            dataArray = Array.isArray(parsedJSON) ? parsedJSON : parsedJSON.preferences;

        } else {
            throw new Error(`Unknown dataset type for file: ${fileName}`);
        }

        if (!dataArray || dataArray.length === 0) {
            throw new Error('Target JSON file does not contain a valid array of items.');
        }

        const connectionString = process.env.MONGO_URI;
        if (!connectionString) {
            throw new Error('MONGO_URI is missing from your environment variables (.env file).');
        }
        
        console.info('Connecting to MongoDB cluster...');
        await mongoose.connect(connectionString);
        console.info('Connected to MongoDB database cluster successfully.');

        // Clears ONLY the specific collection tied to this model safely
        await TargetModel.deleteMany({});
        console.info(`Old records for ${TargetModel.modelName} cleared successfully.`);

        console.info(`Streaming payloads to Atlas cluster...`);
        const insertResult = await TargetModel.insertMany(dataArray);
        console.info(`🎯 Migration Completed! Successfully seeded ${insertResult.length} documents into ${TargetModel.modelName}.`);

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