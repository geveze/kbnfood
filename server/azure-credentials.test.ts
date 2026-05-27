import { describe, it, expect } from "vitest";

describe("Azure AD Credentials - Microsoft Graph Token", () => {
  it("AZURE_CLIENT_ID environment variable ayarlanmış olmalı", () => {
    expect(process.env.AZURE_CLIENT_ID).toBeDefined();
    expect(process.env.AZURE_CLIENT_ID).toBe("b9a72e8f-b6c4-47d7-a320-0aeaef48cc4c");
  });

  it("AZURE_CLIENT_SECRET environment variable ayarlanmış olmalı", () => {
    expect(process.env.AZURE_CLIENT_SECRET).toBeDefined();
    expect(process.env.AZURE_CLIENT_SECRET?.length).toBeGreaterThan(0);
  });

  it("AZURE_TENANT_ID environment variable ayarlanmış olmalı", () => {
    expect(process.env.AZURE_TENANT_ID).toBeDefined();
    expect(process.env.AZURE_TENANT_ID).toBe("208b4126-267e-4c92-aaad-5dac1d753077");
  });

  it("Tüm Azure AD credentials ayarlanmış olmalı", () => {
    const hasAllCredentials = 
      process.env.AZURE_CLIENT_ID &&
      process.env.AZURE_CLIENT_SECRET &&
      process.env.AZURE_TENANT_ID;
    
    expect(hasAllCredentials).toBeTruthy();
  });

  it("Microsoft Graph token URL doğru formatında oluşturulabilmeli", () => {
    const tenantId = process.env.AZURE_TENANT_ID;
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    
    expect(tokenUrl).toContain("login.microsoftonline.com");
    expect(tokenUrl).toContain("oauth2/v2.0/token");
    expect(tokenUrl).toContain(tenantId);
  });
});
