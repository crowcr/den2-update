import admin from "firebase-admin";
import { useLoaderData, Form, Link, useActionData } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { useEffect } from "react";
import toast from "react-hot-toast";

export async function loader() {
  const db = admin.firestore();
  const querySnapshot = await db.collection("games").get();
  const games: any[] = [];
  querySnapshot.forEach((doc) => {
    games.push({ ...doc.data(), docId: doc.id });
  });
  return { games };
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    const gameId = formData.get("gameId") as string;
    if (!gameId) return { error: "ゲームIDが必要です。" };

    try {
      const db = admin.firestore();
      await db.collection("games").doc(gameId).delete();
      return { success: true, message: `「${gameId}」を削除しました。` };
    } catch (e: any) {
      return { error: e.message || "削除に失敗しました。" };
    }
  }

  return null;
}

export default function ConsoleGames() {
  const { games } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  useEffect(() => {
    if (actionData?.success) toast.success(actionData.message || "削除しました。");
    else if (actionData?.error) toast.error(actionData.error);
  }, [actionData]);

  const handleDeleteSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    if (!window.confirm("本当にこのゲームを削除しますか？")) e.preventDefault();
  };

  return (
    <div>
      <h2 className="text-4xl font-semibold mb-2 font-inter">ゲーム管理</h2>
      <p className="mb-8 opacity-70">ゲーム情報の一覧・追加・編集・削除を行います。</p>

      <Link
        to="/den2-console/games/new"
        className="inline-block border border-white hover:text-black hover:bg-white py-2 px-4 duration-200 text-sm mb-8"
      >
        新規ゲームを登録
      </Link>

      {games.length === 0 ? (
        <p className="opacity-60 text-sm">ゲームが登録されていません。</p>
      ) : (
        <div className="flex flex-col gap-6">
          {games.map((game) => (
            <div key={game.id} className="border-4 border-white p-4">
              <div className="flex justify-between items-start gap-4 mb-2">
                <div>
                  <h3 className="font-semibold text-lg">{game.name}</h3>
                  <p className="text-sm opacity-60 font-mono">{game.id}</p>
                </div>
                <div className="flex gap-3 text-sm shrink-0">
                  <Link to={`/den2-console/games/${game.docId}`} className="underline hover:opacity-70 duration-150">
                    編集
                  </Link>
                  <Form method="post" onSubmit={handleDeleteSubmit} className="inline">
                    <input type="hidden" name="intent" value="delete" />
                    <input type="hidden" name="gameId" value={game.id} />
                    <button type="submit" className="underline hover:opacity-70 duration-150 cursor-pointer">
                      削除
                    </button>
                  </Form>
                </div>
              </div>
              <div className="text-sm opacity-70">
                <span>バージョン: {game.latest || "-"}</span>
                {" / "}
                <span>
                  OS: {game.supported_os?.join(", ") || "-"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function meta() {
  return [
    { title: "ゲーム一覧 - DEN2-Console" },
  ];
}
