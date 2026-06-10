import { test, expect, type Page } from "@playwright/test";

// Unique-per-run identities so repeated runs don't collide in the dev DB.
const stamp = Date.now().toString(36);
let seq = 0;

function freshUser() {
  seq += 1;
  const id = `${stamp}_${seq}`;
  return {
    displayName: "E2E Tester",
    username: `e2e_${id}`,
    email: `e2e_${id}@test.dev`,
    password: "password123",
  };
}

// Each call registers a brand-new account so tests never collide on email.
async function signUp(page: Page) {
  const user = freshUser();
  await page.goto("/signup");
  await page.getByPlaceholder("Display name").fill(user.displayName);
  await page.getByPlaceholder("Username").fill(user.username);
  await page.getByPlaceholder("Email").fill(user.email);
  await page.getByPlaceholder("Password (min 8 chars)").fill(user.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/rooms", { timeout: 15_000 });
  return user;
}

test("landing page renders with CTAs", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Watch anything\./i }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse rooms" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Get started" })).toBeVisible();
});

test("sign up → create public room → it opens", async ({ page }) => {
  await signUp(page);

  // Create a public room.
  await page.getByRole("button", { name: "New room" }).click();
  const roomName = `E2E Public ${stamp}`;
  await page.getByPlaceholder(/Room name/).fill(roomName);
  await page.getByRole("button", { name: "Create", exact: true }).click();

  // Lands on the room page (slug route).
  await page.waitForURL(/\/rooms\/.+/, { timeout: 15_000 });

  // The room shell shows either the connecting state or the room header.
  await expect(
    page
      .getByText(/Connecting/i)
      .or(page.getByRole("heading", { name: roomName })),
  ).toBeVisible({ timeout: 15_000 });
});

test("private room: passcode field appears, room is created, owner bypasses gate", async ({
  page,
}) => {
  await signUp(page);

  await page.getByRole("button", { name: "New room" }).click();
  const roomName = `E2E Private ${stamp}`;
  await page.getByPlaceholder(/Room name/).fill(roomName);

  // Toggling private reveals the passcode field.
  const passcode = page.getByPlaceholder(/Passcode/);
  await expect(passcode).toBeHidden();
  await page.getByRole("checkbox").check();
  await expect(passcode).toBeVisible();
  await passcode.fill("secret123");

  await page.getByRole("button", { name: "Create", exact: true }).click();
  await page.waitForURL(/\/rooms\/.+/, { timeout: 15_000 });

  // Owner is auto-admitted (no passcode prompt).
  await expect(page.getByText("Private room")).toBeHidden();
  await expect(
    page
      .getByText(/Connecting/i)
      .or(page.getByRole("heading", { name: roomName })),
  ).toBeVisible({ timeout: 15_000 });
});

test("public room appears in the rooms list", async ({ page }) => {
  await signUp(page);
  await page.getByRole("button", { name: "New room" }).click();
  const roomName = `E2E Listed ${stamp}`;
  await page.getByPlaceholder(/Room name/).fill(roomName);
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await page.waitForURL(/\/rooms\/.+/);

  await page.goto("/rooms");
  await expect(page.getByText(roomName)).toBeVisible({ timeout: 10_000 });
});
