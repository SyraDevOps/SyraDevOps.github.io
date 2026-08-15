const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 8080);
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json", ".png": "image/png" };

function send(response, status, body, headers = {}) {
  response.writeHead(status, { "Access-Control-Allow-Origin": "*", ...headers });
  response.end(body);
}

function validNoaaUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "cdn.star.nesdis.noaa.gov" && url.pathname.startsWith("/GOES19/ABI/FD/");
  } catch { return false; }
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);

  if (requestUrl.pathname === "/api/noaa") {
    const source = requestUrl.searchParams.get("url");
    if (!validNoaaUrl(source)) return send(response, 400, "URL NOAA inválida.");
    try {
      const upstream = await fetch(source, { headers: { "User-Agent": "Orbis-SyraDevOps/1.0" } });
      if (!upstream.ok) return send(response, upstream.status, "Frame indisponível.");
      response.writeHead(200, {
        "Content-Type": upstream.headers.get("content-type") || "image/jpeg",
        "Cache-Control": "public, max-age=600",
        "Access-Control-Allow-Origin": "*"
      });
      for await (const chunk of upstream.body) response.write(chunk);
      return response.end();
    } catch {
      return send(response, 502, "Não foi possível alcançar o NOAA.");
    }
  }

  const relative = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const filePath = path.resolve(ROOT, `.${relative}`);
  if (!filePath.startsWith(ROOT)) return send(response, 403, "Acesso negado.");
  fs.readFile(filePath, (error, data) => {
    if (error) return send(response, 404, "Arquivo não encontrado.");
    send(response, 200, data, { "Content-Type": TYPES[path.extname(filePath)] || "application/octet-stream" });
  });
});

server.listen(PORT, () => console.log(`Orbis disponível em http://localhost:${PORT}`));
