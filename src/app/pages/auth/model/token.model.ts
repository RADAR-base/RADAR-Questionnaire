export interface KeycloakToken {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  id_token: string;
  not_before_policy: any;
  session_state: string;
  scope: any
}

export interface AccessToken extends KeycloakToken{
  iat: number;
}