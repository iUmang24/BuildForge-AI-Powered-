const isProd = process.env.NODE_ENV === "production";

const levels = {
  error: true,               // always show
  warn: !isProd,             // hide in prod
  info: !isProd,             // hide in prod
  debug: !isProd,            // hide in prod
  auth: !isProd,             // auth logs
};

const log = (type, label, ...args) => {
  if (!levels[type]) return;

  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${label}]`, ...args);
};

module.exports = {
  error: (...args) => log("error", "ERROR", ...args),
  warn: (...args) => log("warn", "WARN", ...args),
  info: (...args) => log("info", "INFO", ...args),
  debug: (...args) => log("debug", "DEBUG", ...args),
  auth: (...args) => log("auth", "AUTH", ...args),
};
