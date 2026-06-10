import admin from "firebase-admin";
import { useLoaderData, Link } from "react-router";

export async function loader() {
  const db = admin.firestore();

  const gamesSnapshot = await db.collection("games").get();
  const gamesCount = gamesSnapshot.size;

  const keysSnapshot = await db.collection("serialCodes").get();
  const keysCount = keysSnapshot.size;

  let totalDownloads = 0;
  keysSnapshot.forEach((doc) => {
    totalDownloads += doc.data().call || 0;
  });

  return { gamesCount, keysCount, totalDownloads };
}

export default function ConsoleDashboard() {
  const { gamesCount, keysCount, totalDownloads } = useLoaderData<typeof loader>();

  return (
    <div>
      <h2 className="text-4xl font-semibold mb-2 font-inter">ダッシュボード</h2>
      <p className="mb-8 opacity-70">ゲーム情報とプロダクトキーを管理します。</p>

      <div className="flex flex-col gap-2 mb-10 text-sm">
        <p>登録ゲーム数: <span className="font-semibold">{gamesCount}</span></p>
        <p>発行済みプロダクトキー: <span className="font-semibold">{keysCount}</span></p>
        <p>累計ダウンロード回数: <span className="font-semibold">{totalDownloads}</span></p>
      </div>

      <div className="flex flex-col gap-3">
        <Link
          to="/den2-console/games/new"
          className="inline-block border border-white hover:text-black hover:bg-white py-2 px-4 duration-200 text-sm w-fit"
        >
          新規ゲームを登録
        </Link>
        <Link
          to="/den2-console/keys"
          className="inline-block border border-white hover:text-black hover:bg-white py-2 px-4 duration-200 text-sm w-fit"
        >
          プロダクトキーを生成
        </Link>
      </div>
    </div>
  );
}

export function meta() {
  return [
    { title: "ダッシュボード - DEN2-Console" },
  ];
}
