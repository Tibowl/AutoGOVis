export interface ExperimentMeta {
  name: string
  id: string
  template: string
  oneShot: boolean
  x?: string
  y?: string
}

export interface ExperimentData {
  nickname: string
  stats: [number, number][]
  affiliation: string
  ar: number
}
