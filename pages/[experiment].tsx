import {
    BarElement, CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip
} from "chart.js"
import Color from "color"
import { readFile } from "fs/promises"
import { GetStaticPathsResult, GetStaticPropsContext, GetStaticPropsResult } from "next"
import Head from "next/head"
import { useEffect, useState } from "react"
import { Scatter } from "react-chartjs-2"
import FormattedLink from "../components/FormattedLink"
import Main from "../components/Main"
import { ExperimentData, ExperimentMeta } from "../utils/types"
import styles from "./style.module.css"

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
    next?: ExperimentMeta,
    meta: ExperimentMeta,
    prev?: ExperimentMeta,
    data: ExperimentData[]
}

const UNSELECTED = "Select..."
export default function Experiment({ location, meta, data, next, prev }: Props & { location: string }) {
    const desc = `Visualization for the ${meta.name} experiment for the GUOBA project. The GUOBA Project intends to map out how the artifacts of players perform to improve mathematical models/artifact standards for calculations such as the KQMS.`

    const [showLines, setShowLines] = useState(true)
    const [randomColors, setRandomColors] = useState(true)
    const [showSpecialData, setShowSpecialData] = useState(true)
    const [showPercentiles, setShowPercentiles] = useState(false)
    const [showBoth, setShowBoth] = useState(false)
    const [markedUser, setMarkedUser] = useState(UNSELECTED)
    const [minimumX, setMinimumX] = useState(0)
    const [percentiles, setPercentiles] = useState([5, 25, 50, 75, 95])

    let shownData = data
    if (showPercentiles && !showBoth)
      shownData = [...data.filter(x => x.nickname == markedUser), ...getPercentiles(data, meta, percentiles)]
    else if (showBoth)
      shownData = [...data, ...getPercentiles(data, meta, percentiles)]

    return (
      <Main>
        <Head>
          <title>{meta.name} | The GUOBA Project</title>
          <meta name="twitter:card" content="summary" />
          <meta property="og:title" content={`${meta.name} | The GUOBA Project`} />
          <meta property="og:description" content={desc} />
          <meta name="description" content={desc} />
        </Head>

        <h2 className="font-semibold">
          <FormattedLink href="/#experiments" location={location} className="font-semibold text-lg">
            Experiments
          </FormattedLink>
        </h2>

        <h1 className="text-3xl font-bold pb-0">
            Experiment: {meta.name}
        </h1>
        <div className="flex justify-between text-base pb-1">
          <div className="px-1">
            {prev && <FormattedLink href={`/${prev.id}`} location={location} className="font-bold text-base">
              &larr; {prev.name}
            </FormattedLink>}
          </div>

          <div>
            {next && <FormattedLink href={`/${next.id}`} location={location} className="font-bold text-base">
                {next.name} &rarr;
              </FormattedLink>}
          </div>
        </div>

        {meta.archived && <>
            <h3 className="text-4xl font-bold pt-1 text-red-700 dark:text-red-400" id="archived">Archived</h3>
            <p>This template has been archived and will most likely no longer receive updates in the future.</p>
        </>}

        {meta.note && <>
            <h3 className="text-2xl font-bold pt-1" id="archived">Note</h3>
            <p>{meta.note}</p>
        </>}

        <h3 className="text-lg font-bold pt-1" id="template">Template</h3>
        <p>The template with assumptions for this experiment can be found on <FormattedLink href={`https://github.com/Tibowl/AutoGO/blob/master/templates/${meta.template ?? meta.id}.json`} target="github">GitHub</FormattedLink>.</p>

        <h3 className="text-lg font-bold pt-1" id="results">Results</h3>
        <CheckboxInput label="Show lines" set={setShowLines} value={showLines} />
        {meta.special && <CheckboxInput label="Show special data" set={setShowSpecialData} value={showSpecialData} />}
        <CheckboxInput label="Randomize colors" set={setRandomColors} value={randomColors} />
        <CheckboxInput label="Show percentiles" set={setShowPercentiles} value={showPercentiles} />
        {showPercentiles && <CheckboxInput label="Show both users and percentiles" set={setShowBoth} value={showBoth} />}
        {showPercentiles && <NumberInputList label="Shown percentiles" set={setPercentiles} value={percentiles} defaultValue={50} min={0} max={100} />}
        <SelectInput label="Focused user" set={setMarkedUser} value={markedUser} options={[
          UNSELECTED,
          ...(meta.special && showSpecialData ? (Object.keys(meta.special).length == 1 ? Object.keys(meta.special) : ["Specials"]) : []),
          ...(showPercentiles ? ["Percentiles"] : []),
          ...data.map(x => x.nickname).sort()
        ]} />
        <UserGraph data={shownData} showLines={showLines} meta={meta} randomColors={randomColors} markedUser={markedUser} showSpecialData={showSpecialData} />
        <button className="bg-blue-600 disabled:bg-gray-900 text-slate-50 disabled:text-slate-400 w-fit px-3 py-1 text-center rounded-lg mt-2 cursor-pointer float-right" onClick={() => exportCSV(meta, data)}>Export to .csv</button>
        {!meta.oneShot && <NumberInput label={`Minimum ${meta.x}`} set={setMinimumX} value={minimumX} />}
        <div className="clear-both"></div>
        <Leaderboard data={data} markedUser={markedUser} meta={meta} minimumX={minimumX} />

        <h3 className="text-lg font-bold pt-1" id="disclaimer">Disclaimer</h3>
        <p>This data is gathered from the GUOBA project. Submit your own data <FormattedLink
            href="https://forms.gle/Gv8rd5XEjH3GzhE36"
            target="form">here</FormattedLink>. Please refer to the <FormattedLink href="/">homepage</FormattedLink> for more information.
        </p>
      </Main>
    )
}

