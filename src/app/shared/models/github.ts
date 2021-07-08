export interface GithubTree {
  sha: string
  tree: GithubTreeChild[]
  truncated: boolean
  url: string
}

export interface GithubTreeChild {
  mode: string
  path: string
  sha: string
  size: number
  type: string
  url: string
}

export interface GithubContent {
  content: string
  encoding: string
  node_id: string
  sha: string
  size: number
  url: string
}

export enum GithubFetchStrategy {
  DEFAULT = 'default',
  APP_SERVER = 'appserver'
}
