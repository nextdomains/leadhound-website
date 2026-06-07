const crypto = require("crypto");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8"
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ ok: false, error: "Method not allowed." })
    };
  }

  const params = new URLSearchParams(event.body || "");
  if (params.get("bot-field")) {
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ ok: true }) };
  }

  const submission = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    name: (params.get("name") || "").trim(),
    email: (params.get("email") || "").trim(),
    message: (params.get("message") || "").trim(),
    source: event.headers.origin || event.headers.referer || "unknown"
  };

  if (!submission.name || !submission.email || !submission.message) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ ok: false, error: "Name, email, and message are required." })
    };
  }

  console.log("LeadHound submission", JSON.stringify(submission));

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ ok: true, id: submission.id })
  };
};
