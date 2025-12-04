import axios from "axios";

const BACKEND_BASE =
  "https://vampiremultiplesurvivors-h3gfb9gsf4bscre2.canadacentral-01.azurewebsites.net";

export async function GET(req, { params }) {
  return forward(req, params, "GET");
}

export async function POST(req, { params }) {
  return forward(req, params, "POST");
}

export async function PUT(req, { params }) {
  return forward(req, params, "PUT");
}

export async function DELETE(req, { params }) {
  return forward(req, params, "DELETE");
}

/**
 * Proxy universal – soporte para SockJS + REST
 */
async function forward(req, params, method) {
  const fullPath = params.path.join("/");
  const targetUrl = `${BACKEND_BASE}/${fullPath}`;

  try {
    let data = null;

    // SockJS envía POST TEXT, no JSON → debemos leerlo RAW
    if (method === "POST" || method === "PUT") {
      const text = await req.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = text; // texto plano
      }
    }

    const response = await axios({
      url: targetUrl,
      method,
      data,
      headers: {
        ...Object.fromEntries(req.headers),
        host: undefined, // importante
      },
      withCredentials: true,
      validateStatus: () => true,
      responseType: "arraybuffer", // permite streaming de SockJS
    });

    const contentType = response.headers["content-type"] || "application/octet-stream";

    return new Response(response.data, {
      status: response.status,
      headers: {
        "Content-Type": contentType,
        // evitar CORS
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
