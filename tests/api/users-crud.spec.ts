import { expect, test } from '@playwright/test';

test.describe('users: create, update, delete', () => {
  test('creating a user returns 201 with the fields echoed back and a new id', async ({ request }) => {
    const response = await request.post('/users/add', {
      data: { firstName: 'Muhammad', lastName: 'Ovi', age: 25 },
    });
    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body.firstName).toBe('Muhammad');
    expect(body.lastName).toBe('Ovi');
    expect(body.age).toBe(25);
    expect(body.id).toBeGreaterThan(0);
  });

  test('updating a user returns 200 with only the changed field applied', async ({ request }) => {
    const response = await request.put('/users/2', {
      data: { firstName: 'Anna' },
    });
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.id).toBe(2);
    expect(body.firstName).toBe('Anna');
    // Fields not sent in the request are left untouched, not wiped out.
    expect(body.lastName).toBeTruthy();
  });

  test('deleting a user returns 200 with isDeleted true, not an empty body', async ({ request }) => {
    // Unlike some REST APIs, dummyjson.com's delete is a soft delete: it
    // responds 200 with the full user record plus isDeleted/deletedOn,
    // rather than 204 with no content. Worth asserting explicitly since it
    // is easy to assume the more common 204 convention without checking.
    const response = await request.delete('/users/2');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.id).toBe(2);
    expect(body.isDeleted).toBe(true);
    expect(body.deletedOn).toBeTruthy();
  });
});
