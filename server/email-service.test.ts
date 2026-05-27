import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendFieldInspectionEmail } from './email-service';

describe('Email Service - Field Inspection Email', () => {
  let fetchMock: any;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
    
    // Set environment variables
    process.env.BUILT_IN_FORGE_API_URL = 'https://forge.test.com';
    process.env.BUILT_IN_FORGE_API_KEY = 'test-api-key';
    process.env.PERFORMANCE_MONITORING_EMAIL = 'monitoring@test.com';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should send email to restaurant manager (TO) with inspector in CC', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => 'OK',
    });

    const emailData = {
      branchName: 'Test Branch',
      inspectionDate: '2026-05-08',
      totalScore: 85.5,
      restaurantManagerEmail: 'manager@test.com',
      inspectorName: 'Test Inspector',
      inspectorEmail: 'inspector@test.com',
      otherEmail: 'supervisor@test.com',
    };

    const result = await sendFieldInspectionEmail(emailData);

    expect(result.restaurantManager).toBe(true);
    expect(result.inspector).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const callArgs = fetchMock.mock.calls[0];
    const body = JSON.parse(callArgs[1].body);
    
    // Verify TO field
    expect(body.to).toBe('manager@test.com');
    
    // Verify CC field contains inspector and supervisor
    expect(body.cc).toBeDefined();
    expect(body.cc).toContain('inspector@test.com');
    expect(body.cc).toContain('supervisor@test.com');
    
    expect(body.attachments).toBeUndefined();
    expect(body.html).toBeDefined();
  });

  it('should send email with PDF buffer as attachment', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => 'OK',
    });

    const pdfBuffer = Buffer.from('PDF_CONTENT_TEST');
    const emailData = {
      branchName: 'Test Branch',
      inspectionDate: '2026-05-08',
      totalScore: 85.5,
      restaurantManagerEmail: 'manager@test.com',
      inspectorName: 'Test Inspector',
      inspectorEmail: 'inspector@test.com',
    };

    const result = await sendFieldInspectionEmail(emailData, pdfBuffer);

    expect(result.restaurantManager).toBe(true);
    expect(result.inspector).toBe(true);
    expect(fetchMock).toHaveBeenCalled();

    const callArgs = fetchMock.mock.calls[0];
    const body = JSON.parse(callArgs[1].body);
    
    // Check that PDF attachment is included
    expect(body.attachments).toBeDefined();
    expect(body.attachments).toHaveLength(1);
    expect(body.attachments[0].filename).toContain('Denetim_Test_Branch');
    expect(body.attachments[0].encoding).toBe('base64');
    expect(body.attachments[0].contentType).toBe('application/pdf');
    expect(body.attachments[0].content).toBe(pdfBuffer.toString('base64'));
  });

  it('should not include TO email in CC (avoid duplicates)', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => 'OK',
    });

    const emailData = {
      branchName: 'Test Branch',
      inspectionDate: '2026-05-08',
      totalScore: 85.5,
      restaurantManagerEmail: 'manager@test.com',
      inspectorName: 'Test Inspector',
      inspectorEmail: 'manager@test.com', // Same as manager
      otherEmail: 'supervisor@test.com',
    };

    const result = await sendFieldInspectionEmail(emailData);

    // Should send one email with manager as TO
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.restaurantManager).toBe(true);

    const callArgs = fetchMock.mock.calls[0];
    const body = JSON.parse(callArgs[1].body);
    
    // Verify TO
    expect(body.to).toBe('manager@test.com');
    
    // Verify CC doesn't contain manager (avoid duplicate)
    expect(body.cc).toContain('supervisor@test.com');
    expect(body.cc).not.toContain('manager@test.com');
    expect(body.cc.length).toBe(1); // Only supervisor
  });

  it('should handle API errors gracefully', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      text: async () => 'API Error',
    });

    const emailData = {
      branchName: 'Test Branch',
      inspectionDate: '2026-05-08',
      totalScore: 85.5,
      restaurantManagerEmail: 'manager@test.com',
      inspectorName: 'Test Inspector',
      inspectorEmail: 'inspector@test.com',
    };

    const result = await sendFieldInspectionEmail(emailData);

    expect(result.restaurantManager).toBe(false);
    expect(result.inspector).toBe(false);
  });

  it('should include correct email headers', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => 'OK',
    });

    const emailData = {
      branchName: 'Test Branch',
      inspectionDate: '2026-05-08',
      totalScore: 85.5,
      restaurantManagerEmail: 'manager@test.com',
      inspectorName: 'Test Inspector',
      inspectorEmail: 'inspector@test.com',
    };

    await sendFieldInspectionEmail(emailData);

    const callArgs = fetchMock.mock.calls[0];
    const headers = callArgs[1].headers;
    
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['Authorization']).toBe('Bearer test-api-key');
  });

  it('should handle missing API key gracefully', async () => {
    delete process.env.BUILT_IN_FORGE_API_KEY;

    const emailData = {
      branchName: 'Test Branch',
      inspectionDate: '2026-05-08',
      totalScore: 85.5,
      restaurantManagerEmail: 'manager@test.com',
      inspectorName: 'Test Inspector',
      inspectorEmail: 'inspector@test.com',
    };

    const result = await sendFieldInspectionEmail(emailData);

    expect(result.restaurantManager).toBe(false);
    expect(result.inspector).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
