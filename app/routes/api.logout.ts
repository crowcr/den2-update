import { LoaderFunctionArgs, ActionFunctionArgs, data } from "react-router";
import { sessionStorage } from "~/auth/session.server";

async function handleLogout(request: Request) {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  return data(
    { success: true },
    {
      headers: {
        "Set-Cookie": await sessionStorage.destroySession(session),
      },
    }
  );
}

export async function loader({ request }: LoaderFunctionArgs) {
  return handleLogout(request);
}

export async function action({ request }: ActionFunctionArgs) {
  return handleLogout(request);
}
