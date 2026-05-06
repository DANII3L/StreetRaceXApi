import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = require("../../../firebase-service-account.json");

const serviceAccountConfig = {
  ...serviceAccount,
  private_key: serviceAccount.private_key.replace(/\\n/g, '\n'),
};

initializeApp({
  credential: cert(serviceAccountConfig)
});

export const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });