module.exports = {
  isProd: process.env.APP_ENV === "production",
  isDev: process.env.APP_ENV === "development",
  isLocal: process.env.APP_ENV === "local",
};