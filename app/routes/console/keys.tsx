import admin from "firebase-admin";
import { useState, useEffect } from "react";
import { useLoaderData, useActionData, Form } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import crypto from "crypto";
import toast from "react-hot-toast";

export async function loader() {
  const db = admin.firestore();

  const gamesSnapshot = await db.collection("games").get();
  const games = gamesSnapshot.docs.map((doc) => ({ id: doc.id, name: doc.data().name }));

  const keysSnapshot = await db.collection("serialCodes").get();
  const keys = keysSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  return { games, keys };
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "generate") {
    const gameId = formData.get("gameId") as string;
    const countStr = formData.get("count") as string;
    const count = parseInt(countStr, 10);

    if (!gameId || isNaN(count) || count <= 0 || count > 500)
      return { error: "正しいゲームIDと生成件数（1〜500）を入力してください。" };

    try {
      const db = admin.firestore();
      const gameDoc = await db.collection("games").doc(gameId).get();
      if (!gameDoc.exists) return { error: "指定されたゲームが存在しません。" };

      const querySnapshot = await db.collection("serialCodes").get();
      const existingCodes = new Set(querySnapshot.docs.map((doc) => doc.data().serialCode));

      const generatedCodes: string[] = [];
      const S = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      const batch = db.batch();

      for (let i = 0; i < count; i++) {
        let serialCode = "";
        while (true) {
          let tempCode = "";
          for (let j = 0; j < 4; j++) {
            const randomBytes = crypto.randomBytes(4);
            tempCode += Array.from(randomBytes)
              .map((n) => S[n % S.length])
              .join("");
            if (j < 3) tempCode += "-";
          }
          if (!existingCodes.has(tempCode) && !generatedCodes.includes(tempCode)) {
            serialCode = tempCode;
            break;
          }
        }
        generatedCodes.push(serialCode);

        const docId = crypto.createHash("md5").update(serialCode).digest("hex");
        batch.set(db.collection("serialCodes").doc(docId), {
          call: 0,
          serialCode,
          game: gameId,
          userId: docId,
        });
      }

      await batch.commit();

      return { success: true, generatedCodes, gameId, message: `${count}個のプロダクトキーを生成しました。` };
    } catch (e: any) {
      return { error: e.message || "生成に失敗しました。" };
    }
  }

  return null;
}

export default function ConsoleKeys() {
  const { games, keys: initialKeys } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [filterGameId, setFilterGameId] = useState<string>("all");
  const [keys, setKeys] = useState(initialKeys);

  useEffect(() => {
    if (actionData?.success) toast.success(actionData.message || "生成しました。");
    else if (actionData?.error) toast.error(actionData.error);
  }, [actionData]);

  useEffect(() => {
    setKeys(filterGameId === "all" ? initialKeys : initialKeys.filter((k: any) => k.game === filterGameId));
  }, [filterGameId, initialKeys]);

  return (
    <div>
      <h2 className="text-4xl font-semibold mb-2 font-inter">プロダクトキー管理</h2>
      <p className="mb-8 opacity-70">プロダクトキーの確認、一括生成、Excelダウンロードを行います。</p>

      {/* Generation Form */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">キーを一括生成</h3>
        <Form method="post" className="flex flex-col gap-4 max-w-sm">
          <input type="hidden" name="intent" value="generate" />
          <div>
            <label className="block text-sm mb-1">対象ゲーム</label>
            <select name="gameId" required className="text-black w-full">
              <option value="">-- ゲームを選択 --</option>
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.id})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">生成件数（最大500件）</label>
            <input type="number" name="count" required min={1} max={500} defaultValue={10} className="text-black w-full font-mono" />
          </div>
          <button
            type="submit"
            className="border border-white hover:text-black hover:bg-white py-2 px-4 duration-200 text-sm cursor-pointer w-fit"
          >
            生成する
          </button>
        </Form>
      </div>

      {/* Generated result & download */}
      {actionData?.success && actionData.generatedCodes && (
        <div className="border border-white/30 p-4 mb-8">
          <p className="text-sm mb-3">{actionData.generatedCodes.length}件のキーを生成しました。</p>
          <a
            href={`/den2-console/keys/download?codes=${actionData.generatedCodes.join(",")}&gameId=${actionData.gameId}`}
            className="inline-block border border-white hover:text-black hover:bg-white py-2 px-4 duration-200 text-sm"
          >
            Excelファイルをダウンロード
          </a>
        </div>
      )}

      {/* Per-game downloads */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">ゲーム別ダウンロード</h3>
        <div className="flex flex-col gap-2">
          {games.map((g) => {
            const count = initialKeys.filter((k: any) => k.game === g.id).length;
            return (
              <div key={g.id} className="flex items-center justify-between border border-white/20 p-3 text-sm">
                <span>
                  {g.name} <span className="opacity-50 font-mono">({g.id})</span> — {count}件
                </span>
                {count > 0 ? (
                  <a
                    href={`/den2-console/keys/download?gameId=${g.id}`}
                    className="underline hover:opacity-70 duration-150"
                  >
                    Excelダウンロード
                  </a>
                ) : (
                  <span className="opacity-40">キーなし</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Keys table */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">登録済みキー一覧 ({keys.length}件)</h3>
          <div className="flex items-center gap-2 text-sm">
            <span className="opacity-60">フィルタ:</span>
            <select
              value={filterGameId}
              onChange={(e) => setFilterGameId(e.target.value)}
              className="text-black text-sm"
            >
              <option value="all">すべて</option>
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {keys.length === 0 ? (
          <p className="opacity-50 text-sm">該当するプロダクトキーが見つかりません。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/20 text-left opacity-60">
                  <th className="pb-2 pr-6 font-normal">プロダクトキー</th>
                  <th className="pb-2 pr-6 font-normal">ゲームID</th>
                  <th className="pb-2 font-normal">ダウンロード回数</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 font-mono">
                {keys.map((k: any) => (
                  <tr key={k.id}>
                    <td className="py-2 pr-6">{k.serialCode}</td>
                    <td className="py-2 pr-6 opacity-70">{k.game}</td>
                    <td className="py-2 opacity-70">{k.call ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function meta() {
  return [
    { title: "プロダクトキー - DEN2-Console" },
  ];
}
