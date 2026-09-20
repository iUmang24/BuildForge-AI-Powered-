const axios = require("axios");

const GITHUB_API = "https://api.github.com";
const HEADERS = {
    headers: {
        "User-Agent": "buildforge",
        ...(process.env.GITHUB_TOKEN && {
            Authorization: `token ${process.env.GITHUB_TOKEN}`,
        }),
    },
};

/* ================= COMMON HELPERS ================= */

const extractRepo = (url) => {
    const match = url?.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) return null;
    return { owner: match[1], repo: match[2] };
};

const fetchRepoContents = async ({ owner, repo }) => {
    try {
        const res = await axios.get(
            `${GITHUB_API}/repos/${owner}/${repo}/contents`,
            HEADERS
        );
        return res.data;
    } catch {
        return null;
    }
};

const checkLiveUrl = async (url) => {
    if (!url) return false;

    try {
        const res = await axios.get(url, {
            timeout: 8000,
            validateStatus: (status) => status < 500, // allow 4xx
        });

        return res.status >= 200 && res.status < 400;
    } catch {
        return false;
    }
};


/* ================= ANTI-CHEAT HELPERS ================= */

const fetchRepoMeta = async ({ owner, repo }) => {
    try {
        const res = await axios.get(
            `${GITHUB_API}/repos/${owner}/${repo}`,
            HEADERS
        );
        return res.data;
    } catch {
        return null;
    }
};

const fetchRecentCommits = async ({ owner, repo }) => {
    try {
        const res = await axios.get(
            `${GITHUB_API}/repos/${owner}/${repo}/commits?per_page=10`,
            HEADERS
        );
        return res.data;
    } catch {
        return [];
    }
};

/* ================= WEEK 1 ================= */

const verifyWeek1 = async (repo) => {
    let score = 0;
    const issues = [];

    const contents = await fetchRepoContents(repo);
    if (!contents) {
        return { score: 0, issues: ["Repository not accessible or private"] };
    }

    const names = contents.map((i) => i.name.toLowerCase());

    if (names.includes("readme.md")) score += 1;
    if (names.includes(".gitignore")) score += 2;
    else issues.push(".gitignore missing");

    let hasPackage = names.includes("package.json");

    if (!hasPackage) {
        for (const item of contents) {
            if (item.type === "dir") {
                try {
                    const sub = await axios.get(item.url, HEADERS);
                    if (sub.data.some((f) => f.name === "package.json")) {
                        hasPackage = true;
                        break;
                    }
                } catch { }
            }
        }
    }

    if (hasPackage) score += 3;
    else issues.push("package.json missing");

    try {
        const commits = await axios.get(
            `${GITHUB_API}/repos/${repo.owner}/${repo.repo}/commits?per_page=1`,
            HEADERS
        );
        if (commits.data.length >= 1) score += 4;
        else issues.push("No commits found");
    } catch {
        issues.push("Unable to read commits");
    }

    return { score, issues };
};

/* ================= WEEK 2 ================= */

const verifyWeek2 = async (repo) => {
    let score = 0;
    const issues = [];

    const contents = await fetchRepoContents(repo);
    if (!contents) {
        return { score: 0, issues: ["Repository not accessible or private"] };
    }

    const names = contents.map((i) => i.name.toLowerCase());

    // SQL schema
    if (names.some((n) => n.endsWith(".sql"))) score += 4;
    else issues.push("SQL schema (.sql) missing");

    // ER Diagram
    if (
        names.some(
            (n) =>
                (n.includes("er") || n.includes("diagram")) &&
                (n.endsWith(".png") || n.endsWith(".jpg") || n.endsWith(".pdf"))
        )
    )
        score += 3;
    else issues.push("ER diagram missing");

    // Documentation
    if (
        names.includes("readme.md") ||
        names.includes("database.md") ||
        names.includes("architecture.md")
    )
        score += 3;

    return { score, issues };
};


/* ================= WEEK 3 ================= */

const verifyWeek3 = async (repo) => {
    let score = 0;
    const issues = [];

    const contents = await fetchRepoContents(repo);
    if (!contents) return { score: 0, issues: ["Repository not accessible"] };

    const names = contents.map(i => i.name.toLowerCase());

    // API folder
    if (names.some(n => n.includes("routes") || n.includes("controllers")))
        score += 3;
    else issues.push("Routes and Controllers missing");

    // Auth
    const hasAuth =
        names.some(n => n.includes("auth")) ||
        names.some(n => n.includes("middleware"))

    if (hasAuth) {
        score += 3;
    } else {
        issues.push("Authentication missing");
    }

    // package.json
    if (names.includes("package.json")) score += 2;
    else issues.push("package.json missing");

    if (names.includes("readme.md")) score += 2;

    return { score, issues };
};


