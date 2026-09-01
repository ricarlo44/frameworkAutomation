import { expect, test } from '@playwright/test';

test.describe('auth: login', () => {
  test('logging in with valid credentials succeeds with an access token', async ({ request }) => {
    const response = await request.post('/auth/login', {
      data: { username: 'emilys', password: 'emilyspass' },
    });
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.accessToken).toBeTruthy();
    expect(body.username).toBe('emilys');
  });

  test('logging in with the wrong password is rejected with 400 and a clear error', async ({ request }) => {
    const response = await request.post('/auth/login', {
      data: { username: 'emilys', password: 'wrong-password' },
    });
    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.message).toBe('Invalid credentials');
  });

  test('logging in with a username that does not exist is rejected the same way', async ({ request }) => {
    // Same generic message as a wrong password -- doesn't leak whether the
    // username or the password was the problem, worth locking in explicitly.
    const response = await request.post('/auth/login', {
      data: { username: 'a_user_that_does_not_exist', password: 'whatever' },
    });
    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.message).toBe('Invalid credentials');
  });
});
