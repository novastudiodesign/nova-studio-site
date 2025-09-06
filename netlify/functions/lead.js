// netlify/functions/lead.js

const fetch = require("node-fetch");
const crypto = require("crypto");

const PIXEL_ID = process.env.PIXEL_ID || process.env.FB_PIXEL_ID;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed"
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");

    const headers = event.headers || {};
    const clientIp =
      headers["x-nf-client-connection-ip"] ||
      headers["x-forwarded-for"] ||
      "";
    const userAgent = headers["user-agent"] || "";

    if (!body.em && !body.ph) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Brak danych kontaktowych (email lub telefon)" })
      };
    }

    const eventObj = {
      event_name: body.event_name || "Lead",
      event_time: Math.floor(Date.now() / 1000),
      event_source_url: body.event_source_url || headers["referer"] || "",
      action_source: "website",
      event_id: body.event_id || crypto.randomUUID(),
      user_data: {
        client_ip_address: clientIp,
        client_user_agent: userAgent,
        fbp: body.fbp || undefined,
        fbc: body.fbc || undefined,
        em: body.em || undefined, //
        ph: body.ph || undefined  //
      }
    };

    const payload = {
      data: [eventObj],
      ...(body.test_event_code ? { test_event_code: body.test_event_code } : {})
    };

    const url = `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const text = await resp.text();

    return {
      statusCode: resp.ok ? 200 : 500,
      body: text
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message })
    };
  }
};