function UserGraph({ meta, data, showLines, randomColors, showSpecialData, markedUser }: { meta: ExperimentMeta, data: ExperimentData[], showLines: boolean, randomColors: boolean, showSpecialData: boolean, markedUser: string }) {
  const datasets = (meta.special && showSpecialData) ? Object.entries(meta.special).map(([label, data]) => ({
    label,
    ...getColor({ affiliation: "dn", "ar": -1, "nickname": label, "stats": [] }, randomColors, markedUser),
    showLine: true,
    data: data.map(([x, y]) => ({ x, y }))
  })) : []

  datasets.push(...data.map(d => ({
    label: d.nickname,
    data: meta.oneShot && d.ar > 0 ? [{ x: d.ar, y: Math.max(...d.stats.map(([_x, y]) => y)) }] : d.stats.map(([x, y]) => ({ x, y })),
    showLine: showLines,
    ...getColor(d, randomColors, markedUser)
  })).sort((a, b) => a.label.localeCompare(b.label)))

  return <div className="w-full bg-slate-800 rounded-xl p-1 my-2 md:my-0 text-white col-start-2">
    <Scatter data={({
        datasets: datasets.map(x => ({ ...x, stepped: "after" }))
      })} options={({
        color: "white",
        backgroundColor: "#333333",
        interaction: {
          mode: "point",
          intersect: false
        },
        scales: {
          yAxes: {
            ticks: {
              color: "white"
            },
            grid: {
              color: "rgb(52,71,102)"
            },
            title: {
              display: true,
              color: "rgb(160,160,160)",
              text: meta.y
            }
          },
          xAxes: {
            ticks: {
              color: "white"
            },
            grid: {
              color: "rgb(52,71,102)"
            },
            title: {
              display: true,
              color: "rgb(160,160,160)",
              text: meta.oneShot ? "Total Adventure XP" : meta.x
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (ti) => `${ti.dataset.label} (${ti.label}, ${ti.formattedValue})`
            }
          }
        }
      })} />
  </div>
}

