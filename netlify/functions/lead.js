// netlify/functions/lead.js


const PIXEL_ID = process.env.PIXEL_ID || process.env.FB_PIXEL_ID;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;


exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const body = JSON.parse(event.body || "{}");

    const headers = event.headers || {};
    const clientIp =
      headers["x-nf-client-connection-ip"] ||
      headers["x-forwarded-for"] ||
      "";
    const userAgent = headers["user-agent"] || "";

    const eventObj = {
      event_name: body.event_name || "Lead",
      event_time: Math.floor(Date.now() / 1000),
      event_source_url: body.event_source_url || headers["referer"] || "",
      action_source: "website",
      event_id: body.event_id, // do deduplikacji
      user_data: {
        client_ip_address: clientIp,
        client_user_agent: userAgent,
        fbp: body.fbp,
        fbc: body.fbc,
        em: body.em, // sha256(email) w lowercase
        ph: body.ph  // sha256(phone) w E.164
      }
    };
const payload = { data: [eventObj] };

if (body.test_event_code) {
  payload.test_event_code = body.test_event_code;
}

    const pixelPath = PIXEL_ID ? `/${PIXEL_ID}` : '';
const url = `https://graph.facebook.com/v19.0${pixelPath}/events?access_token=${ACCESS_TOKEN}`;


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
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
