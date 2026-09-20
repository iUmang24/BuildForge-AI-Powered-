const express = require("express");
const router = express.Router();
const stateController = require("../controllers/state");

router.get("/", stateController.getStates);

module.exports = router;