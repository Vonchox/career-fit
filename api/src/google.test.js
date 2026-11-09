const { test } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const jwt = require("jsonwebtoken");
const { createGoogleRouter } = require("./routes/google");
test("Google verifies nonce and identity, refuses silent email linking and links only authenticated matching accounts", async (t) => {
  const users = [
    {
      id: "existing",
      email: "existing@example.com",
      nombre: "Existing",
      passwordHash: "hash",
      googleSub: null,
    },
  ];
  let identity,
    verifyCalls = 0;
  const database = {
    usuario: {
      findUnique: async ({ where }) =>
        users.find((user) =>
          Object.entries(where).every(([key, value]) => user[key] === value),
        ) || null,
      create: async ({ data }) => {
        const user = { id: "new", ...data };
        users.push(user);
        return user;
      },
      update: async ({ where, data }) => {
        const user = users.find((u) => u.id === where.id);
        Object.assign(user, data);
        return user;
      },
    },
  };
  const app = express();
  app.use(express.json());
  app.use(
    "/auth",
    createGoogleRouter({
      database,
      clientId: "test-client",
      verifyGoogle: async (token, audience) => {
        verifyCalls++;
        assert.equal(audience, "test-client");
        if (token === "forged") throw new Error("invalid signature");
        return identity;
      },
    }),
  );
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}/auth`,
    headers = { "Content-Type": "application/json" };
  const challenge = await (await fetch(url + "/google/challenge")).json();
  identity = {
    sub: "google-user",
    email: "new@example.com",
    email_verified: true,
    name: "New user",
    nonce: challenge.nonce,
  };
  const post = (credential = "valid", path = "/google", extra = {}) =>
    fetch(url + path, {
      method: "POST",
      headers: { ...headers, ...extra },
      body: JSON.stringify({ credential, challenge: challenge.challenge }),
    });
  assert.equal((await post("forged")).status, 401);
  identity.nonce = "wrong";
  assert.equal((await post()).status, 401);
  identity.nonce = challenge.nonce;
  identity.email_verified = false;
  assert.equal((await post()).status, 401);
  identity.email_verified = true;
  const created = await (await post()).json();
  assert.equal(created.user.googleLinked, true);
  assert.equal(users.length, 2);
  assert.equal(users[1].passwordHash, undefined);
  assert.equal((await (await post()).json()).user.id, "new");
  assert.equal(users.length, 2);
  identity = {
    ...identity,
    sub: "another-google",
    email: "existing@example.com",
  };
  assert.equal((await post()).status, 409);
  assert.equal(users[0].googleSub, null);
  assert.equal((await post("valid", "/google/link")).status, 401);
  const auth = {
    Authorization: `Bearer ${jwt.sign({ userId: "existing" }, process.env.JWT_SECRET || "super-secret-key-for-dev")}`,
  };
  identity.email = "wrong@example.com";
  assert.equal((await post("valid", "/google/link", auth)).status, 409);
  identity.email = "existing@example.com";
  assert.equal((await post("valid", "/google/link", auth)).status, 200);
  assert.equal(users[0].googleSub, "another-google");
  assert.ok(verifyCalls > 0);
});
test("Google configuration is explicit when client ID is absent", async (t) => {
  const app = express();
  app.use(createGoogleRouter({ database: {}, clientId: "" }));
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}`;
  assert.equal(
    (await (await fetch(url + "/config")).json()).googleClientId,
    null,
  );
  assert.equal((await fetch(url + "/google/challenge")).status, 503);
});
