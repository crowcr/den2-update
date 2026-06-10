import admin from "firebase-admin";
import { useState, useEffect } from "react";
import { Form, useNavigate, useActionData, Link } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import toast from "react-hot-toast";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const gameId = (formData.get("gameId") as string)?.trim();
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const latest = formData.get("latest") as string;
  const image_url = formData.get("image_url") as string;
  const manual_url = formData.get("manual_url") as string;
  const shop_url = formData.get("shop_url") as string;
  const supported_os = formData.getAll("supported_os") as string[];
  const changelogJson = formData.get("changelogJson") as string;

  if (!gameId || !name) return { error: "ゲームIDとゲーム名は必須です。" };
  if (!/^[a-zA-Z0-9_-]+$/.test(gameId))
    return { error: "ゲームIDは半角英数字、ハイフン、アンダースコアのみ使用できます。" };

  const db = admin.firestore();
  try {
    const docRef = db.collection("games").doc(gameId);
    const doc = await docRef.get();
    if (doc.exists) return { error: `ゲームID「${gameId}」は既に登録されています。` };

    const changelog = changelogJson ? JSON.parse(changelogJson) : [];

    await docRef.set({
      name,
      description: description || "",
      latest: latest || "",
      image_url: image_url || "",
      manual_url: manual_url || "",
      shop_url: shop_url || "",
      supported_os: supported_os.length > 0 ? supported_os : ["universal"],
      changelog,
    });

    return { success: true };
  } catch (e: any) {
    return { error: e.message || "ゲームの登録に失敗しました。" };
  }
}

const OS_OPTIONS = ["windows", "mac", "linux", "universal"];

export default function ConsoleGamesNew() {
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();
  const [changelog, setChangelog] = useState<{ version: string; date: string; description: string }[]>([]);
  const [osSelection, setOsSelection] = useState<string[]>(["windows"]);

  useEffect(() => {
    if (actionData?.success) {
      toast.success("ゲームを登録しました。");
      navigate("/den2-console/games");
    } else if (actionData?.error) {
      toast.error(actionData.error);
    }
  }, [actionData, navigate]);

  const addChangelog = () => {
    const today = new Date().toISOString().split("T")[0];
    setChangelog([{ version: "", date: today, description: "" }, ...changelog]);
  };

  const removeChangelog = (i: number) => setChangelog(changelog.filter((_, idx) => idx !== i));

  const updateChangelog = (i: number, field: "version" | "date" | "description", value: string) => {
    const updated = [...changelog];
    updated[i][field] = value;
    setChangelog(updated);
  };

  const toggleOs = (os: string) =>
    setOsSelection((prev) => (prev.includes(os) ? prev.filter((x) => x !== os) : [...prev, os]));

  return (
    <div className="max-w-xl">
      <Link to="/den2-console/games" className="text-sm underline opacity-60 hover:opacity-100 duration-150 block mb-6">
        ← ゲーム一覧に戻る
      </Link>

      <h2 className="text-4xl font-semibold mb-2 font-inter">新規ゲーム登録</h2>
      <p className="mb-8 opacity-70">新しいゲームの情報を追加します。</p>

      <Form method="post" className="flex flex-col gap-5">
        <div>
          <label className="block text-sm mb-1">ゲームID <span className="opacity-50">（後から変更不可）</span></label>
          <input type="text" name="gameId" required placeholder="e.g. den2-action" className="text-black w-full font-mono" />
        </div>

        <div>
          <label className="block text-sm mb-1">ゲーム名</label>
          <input type="text" name="name" required placeholder="e.g. 電通アクション" className="text-black w-full" />
        </div>

        <div>
          <label className="block text-sm mb-1">説明</label>
          <textarea name="description" rows={3} placeholder="ゲームの説明を記載します。" className="text-black w-full" />
        </div>

        <div>
          <label className="block text-sm mb-1">最新バージョン</label>
          <input type="text" name="latest" placeholder="e.g. 1.0.0" className="text-black w-full font-mono" />
        </div>

        <div>
          <label className="block text-sm mb-1">画像URL</label>
          <input type="url" name="image_url" placeholder="https://..." className="text-black w-full" />
        </div>

        <div>
          <label className="block text-sm mb-1">商品販売ページURL</label>
          <input type="url" name="shop_url" placeholder="https://booth.pm/..." className="text-black w-full" />
        </div>

        <div>
          <label className="block text-sm mb-1">説明書URL</label>
          <input type="url" name="manual_url" placeholder="https://..." className="text-black w-full" />
        </div>

        <div>
          <label className="block text-sm mb-2">対応OS</label>
          <div className="flex flex-wrap gap-4">
            {OS_OPTIONS.map((os) => (
              <label key={os} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  name="supported_os"
                  value={os}
                  checked={osSelection.includes(os)}
                  onChange={() => toggleOs(os)}
                  className="text-white"
                />
                <span className="capitalize">{os}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Changelog */}
        <div className="border-t border-white/20 pt-5">
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm">更新履歴</label>
            <button type="button" onClick={addChangelog} className="text-sm underline hover:opacity-70 duration-150 cursor-pointer">
              + 履歴を追加
            </button>
          </div>
          <input type="hidden" name="changelogJson" value={JSON.stringify(changelog)} />
          {changelog.length === 0 ? (
            <p className="text-sm opacity-50">まだ更新履歴はありません。</p>
          ) : (
            <div className="flex flex-col gap-4">
              {changelog.map((log, i) => (
                <div key={i} className="border border-white/20 p-3 flex flex-col gap-2 relative">
                  <button
                    type="button"
                    onClick={() => removeChangelog(i)}
                    className="absolute top-2 right-2 text-sm opacity-50 hover:opacity-100 cursor-pointer"
                  >
                    ✕
                  </button>
                  <div className="flex gap-3 pr-6">
                    <div className="flex-1">
                      <label className="text-xs opacity-60 block mb-1">バージョン</label>
                      <input
                        type="text"
                        value={log.version}
                        onChange={(e) => updateChangelog(i, "version", e.target.value)}
                        placeholder="1.0.1"
                        className="text-black w-full text-sm font-mono"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs opacity-60 block mb-1">リリース日</label>
                      <input
                        type="date"
                        value={log.date}
                        onChange={(e) => updateChangelog(i, "date", e.target.value)}
                        className="text-black w-full text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs opacity-60 block mb-1">変更内容</label>
                    <textarea
                      value={log.description}
                      onChange={(e) => updateChangelog(i, "description", e.target.value)}
                      rows={2}
                      className="text-black w-full text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-4 border-t border-white/20 pt-5">
          <Link
            to="/den2-console/games"
            className="border border-white hover:text-black hover:bg-white py-2 px-4 duration-200 text-sm"
          >
            キャンセル
          </Link>
          <button
            type="submit"
            className="border border-white hover:text-black hover:bg-white py-2 px-4 duration-200 text-sm cursor-pointer"
          >
            登録する
          </button>
        </div>
      </Form>
    </div>
  );
}

export function meta() {
  return [
    { title: "ゲーム追加 - DEN2-Console" },
  ];
}
