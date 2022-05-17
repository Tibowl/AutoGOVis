import { readFile } from "fs/promises"
import { GetStaticPropsContext, GetStaticPropsResult } from "next"
import Head from "next/head"
import FormattedLink from "../components/FormattedLink"
import Main from "../components/Main"
import { ExperimentMeta } from "../utils/types"

interface Props {
  experiments: ExperimentMeta[]
}

export default function Experiments({ location, experiments }: Props & { location: string }) {
  const desc = "List of GUOBA Experiments."
  return (
    <Main>
    <Head>
      <title>Experiments | Wicked</title>
      <meta name="twitter:card" content="summary" />
      <meta property="og:title" content="Experiments | Wicked" />
      <meta property="og:description" content={desc} />
      <meta name="description" content={desc} />
    </Head>

    <h1 className="text-5xl font-bold pb-2">
      Experiments
    </h1>

    <ul>
      {experiments.map(experiment => (<li key={experiment.name}>
        -{" "}
        <FormattedLink href={`/${experiment.id}`} location={location} className="font-semibold text-xl">
          {experiment.name}
        </FormattedLink>
      </li>))}
    </ul>

    </Main>
  )
}

export async function getStaticProps(context: GetStaticPropsContext): Promise<GetStaticPropsResult<Props>> {
  const experiments = JSON.parse((await readFile("./data/experiments.json")).toString())

  return {
    props: {
      experiments
    },
    revalidate: 60 * 60 * 2
  }
}
