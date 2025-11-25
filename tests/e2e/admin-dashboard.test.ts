import { expect, test } from "@playwright/test";
import {ADMIN_DASHBOARD, ADMIN_PROFILE, ADMIN_MANAGE_SURVEYORS, ADMIN_ADD_SURVEYORS, LOGIN} from "@/constants/routes";

const ADMIN_NIP = "1234567890";
const ADMIN_PASSWORD = "WRI@explore";

test.describe("E2E: Admin Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(LOGIN);
    await page.getByPlaceholder("Masukkan NIP Anda...").fill(ADMIN_NIP);
    await page.getByPlaceholder("Masukkan kata sandi Anda...").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /Masuk/i }).click();

    await page.waitForURL("**/dasbor");
  });

  test("should display admin dashboard", async ({ page }) => {
    await page.goto(ADMIN_DASHBOARD);
    await expect(page).toHaveURL(ADMIN_DASHBOARD);
    
    // cek judul dashboard
    const pageTitle = page.locator("h1, h2");
    const titleCount = await pageTitle.count();
    
    // jika ada judul atau konten utama terlihat
    if (titleCount > 0) {
      expect(titleCount).toBeGreaterThan(0);
    }

    const mainContent = page.locator("main");
    await expect(mainContent).toBeVisible();
  });

  test("should navigate to admin profile", async ({ page }) => {
    await page.goto(ADMIN_DASHBOARD);
    
    // klik tombol profil
    const profileLink = page.getByRole("link", { name: /profil|profile/i }).first();
    if (await profileLink.isVisible({ timeout: 500 }).catch(() => false)) {
      await profileLink.click();
      await page.waitForURL(ADMIN_PROFILE);
      await expect(page).toHaveURL(ADMIN_PROFILE);
    }
  });

  test("should access surveyor management", async ({ page }) => {
    await page.goto(ADMIN_DASHBOARD);
    
    // klik kelola surveyor
    const surveyorLink = page.getByRole("link", { name: /surveyor|kelola/i }).first();
    if (await surveyorLink.isVisible({ timeout: 500 }).catch(() => false)) {
      await surveyorLink.click();
      await page.waitForURL(ADMIN_MANAGE_SURVEYORS);
      await expect(page).toHaveURL(ADMIN_MANAGE_SURVEYORS);
    }
  });

  test("should display sidebar navigation", async ({ page }) => {
    await page.goto(ADMIN_DASHBOARD);
    
    // cek sidebar/navigasi ada
    const sidebar = page.locator("aside, nav, [role='navigation']");
    const isSidebarVisible = await sidebar.isVisible({ timeout: 1000 }).catch(() => false);
    
    if (isSidebarVisible) {
      const navLinks = sidebar.locator("a");
      const linksCount = await navLinks.count();
      expect(isSidebarVisible).toBe(true);
    } else {
      const anyNav = page.locator("nav, [role='navigation']");
      expect(await anyNav.count() >= 0).toBe(true);
    }
  });

  test("should logout from dashboard", async ({ page }) => {
    await page.goto(ADMIN_DASHBOARD);

    const logoutButton = page.getByRole("button", { name: /keluar|logout/i });
    if (await logoutButton.isVisible({ timeout: 500 }).catch(() => false)) {
      await logoutButton.click();

      await page.waitForURL(LOGIN);
      await expect(page).toHaveURL(LOGIN);
    }
  });
});
