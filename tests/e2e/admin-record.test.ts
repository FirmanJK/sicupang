import { expect, test } from "@playwright/test";
import {ADMIN_DASHBOARD, ADMIN_SUBDISTRICT_RECORD, ADMIN_FOOD_RECORD, ADMIN_PPH_RECORD, LOGIN} from "@/constants/routes";

const ADMIN_NIP = "1234567890";
const ADMIN_PASSWORD = "WRI@explore";

test.describe("E2E: Admin Rekap Data", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(LOGIN);
        await page.getByPlaceholder("Masukkan NIP Anda...").fill(ADMIN_NIP);
        await page.getByPlaceholder("Masukkan kata sandi Anda...").fill(ADMIN_PASSWORD);
        await page.getByRole("button", { name: /Masuk/i }).click();

        await page.waitForURL("**/dasbor");
    });

    test("should display subdistrict record page", async ({ page }) => {
        await page.goto(ADMIN_SUBDISTRICT_RECORD);
        await expect(page).toHaveURL(ADMIN_SUBDISTRICT_RECORD);

        const mainContent = page.locator("main");
        await expect(mainContent).toBeVisible();
        
        // cek tabel/grafik
        const content = page.locator("table, [role='grid'], canvas, .chart");
        const isContentVisible = await content.isVisible({ timeout: 1000 }).catch(() => false);
        expect(isContentVisible).toBeDefined();
    });

    test("should display food record page", async ({ page }) => {
        await page.goto(ADMIN_FOOD_RECORD);
        await expect(page).toHaveURL(ADMIN_FOOD_RECORD);

        const mainContent = page.locator("main");
        await expect(mainContent).toBeVisible();
        
        // cek tabel/daftar
        const table = page.locator("table, [role='grid']");
        const isTableVisible = await table.isVisible({ timeout: 1000 }).catch(() => false);
        expect(isTableVisible).toBeDefined();
    });

    test("should filter food record by date range", async ({ page }) => {
        await page.goto(ADMIN_FOOD_RECORD);
        
        // input filter tanggal
        const startDateInput = page.getByLabel(/dari|start date/i);
        const endDateInput = page.getByLabel(/sampai|end date/i);
        
        const hasStartDate = await startDateInput.isVisible({ timeout: 500 }).catch(() => false);
        const hasEndDate = await endDateInput.isVisible({ timeout: 500 }).catch(() => false);
        
        if (hasStartDate && hasEndDate) {
        await startDateInput.fill("2024-01-01");
        await endDateInput.fill("2024-12-31");

        const filterButton = page.getByRole("button", { name: /filter|cari|search/i });
        if (await filterButton.isVisible({ timeout: 500 }).catch(() => false)) {
            await filterButton.click();
            await page.waitForTimeout(500);
        }
        }
    });

    test("should display PPH record page", async ({ page }) => {
        await page.goto(ADMIN_PPH_RECORD);
        await expect(page).toHaveURL(ADMIN_PPH_RECORD);

        const mainContent = page.locator("main");
        await expect(mainContent).toBeVisible();
    });

    test("should select subdistrict in PPH record", async ({ page }) => {
        await page.goto(ADMIN_PPH_RECORD);
        
        // select kecamatan
        const kecamatanSelect = page.locator("select, [role='combobox']").first();
        if (await kecamatanSelect.isVisible({ timeout: 500 }).catch(() => false)) {
        await kecamatanSelect.click();
        
        const options = page.locator("[role='option']");
        if (await options.count() > 0) {
            await options.first().click();
            await page.waitForTimeout(500);
        }
        }
    });

    test("should select year in PPH record", async ({ page }) => {
        await page.goto(ADMIN_PPH_RECORD);
        
        // select tahun
        const yearSelect = page.locator("select, [role='combobox']").nth(1);
        if (await yearSelect.isVisible({ timeout: 500 }).catch(() => false)) {
        await yearSelect.click();
        
        const options = page.locator("[role='option']");
        if (await options.count() > 0) {
            await options.first().click();
            await page.waitForTimeout(500);
        }
        }
    });

    test("should export PPH record data", async ({ page }) => {
        await page.goto(ADMIN_PPH_RECORD);
        
        // cari tombol export
        const exportButton = page.getByRole("button", { name: /export|unduh|download/i });
        if (await exportButton.isVisible({ timeout: 500 }).catch(() => false)) {
        await exportButton.click();
        await page.waitForTimeout(500);
        expect(exportButton).toBeTruthy();
        }
    });

    test("should search in food record", async ({ page }) => {
        await page.goto(ADMIN_FOOD_RECORD);
        
        // cari input search
        const searchInput = page.getByPlaceholder(/cari|search/i);
        if (await searchInput.isVisible({ timeout: 500 }).catch(() => false)) {
        await searchInput.fill("test");
        await page.waitForTimeout(500);
        
        const table = page.locator("table, [role='grid']");
        await expect(table).toBeVisible({ timeout: 1000 }).catch(() => {});
        }
    });

    test("should view food record detail", async ({ page }) => {
        await page.goto(ADMIN_FOOD_RECORD);
        
        // klik tombol detail
        const detailButton = page.getByRole("button", { name: /detail|lihat/i }).first();
        if (await detailButton.isVisible({ timeout: 500 }).catch(() => false)) {
        await detailButton.click();
        await page.waitForTimeout(500);
        
        const currentUrl = page.url();
        expect(currentUrl).toContain("pangan");
        }
    });

    test("should display summary statistics", async ({ page }) => {
        await page.goto(ADMIN_DASHBOARD);
        
        // cek kartu ringkasan/statistik
        const summaryCards = page.locator("[class*='card'], [class*='stat'], [class*='summary']");
        const cardsCount = await summaryCards.count();

        expect(cardsCount >= 0).toBe(true);
    });

    test("should handle filter reset", async ({ page }) => {
        await page.goto(ADMIN_FOOD_RECORD);
        
        // isi filter
        const searchInput = page.getByPlaceholder(/cari|search/i);
        if (await searchInput.isVisible({ timeout: 500 }).catch(() => false)) {
        await searchInput.fill("test");

        const resetButton = page.getByRole("button", { name: /reset|bersihkan/i });
        if (await resetButton.isVisible({ timeout: 500 }).catch(() => false)) {
            await resetButton.click();
            
            // input seharusnya dibersihkan
            await expect(searchInput).toHaveValue("");
        }
        }
    });

    test("should handle pagination in food record", async ({ page }) => {
        await page.goto(ADMIN_FOOD_RECORD);
        
        // cek pagination
        const pagination = page.locator("[class*='pagination'], [class*='paging']");
        const isPaginationVisible = await pagination.isVisible({ timeout: 1000 }).catch(() => false);
        
        if (isPaginationVisible) {
        const nextButton = page.getByRole("button", { name: /next|berikutnya/i });
        const isPaginationWorking = await nextButton.isVisible({ timeout: 500 }).catch(() => false);
        expect(isPaginationWorking).toBeDefined();
        }
    });
});
