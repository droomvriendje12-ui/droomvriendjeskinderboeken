const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy all /api requests to backend at port 8001
  // The backend expects /api prefix, so we don't rewrite
  app.use(
    createProxyMiddleware('/api', {
      target: 'http://localhost:8001',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/api'  // Keep the /api prefix
      },
      logLevel: 'debug'
    })
  );
};
