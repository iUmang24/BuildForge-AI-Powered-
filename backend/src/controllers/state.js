const pool = require("../config/db");
const { success, failure } = require("../utils/error");
const logger = require("../utils/logger");

exports.getStates = async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT DISTINCT state FROM colleges WHERE state IS NOT NULL ORDER BY state"
        );

        const states = rows.map((row) => row.state);
        logger.info("States fetched successfully");
        return success(
            res,
            "R00",
            "States fetched successfully",
            states,
            200);
    } catch (error) {
        logger.error("Error fetching states:", error);
        return failure(
            res,
            "R01",
            "Failed to fetch states",
            error.message,
            500
        );
    }
};