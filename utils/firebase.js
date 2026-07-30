const fs = require("node:fs");
const path = require("node:path");
const admin = require("firebase-admin");

function resolveCredentialsPath() {
  const configuredPath = process.env.FIREBASE_ADMIN_CREDENTIALS_PATH;
  if (configuredPath) {
    return path.resolve(process.cwd(), configuredPath);
  }

  return path.resolve(process.cwd(), "trackmate-67583-firebase-adminsdk-fbsvc-b272b5840c.json");
}

function initializeFirebaseAdmin() {
  if (typeof admin.getApps === "function" && admin.getApps().length > 0) {
    return admin;
  }

  const credentialsPath = resolveCredentialsPath();
  if (!fs.existsSync(credentialsPath)) {
    console.warn(`Firebase Admin credentials not found at ${credentialsPath}. Push notifications will be disabled.`);
    return admin;
  }

  const serviceAccount = require(credentialsPath);
  admin.initializeApp({
    credential: admin.cert(serviceAccount),
  });

  return admin;
}

module.exports = {
  admin: initializeFirebaseAdmin(),
  initializeFirebaseAdmin,
  resolveCredentialsPath,
};
