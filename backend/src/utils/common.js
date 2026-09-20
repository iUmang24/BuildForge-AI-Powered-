const fs = require("fs");
const path = require("path");
const axios = require("axios");

/* ================= TITLE CASE ================= */
function toTitleCase(str) {
    if (!str) return "";

    return str
        .toLowerCase()
        .split(" ")
        .map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        )
        .join(" ");
}

/* ================= IMAGE → BASE64 ================= */
async function imageToBase64Universal(imagePath) {
    if (!imagePath) return "";

    // ✅ If already full URL
    if (imagePath.startsWith("http")) {
        const response = await axios.get(imagePath, {
            responseType: "arraybuffer",
        });

        const contentType = response.headers["content-type"];
        const base64 = Buffer.from(response.data, "binary").toString("base64");

        return `data:${contentType};base64,${base64}`;
    }

    // ✅ Otherwise treat as local file
    const fullPath = path.join(process.cwd(), "public", imagePath);

    if (!fs.existsSync(fullPath)) {
        console.warn("Image not found:", fullPath);
        return "";
    }

    const ext = path.extname(imagePath).replace(".", "");
    const fileData = fs.readFileSync(fullPath);

    return `data:image/${ext};base64,${fileData.toString("base64")}`;
}

async function isValidGithubRepo(repoUrl, githubUsername) {
  if (!repoUrl) return true; // allow empty if only one repo is provided

  const pattern = new RegExp(`^https://github\\.com/${githubUsername}/`, "i");

  return pattern.test(repoUrl);
}


/* ================= EXPORT ================= */
module.exports = {
    toTitleCase,
    imageToBase64Universal,
    isValidGithubRepo,
};