const express = require("express");
const router = express.Router();

const { getHistoricalSites, getHistoricalSiteById } = require("../controllers/location");

router.get("/", getHistoricalSites);       

router.get("/:id", getHistoricalSiteById);    

module.exports = router;
