import { twMerge } from "tailwind-merge";

export default function Layout({ children }: any) {
  return (
    <div className="relative min-h-screen">
      <main
        className={twMerge(
          "flex min-h-screen justify-center p-12 md:p-20 font-noto"
        )}
      >
        {children}
      </main>
    </div>
  );
}
