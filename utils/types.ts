export interface ExperimentMeta {
  name: string
  note: string
  id: string
  template?: string
  archived?: true
  outputFile?: string
  oneShot: boolean
  x?: string
  y?: string
  special?: {
    [name: string]: [number, number][]
  }
}

export interface ExperimentData {
  nickname: string
  stats: [number, number][]
  affiliation: string
  ar: number
}
