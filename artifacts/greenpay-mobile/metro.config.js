const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const apiPort = Number(process.env.GREENPAY_API_PORT || 22920);

config.server = {
  ...config.server,
  enhanceMiddleware: (metroMiddleware) => (req, res, next) => {
    const pathname = new URL(req.url || "/", "http://localhost").pathname;
    if (pathname !== "/api" && !pathname.startsWith("/api/")) {
      return metroMiddleware(req, res, next);
    }

    const proxyRequest = require("node:http").request({
      hostname: "127.0.0.1",
      port: apiPort,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: `127.0.0.1:${apiPort}` },
    }, (proxyResponse) => {
      res.writeHead(proxyResponse.statusCode || 502, proxyResponse.headers);
      proxyResponse.pipe(res);
    });

    proxyRequest.on("error", (error) => {
      console.error(`[GreenPay API proxy] ${error.message}`);
      if (!res.headersSent) {
        res.writeHead(502, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "GreenPay API is unavailable in the preview." }));
      }
    });
    req.pipe(proxyRequest);
  },
};

module.exports = config;
