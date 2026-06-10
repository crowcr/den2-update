import { useForm, SubmitHandler } from "react-hook-form";
import { useFirebaseAuth } from "~/auth/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";

type LoginFormInputs = {
  email: string;
  password: string;
};

export default function ConsoleLogin() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInputs>();

  const navigate = useNavigate();
  const { getFirebaseAuth } = useFirebaseAuth();

  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    const loading = toast.loading("ログイン処理中...");
    try {
      const auth = getFirebaseAuth();
      const credential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const idTokenResult = await credential.user.getIdTokenResult();

      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken: idTokenResult.token,
          refreshToken: credential.user.refreshToken,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success("ログインしました", { id: loading });
        navigate("/den2-console");
      } else {
        toast.error(json.error || "認証セッションの作成に失敗しました。", { id: loading });
      }
    } catch (error: any) {
      let errorMsg = "ログインに失敗しました。メールアドレスまたはパスワードをご確認ください。";
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        errorMsg = "メールアドレスまたはパスワードが正しくありません。";
      }
      toast.error(errorMsg, { id: loading });
    }
  };

  return (
    <div className="max-w-sm w-full">
      <h2 className="text-4xl font-semibold mb-2 font-inter">DEN2 Console</h2>
      <p className="mb-6 opacity-70 text-sm">管理者ログイン</p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm mb-1">メールアドレス</label>
          {errors.email && <p className="text-red-400 text-sm mb-1">{errors.email.message}</p>}
          <input
            type="email"
            className="text-black w-full"
            placeholder="admin@example.com"
            {...register("email", {
              required: "メールアドレスを入力してください",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "有効なメールアドレス形式ではありません",
              },
            })}
          />
        </div>

        <div>
          <label className="block text-sm mb-1">パスワード</label>
          {errors.password && <p className="text-red-400 text-sm mb-1">{errors.password.message}</p>}
          <input
            type="password"
            className="text-black w-full"
            placeholder="••••••••"
            {...register("password", {
              required: "パスワードを入力してください",
              minLength: {
                value: 6,
                message: "パスワードは6文字以上で入力してください",
              },
            })}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="border border-white hover:text-black hover:bg-white py-2 px-4 duration-200 cursor-pointer disabled:opacity-50 mt-2"
        >
          {isSubmitting ? "処理中..." : "ログイン"}
        </button>
      </form>
    </div>
  );
}

export function meta() {
  return [
    { title: "ログイン - DEN2-Console" },
  ];
}