function Leaderboard({ data, meta, markedUser, minimumX }: {data: ExperimentData[], meta: ExperimentMeta, markedUser: string, minimumX: number}) {
  return <table className={`table-auto w-full ${styles.table} my-2 sm:text-base text-sm`}>
  <thead>
    <tr className="divide-x divide-gray-200 dark:divide-gray-500">
      <th>#</th>
      <th>Name</th>
      <th>Total Adventure XP</th>
      <th>Affiliation</th>
      {!meta.oneShot && <th>{meta.x ?? "x"}</th>}
      <th>{meta.y ?? "y"}</th>
    </tr>
  </thead>
  <tbody className="divide-y divide-gray-200 dark:divide-gray-500">
    {data
      .map(c => ({
        nickname: c.nickname,
        ar: c.ar,
        affiliation: c.affiliation,
        bestStats: c.stats.find(x => meta.oneShot || x[0] >= minimumX)
      }))
      .sort((a, b) => {
        const statA = a?.bestStats?.[1]
        if (statA == undefined) return 1

        const statB = b?.bestStats?.[1]
        if (statB == undefined) return -1

        return statB - statA
      })
      .map((c, i) => <tr className={`pr-1 divide-x divide-gray-200 dark:divide-gray-500 ${markedUser == c.nickname ? "font-bold" : ""}`} key={i}>
        <td>#{i+1}</td>
        <td>{c.nickname}</td>
        <td>{c.ar.toLocaleString()}</td>
        <td>{c.affiliation}</td>
        {!meta.oneShot && <td>{c.bestStats?.[0]?.toLocaleString() ?? "---"}</td>}
        <td>{c.bestStats?.[1]?.toLocaleString() ?? "---"}</td>
      </tr>)}
  </tbody>
</table>
}

function CheckboxInput({ value, set, label }: { value: boolean, set: (newValue: boolean) => unknown, label: string }) {
  return <div><label>
    {label}
    <input
      className="bg-slate-200 dark:bg-slate-800 rounded-lg px-2 ml-2 mt-1 focus:ring-indigo-500 focus:border-indigo-500"
      checked={value}
      onChange={(e) => set(e.target.checked)}
      type="checkbox"
    />
  </label></div>
}

function SelectInput({ value, set, label, options }: { value: string, set: (newValue: string) => unknown, options: string[], label: string }) {
  return <div><label>
    {label}
    <select
      value={value}
      onChange={e => set(e.target.value)}
      className="mt-1 ml-2 mb-2 py-0.5 px-2 border border-gray-300 bg-slate-200 dark:bg-slate-800 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
    >
      {options.map(opt => <option key={opt}>{opt}</option>)}
    </select>
  </label></div>
}

function NumberInput({ value, set, label, min, max }: { value: number, set: (newValue: number) => unknown, label: string, min?: number, max?: number }) {
  return <div><label>
    {label}
    <input
      className="bg-slate-200 sm:w-32 w-24 dark:bg-slate-800 rounded-lg px-2 ml-2 mt-1 focus:ring-indigo-500 focus:border-indigo-500"
      value={value}
      onChange={(e) => {
        const value = +e.target.value
        set(min && value < min ? min : max && value > max ? max : value)
      }}
      min={min}
      max={max}
      type="number"
    />
    <button className={`${value == min ? "bg-slate-800 text-slate-50": "bg-red-500 text-slate-50 cursor-pointer"} text-center rounded-lg px-1 inline-block ml-2 md:sr-only`} tabIndex={-1}  onClick={() => (min == undefined || value > min) ? set(value - 1) : void 0}>Subtract 1</button>
    <button className={`${value == max ? "bg-slate-800 text-slate-50": "bg-green-500 text-slate-50 cursor-pointer"} text-center rounded-lg px-1 inline-block ml-2 md:sr-only`}  tabIndex={-1}  onClick={() => (max == undefined || value < max) ? set(value + 1) : void 0}>Add 1</button>

  </label></div>
}

