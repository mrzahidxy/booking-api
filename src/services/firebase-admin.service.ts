import admin from "firebase-admin";
import env from "../utils/env";

let messaging: admin.messaging.Messaging | null = null;

export const getMessaging = () => {
  if (messaging) return messaging;

  const serviceAccountJson = env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountJson) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set");
  }

  const normalizedServiceAccount = serviceAccountJson.trim().startsWith("{")
    ? serviceAccountJson
    : Buffer.from(serviceAccountJson, "base64").toString("utf-8");
  const serviceAccount = JSON.parse(normalizedServiceAccount);

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin Initialized Successfully");
  }

  messaging = admin.messaging();
  return messaging;
};
