import { Outlet, Link, useLocation, Form, useLoaderData } from "react-router";
import { getAuthFromRequest } from "~/auth/session.server";
import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const isLoginPage = url.pathname.endsWith("/login");

  const authResult = await getAuthFromRequest(request);

  if (isLoginPage) {
    if (authResult?.tokens.decodedToken.admin) {
      throw new Response("", {
        status: 302,
        headers: { Location: "/den2-console" },
      });
    }
    return { isAdmin: false, user: null };
  }

  if (!authResult || !authResult.tokens.decodedToken.admin) {
    throw new Response("", {
      status: 302,
      headers: { Location: "/den2-console/login" },
    });
  }

  const headers = new Headers();
  if (authResult.commit) {
    headers.append("Set-Cookie", await authResult.commit());
  }

  return {
    isAdmin: true,
    user: authResult.tokens.decodedToken,
  };
}

export default function ConsoleLayout() {
  const { isAdmin } = useLoaderData<typeof loader>();
  const location = useLocation();

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen justify-center p-12 md:p-20 font-noto">
        <Outlet />
      </div>
    );
  }

  const isActive = (path: string) => {
    if (path === "/den2-console") return location.pathname === "/den2-console";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen font-noto">
      <header className="border-b border-white/20 px-8 py-4 flex items-center justify-between">
        <nav className="flex items-center gap-6 text-sm">
          <Link to="/den2-console" className="font-semibold text-lg font-inter mr-4">
            DEN2 Console
          </Link>
          <Link
            to="/den2-console/games"
            className={isActive("/den2-console/games") ? "underline" : "opacity-60 hover:opacity-100 duration-150"}
          >
            ゲーム管理
          </Link>
          <Link
            to="/den2-console/keys"
            className={isActive("/den2-console/keys") ? "underline" : "opacity-60 hover:opacity-100 duration-150"}
          >
            プロダクトキー
          </Link>
        </nav>
        <Form method="post" action="/api/logout">
          <button
            type="submit"
            className="border border-white hover:text-black hover:bg-white py-1 px-4 duration-200 text-sm cursor-pointer"
          >
            ログアウト
          </button>
        </Form>
      </header>
      <main className="p-12 md:p-16 max-w-5xl">
        <Outlet />
      </main>
    </div>
  );
}
