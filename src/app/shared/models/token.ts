export interface OAuthToken {
  expires_in?: number
  iat?: number
  refresh_token?: string
  access_token?: string
}

export interface MetaToken {
  refreshToken?: string
  baseUrl?: string
}
