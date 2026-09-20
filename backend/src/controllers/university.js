const pool = require("../config/db");
const { success, failure } = require("../utils/error");

exports.getUniversities = async (req, res) => {
  try {
    const { state } = req.query;

    if (!state) {
      return failure(
        res,
        "U01",
        "State is required",
        null,
        400
      );
    }

    const [rows] = await pool.query(
      `
      SELECT id, name
      FROM universities
      WHERE state = ?
      ORDER BY name
      `,
      [state]
    );

    return success(
      res,
      "U00",
      "Universities fetched successfully",
      rows,
      200
    );
  } catch (error) {
    console.error("Error fetching universities:", error);
    return failure(
      res,
      "U99",
      "Failed to fetch universities",
      error.message,
      500
    );
  }
};
