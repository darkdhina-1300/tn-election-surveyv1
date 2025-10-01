const fetch = require("node-fetch");

exports.handler = async () => {
  try {
    const repoOwner = "darkdhina-1300";
    const repoName = "tn-election-surveyv1";
    const filePath = "data.csv";

    const url = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/${filePath}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `token ${process.env.GH_TOKEN}`, // required if repo is private
      },
    });

    if (!res.ok) {
      return {
        statusCode: res.status,
        body: JSON.stringify({ error: "GitHub fetch failed", status: res.status }),
      };
    }

    const text = await res.text();

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/csv" },
      body: text,
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
