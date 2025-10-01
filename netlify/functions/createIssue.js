// netlify/functions/createIssue.js
import fetch from "node-fetch";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // 👇 Now includes email + comment
    const { name, mobile, email, city, pincode, vote, comment } = JSON.parse(event.body);

    if (!name || !mobile || !city || !pincode || !vote) {
      return { statusCode: 400, body: "Missing fields" };
    }

    const repoOwner = "darkdhina-1300";
    const repoName = "tn-election-surveyv1";
    const filePath = "data.csv";

    const token = process.env.GH_TOKEN;

    // Step 1: Get current file contents + sha
    const getUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;
    const getRes = await fetch(getUrl, {
      headers: { Authorization: `token ${token}` }
    });

    if (!getRes.ok) {
      const err = await getRes.text();
      throw new Error(`GitHub fetch failed: ${err}`);
    }

    const fileData = await getRes.json();
    const sha = fileData.sha;

    // Step 2: Append new line (match CSV header order)
    const currentContent = Buffer.from(fileData.content, "base64").toString("utf8");
    const newLine = `${name},${mobile},${email || ""},${city},${pincode},${vote},${comment || ""}\n`;
    const updatedContent = currentContent + newLine;

    // Step 3: Commit back
    const putRes = await fetch(getUrl, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "Add new survey response",
        content: Buffer.from(updatedContent).toString("base64"),
        sha
      })
    });

    if (!putRes.ok) {
      const err = await putRes.text();
      throw new Error(`GitHub update failed: ${err}`);
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
