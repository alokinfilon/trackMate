if (process.env.NODE_ENV !== 'production') {
    try {
        require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);
        console.log("Local DNS overrides applied.");
    } catch (err) {
        console.warn("Failed to set custom local DNS servers:", err.message);
    }
}

const express = require('express');
const cors = require('cors');
const morgan = require("morgan");
const User = require("./models/user"); 
const passport = require("./middleware/passport"); 
const config = require("./utils/config");
const galleryRoutes = require("./routes/gallery.routes");
const notFoundMiddleware = require("./middleware/notFound");
const errorHandlerMiddleware = require("./middleware/errorHandler");
const { logReqRes } = require("./middleware");
const { connectMongoDb } = require("./database/connection");

const authRouter = require("./routes/auth");
const locationRoutes = require("./routes/locationRoutes");       
const tripRoutes = require("./routes/trip.routes"); // ✅ Clean import of trip routes

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger/swagger');

const app = express();
const PORT = process.env.PORT || 3000;

connectMongoDb(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully to historical database cluster.");
    })
    .catch((err) => console.error("MongoDB connection failed:", err.message));

app.use(cors()); 
app.use(morgan("common"));
app.use(express.json()); 
app.use(express.urlencoded({ extended: false }));
app.use(logReqRes("log.txt"));

app.get('/health', (req, res) => res.status(200).send('Server is alive!'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/auth", authRouter); 
app.use("/locations", locationRoutes);
app.use("/api/gallery", galleryRoutes);
// ✅ This single line maps your trip routes correctly. 
// ❌ The 'router.post' and 'router.get' lines have been safely removed from here.
app.use("/api/trips", tripRoutes); 

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);    

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
});
