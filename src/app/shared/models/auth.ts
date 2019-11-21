export interface KeycloakConfig {
  authServerUrl: string,
  realm: string,
  clientId: string,
  redirectUri: string,
  realmUrl?: string
  credentials?: any
}

export interface YesOrNoQuestion {
  isAnswered: boolean
  answer: boolean
  question: string
  questionId: number
}

export interface ConsentPageItem {
  title: string
  iconMd: string
  detail: string[]
}

