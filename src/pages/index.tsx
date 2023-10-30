import { Inter } from "next/font/google";
import Layout from "@/components/Layout";
import Head from "next/head";
import { FaExternalLinkAlt } from "react-icons/fa";
import { useFirebaseAuth } from "@/auth/firebase";
import { GetServerSideProps } from "next";
import { twMerge } from "tailwind-merge";
import { getTokensFromObject } from "next-firebase-auth-edge/lib/next/tokens";
import { getDoc } from "firebase/firestore";

const inter = Inter({ subsets: ["latin"] });

export default function Home({ game, data }: { game: string; data: any }) {
  const { getFirebaseAuth } = useFirebaseAuth();
  const auth = getFirebaseAuth();
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
      method: "GET",
    });
    window.location.reload();
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
      <Head>
        <title>DEN2-Updater</title>
      </Head>
      <div className="max-w-xl w-full">
        <button
          onClick={handleLogout}
          className="text-center border-2 border-white hover:text-black hover:bg-white py-2 px-4 duration-200 my-4"
        >
          ログアウト
        </button>
        <h2 className={twMerge("text-4xl font-semibold mb-2", inter.className)}>
          DEN2-Updater
        </h2>
        <p>
          電気通信部制作のゲームをプレイしていただきありがとうございます。
          <br />
          以下のリンクからゲームをダウンロードいただけます。
        </p>
        <div className="flex flex-col mt-4">
          {data.map(
            (item: Game) =>
              item.id === game && (
                <div key={item.id}>
                  <h3
                    className={twMerge(
                      "mb-2 text-2xl font-medium",
                      inter.className
                    )}
                  >
                    {item.name}
                  </h3>
                  {item.image_url && (
                    <img src={item.image_url} className="w-full mb-2" />
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
                      className="block w-full text-center border-2 border-white hover:text-black hover:bg-white py-4 duration-200 my-4"
                    >
                      {capitalize(os)}版をダウンロード <br />
                      {item.latest} ({item.changelog[0].date})
                    </button>
                  ))}

                  <details>
                    <summary>更新履歴</summary>
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

export const getServerSideProps: GetServerSideProps = async (context) => {
  const res = await fetch("https://files.ja1ykl.com/game/info");
  const json = await res.json();
  const tokens = await getTokensFromObject(context.req.cookies, {
    apiKey: process.env.FIREBASE_API_KEY || "",
    serviceAccount: {
      projectId: process.env.FIREBASE_PROJECT_ID || "",
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY || "",
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || "",
    },
    cookieName: "AuthToken",
    cookieSignatureKeys: ["ovo010ovo", "dotdash-DEN2"],
  });
  const user = tokens || null;
  const dbUrl = `https://firestore.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/databases/(default)/documents/serialCodes/${tokens?.decodedToken.uid}`;
  const dbRes = await fetch(dbUrl, {
    headers: {
      Authorization: `Bearer ${tokens?.token}`,
    },
  });
  const dbJson = await dbRes.json();
  if (!user) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  } else {
    return {
      props: {
        game: dbJson.fields.game.stringValue,
        data: JSON.parse(JSON.stringify(json)),
      },
    };
  }
};
