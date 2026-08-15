function validNoaaUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "cdn.star.nesdis.noaa.gov" && url.pathname.startsWith("/GOES19/ABI/FD/");
  } catch { return false; }
}

module.exports = async (request, response) => {
  const source = Array.isArray(request.query.url) ? request.query.url[0] : request.query.url;
  if (!validNoaaUrl(source)) return response.status(400).send("URL NOAA inválida.");

  try {
    const upstream = await fetch(source, { headers: { "User-Agent": "Orbis-SyraDevOps/1.0" } });
    if (!upstream.ok) return response.status(upstream.status).send("Frame indisponível.");
    const data = Buffer.from(await upstream.arrayBuffer());
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Cache-Control", "public, max-age=600, s-maxage=600");
    response.setHeader("Content-Type", upstream.headers.get("content-type") || "image/jpeg");
    return response.status(200).send(data);
  } catch {
    return response.status(502).send("Não foi possível alcançar o NOAA.");
  }
};