/* ================= WEEK 4 ================= */


const verifyWeek4 = async (repo) => {
    let score = 0;
    const issues = [];

    const contents = await fetchRepoContents(repo);
    if (!contents) return { score: 0, issues: ["Repository not accessible"] };

    const names = contents.map(i => i.name.toLowerCase());

    if (names.some(n => n.includes("middleware"))) score += 2;
    else issues.push("Middleware missing");

    if (names.some(n => n.includes("validation"))) score += 2;
    else issues.push("Validations missing");

    if (names.some(n => n.includes("error"))) score += 2;
    else issues.push("Error handling missing");

    if (names.includes("env") || names.includes(".env"))
        score += 2;
    else issues.push("Environment config missing");

    if (names.includes("readme.md")) score += 2;

    return { score, issues };
};


/* ================= WEEK 5 ================= */


const verifyWeek5 = async (repo) => {
    let score = 0;
    const issues = [];

    const contents = await fetchRepoContents(repo);
    if (!contents) return { score: 0, issues: ["Repository not accessible"] };

    const names = contents.map(i => i.name.toLowerCase());

    if (names.includes("src") || names.includes("app")) score += 2;
    else issues.push("Frontend source folder missing");

    if (names.some(n => n.includes("components"))) score += 2;
    else issues.push("UI components missing");

    if (names.includes("package.json")) score += 2;

    if (names.some(n => n.includes("services") || n.includes("api")))
        score += 2;
    else issues.push("API integration layer missing");

    if (names.includes("readme.md")) score += 2;

    return { score, issues };
};



/* ================= WEEK 6 ================= */

const verifyWeek6 = async (repo) => {
    let score = 0;
    const issues = [];

    const contents = await fetchRepoContents(repo);
    if (!contents) return { score: 0, issues: ["Repository not accessible"] };

    const names = contents.map(i => i.name.toLowerCase());

    if (names.some(n => n.includes("responsive") || n.includes("mobile")))
        score += 3;
    else issues.push("Responsiveness evidence missing");

    if (names.some(n => n.includes("validation"))) score += 3;
    else issues.push("Form validation missing");

    if (names.includes("styles") || names.includes("css"))
        score += 2;
    else issues.push("Styles are missing");

    if (names.includes("readme.md")) score += 2;

    return { score, issues };
};



/* ================= WEEK 7 ================= */

const verifyWeek7 = async (repo) => {
    let score = 0;
    const issues = [];

    const contents = await fetchRepoContents(repo);
    if (!contents) return { score: 0, issues: ["Repository not accessible"] };

    const names = contents.map(i => i.name.toLowerCase());

    if (names.some(n => n.includes("test") || n.includes("__tests__")))
        score += 4;
    else issues.push("Test files missing");

    if (
        names.some(name => name.toLowerCase().includes("jest")) ||
        names.some(name => name.toLowerCase().includes("vitest"))
    ) {
        score += 3;
    } else {
        issues.push("jest or vitest files missing");
    }

    if (names.includes("readme.md")) score += 3;

    return { score, issues };
};




/* ================= WEEK 8 ================= */


const verifyWeek8 = async ({
    repo,
    frontendLiveUrl,
    backendLiveUrl
}) => {
    const issues = [];

    const contents = await fetchRepoContents(repo);
    if (!contents) {
        return {
            passed: false,
            issues: ["Repository not accessible"]
        };
    }

    const names = contents.map(i => i.name.toLowerCase());

    // README
    if (!names.includes("readme.md")) {
        issues.push("Final documentation (README.md) missing");
    }

    // Deployment config
    const hasDeploy =
        names.some(n =>
            n.includes("vercel") ||
            n.includes("netlify") ||
            n.includes("deploy")
        );

    if (!hasDeploy) {
        issues.push("Deployment configuration missing");
    }

    // Frontend live URL
    const frontendOk = await checkLiveUrl(frontendLiveUrl);
    if (!frontendOk) {
        issues.push("Frontend live URL not reachable");
    }

    // Backend live URL
    const backendOk = await checkLiveUrl(backendLiveUrl);
    if (!backendOk) {
        issues.push("Backend live URL not reachable");
    }

    return {
        passed: issues.length === 0,
        issues
    };
};



