import { Inter } from "next/font/google";
import { twMerge } from "tailwind-merge";
import { useForm, SubmitHandler } from "react-hook-form";
import { useFirebaseAuth } from "@/auth/firebase";
import { signInWithCustomToken } from "firebase/auth";
import Head from "next/head";
import toast from "react-hot-toast";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";

const inter = Inter({ subsets: ["latin"] });

export default function Login() {
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<{ serialCode: string }>();

  const onSubmit: SubmitHandler<{ serialCode: string }> = (data) => {
    console.log(data);
    handleLoginWithSerialCode(data.serialCode);
  };
  const router = useRouter();
  const { getFirebaseAuth } = useFirebaseAuth();

  async function handleLoginWithSerialCode(serialCode: string) {
    const loading = toast.loading("認証中...");
    const res = await fetch(
      `https://asia-northeast1-dotdash-game.cloudfunctions.net/customAuth?serialCode=${serialCode}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const json = await res.json();
    if (!res.ok || !json.customToken) {
      setError("serialCode", { message: "シリアルコードが正しくありません。" });
      toast.error("シリアルコードが正しくありません。", { id: loading });
      return;
    }
    const auth = getFirebaseAuth();
    const credential = await signInWithCustomToken(auth, json.customToken);
    const idTokenResult = await credential.user.getIdTokenResult();
    const logres = await (
      await fetch("/api/login", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${idTokenResult.token}`,
        },
      })
    ).json();
    if (logres.success) {
      toast.success("認証成功", { id: loading });
      router.push("/");
    } else {
      toast.error("認証失敗", {
        id: loading,
      });
    }
  }
  return (
    <Layout>
      <Head>
        <title>認証 | DEN2-Updater</title>
      </Head>
      <div className="max-w-xl w-full">
        <h2 className={twMerge("text-4xl font-semibold mb-2", inter.className)}>
          DEN2-Updater
        </h2>
        <p>
          ゲームファイルをダウンロードするためのサイトです。
          <br />
          製品に付属しているプロダクトキーを入力してください。
          <br />
          <br />
          ※もしプロダクトキーが正しいのに使用できない場合は、
          <code>denntuu20xx@gmail.com</code>までお問い合わせください。
        </p>
        <form onSubmit={handleSubmit(onSubmit)}>
          <h2 className="text-xl font-bold my-2">プロダクトキー</h2>
          {errors.serialCode && (
            <p className="text-red-500 my-2">{errors.serialCode.message}</p>
          )}
          <input
            type="text"
            className={twMerge(
              "text-black w-full",
              errors.serialCode && "focus:ring-red-600 focus:border-red-600"
            )}
            placeholder="AAAA-BBBB-CCCC-DDDD"
            {...register("serialCode", {
              required: "シリアルコードを入力してください。",
              pattern: {
                message: "シリアルコードの形式が正しくありません。",
                value: /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/,
              },
            })}
          />
          <button className="border-white border-2 px-4 py-1.5 my-2 duration-200 hover:bg-white hover:text-black">
            認証
          </button>
        </form>
      </div>
    </Layout>
  );
}
