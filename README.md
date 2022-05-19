# AutoGO Visualizer
A visualizer for data produced by AutoGO. Made for [The GUOBA Project](https://dn.hutaobot.moe).

## Running in development mode
Install dependencies with `npm i`. Start development mode with `npm run dev`.

## File setup
Most data is stored in the `data` folder.

The list of experiments to show on the site are listed under `data/experiments.json`. This file contains the human readable names, x/y axis names, the id (used in the URL on visualizer), the template (used to read from in `data/output` and to link to GitHub), special data lines and `oneShot` to show AR instead of the x stored in the output file.

AutoGO's output folder can be copied into the `data` folder as such that a template named `kazuha-er-em` would be stored at `data/output/kazuha-er-em.json`.

A AutoGO name to GUOBA Project Google form export data mapping `users.json` (however the script to generate these requires Google Forms access and thus won't be available). This can be replaced with a placeholder file with just `[]`.
