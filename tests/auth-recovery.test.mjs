import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPasswordRecoveryRedirect, getRequestedAuthMode } from '../lib/auth-recovery.mjs';

test('opens recovery mode when the login URL requests it', () => {
  assert.equal(getRequestedAuthMode('?mode=recovery'), 'recovery');
});

test('defaults to sign in for unknown or absent modes', () => {
  assert.equal(getRequestedAuthMode(''), 'signin');
  assert.equal(getRequestedAuthMode('?mode=signup'), 'signin');
});

test('sends password recovery through the PKCE callback to an internal update route', () => {
  const redirect = new URL(buildPasswordRecoveryRedirect('https://happyforge.vercel.app'));
  assert.equal(redirect.origin, 'https://happyforge.vercel.app');
  assert.equal(redirect.pathname, '/auth/callback');
  assert.equal(redirect.searchParams.get('next'), '/auth/update-password');
});
