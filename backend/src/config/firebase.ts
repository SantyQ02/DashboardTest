import { logWarn } from "@saveapp-org/shared/logger";
import { initializeApp, cert, AppOptions } from "firebase-admin/app";
import { getApps } from "firebase-admin/app";

if (!getApps().length) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (!serviceAccountJson || !projectId) {
    logWarn(
      "Firebase credentials missing – Firebase has not been initialised. Provide FIREBASE_SERVICE_ACCOUNT_JSON and FIREBASE_PROJECT_ID env vars.",
    );
  } else {
    const opts: AppOptions = {
      credential: cert(JSON.parse(serviceAccountJson)),
      projectId,
    };
    initializeApp(opts);
  }
}

export const getFirebaseAdmin = () => {
  return initializeApp();
};
