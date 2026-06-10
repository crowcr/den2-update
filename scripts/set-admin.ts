import admin from "firebase-admin";

const uidOrEmail = process.argv[2];

if (!uidOrEmail) {
  console.error("Usage: bun run scripts/set-admin.ts <uid_or_email>");
  process.exit(1);
}

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error("Missing Firebase Admin credentials in environment variables. Make sure your .env file is populated.");
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

async function setAdminClaim() {
  try {
    let uid = uidOrEmail;
    
    // If it looks like an email, find the user by email first
    if (uidOrEmail.includes("@")) {
      console.log(`Finding user by email: ${uidOrEmail}`);
      const user = await admin.auth().getUserByEmail(uidOrEmail);
      uid = user.uid;
    }
    
    console.log(`Setting admin claim for user UID: ${uid}`);
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    
    // Verify the claims
    const userAfter = await admin.auth().getUser(uid);
    console.log("Success! Current custom claims:", userAfter.customClaims);
  } catch (error) {
    console.error("Error setting admin claim:", error);
    process.exit(1);
  }
}

setAdminClaim();
