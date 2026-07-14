const http = require('http');
const https = require('https');

function fetchLiveUserToken() {
  console.log("1. Authenticating test user with Auth0 via Password-Realm Flow...");

  const data = new URLSearchParams({
    // CRITICAL SECURITY FIX: Switched grant type to password-realm
    "grant_type": "http://auth0.com/oauth/grant-type/password-realm", 
    "client_id": "iQdvaJuzGtQr0KXxLB8zIGmxPCHD8sIk", 
    "username": "testuser@example.com", 
    "password": "Password123!", 
    "audience": "https://trackmate-x7ue.onrender.com",
    // CRITICAL REQUIREMENT: Explicitly names your database realm connection
    "realm": "Username-Password-Authentication", 
    "scope": "openid profile email"
  }).toString();

  const options = {
    hostname: 'dev-ccfir3u2hdg8btjk.us.auth0.com',
    port: 443,
    path: '/oauth/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(data)
    },
    rejectUnauthorized: false
  };

  const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      try {
        const auth0Data = JSON.parse(body);
        if (res.statusCode !== 200) {
          console.error("❌ Auth0 Gateway Rejected User Authentication Request:", auth0Data);
          return;
        }
        console.log("✅ Live User-Scoped Auth0 Token acquired successfully!");
        forwardToBackend(auth0Data.access_token);
      } catch (e) {
        console.error("❌ Failed to parse Auth0 response body as JSON!");
        console.log("Raw Auth0 text output was:", body);
      }
    });
  });

  req.on('error', (e) => console.error("Network connection error to Auth0:", e.message));
  req.write(data);
  req.end();
}

function forwardToBackend(token) {
  console.log("2. Forwarding user token down to your local Express server pipeline...");

  const data = JSON.stringify({});

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/auth/auth0-sync',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Content-Length': Buffer.byteLength(data)
    }
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      console.log(`Server HTTP Status Code: ${res.statusCode}`);
      try {
        const backendData = JSON.parse(body);
        if (res.statusCode !== 200) {
          console.error("❌ Backend processing sync failure:", backendData);
          return;
        }
        console.log("\n🎉 SUCCESS! Your entire synchronization loop works perfectly:");
        console.log(backendData);
      } catch (e) {
        console.error("\n❌ CRITICAL: Your Express server did not return valid JSON data!");
        console.log("Raw Server Response Output:", body || "(Empty Response Body)");
      }
    });
  });

  req.on('error', (e) => console.error("Network connection error to local server:", e.message));
  req.write(data);
  req.end();
}

fetchLiveUserToken();
