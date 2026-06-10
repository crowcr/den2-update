import { ActionFunctionArgs, LoaderFunctionArgs, data } from "react-router";
import admin from "firebase-admin";
import { sessionStorage } from "~/auth/session.server";

async function handleLogin(idToken: string, refreshToken?: string, request?: Request) {
  if (!idToken) {
    return data({ error: "Missing ID token" }, { status: 400 });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const session = await sessionStorage.getSession(request?.headers.get("Cookie"));
    session.set("idToken", idToken);
    if (refreshToken) {
      session.set("refreshToken", refreshToken);
    }

    return data(
      { success: true },
      {
        headers: {
          "Set-Cookie": await sessionStorage.commitSession(session),
        },
      }
    );
  } catch (error) {
    console.error("Error in login route:", error);
    return data({ error: "Invalid ID token" }, { status: 401 });
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return data({ error: "Unauthorized" }, { status: 401 });
  }
  const idToken = authHeader.substring(7);
  const refreshToken = request.headers.get("x-save-refresh-token") || undefined;
  return handleLogin(idToken, refreshToken, request);
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }
  try {
    const body = await request.json();
    const { idToken, refreshToken } = body;
    return handleLogin(idToken, refreshToken, request);
  } catch (error) {
    return data({ error: "Bad request" }, { status: 400 });
  }
}
