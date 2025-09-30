const fetch = require("node-fetch");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const data = JSON.parse(event.body);

    // Format as CSV row
    const row = `${data.name},${data.mobile},${data.email || ""},${data.city},${data.pincode},${data.vote},${data.comment || ""}\n`;

    const token = process.env.GH_TOKEN;
    const repo = "darkdhina-1300/tn-election-surveyv1"; // ✅ updated repo
    const path = "data.csv";
    const branch = "main"; // change if your default branch is different

    // Fetch current data.csv
    const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`, {
      headers: { Authorization: `token ${token}` }
    });

    let content = "";
    let sha = null;

    if (res.ok) {
      const file = await res.json();
      content = Buffer.from(file.content, "base64").toString("utf-8");
      sha = file.sha;
    } else if (res.status === 404) {
      // Create new file with headers if not found
      content = "Name,Mobile,Email,City,PinCode,Vote,Comment\n";
    } else {
      throw new Error(`Unable to access data.csv in repo (status: ${res.status})`);
    }

    // Append row
    content += row;

    // Push update
    const updateRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "Update data.csv with new submission",
        content: Buffer.from(content).toString("base64"),
        sha: sha || undefined,
        branch: branch
      })
    });

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      throw new Error(`GitHub update failed: ${errText}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Submission saved to data.csv ✅" })
    };
  } catch (error) {
    console.error("Error:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error: " + error.message })
    };
  }
};
