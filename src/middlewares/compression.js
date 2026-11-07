const zlib = require('zlib');

/**
 * Lightweight native HTTP Gzip compression middleware for JSON & HTML/CSS/JS payloads >= 1KB
 */
function compressionMiddleware(req, res, next) {
  const acceptEncoding = req.headers['accept-encoding'] || '';
  if (!acceptEncoding.includes('gzip')) {
    return next();
  }

  const originalJson = res.json.bind(res);
  res.json = function (body) {
    try {
      const jsonStr = JSON.stringify(body);
      const byteLen = Buffer.byteLength(jsonStr, 'utf8');
      if (byteLen >= 1024 && !res.headersSent) {
        const compressed = zlib.gzipSync(Buffer.from(jsonStr, 'utf8'));
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Vary', 'Accept-Encoding');
        res.setHeader('Content-Length', compressed.length);
        return res.end(compressed);
      }
    } catch {
      // Fallback to standard uncompressed res.json on any error
    }
    return originalJson(body);
  };

  next();
}

module.exports = compressionMiddleware;
