const { launchBrowser } = require("../utils/puppeteer");

/**
 * Generate PDF buffer from HTML
 * @param {string} html
 * @param {object} options
 * @returns {Buffer}
 */

let browserInstance = null;

async function getBrowser() {
  if (!browserInstance) {
    browserInstance = await launchBrowser();
  }
  return browserInstance;
}


async function generatePDFfromHTML(html, options = {}) {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 8000,
    });

    // wait for fonts
    await page.evaluateHandle("document.fonts.ready");

    // force browser to repaint layout
    await page.evaluate(() => new Promise(r => requestAnimationFrame(r)));

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      ...options,
    });

    return pdf;
  } finally {
    await page.close(); // ✅ close page only
  }
}

module.exports = {
  generatePDFfromHTML,
};
