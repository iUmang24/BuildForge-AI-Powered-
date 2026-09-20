const pool = require("../config/db");
const { success, failure } = require("../utils/error");
const logger = require("../utils/logger");

exports.getAvailableProjects = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return failure(
        res,
        "P01",
        "College ID is required",
        null,
        400
      );
    }

    const [rows] = await pool.query(
      `
      SELECT
          p.id,
          p.title,
          p.description
      FROM projects p
      WHERE
          p.is_active = 1
          AND p.id NOT IN (
              SELECT cp.project_id
              FROM college_projects cp
              WHERE cp.college_id = ?
          )
      ORDER BY p.title
      `,
      [id]
    );

    logger.info("Projects fetched successfully");
    return success(
      res,
      "P00",
      "Available projects fetched successfully",
      rows,
      200
    );
  } catch (error) {
    logger.error("Error fetching projects:", error);
    return failure(
      res,
      "P99",
      "Failed to fetch projects",
      error.message,
      500
    );
  }
};
