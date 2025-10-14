const express = require("express");
const { getRaceTimer } = require("../controller/RaceTimer");
const router = express.Router();
const Auth = require("../middleware/middleware");

router.get("/user/raceTimer",Auth, getRaceTimer);

module.exports = router;
