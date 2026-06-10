import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("api/login", "routes/api.login.ts"),
  route("api/logout", "routes/api.logout.ts"),
] satisfies RouteConfig;
