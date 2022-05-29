import { readFile } from "fs/promises"
import { GetStaticPropsContext, GetStaticPropsResult } from "next"
import Head from "next/head"
import FormattedLink from "../components/FormattedLink"
import Main from "../components/Main"
import { ExperimentMeta } from "../utils/types"

interface Props {
  experiments: ExperimentMeta[]
}

export default function MainPage({ location, experiments }: Props & { location: string }) {
  const desc = "The GUOBA Project intends to map out how the artifacts of players perform to improve mathematical models/artifact standards for calculations such as the KQMS."
  return (
    <Main>
    <Head>
      <title>The GUOBA Project</title>
      <meta name="twitter:card" content="summary" />
      <meta property="og:title" content="The GUOBA Project" />
      <meta property="og:description" content={desc} />
      <meta name="description" content={desc} />
    </Head>

    <h1 className="text-5xl font-bold pb-2">
      The GUOBA Project
    </h1>

    <h3 className="text-2xl font-bold pt-1" id="about">Submitting data</h3>
    <div className="font-bold text-xl text-red-700 dark:text-red-400">Note: The form will close when the 2.7 maintenance starts.</div>
    <p>
      Submit your own data <FormattedLink href="https://forms.gle/Gv8rd5XEjH3GzhE36"
            target="form">here</FormattedLink>.
    </p>
    <p>
     <b>Instructions: </b>
      Enter your artifacts (and optionally, weapon and character data) into <FormattedLink href="https://frzyc.github.io/genshin-optimizer/"
      target="go">Genshin Optimizer</FormattedLink> by either manually entering them (not recommended) or via some scanner (read <FormattedLink
      href="https://frzyc.github.io/genshin-optimizer/#/scanner" target="go-scan">GenshinOptimizer&apos;s scanner page</FormattedLink> for more information).
      Next, a GOOD export can be taken via the <FormattedLink href="https://frzyc.github.io/genshin-optimizer/#/setting"
      target="go-setting">Settings</FormattedLink> page under <i>Database Download</i>.
    </p>

    <h3 className="text-2xl font-bold pt-1" id="about">About &lsquo;The GUOBA Project&rsquo;</h3>
    <p>This is a project to map out how the artifacts of players perform to improve mathematical models/artifact standards for calculations.
      The problem with simulating artifacts is that it&apos;s hard to verify if results that come from them are correct. Players have different
      strategies when selecting which domain to farm/which artifact to upgrade/which to trash. For example, the first experiment we&apos;ll do with
      this data is map out ER vs EM for a four piece Viridescent Venerer set.</p>

    <h3 className="text-2xl font-bold pt-1" id="experiments">List of Experiments</h3>
    <List experiments={experiments.filter(x => !x.archived)} location={location} />

    <details>
        <summary className="text-xl font-bold pt-1" id="archived-experiments">Archived Experiments</summary>
        <List experiments={experiments.filter(x => x.archived)} location={location} />
    </details>

    </Main>
  )
}
function List({ experiments, location }: { experiments: ExperimentMeta[], location: string}) {
  return <ul>
    {experiments.map(experiment => (<li key={experiment.name}>
      -{" "}
      <FormattedLink href={`/${experiment.id}`} location={location} className="font-semibold text-l">
        {experiment.name}
      </FormattedLink>
    </li>))}
  </ul>
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
