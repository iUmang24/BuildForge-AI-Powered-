const pool = require("../config/db");
const { success, failure } = require("../utils/error");
const logger = require("../utils/logger");

exports.getColleges = async (req, res) => {
    try {
        const { state } = req.query;

        if (!state) {
            return failure(
                res,
                "C01",
                "State name is required",
                null,
                400
            );
        }

        const [rows] = await pool.query(
        `
        SELECT id,
    CONCAT(name, ', ', city) AS colleges
        FROM colleges
        WHERE
            LOWER(state) = LOWER(?)
            AND name IS NOT NULL
            AND name <> ''
        ORDER BY name;
      `,
            [state]
        );

        logger.info("Colleges fetched successfully");
        return success(
            res,
            "C00",
            "Colleges fetched successfully",
            rows,
            200
        );
    } catch (error) {
        logger.error("Error fetching colleges:", error);
        return failure(
            res,
            "C99",
            "Failed to fetch colleges",
            error.message,
            500
        );
    }
};
