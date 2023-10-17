import { Noto_Sans_JP } from "next/font/google";
import { twMerge } from "tailwind-merge";
import { Toaster } from "react-hot-toast";

const notojp = Noto_Sans_JP({ subsets: ["latin"] });

export default function Layout({ children }: any) {
  return (
    <div className="relative min-h-screen">
      <main
        className={twMerge(
          "flex min-h-screen justify-center p-20",
          notojp.className
        )}
      >
        {children}
      </main>
      <Toaster position="bottom-right" />
    </div>
  );
}
