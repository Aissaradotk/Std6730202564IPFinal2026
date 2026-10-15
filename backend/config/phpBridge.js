const http = require("http");

const PHP_API_BASE = process.env.PHP_API_BASE || "http://119.59.102.161/std6730202564/api.php";
let isBridgeActive = false;
let lastCheckTime = 0;

/**
 * Check if the PHP bridge on the university web server is available
 */
async function checkBridgeAvailability() {
  const now = Date.now();
  // Cache check for 10 seconds
  if (now - lastCheckTime < 10000 && isBridgeActive) {
    return isBridgeActive;
  }
  lastCheckTime = now;

  try {
    const res = await requestPhpApi("ping", "GET", null, 2500);
    if (res && res.success === true) {
      if (!isBridgeActive) {
        console.log(`[PHP Bridge] Successfully connected to live MySQL via ${PHP_API_BASE}`);
      }
      isBridgeActive = true;
      return true;
    }
  } catch (err) {
    isBridgeActive = false;
  }
  return false;
}

/**
 * Perform HTTP request to PHP API
 */
function requestPhpApi(action, method = "GET", body = null, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const urlStr = `${PHP_API_BASE}?action=${encodeURIComponent(action)}`;
    const parsed = new URL(urlStr);

    const postData = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || 80,
        path: parsed.pathname + parsed.search,
        method: method,
        timeout: timeout,
        headers: {
          "Content-Type": "application/json",
          ...(postData ? { "Content-Length": Buffer.byteLength(postData) } : {})
        }
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (e) {
            resolve({ raw: data, statusCode: res.statusCode });
          }
        });
      }
    );

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("PHP Bridge timeout"));
    });

    req.on("error", (err) => reject(err));

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

module.exports = {
  PHP_API_BASE,
  checkBridgeAvailability,
  requestPhpApi
};