/* ================= DISPATCHER ================= */

exports.verifySubmissionByWeek = async ({
    weekNumber,
    frontendLink,
    backendLink,
    frontendLiveUrl,
    backendLiveUrl,
    studentGithubUsername,
    enrollmentDate
}) => {
    const links = [
        ...new Set([frontendLink, backendLink].filter(Boolean))
    ];

    // console.log("🔍 VERIFY START", {
    //     weekNumber,
    //     frontendLink,
    //     backendLink,
    //     studentGithubUsername,
    //     enrollmentDate
    // });

    let bestScore = 0;
    let bestIssues = [];

    for (const link of links) {
        const repo = extractRepo(link);
        if (!repo) continue;

        /* ================= 🔐 ANTI-CHEAT START ================= */

        console.log("➡️ Checking repo:", repo);

        /* 1️⃣ Owner check */
        if (studentGithubUsername) {
            if (repo.owner.toLowerCase() !== studentGithubUsername.toLowerCase()) {
                const reason = "Repository owner does not match student's GitHub username";
                console.log("❌", reason);
                bestIssues.push(reason);
                continue;
            }
        }

        /* 2️⃣ Repo metadata */
        const repoMeta = await fetchRepoMeta(repo);
        if (!repoMeta) {
            const reason = "Unable to fetch repository metadata (private or inaccessible)";
            console.log("❌", reason);
            bestIssues.push(reason);
            continue;
        }

        /* 3️⃣ Fork check */
        if (repoMeta.fork) {
            const reason = "Forked repositories are not allowed";
            console.log("❌", reason);
            bestIssues.push(reason);
            continue;
        }

        /* 4️⃣ Enrollment date check */
        if (enrollmentDate) {
            const repoCreated = new Date(repoMeta.created_at);
            const enrolledAt = new Date(enrollmentDate);

            if (repoCreated < enrolledAt) {
                const reason =
                    "Repository was created before program enrollment date";
                console.log("❌", reason);
                bestIssues.push(reason);
                continue;
            }
        }

        /* 5️⃣ Commit ownership check */
        const commits = await fetchRecentCommits(repo);

        if (!commits.length) {
            const reason = "No commits found in repository";
            console.log("❌", reason);
            bestIssues.push(reason);
            continue;
        }

        const studentCommitFound = commits.some(c => {
            if (c.author?.login) {
                return (
                    c.author.login.toLowerCase() ===
                    studentGithubUsername.toLowerCase()
                );
            }

            const email = c.commit?.author?.email;
            return email?.toLowerCase().includes(studentGithubUsername.toLowerCase());
        });

        if (studentGithubUsername && !studentCommitFound) {
            const reason =
                "No commits authored by the student were found";
            console.log("❌", reason);
            bestIssues.push(reason);
            continue;
        }

        console.log("✅ Anti-cheat PASSED");

        /* ================= 🔐 ANTI-CHEAT END ================= */

        /* ================= WEEK VERIFICATION ================= */

        let result;

        if (weekNumber === 8) {
            // 🔥 WEEK 8: SPECIAL HANDLING (NO AUTO PASS MESSAGE)

            result = await verifyWeek8({
                repo,
                frontendLiveUrl,
                backendLiveUrl
            });

            if (!result.passed) {
                return {
                    passed: false,
                    score: 0,
                    feedback: `Verification failed: ${result.issues.join(", ")}`
                };
            }

            // ✅ SUCCESS → MANUAL REVIEW FLOW
            return {
                passed: true,
                score: 10,
                feedback:
                    "Week 8 has been submitted for review. Please wait up to 24 hours. You will receive an email once verified."
            };
        }

        if (weekNumber === 1) result = await verifyWeek1(repo);
        else if (weekNumber === 2) result = await verifyWeek2(repo);
        else if (weekNumber === 3) result = await verifyWeek3(repo);
        else if (weekNumber === 4) result = await verifyWeek4(repo);
        else if (weekNumber === 5) result = await verifyWeek5(repo);
        else if (weekNumber === 6) result = await verifyWeek6(repo);
        else if (weekNumber === 7) result = await verifyWeek7(repo);
        else continue;

        if (result.score > bestScore) {
            bestScore = result.score;
            bestIssues = result.issues;
        }
    }

    const passed = bestScore >= 8;

    return {
        passed,
        score: Math.min(bestScore, 10),
        feedback: passed
            ? `Week ${weekNumber} verified successfully.`
            : `Verification failed: ${bestIssues.join(", ")}`,
    };
};
