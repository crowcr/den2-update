import { createCookieSessionStorage, redirect } from "react-router";
import admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK", error);
  }
}

const sessionSecret = process.env.SESSION_SECRET || "ovo010ovo-dotdash-DEN2-secret";

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "AuthToken",
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
  },
});

export async function refreshFirebaseToken(refreshToken: string) {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
  if (!apiKey) {
    console.error("Firebase API Key is missing for token refresh");
    return null;
  }

  try {
    const res = await fetch(`https://securetoken.googleapis.com/v1/token?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Token refresh failed: ", errText);
      return null;
    }

    const data = await res.json();
    return {
      idToken: data.id_token as string,
      refreshToken: data.refresh_token as string,
    };
  } catch (e) {
    console.error("Error refreshing token: ", e);
    return null;
  }
}

export async function getAuthFromRequest(request: Request) {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const idToken = session.get("idToken");
  const refreshToken = session.get("refreshToken");

  if (!idToken || !refreshToken) {
    return null;
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return {
      tokens: {
        token: idToken,
        refreshToken,
        decodedToken,
      },
      commit: null,
    };
  } catch (error: any) {
    if (error.code === "auth/id-token-expired") {
      console.log("Firebase ID token expired. Attempting refresh...");
      const refreshResult = await refreshFirebaseToken(refreshToken);
      if (refreshResult) {
        try {
          const newDecodedToken = await admin.auth().verifyIdToken(refreshResult.idToken);
          session.set("idToken", refreshResult.idToken);
          session.set("refreshToken", refreshResult.refreshToken);

          return {
            tokens: {
              token: refreshResult.idToken,
              refreshToken: refreshResult.refreshToken,
              decodedToken: newDecodedToken,
            },
            commit: () => sessionStorage.commitSession(session),
          };
        } catch (e) {
          console.error("Failed to verify refreshed token", e);
        }
      }
    } else {
      console.error("Firebase ID token verification failed: ", error);
    }
  }

  return null;
}

export async function requireAdmin(request: Request) {
  const authResult = await getAuthFromRequest(request);
  if (!authResult) {
    throw redirect("/den2-console/login");
  }

  const { decodedToken } = authResult.tokens;
  if (!decodedToken.admin) {
    console.warn(`User ${decodedToken.uid} attempted to access admin route without admin claim.`);
    throw redirect("/den2-console/login");
  }

  return authResult;
}
