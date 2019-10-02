export interface KeycloakConfig {
  authServerUrl: string,
  realm: string,
  clientId: string,
  redirectUri: string,
  realmUrl?: string
  credentials?: any
}
