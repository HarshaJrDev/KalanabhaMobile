export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  // Unique per issuance. JWT `iat` only has second-level resolution, so
  // without this, two tokens signed for the same user within the same
  // wall-clock second are byte-identical — which silently breaks refresh
  // token rotation/revocation (a "revoked" token is indistinguishable from
  // the current one). See TokenService.signAccessToken/signRefreshToken.
  jti?: string;
}
