// Node.js 18+ native fetch kullanıyor

interface MicrosoftGraphToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
}

let cachedToken: MicrosoftGraphToken | null = null;

/**
 * Microsoft Graph API'den access token alır
 */
export async function getMicrosoftGraphToken(): Promise<string> {
  // Cache'de varsa ve geçerli ise kullan
  if (cachedToken && cachedToken.expires_at > Date.now()) {
    return cachedToken.access_token;
  }

  const clientId = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  const tenantId = process.env.AZURE_TENANT_ID;

  if (!clientId || !clientSecret || !tenantId) {
    throw new Error("Azure kimlik doğrulama bilgileri eksik");
  }

  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  try {
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token alma başarısız: ${error}`);
    }

    const data = (await response.json()) as any;

    cachedToken = {
      access_token: data.access_token,
      token_type: data.token_type,
      expires_in: data.expires_in,
      expires_at: Date.now() + data.expires_in * 1000 - 60000, // 1 dakika öncesinden yenile
    };

    return cachedToken.access_token;
  } catch (error) {
    console.error("Microsoft Graph token hatası:", error);
    throw new Error("Microsoft Graph token alınamadı");
  }
}

/**
 * SharePoint Excel dosyasına satır ekler
 */
export async function addRowToSharePointExcel(
  siteId: string,
  driveId: string,
  itemId: string,
  rowData: Record<string, any>
): Promise<void> {
  const token = await getMicrosoftGraphToken();

  // Excel dosyasının çalışma sayfasına satır ekle
  const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${itemId}/workbook/tables/Table1/rows/add`;

  const values = [Object.values(rowData)];

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Excel satırı ekleme başarısız: ${error}`);
    }

    console.log("SharePoint Excel dosyasına satır eklendi");
  } catch (error) {
    console.error("SharePoint Excel ekleme hatası:", error);
    throw new Error("SharePoint Excel dosyasına yazma başarısız");
  }
}

/**
 * SharePoint site ve drive bilgisini alır
 */
export async function getSharePointSiteInfo(siteUrl: string): Promise<{
  siteId: string;
  driveId: string;
}> {
  const token = await getMicrosoftGraphToken();

  // Site URL'sinden site ID'sini al
  const urlParts = siteUrl.split("/");
  const hostname = urlParts[2]; // kebanentegre-my.sharepoint.com
  const sitePath = urlParts.slice(3).join("/"); // personal/abdullah_er_kebanet_com

  const siteUrl2 = `https://graph.microsoft.com/v1.0/sites/${hostname}:/${sitePath}`;

  try {
    const response = await fetch(siteUrl2, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("SharePoint site bilgisi alınamadı");
    }

    const siteData = (await response.json()) as any;
    const siteId = siteData.id;

    // Drive ID'sini al
    const driveUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/drive`;
    const driveResponse = await fetch(driveUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!driveResponse.ok) {
      throw new Error("SharePoint drive bilgisi alınamadı");
    }

    const driveData = (await driveResponse.json()) as any;
    const driveId = driveData.id;

    return { siteId, driveId };
  } catch (error) {
    console.error("SharePoint site bilgisi hatası:", error);
    throw new Error("SharePoint site bilgisi alınamadı");
  }
}

/**
 * Excel dosyasının item ID'sini alır - dosya yolunu destekler
 */
export async function getExcelFileItemId(
  driveId: string,
  filePath: string
): Promise<string> {
  const token = await getMicrosoftGraphToken();

  // Dosya yolundan son dosya adını al
  const fileName = filePath.split("/").pop() || filePath;

  // Dosya yolunun dizin kısmını al
  const pathParts = filePath.split("/");
  const directories = pathParts.slice(0, -1);

  try {
    let currentPath = "root";

    // Dizinleri gezin
    for (const dir of directories) {
      const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${currentPath}/children?$filter=name eq '${dir}'`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Dizin bulunamadı: ${dir}`);
      }

      const data = (await response.json()) as any;
      if (data.value.length === 0) {
        throw new Error(`Dizin bulunamadı: ${dir}`);
      }
      currentPath = data.value[0].id;
    }

    // Son dosyayı bul
    const fileUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${currentPath}/children?$filter=name eq '${fileName}'`;
    const fileResponse = await fetch(fileUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!fileResponse.ok) {
      throw new Error("Excel dosyası bulunamadı");
    }

    const fileData = (await fileResponse.json()) as any;
    if (fileData.value.length === 0) {
      throw new Error(`${fileName} dosyası SharePoint'te bulunamadı`);
    }

    return fileData.value[0].id;
  } catch (error) {
    console.error("Excel dosyası ID hatası:", error);
    throw new Error("Excel dosyası ID alınamadı");
  }
}
