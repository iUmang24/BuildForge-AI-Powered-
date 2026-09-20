const restrictAccess = (req, res, next) => {
  const allowedEmailsEnv = process.env.ALLOWED_EMAILS;

  // If variable not set or empty → allow everyone
  if (!allowedEmailsEnv || allowedEmailsEnv.trim() === "") {
    return next();
  }

  const allowedEmails = allowedEmailsEnv
    .split(",")
    .map(email => email.trim().toLowerCase());

  const userEmail = (req.body.email || "").toLowerCase();

  if (!allowedEmails.includes(userEmail)) {
    return res.status(403).json({
      success: false,
      message: "Access restricted in this environment"
    });
  }

  next();
};

module.exports = restrictAccess;
