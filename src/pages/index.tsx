import { Inter } from "next/font/google";
import Layout from "@/components/Layout";
import Head from "next/head";
import { FaExternalLinkAlt } from "react-icons/fa";
import { useFirebaseAuth } from "@/auth/firebase";
import { GetServerSideProps } from "next";
import { twMerge } from "tailwind-merge";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const inter = Inter({ subsets: ["latin"] });

export default function Home({ game, data }: { game: string; data: any }) {
  const { getFirebaseAuth } = useFirebaseAuth();
  const auth = getFirebaseAuth();
  async function handleLogout() {
    await fetch("/api/logout", {
      method: "GET",
    });
    window.location.reload();
  }
  async function downloadFile(name: string) {
    window.open(
      `https://files.ja1ykl.com/game/${name}/dl?accessToken=${
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
            (item: any) =>
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
                    className="flex items-center"
                  >
                    商品販売ページ&nbsp;
                    <FaExternalLinkAlt />
                  </a>
                  <button
                    onClick={() => downloadFile("dotdash")}
                    className="block w-full text-center border-2 border-white hover:text-black hover:bg-white py-4 duration-200 my-4"
                  >
                    ダウンロード <br />
                    {item.latest} ({item.changelog[0].date})
                  </button>
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
  const app = getApp();
  const auth = getAuth(app);
  const db = getFirestore(app);
  const user = auth.currentUser;

  if (!user) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  } else {
    const game = (await getDoc(doc(db, "serialCodes", user.uid))).data()?.game;
    return {
      props: {
        game: game,
        data: JSON.parse(JSON.stringify(json)),
      },
    };
  }
};