function NumberInputList({ value, set, label, defaultValue, min, max }: { value: number[], set: (newValue: number[]) => unknown, label: string, defaultValue: number, min?: number, max?: number }) {
  const [target, setTarget] = useState(defaultValue)

  function add(v: number) {
    const newValue = [...value, v].sort((a, b) => a-b).filter((v, i, a) => a.indexOf(v) == i)
    set(newValue)
  }
  function remove(v: number) {
    set(value.filter(v2 => v != v2))
  }

  return <div><label>
    {label}
    <input
      className="bg-slate-200 sm:w-32 w-24 dark:bg-slate-800 rounded-lg px-2 ml-2 mt-1 focus:ring-indigo-500 focus:border-indigo-500"
      min={min}
      max={max}
      value={target}
      onChange={(e) => {
        const value = +e.target.value
        setTarget(min && value < min ? min : max && value > max ? max : value)
      }}
      onKeyDown={e => {
        if (e.key == "Enter") {
          e.preventDefault()
          add(parseInt(e.currentTarget.value))
        }
      }}
      type="number"
    />
    <button className={"bg-green-500 text-slate-50 cursor-pointer text-center rounded-lg px-1 inline-block ml-2"}  tabIndex={-1}  onClick={() => add(target)}>Add {target}</button>
    {value.map(v => <button key={v} className={"bg-red-500 text-slate-50 cursor-pointer text-center rounded-lg px-1 inline-block ml-2"}  tabIndex={-1}  onClick={() => remove(v)}>Remove {v}</button>)}


  </label></div>
}


function getPercentiles(data: ExperimentData[], meta: ExperimentMeta, percents: number[]): ExperimentData[] {
  const percentiles: {
    percentile: number,
    stats: [number, number][]
  }[] = percents.map(i => ({ percentile: i, stats: [] }))

  let xValues = data.flatMap(x => x.stats.map(x => x[0])).filter((v, i, a) => a.indexOf(v) == i).sort()

  if (meta.oneShot)
    xValues = [Math.min(...data.map(x => x.ar)), Math.max(...data.map(x => x.ar))]

  xValues.forEach(x => {
    const values = data.map(u => u.stats.find(s => s[0] >= x || meta.oneShot)).sort((a, b) => (b?.[1] ?? 0) - (a?.[1] ?? 0))

    percentiles.forEach(p => {
      const value = values[Math.floor(values.length * p.percentile / 100)]
      if (value == undefined) return
      if (p.stats.length > 1 && p.stats[p.stats.length - 1]?.[1] == value?.[1])
        p.stats.pop()
      p.stats.push([x, value[1]])
    })
  })

  return percentiles.map(p => ({
      affiliation: "percentile",
      ar: -1,
      nickname: `${p.percentile}%`,
      stats: p.stats
    }))
}


function getColor(data: ExperimentData, randomColors: boolean, markedUser: string) {
  if (data.nickname == "KQMS") return {
    borderColor: "#9b4fd1",
    backgroundColor: "#d9b8ef",
    borderWidth: data.nickname == markedUser ? 4 : undefined,
    segment: { borderColor: "#9b4fd1" }
  }

  let base = Color({ r: 201, g: 201, b: 201 }) // gray
  switch(data.affiliation) {
    case "KQM Abyss":
      base = Color({ r: 177, g: 99, b: 255 }) // purple
      break
    case "KQM Theorycraft":
      base = Color({ r: 255, g: 99, b: 99 }) // red
      break
    case "KQM Leaks":
      base = Color({ r: 99, g: 138, b: 255 }) // dark blue
      break
    case "KQM Guhua":
      base = Color({ r: 99, g: 255, b: 255 }) // light blue
      break
    case "Genshin Optimizer":
      base = Color({ r: 255, g: 216, b: 99 }) // yellow
      break
    case "TTDS Mains":
      base = Color({ r: 255, g: 99, b: 216 }) // pink
      break
    // unused Color({ r: 99, g: 255, b: 138 }): green2
  }

  if (data.nickname == "Artesians#0002") {
    base = Color("#423B17").lighten(.4)
    randomColors = false
  }

  let mult = .2

  if (markedUser == UNSELECTED) {
    if (data.ar < 0 && data.affiliation == "percentile")
      mult = 1.3
    else
      mult = 0.5
  } else if (data.nickname == markedUser)
    mult = 2

  if (data.ar < 0) {
    base = Color({ r: 177, g: 255, b: 99 }) // specials
    if (data.affiliation == "percentile") {
      base = Color({ r: 99, g: 255, b: 255 }).darken(parseInt(data.nickname.replace("%", "")) / 150)
      randomColors = false
      if (markedUser == "Percentiles")
        mult = 2
    } else if (markedUser == "Specials")
      mult = 2
  }

  const a = randomColors ? (Math.random() - 0.5) * 0.6 : 0
  const b = randomColors ? (Math.random() - 0.5) * 0.4 : 0
  const c = randomColors ? (Math.random() - 0.5) * 15  : 0


  return {
    backgroundColor: applyColor(base, a, b, c, 0.6 * mult),
    borderColor: applyColor(base, a, b, c, 1.2 * mult),
    borderWidth: data.nickname == markedUser ? 5 : undefined,
    segment: { borderColor: applyColor(base, a, b, c, .25 * mult) }
  }
}

