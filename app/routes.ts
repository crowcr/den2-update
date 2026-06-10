import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("api/login", "routes/api.login.ts"),
  route("api/logout", "routes/api.logout.ts"),

  // 管理画面（推測されにくいURLプレフィックス）
  route("den2-console", "routes/console/layout.tsx", [
    index("routes/console/dashboard.tsx"),
    route("login", "routes/console/login.tsx"),
    route("games", "routes/console/games.tsx"),
    route("games/new", "routes/console/games-new.tsx"),
    route("games/:gameId", "routes/console/games-edit.tsx"),
    route("keys", "routes/console/keys.tsx"),
    route("keys/download", "routes/console/keys-download.ts"),
  ]),
] satisfies RouteConfig;
