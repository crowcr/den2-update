import { Inter, Noto_Sans_JP } from 'next/font/google'
import { twMerge } from 'tailwind-merge'
import Head from 'next/head'
import { FaExternalLinkAlt } from 'react-icons/fa'
import { useFirebaseAuth } from '@/auth/firebase'
import { GetServerSideProps } from "next";

const notojp = Noto_Sans_JP({ subsets: ['latin'] })
const inter = Inter({ subsets: ['latin'] })

export default function Home({ data }: { data: any }) {
  const { getFirebaseAuth } = useFirebaseAuth();
  const auth = getFirebaseAuth();
  async function handleLogout() {
    await fetch("/api/logout", {
      method: "GET",
    });
    window.location.reload();
  }
  async function downloadFile(name: string) {
    //@ts-ignore
    window.open(`https://files.ja1ykl.com/game/${name}/dl?accessToken=${auth.currentUser?.accessToken}`, "_blank")
  }
  return (
    <main
      className={twMerge("flex min-h-screen justify-center p-20", notojp.className)}
    >
      <Head>
        <title>DEN2-Updater</title>
      </Head>
      <div className='max-w-xl w-full'>
        <button onClick={handleLogout} className='text-center border-2 border-white hover:text-black hover:bg-white py-2 px-4 duration-200 my-4'>ログアウト</button>
        <h2 className={twMerge('text-4xl font-semibold mb-2', inter.className)}>DEN2-Updater</h2>
        <p>電気通信部制作のゲームをプレイしていただきありがとうございます。<br/>以下のリンクからゲームをダウンロードいただけます。</p>
        <div className='flex flex-col mt-4'>
          {data.map((item: any) => (
            <div key={item.id}>
              <h3 className={twMerge('mb-2 text-2xl font-medium', inter.className)}>{item.name}</h3>
              <img src={item.image_url} className='w-full mb-2' />
              <a href={item.shop_url} target='_blank' rel="noopener noreferrer" className='flex items-center'>商品販売ページ&nbsp;<FaExternalLinkAlt /></a>
              <button onClick={() => downloadFile("dotdash")} className='block w-full text-center border-2 border-white hover:text-black hover:bg-white py-4 duration-200 my-4'>
                ダウンロード <br/>
                {item.latest} ({item.changelog[0].date})
              </button>
              <details>
                <summary>
                  更新履歴
                </summary>
                {item.changelog.map((log: any) => (
                  <dl key={log.version}>
                    <dt className='font-bold mt-2'>{log.version} ({log.date})</dt>
                    <dd>{log.description}</dd>
                  </dl>
                ))}
              </details>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const res = await fetch("https://files.ja1ykl.com/game/info")
  const json = await res.json()

  return {
    props: {
      data: JSON.parse(JSON.stringify(json)),
    },
  };
}