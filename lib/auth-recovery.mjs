export function getRequestedAuthMode(search) {
  const params = new URLSearchParams(search);
  return params.get('mode') === 'recovery' ? 'recovery' : 'signin';
}

export function buildPasswordRecoveryRedirect(origin) {
  const callbackUrl = new URL('/auth/callback', origin);
  callbackUrl.searchParams.set('next', '/auth/update-password');
  return callbackUrl.toString();
}
