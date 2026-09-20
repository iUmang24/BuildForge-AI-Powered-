const isVercel =
  process.env.VERCEL === "1" || process.env.VERCEL_ENV !== undefined;

const puppeteer = isVercel
  ? require("puppeteer-core")
  : require("puppeteer");

const chromium = isVercel
  ? require("@sparticuz/chromium")
  : null;

async function launchBrowser() {
  if (isVercel) {
    return await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });
  }

  // Local (Windows/Mac/Linux)
  return await puppeteer.launch({
    headless: true,
  });
}

module.exports = {
  launchBrowser,
};
