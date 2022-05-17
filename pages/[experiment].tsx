import {
  BarElement, CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip
} from "chart.js"
import { readFile } from "fs/promises"
import { GetStaticPathsResult, GetStaticPropsContext, GetStaticPropsResult } from "next"
import Head from "next/head"
import { Scatter } from "react-chartjs-2"
import FormattedLink from "../components/FormattedLink"
import Main from "../components/Main"
import { ExperimentData, ExperimentMeta } from "../utils/types"
import Color from "color"

ChartJS.register(
  LinearScale,
  CategoryScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Legend,
  Tooltip
)

interface Props {
    meta: ExperimentMeta,
    data: ExperimentData[]
}


export default function Experiment({ location, meta, data }: Props & { location: string }) {
    const desc = `${meta.name} experiment data.`
    return (
        <Main>
        <Head>
            <title>{meta.name} | Wicked</title>
            <meta name="twitter:card" content="summary" />
            <meta property="og:title" content={`${meta.name} | Wicked`} />
            <meta property="og:description" content={desc} />
            <meta name="description" content={desc} />
        </Head>

        <h2 className="font-semibold">
            <FormattedLink href="/" location={location} className="font-semibold text-lg">
            Experiments
            </FormattedLink>
        </h2>

        <h1 className="text-3xl font-bold pb-2">
            Experiment: {meta.name}
        </h1>

        <h3 className="text-lg font-bold pt-1" id="results">Results</h3>
        <div className="w-full bg-slate-800 rounded-xl p-1 my-2 md:my-0 text-white col-start-2">
          <Scatter data={({
              datasets: data.map(d => ({
                label: d.nickname,
                data: meta.oneShot ? [{ x: d.ar, y: Math.max(...d.stats.map(([_x, y]) => y)) }] : d.stats.map(([x, y]) => ({ x, y })),
                ...getColor(d)
              }))
            })} options={({
              color: "white",
              backgroundColor: "#333333",
              interaction: {
                mode: "index",
                intersect: false
              },
              scales: {
                yAxes: {
                  ticks: {
                      color: "white"
                  }
                },
                xAxes: {
                  ticks: {
                      color: "white"
                  }
                }
              },
              plugins: {
                tooltip: {
                  callbacks: {
                    label: (ti) => `${ti.dataset.label} (${ti.label}, ${ti.formattedValue})`
                  }
                }
              }
            })} />
        </div>
        </Main>
    )
}

function getColor(data: ExperimentData) {
  let pillarIndex = 0
  switch(data.affiliation) {
    case "KQM Theorycraft":
      pillarIndex = 1
      break
    case "KQM Leaks":
      pillarIndex = 2
      break
  }

  const a = (Math.random() - 0.5) * 0.5
  const b = (Math.random() - 0.5) * 0.5
  const c = 1 + (Math.random() - 0.5) * 0.2

  return {
    backgroundColor: getColorIndex(pillarIndex, a, b, c, 0.4),
    borderColor: getColorIndex(pillarIndex, a, b, c, 1)
  }
}

const colors = [
  Color({ r: 201, g: 201, b: 201 }),
  Color({ r: 255, g: 99, b: 99 }),
  Color({ r: 255, g: 216, b: 99 }),
  Color({ r: 177, g: 255, b: 99 }),
  Color({ r: 99, g: 255, b: 138 }),
  Color({ r: 99, g: 255, b: 255 }),
  Color({ r: 99, g: 138, b: 255 }),
  Color({ r: 177, g: 99, b: 255 }),
  Color({ r: 255, g: 99, b: 216 }),
]

function getColorIndex(index: number, randomness1: number, randomness2: number, randomness3: number, alpha: number) {
  const base = colors[index]

  return base
    .lighten(randomness1)
    .saturate(randomness2)
    .hue(base.hue() * randomness3)
    .toString()
}

const level = [
  0,
  0, 375, 875, 1500, 2225, 3075, 4025, 5100, 6300, 7600, 9025, 10550, 12200, 13975, 15850, 17850, 20225, 22725, 25350, 28125,
  30950, 34375, 38100, 42100, 46400, 50975, 55850, 61000, 66450, 72175, 78200, 84500, 91100, 98000, 105175, 112650, 120400, 128450, 136775, 145400,
  155950, 167475, 179950, 193400, 207800, 223150, 239475, 256750, 275000, 294200, 320600, 349400, 380600, 414200, 450200, 682550, 941500, 1227250, 1540075, 1880200
]

export async function getStaticProps(context: GetStaticPropsContext): Promise<GetStaticPropsResult<Props>> {
  const experimentName = context.params?.experiment
  const experiments = JSON.parse((await readFile("./data/experiments.json")).toString())
  const users = JSON.parse((await readFile("./data/users.json")).toString()) as {
    "responseId": string,
    "createTime": string,
    "lastSubmittedTime": string,
    "arLvl": string,
    "arXP": string,
    "server": string,
    "dbFile": {
      "fileId": string
    },
    "discord": string,
    "affiliation": string,
    "hasWeapons": "Yes" | "No",
    "hasChars": "Yes" | "No",
    "showTag": "Yes" | "No"
  }[]

  const meta = (experiments?.find((ex: ExperimentMeta) => ex.id == experimentName) as undefined | ExperimentMeta)
  if (!experiments || !meta || !users) {
    return {
      notFound: true,
      revalidate: 15 * 60
    }
  }

  try {
    const output = JSON.parse((await readFile(`./data/output/${meta.template}.json`)).toString()) as {user: string, stats: [number, number][]}[]
    const data: ExperimentData[] = output.map(o => {
      const user = users.find(u => u.dbFile.fileId + ".json" == o.user)
      return {
        nickname: user?.showTag ? user?.discord : "Anonymous",
        affiliation: user?.affiliation || "Unaffiliated",
        stats: o.stats,
        ar: parseInt(user?.arXP ?? "0") + level[parseInt(user?.arLvl ?? "0")]
      }
    })

    return {
      props: {
        meta,
        data
      },
      revalidate: 60 * 60 * 1
    }
  } catch (error) {
    return {
      notFound: true,
      revalidate: 15 * 60
    }
  }
}

export async function getStaticPaths(): Promise<GetStaticPathsResult> {
  const experiments = JSON.parse((await readFile("./data/experiments.json")).toString())

  return {
    paths: experiments?.map((g: ExperimentMeta) => ({
      params: { experiment: g.id }
    })) ?? [],
    fallback: "blocking"
  }
}
