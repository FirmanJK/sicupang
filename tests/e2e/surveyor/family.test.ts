import { expect, test } from "playwright/test";
import {
  API_SURVEYOR_ADD_DATA_FAMILY,
  API_SURVEYOR_FAMILY,
  LOGIN,
  SURVEYOR_ADD_DATA_FAMILY,
  SURVEYOR_DASHBOARD,
  SURVEYOR_FAMILY,
} from "@/constants/routes";

test.describe("E2E: Alur Tambah Data Keluarga", () => {
  // prettier-ignore
  test.beforeEach(async ({ page }) => {
    await page.goto(LOGIN);
    await page.getByPlaceholder("Masukkan NIP Anda...").fill("198409212017062001");
    await page.getByPlaceholder("Masukkan kata sandi Anda...").fill("21091984");
    await page.getByRole("button", { name: /Masuk/i }).click();
    await page.waitForURL(SURVEYOR_DASHBOARD);
    await expect(page).toHaveURL(SURVEYOR_DASHBOARD);
    await page.goto(SURVEYOR_FAMILY);
    await page.waitForURL(SURVEYOR_FAMILY);
    await expect(page).toHaveURL(SURVEYOR_FAMILY);
    await page.goto(SURVEYOR_ADD_DATA_FAMILY);
    await page.waitForURL(SURVEYOR_ADD_DATA_FAMILY);
  });

  /** Tes Positif */
  // prettier-ignore
  test("should create family data with valid inputs", async ({ page }) => {
    const UNIQUE_NAME = "Budi Santoso " + Math.random().toString(36).substring(2, 5).toUpperCase();
    const UNIQUE_KK = `3501${Math.floor(Math.random() * 900000000000).toString().padStart(12, "0")}`;

    await page.route(`**${API_SURVEYOR_ADD_DATA_FAMILY}`, async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          message: "Data keluarga berhasil ditambahkan.",
        }),
      });
    });

    await page.route("**/api/ingredient-extract", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ingredients: ["Nasi", "Goreng"], status: "ok" }),
        });
      } else {
        route.continue();
      }
    });

    await page.route(`**${API_SURVEYOR_FAMILY}`, async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            family: [
              {
                name: UNIQUE_NAME,
                family_card_number: UNIQUE_KK,
                village: "Saptorenggo - 35.07.18.2012",
                id_family: Math.floor(Math.random() * 1000) + 1,
              },
            ],
          }),
        });
      } else {
        route.continue();
      }
    });

    // Text Input
    await page.getByPlaceholder("Cth. Agus Miftah").fill(UNIQUE_NAME);
    await page.getByPlaceholder("Cth. 1234567890123456").fill(UNIQUE_KK);
    await page.getByPlaceholder("Cth. Perumahan Meikarta").fill("Jl. Merdeka No. 123");
    await page.getByPlaceholder("Cth. 11").nth(0).fill("4");

    // Select Input
    await page.getByRole("button", { name: "Pilih Desa" }).click();
    await page.getByRole("listitem").filter({ hasText: "Saptorenggo" }).click();
    await page.getByRole("button", { name: "Pilih Pendapatan Keluarga" }).click();
    await page.getByRole("listitem").filter({ hasText: "Rp2 juta - Rp3 juta" }).click();
    await page.getByRole("button", { name: "Pilih Pengeluaran Keluarga" }).click();
    await page.getByRole("listitem").filter({ hasText: "Rp1 juta - Rp2 juta" }).click();

    // Radio Input
    await page.getByRole("radio", { name: "Ya" }).first().check();
    await page.getByRole("radio", { name: "Tidak" }).nth(1).check();
    await page.getByRole("radio", { name: "Ya" }).nth(2).check();
    await page.getByLabel("Pilih Gambar").setInputFiles("public/images/favicon.svg");
    await expect(page.getByLabel("Pilih Gambar")).not.toBeVisible();

    // Dynamic Table Input
    await page.getByLabel("Nama Olahan Pangan").fill("Nasi Goreng");
    await page.getByLabel("Porsi").fill("2");
    await page.getByRole("button", { name: "Tambah" }).click();
    await expect(page.getByRole("cell", { name: "Nasi Goreng" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "2 Porsi" })).toBeVisible();
    await page.getByRole("button", { name: "Simpan" }).click();

    await page.goto(SURVEYOR_FAMILY);
    await page.waitForURL(SURVEYOR_FAMILY);

    // Verifikasi bahwa data yang di-mock muncul di tabel
    await expect(page.getByRole("cell", { name: UNIQUE_NAME })).toBeVisible();
  });

  /** Tes Negatif */
  // prettier-ignore
  test("should not create family data with empty inputs", async ({ page }) => {
    await page.getByRole("button", { name: "Simpan" }).click();
    expect(await page.getByLabel("Nama Kepala Keluarga").evaluate((element: HTMLInputElement) => element.validationMessage)).not.toBe("");
    await expect(page).toHaveURL(SURVEYOR_ADD_DATA_FAMILY);
  });

  // prettier-ignore
  test("should display validation errors for empty required text/number inputs", async ({ page }) => {
    await page.getByRole("button", { name: "Simpan" }).click();

    let validationMessage = await page.getByPlaceholder("Cth. Agus Miftah").evaluate((element: HTMLInputElement) => element.validationMessage);
    expect(validationMessage).not.toBe("");

    validationMessage = await page.getByPlaceholder("Cth. 1234567890123456").evaluate((element: HTMLInputElement) => element.validationMessage);
    expect(validationMessage).not.toBe("");

    validationMessage = await page.getByPlaceholder("Cth. Perumahan Meikarta").evaluate((element: HTMLInputElement) => element.validationMessage);
    expect(validationMessage).not.toBe("");

    validationMessage = await page.getByPlaceholder("Cth. 11").nth(0).evaluate((element: HTMLInputElement) => element.validationMessage);
    expect(validationMessage).not.toBe("");

    await expect(page).toHaveURL(SURVEYOR_ADD_DATA_FAMILY);
  });

  // prettier-ignore
  test("should prevent submission if required selects and radios are empty", async ({ page }) => {
    await page.getByPlaceholder("Cth. Agus Miftah").fill("Tester Negatif");
    await page.getByPlaceholder("Cth. 1234567890123456").fill("9999999999999999");
    await page.getByPlaceholder("Cth. Perumahan Meikarta").fill("Alamat Negatif");
    await page.getByPlaceholder("Cth. 11").nth(0).fill("4");

    await page.getByLabel("Pilih Gambar").setInputFiles("public/images/favicon.svg");
    await page.getByRole("button", { name: "Simpan" }).click();
    await expect(page).toHaveURL(SURVEYOR_ADD_DATA_FAMILY, { timeout: 5000 });

    await expect(page.getByRole("button", { name: "Simpan" })).not.toBeDisabled();
  });

  // prettier-ignore
  test("should prevent submission without uploading a photo", async ({ page }) => {
    await page.getByPlaceholder("Cth. Agus Miftah").fill("Tester Foto");
    await page.getByPlaceholder("Cth. 1234567890123456").fill("9999999999999998");
    await page.getByPlaceholder("Cth. Perumahan Meikarta").fill("Alamat Foto");
    await page.getByPlaceholder("Cth. 11").nth(0).fill("4");

    await page.getByRole("button", { name: "Pilih Desa" }).click();
    await page.getByRole("listitem").filter({ hasText: "Saptorenggo" }).click();
    await page.getByRole("button", { name: "Pilih Pendapatan Keluarga" }).click();
    await page.getByRole("listitem").filter({ hasText: "Rp2 juta - Rp3 juta" }).click();
    await page.getByRole("button", { name: "Pilih Pengeluaran Keluarga" }).click();
    await page.getByRole("listitem").filter({ hasText: "Rp1 juta - Rp2 juta" }).click();
    await page.getByRole("radio", { name: "Ya" }).first().check();
    await page.getByRole("radio", { name: "Tidak" }).nth(1).check();
    await page.getByRole("radio", { name: "Ya" }).nth(2).check();

    await page.getByRole("button", { name: "Simpan" }).click();
    await expect(page).toHaveURL(SURVEYOR_ADD_DATA_FAMILY, { timeout: 5000 });
  });

  // prettier-ignore
  test("should display browser validation for missing text and number inputs", async ({ page }) => {
    await page.getByRole("button", { name: "Simpan" }).click();

    // Nama Kepala Keluarga
    let validationMessage = await page.getByPlaceholder("Cth. Agus Miftah").evaluate((element: HTMLInputElement) => element.validationMessage);
    expect(validationMessage).not.toBe("");

    // Nomor Kartu Keluarga
    validationMessage = await page.getByPlaceholder("Cth. 1234567890123456").evaluate((element: HTMLInputElement) => element.validationMessage);
    expect(validationMessage).not.toBe("");

    // Alamat
    validationMessage = await page.getByPlaceholder("Cth. Perumahan Meikarta").evaluate((element: HTMLInputElement) => element.validationMessage);
    expect(validationMessage).not.toBe("");

    // Jumlah Anggota
    validationMessage = await page.getByPlaceholder("Cth. 11").nth(0).evaluate((element: HTMLInputElement) => element.validationMessage);
    expect(validationMessage).not.toBe("");

    await expect(page).toHaveURL(SURVEYOR_ADD_DATA_FAMILY);
  });

  // prettier-ignore
  test("should prevent submission if required selects and radios are missing", async ({ page }) => {
    await page.getByPlaceholder("Cth. Agus Miftah").fill("Tester Negatif Select");
    await page.getByPlaceholder("Cth. 1234567890123456").fill("1111222233334444");
    await page.getByPlaceholder("Cth. Perumahan Meikarta").fill("Jl. Missing Select");
    await page.getByPlaceholder("Cth. 11").nth(0).fill("4");
    await page.getByLabel("Pilih Gambar").setInputFiles("public/images/favicon.svg");
    await expect(page.getByLabel("Pilih Gambar")).not.toBeVisible();

    await page.route(`**${API_SURVEYOR_ADD_DATA_FAMILY}`, async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ message: "Field wajib (select/radio) belum terisi." }),
      });
    });

    await page.getByRole("button", { name: "Simpan" }).click();

    await expect(page).toHaveURL(SURVEYOR_ADD_DATA_FAMILY, { timeout: 5000 });
    await expect(page.getByRole("button", { name: "Simpan" })).not.toBeDisabled();
  });

  // prettier-ignore
  test("should display server error for invalid input format (KK length)", async ({ page }) => {
    const LONG_KK = "12345678901234567"; // 17 digit, melebihi batas 16 di Prisma/Zod

    // Mock POST untuk mengembalikan 400 Bad Request (kegagalan Zod)
    await page.route(`**${API_SURVEYOR_ADD_DATA_FAMILY}`, async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ message: "Nomor Kartu Keluarga melebihi batas 16 digit." }),
      });
    });

    // Isi Form dengan KK yang terlalu panjang
    await page.getByPlaceholder("Cth. Agus Miftah").fill("Tester Invalid Length");
    await page.getByPlaceholder("Cth. 1234567890123456").fill(LONG_KK);
    await page.getByPlaceholder("Cth. Perumahan Meikarta").fill("Jl. Invalid");
    await page.getByPlaceholder("Cth. 11").nth(0).fill("4");
    await page.getByLabel("Pilih Gambar").setInputFiles("public/images/favicon.svg");

    // Isi Select & Radio
    await page.getByRole("button", { name: "Pilih Desa" }).click();
    await page.getByRole("listitem").filter({ hasText: "Saptorenggo" }).click();
    await page.getByRole("button", { name: "Pilih Pendapatan Keluarga" }).click();
    await page.getByRole("listitem").filter({ hasText: "Rp2 juta - Rp3 juta" }).click();
    await page.getByRole("button", { name: "Pilih Pengeluaran Keluarga" }).click();
    await page.getByRole("listitem").filter({ hasText: "Rp1 juta - Rp2 juta" }).click();
    await page.getByRole("radio", { name: "Ya" }).first().check();
    await page.getByRole("radio", { name: "Tidak" }).nth(1).check();
    await page.getByRole("radio", { name: "Ya" }).nth(2).check();

    await page.getByRole("button", { name: "Simpan" }).click();
    await expect(page).toHaveURL(SURVEYOR_ADD_DATA_FAMILY, { timeout: 5000 });
  });

   // prettier-ignore
  test("should reject negative number for family member count", async ({ page }) => {
    await page.route(`**${API_SURVEYOR_ADD_DATA_FAMILY}`, async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ message: "Jumlah anggota keluarga harus positif." }),
      });
    });

    await page.getByPlaceholder("Cth. Agus Miftah").fill("Tester Negative Count");
    await page.getByPlaceholder("Cth. 1234567890123456").fill("1234567890123456");
    await page.getByPlaceholder("Cth. Perumahan Meikarta").fill("Jl. Negative");
    await page.getByPlaceholder("Cth. 11").nth(0).fill("-5");
    await page.getByLabel("Pilih Gambar").setInputFiles("public/images/favicon.svg");

    await page.getByRole("button", { name: "Pilih Desa" }).click();
    await page.getByRole("listitem").filter({ hasText: "Saptorenggo" }).click();
    await page.getByRole("button", { name: "Pilih Pendapatan Keluarga" }).click();
    await page.getByRole("listitem").filter({ hasText: "Rp2 juta - Rp3 juta" }).click();
    await page.getByRole("button", { name: "Pilih Pengeluaran Keluarga" }).click();
    await page.getByRole("listitem").filter({ hasText: "Rp1 juta - Rp2 juta" }).click();
    await page.getByRole("radio", { name: "Ya" }).first().check();
    await page.getByRole("radio", { name: "Tidak" }).nth(1).check();
    await page.getByRole("radio", { name: "Ya" }).nth(2).check();

    await page.getByRole("button", { name: "Simpan" }).click();
    await expect(page).toHaveURL(SURVEYOR_ADD_DATA_FAMILY, { timeout: 5000 });
  });

  // prettier-ignore
  test("should reject duplicate KK number", async ({ page }) => {
    const DUPLICATE_KK = "3501123456789012";

    await page.route(`**${API_SURVEYOR_ADD_DATA_FAMILY}`, async (route) => {
      await route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({ message: "Nomor Kartu Keluarga sudah terdaftar." }),
      });
    });

    await page.getByPlaceholder("Cth. Agus Miftah").fill("Tester Duplicate KK");
    await page.getByPlaceholder("Cth. 1234567890123456").fill(DUPLICATE_KK);
    await page.getByPlaceholder("Cth. Perumahan Meikarta").fill("Jl. Duplicate");
    await page.getByPlaceholder("Cth. 11").nth(0).fill("4");
    await page.getByLabel("Pilih Gambar").setInputFiles("public/images/favicon.svg");

    await page.getByRole("button", { name: "Pilih Desa" }).click();
    await page.getByRole("listitem").filter({ hasText: "Saptorenggo" }).click();
    await page.getByRole("button", { name: "Pilih Pendapatan Keluarga" }).click();
    await page.getByRole("listitem").filter({ hasText: "Rp2 juta - Rp3 juta" }).click();
    await page.getByRole("button", { name: "Pilih Pengeluaran Keluarga" }).click();
    await page.getByRole("listitem").filter({ hasText: "Rp1 juta - Rp2 juta" }).click();
    await page.getByRole("radio", { name: "Ya" }).first().check();
    await page.getByRole("radio", { name: "Tidak" }).nth(1).check();
    await page.getByRole("radio", { name: "Ya" }).nth(2).check();

    await page.getByRole("button", { name: "Simpan" }).click();
    await expect(page).toHaveURL(SURVEYOR_ADD_DATA_FAMILY, { timeout: 5000 });
  });

  // prettier-ignore
  test("should handle server error gracefully", async ({ page }) => {
    await page.route(`**${API_SURVEYOR_ADD_DATA_FAMILY}`, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "Internal Server Error." }),
      });
    });

    await page.getByPlaceholder("Cth. Agus Miftah").fill("Tester Server Error");
    await page.getByPlaceholder("Cth. 1234567890123456").fill("9876543210987654");
    await page.getByPlaceholder("Cth. Perumahan Meikarta").fill("Jl. Server Error");
    await page.getByPlaceholder("Cth. 11").nth(0).fill("4");
    await page.getByLabel("Pilih Gambar").setInputFiles("public/images/favicon.svg");

    await page.getByRole("button", { name: "Pilih Desa" }).click();
    await page.getByRole("listitem").filter({ hasText: "Saptorenggo" }).click();
    await page.getByRole("button", { name: "Pilih Pendapatan Keluarga" }).click();
    await page.getByRole("listitem").filter({ hasText: "Rp2 juta - Rp3 juta" }).click();
    await page.getByRole("button", { name: "Pilih Pengeluaran Keluarga" }).click();
    await page.getByRole("listitem").filter({ hasText: "Rp1 juta - Rp2 juta" }).click();
    await page.getByRole("radio", { name: "Ya" }).first().check();
    await page.getByRole("radio", { name: "Tidak" }).nth(1).check();
    await page.getByRole("radio", { name: "Ya" }).nth(2).check();

    await page.getByRole("button", { name: "Simpan" }).click();
    await expect(page).toHaveURL(SURVEYOR_ADD_DATA_FAMILY, { timeout: 5000 });
  });

  // prettier-ignore
  test("should reject zero value for family member count", async ({ page }) => {
    await page.route(`**${API_SURVEYOR_ADD_DATA_FAMILY}`, async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ message: "Jumlah anggota keluarga minimal 1." }),
      });
    });

    await page.getByPlaceholder("Cth. Agus Miftah").fill("Tester Zero Count");
    await page.getByPlaceholder("Cth. 1234567890123456").fill("1111222233334446");
    await page.getByPlaceholder("Cth. Perumahan Meikarta").fill("Jl. Zero Count");
    await page.getByPlaceholder("Cth. 11").nth(0).fill("0");
    await page.getByLabel("Pilih Gambar").setInputFiles("public/images/favicon.svg");

    await page.getByRole("button", { name: "Pilih Desa" }).click();
    await page.getByRole("listitem").filter({ hasText: "Saptorenggo" }).click();
    await page.getByRole("button", { name: "Pilih Pendapatan Keluarga" }).click();
    await page.getByRole("listitem").filter({ hasText: "Rp2 juta - Rp3 juta" }).click();
    await page.getByRole("button", { name: "Pilih Pengeluaran Keluarga" }).click();
    await page.getByRole("listitem").filter({ hasText: "Rp1 juta - Rp2 juta" }).click();
    await page.getByRole("radio", { name: "Ya" }).first().check();
    await page.getByRole("radio", { name: "Tidak" }).nth(1).check();
    await page.getByRole("radio", { name: "Ya" }).nth(2).check();

    await page.getByRole("button", { name: "Simpan" }).click();
    await expect(page).toHaveURL(SURVEYOR_ADD_DATA_FAMILY, { timeout: 5000 });
  });

  // prettier-ignore
  test("should reject excessively long name input", async ({ page }) => {
    const LONG_NAME = "A".repeat(256); // Nama terlalu panjang

    await page.route(`**${API_SURVEYOR_ADD_DATA_FAMILY}`, async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ message: "Nama kepala keluarga terlalu panjang." }),
      });
    });

    await page.getByPlaceholder("Cth. Agus Miftah").fill(LONG_NAME);
    await page.getByPlaceholder("Cth. 1234567890123456").fill("1234567890123456");
    await page.getByPlaceholder("Cth. Perumahan Meikarta").fill("Jl. Long Name");
    await page.getByPlaceholder("Cth. 11").nth(0).fill("4");
    await page.getByLabel("Pilih Gambar").setInputFiles("public/images/favicon.svg");

    await page.getByRole("button", { name: "Pilih Desa" }).click();
    await page.getByRole("listitem").filter({ hasText: "Saptorenggo" }).click();
    await page.getByRole("button", { name: "Pilih Pendapatan Keluarga" }).click();
    await page.getByRole("listitem").filter({ hasText: "Rp2 juta - Rp3 juta" }).click();
    await page.getByRole("button", { name: "Pilih Pengeluaran Keluarga" }).click();
    await page.getByRole("listitem").filter({ hasText: "Rp1 juta - Rp2 juta" }).click();
    await page.getByRole("radio", { name: "Ya" }).first().check();
    await page.getByRole("radio", { name: "Tidak" }).nth(1).check();
    await page.getByRole("radio", { name: "Ya" }).nth(2).check();

    await page.getByRole("button", { name: "Simpan" }).click();
    await expect(page).toHaveURL(SURVEYOR_ADD_DATA_FAMILY, { timeout: 5000 });
  });
});
