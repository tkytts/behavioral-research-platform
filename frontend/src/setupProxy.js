const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  const gameHubProxy = createProxyMiddleware({
    target: 'http://localhost:5000',
    changeOrigin: true,
    ws: false,               // don't intercept all upgrades automatically
    logLevel: 'silent',
    onError: (err, req, res) => {
      if (err.code === 'ERR_STREAM_WRITE_AFTER_END') return;
      console.error('[Proxy Error]', err.message);
    }
  });

  app.use('/api/gamehub', gameHubProxy);

  // CRA 5 only passes `app` to setupProxy, not the HTTP server.
  // Grab the server reference lazily from the first incoming request's socket,
  // then attach a selective upgrade handler so only SignalR WebSocket connections
  // are proxied — leaving HMR's /ws upgrades untouched.
  let upgradeHandlerAttached = false;
  app.use((req, res, next) => {
    if (!upgradeHandlerAttached && req.socket?.server) {
      upgradeHandlerAttached = true;
      req.socket.server.on('upgrade', (upgradeReq, socket, head) => {
        if (upgradeReq.url.startsWith('/api/gamehub')) {
          gameHubProxy.upgrade(upgradeReq, socket, head);
        }
        // All other upgrades (e.g. HMR /ws) are left alone
      });
    }
    next();
  });

  // Proxy other API calls without WebSocket
  app.use('/api', createProxyMiddleware({
    target: 'http://localhost:5000',
    changeOrigin: true,
    logLevel: 'silent'
  }));
};
