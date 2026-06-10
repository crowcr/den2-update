import Layout from "~/components/Layout";
import { FaExternalLinkAlt } from "react-icons/fa";
import { useFirebaseAuth } from "~/auth/firebase";
import { useLoaderData, useNavigate, redirect, data, type LoaderFunctionArgs } from "react-router";
import { getAuthFromRequest } from "~/auth/session.server";

export function meta() {
  return [
    { title: "DEN2-Updater" },
  ];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const authResult = await getAuthFromRequest(request);
  if (!authResult) {
    return redirect("/login");
  }

  try {
    const res = await fetch("https://files.ja1ykl.com/game/info");
    const json = await res.json();

    const dbUrl = `https://firestore.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/databases/(default)/documents/serialCodes/${authResult.tokens.decodedToken.uid}`;
    const dbRes = await fetch(dbUrl, {
      headers: {
        Authorization: `Bearer ${authResult.tokens.token}`,
      },
    });

    if (!dbRes.ok) {
      console.error("Failed to fetch Firestore doc:", await dbRes.text());
      return redirect("/login");
    }

    const dbJson = await dbRes.json();

    const headers = new Headers();
    if (authResult.commit) {
      headers.append("Set-Cookie", await authResult.commit());
    }

    return data(
      {
        game: dbJson.fields.game.stringValue,
        data: json,
      },
      { headers }
    );
  } catch (error) {
    console.error("Loader failed in home route:", error);
    return redirect("/login");
  }
}

export default function Home() {
  const { game, data: gameData } = useLoaderData<typeof loader>();
  const { getFirebaseAuth } = useFirebaseAuth();
  const auth = getFirebaseAuth();
  const navigate = useNavigate();

  type Game = {
    id: string;
    name: string;
    manual_url: string;
    image_url: string;
    shop_url: string;
    latest: string;
    supported_os: string[];
    changelog: {
      version: string;
      date: string;
      description: string;
    }[];
  };

  const capitalize = (s: string) => s && s[0].toUpperCase() + s.slice(1);

  async function handleLogout() {
    await fetch("/api/logout", {
      method: "POST",
    });
    navigate("/login");
  }

  async function downloadFile(name: string, os: string) {
    window.open(
      `https://files.ja1ykl.com/game/${name}/dl?os=${os}&accessToken=${
        (auth.currentUser as any)?.accessToken
      }`,
      "_blank"
    );
  }

  return (
    <Layout>
      <div className="max-w-xl w-full">
        <button
          onClick={handleLogout}
          className="text-center border-2 border-white hover:text-black hover:bg-white py-2 px-4 duration-200 my-4 cursor-pointer"
        >
          ログアウト
        </button>
        <h2 className="text-4xl font-semibold mb-2 font-inter">
          DEN2-Updater
        </h2>
        <p>
          電気通信部制作のゲームをプレイしていただきありがとうございます。
          <br />
          以下のリンクからゲームをダウンロードいただけます。
        </p>
        <div className="flex flex-col mt-4">
          {gameData.map(
            (item: Game) =>
              item.id === game && (
                <div key={item.id}>
                  <h3 className="mb-2 text-2xl font-medium font-inter">
                    {item.name}
                  </h3>
                  {item.image_url && (
                    <img src={item.image_url} className="w-full mb-2" alt={item.name} />
                  )}
                  <a
                    href={item.shop_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center mb-2"
                  >
                    商品販売ページ&nbsp;
                    <FaExternalLinkAlt />
                  </a>
                  {item.manual_url && (
                    <a
                      href={item.manual_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center"
                    >
                      説明書&nbsp;
                      <FaExternalLinkAlt />
                    </a>
                  )}
                  {item.supported_os.map((os: string) => (
                    <button
                      key={os}
                      onClick={() => downloadFile(item.id, os)}
                      className="block w-full text-center border-2 border-white hover:text-black hover:bg-white py-4 duration-200 my-4 cursor-pointer"
                    >
                      {capitalize(os)}版をダウンロード <br />
                      {item.latest} ({item.changelog[0].date})
                    </button>
                  ))}

                  <details>
                    <summary className="cursor-pointer">更新履歴</summary>
                    {item.changelog.map((log: any) => (
                      <dl key={log.version}>
                        <dt className="font-bold mt-2">
                          {log.version} ({log.date})
                        </dt>
                        <dd>{log.description}</dd>
                      </dl>
                    ))}
                  </details>
                </div>
              )
          )}
        </div>
      </div>
    </Layout>
  );
}
