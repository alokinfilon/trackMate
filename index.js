require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const morgan = require("morgan");

const passport = require("./middleware/passport"); 
const config = require("./utils/config");

const notFoundMiddleware = require("./middleware/notFound");
const errorHandlerMiddleware = require("./middleware/errorHandler");
const { logReqRes } = require("./middleware");
const { connectMongoDb } = require("./database/connection");

const authRouter = require("./routes/auth");
const locationRoutes = require("./routes/locationRoutes");       

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

app.use("/locations", locationRoutes);       
app.use("/auth", authRouter); 
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/health', (req, res) => res.status(200).send('Server is alive!'));

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);    

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
});
