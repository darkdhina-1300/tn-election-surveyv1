const fetch = require("node-fetch");

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    // Parse form data
    const { name, mobile, email, city, pincode, vote, comment } = JSON.parse(event.body);

    if (!name || !mobile || !city || !pincode || !vote) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    // 🔹 Fixed repo for your case
    const repo = "darkdhina-1300/tn-election-surveyv1";
    const token = process.env.GITHUB_TOKEN; // Add in Netlify env
    const filePath = "data.csv";

    // 1️⃣ Fetch existing CSV from GitHub
    const fileRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
      headers: { Authorization: `token ${token}` },
    });

    if (!fileRes.ok) {
      throw new Error(`Unable to access ${filePath} in repo (status: ${fileRes.status})`);
    }

    const fileData = await fileRes.json();
    const oldContent = Buffer.from(fileData.content, "base64").toString("utf-8");

    // 2️⃣ Append new row
    const newRow = `${name},${mobile},${email || ""},${city},${pincode},${vote},${comment || ""}\n`;
    const newContent = oldContent + newRow;

    // 3️⃣ Commit new content to GitHub
    const updateRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Update data.csv via Netlify function",
        content: Buffer.from(newContent).toString("base64"),
        sha: fileData.sha,
      }),
    });

    if (!updateRes.ok) {
      const err = await updateRes.text();
      throw new Error(`GitHub update failed: ${err}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Data saved successfully" }),
    };

  } catch (err) {
    console.error("❌ Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