function applyColor(base: Color, randomness1: number, randomness2: number, randomness3: number, alpha: number) {
  return base
    .lighten(randomness1)
    .desaturate(randomness2)
    .hue(base.hue() + randomness3)
    .alpha(alpha)
    .toString()
}

function exportCSV(meta: ExperimentMeta, data: ExperimentData[]) {
  const file = {
    mime: "text/plain",
    filename: `${meta.outputFile?.replace(/\//g, "-") ?? meta.template ?? meta.id}.csv`,
    contents: "user,affiliation,ar,x,y\n" +
      data.flatMap(u => u.stats.map(d => `${u.nickname.replace(/,/g, "")},${u.affiliation.replace(/,/g, "")},${u.ar},${d.join(",")}`)).join("\n"),
  }
  const blob = new Blob([file.contents], { type: file.mime }), url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  document.body.appendChild(link) // Firefox requires the link to be in the body
  link.download = file.filename
  link.href = url
  link.click()
  document.body.removeChild(link) // remove the link when done
}

const level = [
  0,
  0, 375, 875, 1500, 2225, 3075, 4025, 5100, 6300, 7600, 9025, 10550, 12200, 13975, 15850, 17850, 20225, 22725, 25350, 28125,
  30950, 34375, 38100, 42100, 46400, 50975, 55850, 61000, 66450, 72175, 78200, 84500, 91100, 98000, 105175, 112650, 120400, 128450, 136775, 145400,
  155950, 167475, 179950, 193400, 207800, 223150, 239475, 256750, 275000, 294200, 320600, 349400, 380600, 414200, 450200, 682550, 941500, 1227250, 1540075, 1880200
]

export async function getStaticProps(context: GetStaticPropsContext): Promise<GetStaticPropsResult<Props>> {
  try {
    const experimentName = context.params?.experiment
    const experiments = JSON.parse((await readFile("./data/experiments.json")).toString()) as ExperimentMeta[] | undefined
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

    const meta = (experiments?.find(ex => ex.id == experimentName) as undefined | ExperimentMeta)
    if (!experiments || !meta || !users) {
      return {
        notFound: true,
        revalidate: 15 * 60
      }
    }
    const index = experiments.indexOf(meta)
    const next = experiments[index + 1] ?? null
    const prev = experiments[index - 1] ?? null

    const output = JSON.parse((await readFile(`./data/output/${meta.outputFile ?? meta.template ?? meta.id}.json`)).toString()) as {user: string, stats: [number, number][]}[]
    let i = 0
    const data: ExperimentData[] = output.map(o => {
      const user = users.find(u => u.dbFile.fileId + ".json" == o.user)
      return {
        nickname: (user?.showTag == "Yes") ? user?.discord : `Anonymous #${++i}`,
        affiliation: user?.affiliation || "Unaffiliated",
        stats: o.stats,
        ar: parseInt(user?.arXP ?? "0") + level[parseInt(user?.arLvl ?? "0")]
      }
    }).sort((a, b) => a.nickname.localeCompare(b.nickname))

    return {
      props: {
        prev,
        next,
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
