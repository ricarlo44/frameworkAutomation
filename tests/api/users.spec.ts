import { expect, test } from '@playwright/test';

// The store under test (teststore.blassacademy.com) has no backend API of
// its own -- confirmed during exploration: zero XHR/fetch requests across
// login, cart, and checkout. This suite runs against dummyjson.com, a
// public practice API, so the framework has real HTTP/contract coverage to
// show. reqres.in was tried first but its anonymous tier caps at 40
// requests/day, which broke on the very first full run -- see README
// "Why dummyjson.com".

test.describe('users: read', () => {
  test('a known user is returned with the documented fields', async ({ request }) => {
    const response = await request.get('/users/2');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toMatchObject({
      id: 2,
      email: expect.stringContaining('@'),
      firstName: expect.any(String),
      lastName: expect.any(String),
      username: expect.any(String),
    });
  });

  test('the user list is paginated with a consistent total/skip/limit shape', async ({ request }) => {
    const response = await request.get('/users?limit=5');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.limit).toBe(5);
    expect(Array.isArray(body.users)).toBe(true);
    expect(body.users).toHaveLength(5);
    expect(body.total).toBeGreaterThan(body.users.length);
    for (const user of body.users) {
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
    }
  });

  test('a user id that does not exist returns 404 with a clear message', async ({ request }) => {
    const response = await request.get('/users/999999');
    expect(response.status()).toBe(404);

    const body = await response.json();
    expect(body.message).toContain("999999");
  });
});
