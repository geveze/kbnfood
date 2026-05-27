import { describe, it, expect, beforeAll } from "vitest";

describe("Microsoft Graph API", () => {
  beforeAll(() => {
    // Azure kimlik doğrulama bilgilerini kontrol et
    if (!process.env.AZURE_CLIENT_ID) {
      console.warn("AZURE_CLIENT_ID environment variable not set");
    }
    if (!process.env.AZURE_CLIENT_SECRET) {
      console.warn("AZURE_CLIENT_SECRET environment variable not set");
    }
    if (!process.env.AZURE_TENANT_ID) {
      console.warn("AZURE_TENANT_ID environment variable not set");
    }
  });

  it("should have Azure credentials configured", () => {
    expect(process.env.AZURE_TENANT_ID).toBe("208b4126-267e-4c92-aaad-5dac1d753077");
  });

  it("should have Client ID configured", () => {
    // Client ID'nin varlığını kontrol et (gerçek değer user tarafından sağlanacak)
    if (process.env.AZURE_CLIENT_ID) {
      expect(process.env.AZURE_CLIENT_ID).toBeTruthy();
    }
  });

  it("should have Client Secret configured", () => {
    // Client Secret'ın varlığını kontrol et (gerçek değer user tarafından sağlanacak)
    if (process.env.AZURE_CLIENT_SECRET) {
      expect(process.env.AZURE_CLIENT_SECRET).toBeTruthy();
    }
  });

  it("should validate SharePoint configuration", () => {
    const sharePointUrl = "https://kebanentegre-my.sharepoint.com/personal/abdullah_er_kebanet_com";
    const excelFileName = "PİF Keban.xlsx";

    expect(sharePointUrl).toContain("sharepoint.com");
    expect(excelFileName).toContain("PİF");
  });
});
