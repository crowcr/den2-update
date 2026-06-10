import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    resolve: {
      tsconfigPaths: true
    },
    plugins: [
      tailwindcss(),
      reactRouter(),
    ],
    define: {
      "process.env.NEXT_PUBLIC_REDIRECT_URL": JSON.stringify(env.NEXT_PUBLIC_REDIRECT_URL),
      "process.env.NEXT_PUBLIC_FIREBASE_API_KEY": JSON.stringify(env.NEXT_PUBLIC_FIREBASE_API_KEY),
      "process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN": JSON.stringify(env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
      "process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL": JSON.stringify(env.NEXT_PUBLIC_FIREBASE_DATABASE_URL),
      "process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID": JSON.stringify(env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
      "process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID": JSON.stringify(env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
      "process.env.NEXT_PUBLIC_EMULATOR_HOST": JSON.stringify(env.NEXT_PUBLIC_EMULATOR_HOST),
    },
    ssr: {
      noExternal: [/^react-icons/],
    },
  };
});
