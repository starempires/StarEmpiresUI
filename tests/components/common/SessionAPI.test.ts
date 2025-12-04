import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import * as SessionAPI from '../../../src/components/common/SessionAPI';

/**
 * Property-Based Tests for SessionAPI
 *
 * These tests use fast-check to generate random test data and verify
 * that correctness properties hold across all valid inputs.
 */

describe('SessionAPI - Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock global fetch
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * **Feature: admin-order-processing, Property 3: Admin flag inclusion**
   *
   * For any call to updateTurn with processAdminOnly set to true, the API request
   * payload should include the processAdminOnly field set to true
   *
   * **Validates: Requirements 2.3**
   */
  it('Property 3: Admin flag inclusion', async () => {
    // Generator for session names
    const sessionNameArb = fc.string({ minLength: 3, maxLength: 20 });

    // Generator for turn numbers
    const turnNumberArb = fc.integer({ min: 0, max: 100 });

    await fc.assert(
      fc.asyncProperty(sessionNameArb, turnNumberArb, async (sessionName, turnNumber) => {
        // Clear mocks before each iteration
        vi.clearAllMocks();
        
        // Setup: Mock fetch to return a successful response
        const mockResponse = {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ message: 'Success' }),
        };
        (global.fetch as any).mockResolvedValue(mockResponse);

        // Act: Call updateTurn with processAdminOnly=true
        await SessionAPI.updateTurn(sessionName, turnNumber, true);

        // Assert: Verify fetch was called
        expect(global.fetch).toHaveBeenCalledTimes(1);

        // Assert: Get the call arguments
        const fetchCall = (global.fetch as any).mock.calls[0];
        const [url, options] = fetchCall;

        // Assert: Verify the URL
        expect(url).toBe('https://api.starempires.com/updateTurn');

        // Assert: Verify the request method
        expect(options.method).toBe('POST');

        // Assert: Parse the request body
        const requestBody = JSON.parse(options.body);

        // Assert: Verify processAdminOnly is included and set to true
        expect(requestBody).toHaveProperty('processAdminOnly');
        expect(requestBody.processAdminOnly).toBe(true);

        // Assert: Verify other required fields are present
        expect(requestBody.sessionName).toBe(sessionName);
        expect(requestBody.turnNumber).toBe(turnNumber);

        // Additional property checks:
        // 1. The payload should have exactly 3 fields when processAdminOnly is true
        const payloadKeys = Object.keys(requestBody);
        expect(payloadKeys).toHaveLength(3);
        expect(payloadKeys).toContain('sessionName');
        expect(payloadKeys).toContain('turnNumber');
        expect(payloadKeys).toContain('processAdminOnly');

        // 2. processAdminOnly should be a boolean
        expect(typeof requestBody.processAdminOnly).toBe('boolean');

        // 3. processAdminOnly should be exactly true (not truthy)
        expect(requestBody.processAdminOnly).toBe(true);
      }),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  }, 60000); // Increase timeout for property-based test with 100 runs

  /**
   * **Feature: admin-order-processing, Property 4: Admin flag omission**
   *
   * For any call to updateTurn with processAdminOnly set to false or undefined,
   * the API request payload should either omit the processAdminOnly field or set it to false
   *
   * **Validates: Requirements 2.4**
   */
  it('Property 4: Admin flag omission', async () => {
    // Generator for session names
    const sessionNameArb = fc.string({ minLength: 3, maxLength: 20 });

    // Generator for turn numbers
    const turnNumberArb = fc.integer({ min: 0, max: 100 });

    // Generator for processAdminOnly values that should result in omission
    // This includes: false, undefined, and omitting the parameter entirely
    const processAdminOnlyArb = fc.constantFrom(false, undefined);

    await fc.assert(
      fc.asyncProperty(
        sessionNameArb,
        turnNumberArb,
        processAdminOnlyArb,
        async (sessionName, turnNumber, processAdminOnly) => {
          // Clear mocks before each iteration
          vi.clearAllMocks();
          
          // Setup: Mock fetch to return a successful response
          const mockResponse = {
            ok: true,
            status: 200,
            text: async () => JSON.stringify({ message: 'Success' }),
          };
          (global.fetch as any).mockResolvedValue(mockResponse);

          // Act: Call updateTurn with processAdminOnly=false or undefined
          await SessionAPI.updateTurn(sessionName, turnNumber, processAdminOnly);

          // Assert: Verify fetch was called
          expect(global.fetch).toHaveBeenCalledTimes(1);

          // Assert: Get the call arguments
          const fetchCall = (global.fetch as any).mock.calls[0];
          const [url, options] = fetchCall;

          // Assert: Verify the URL
          expect(url).toBe('https://api.starempires.com/updateTurn');

          // Assert: Verify the request method
          expect(options.method).toBe('POST');

          // Assert: Parse the request body
          const requestBody = JSON.parse(options.body);

          // Assert: Verify processAdminOnly is NOT included in the payload
          // (or if included, it should be false - but per implementation, it should be omitted)
          expect(requestBody).not.toHaveProperty('processAdminOnly');

          // Assert: Verify required fields are present
          expect(requestBody.sessionName).toBe(sessionName);
          expect(requestBody.turnNumber).toBe(turnNumber);

          // Additional property checks:
          // 1. The payload should have exactly 2 fields when processAdminOnly is false/undefined
          const payloadKeys = Object.keys(requestBody);
          expect(payloadKeys).toHaveLength(2);
          expect(payloadKeys).toContain('sessionName');
          expect(payloadKeys).toContain('turnNumber');

          // 2. Ensure no extra fields are present
          expect(payloadKeys).not.toContain('processAdminOnly');
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  }, 60000); // Increase timeout for property-based test with 100 runs

  /**
   * **Feature: admin-order-processing, Property 5: Backward compatibility**
   *
   * For any existing call to updateTurn without the processAdminOnly parameter,
   * the function should behave identically to the previous implementation
   *
   * **Validates: Requirements 2.5, 5.2, 5.3, 5.4**
   */
  it('Property 5: Backward compatibility', async () => {
    // Generator for session names
    const sessionNameArb = fc.string({ minLength: 3, maxLength: 20 });

    // Generator for turn numbers
    const turnNumberArb = fc.integer({ min: 0, max: 100 });

    await fc.assert(
      fc.asyncProperty(sessionNameArb, turnNumberArb, async (sessionName, turnNumber) => {
        // Clear mocks before each iteration
        vi.clearAllMocks();
        
        // Setup: Mock fetch to return a successful response
        const mockResponseText = JSON.stringify({ message: 'Turn updated successfully' });
        const mockResponse = {
          ok: true,
          status: 200,
          text: async () => mockResponseText,
        };
        (global.fetch as any).mockResolvedValue(mockResponse);

        // Act: Call updateTurn WITHOUT the processAdminOnly parameter (backward compatible call)
        const result = await SessionAPI.updateTurn(sessionName, turnNumber);

        // Assert: Verify fetch was called exactly once
        expect(global.fetch).toHaveBeenCalledTimes(1);

        // Assert: Get the call arguments
        const fetchCall = (global.fetch as any).mock.calls[0];
        const [url, options] = fetchCall;

        // Assert: Verify the URL is correct
        expect(url).toBe('https://api.starempires.com/updateTurn');

        // Assert: Verify the request method
        expect(options.method).toBe('POST');

        // Assert: Verify headers are present
        expect(options.headers).toBeDefined();
        expect(options.headers['Content-Type']).toBe('application/json');

        // Assert: Parse the request body
        const requestBody = JSON.parse(options.body);

        // Assert: Verify processAdminOnly is NOT included (backward compatibility)
        expect(requestBody).not.toHaveProperty('processAdminOnly');

        // Assert: Verify only the original fields are present
        expect(requestBody.sessionName).toBe(sessionName);
        expect(requestBody.turnNumber).toBe(turnNumber);

        // Assert: Verify the payload has exactly 2 fields (sessionName and turnNumber only)
        const payloadKeys = Object.keys(requestBody);
        expect(payloadKeys).toHaveLength(2);
        expect(payloadKeys).toContain('sessionName');
        expect(payloadKeys).toContain('turnNumber');

        // Assert: Verify the function returns the response text (backward compatible behavior)
        expect(result).toBe(mockResponseText);

        // Additional backward compatibility checks:
        // 1. The function should handle successful responses the same way
        expect(result).toBeTruthy();
        expect(typeof result).toBe('string');

        // 2. The payload structure should match the original implementation
        // (no new fields, same field order, same types)
        expect(typeof requestBody.sessionName).toBe('string');
        expect(typeof requestBody.turnNumber).toBe('number');
      }),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  }, 60000); // Increase timeout for property-based test with 100 runs

  /**
   * **Feature: admin-order-processing, Property 5: Backward compatibility (Error Handling)**
   *
   * For any error scenarios, updateTurn should handle them identically to the previous implementation
   *
   * **Validates: Requirements 2.5, 5.2, 5.3, 5.4**
   */
  it('Property 5: Backward compatibility - Error handling', async () => {
    // Generator for session names
    const sessionNameArb = fc.string({ minLength: 3, maxLength: 20 });

    // Generator for turn numbers
    const turnNumberArb = fc.integer({ min: 0, max: 100 });

    // Generator for error status codes
    const errorStatusArb = fc.constantFrom(404, 500, 503);

    await fc.assert(
      fc.asyncProperty(
        sessionNameArb,
        turnNumberArb,
        errorStatusArb,
        async (sessionName, turnNumber, errorStatus) => {
          // Clear mocks before each iteration
          vi.clearAllMocks();
          
          // Setup: Mock fetch to return an error response
          const mockResponse = {
            ok: false,
            status: errorStatus,
            text: async () => JSON.stringify({ error: 'Error occurred' }),
          };
          (global.fetch as any).mockResolvedValue(mockResponse);

          // Act: Call updateTurn WITHOUT the processAdminOnly parameter
          const result = await SessionAPI.updateTurn(sessionName, turnNumber);

          // Assert: Verify fetch was called
          expect(global.fetch).toHaveBeenCalledTimes(1);

          // Assert: Get the call arguments
          const fetchCall = (global.fetch as any).mock.calls[0];
          const [_url, options] = fetchCall;

          // Assert: Parse the request body
          const requestBody = JSON.parse(options.body);

          // Assert: Verify processAdminOnly is NOT included (backward compatibility)
          expect(requestBody).not.toHaveProperty('processAdminOnly');

          // Assert: Verify backward compatible error handling
          // The function should return empty string for non-200 responses
          expect(result).toBe('');

          // Assert: Verify the payload structure is unchanged
          expect(requestBody.sessionName).toBe(sessionName);
          expect(requestBody.turnNumber).toBe(turnNumber);
          expect(Object.keys(requestBody)).toHaveLength(2);
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  }, 60000); // Increase timeout for property-based test with 100 runs
});

/**
 * Unit Tests for SessionAPI.updateTurn
 *
 * These tests verify specific behaviors of the updateTurn function,
 * particularly around the processAdminOnly parameter handling.
 */
describe('SessionAPI.updateTurn - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock global fetch
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Test updateTurn with processAdminOnly=true includes flag in payload
   * Requirements: 2.1, 2.3
   */
  it('should include processAdminOnly=true in payload when parameter is true', async () => {
    // Setup: Mock fetch to return a successful response
    const mockResponse = {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ message: 'Admin orders processed' }),
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    // Act: Call updateTurn with processAdminOnly=true
    await SessionAPI.updateTurn('test-session', 5, true);

    // Assert: Verify fetch was called
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Assert: Get the call arguments
    const fetchCall = (global.fetch as any).mock.calls[0];
    const [url, options] = fetchCall;

    // Assert: Verify the URL
    expect(url).toBe('https://api.starempires.com/updateTurn');

    // Assert: Verify the request method
    expect(options.method).toBe('POST');

    // Assert: Parse the request body
    const requestBody = JSON.parse(options.body);

    // Assert: Verify processAdminOnly is included and set to true
    expect(requestBody).toHaveProperty('processAdminOnly');
    expect(requestBody.processAdminOnly).toBe(true);
    expect(requestBody.sessionName).toBe('test-session');
    expect(requestBody.turnNumber).toBe(5);
  });

  /**
   * Test updateTurn with processAdminOnly=false omits flag from payload
   * Requirements: 2.2, 2.4
   */
  it('should omit processAdminOnly from payload when parameter is false', async () => {
    // Setup: Mock fetch to return a successful response
    const mockResponse = {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ message: 'Turn updated' }),
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    // Act: Call updateTurn with processAdminOnly=false
    await SessionAPI.updateTurn('test-session', 5, false);

    // Assert: Verify fetch was called
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Assert: Get the call arguments
    const fetchCall = (global.fetch as any).mock.calls[0];
    const [url, options] = fetchCall;

    // Assert: Verify the URL
    expect(url).toBe('https://api.starempires.com/updateTurn');

    // Assert: Parse the request body
    const requestBody = JSON.parse(options.body);

    // Assert: Verify processAdminOnly is NOT included
    expect(requestBody).not.toHaveProperty('processAdminOnly');
    expect(requestBody.sessionName).toBe('test-session');
    expect(requestBody.turnNumber).toBe(5);
    expect(Object.keys(requestBody)).toHaveLength(2);
  });

  /**
   * Test updateTurn with processAdminOnly=undefined omits flag from payload
   * Requirements: 2.2, 2.4
   */
  it('should omit processAdminOnly from payload when parameter is undefined', async () => {
    // Setup: Mock fetch to return a successful response
    const mockResponse = {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ message: 'Turn updated' }),
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    // Act: Call updateTurn with processAdminOnly=undefined
    await SessionAPI.updateTurn('test-session', 5, undefined);

    // Assert: Verify fetch was called
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Assert: Get the call arguments
    const fetchCall = (global.fetch as any).mock.calls[0];
    const [url, options] = fetchCall;

    // Assert: Verify the URL
    expect(url).toBe('https://api.starempires.com/updateTurn');

    // Assert: Parse the request body
    const requestBody = JSON.parse(options.body);

    // Assert: Verify processAdminOnly is NOT included
    expect(requestBody).not.toHaveProperty('processAdminOnly');
    expect(requestBody.sessionName).toBe('test-session');
    expect(requestBody.turnNumber).toBe(5);
    expect(Object.keys(requestBody)).toHaveLength(2);
  });

  /**
   * Test updateTurn without parameter omits flag from payload
   * Requirements: 2.2, 2.5
   */
  it('should omit processAdminOnly from payload when parameter is not provided', async () => {
    // Setup: Mock fetch to return a successful response
    const mockResponse = {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ message: 'Turn updated' }),
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    // Act: Call updateTurn without processAdminOnly parameter
    await SessionAPI.updateTurn('test-session', 5);

    // Assert: Verify fetch was called
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Assert: Get the call arguments
    const fetchCall = (global.fetch as any).mock.calls[0];
    const [url, options] = fetchCall;

    // Assert: Verify the URL
    expect(url).toBe('https://api.starempires.com/updateTurn');

    // Assert: Parse the request body
    const requestBody = JSON.parse(options.body);

    // Assert: Verify processAdminOnly is NOT included
    expect(requestBody).not.toHaveProperty('processAdminOnly');
    expect(requestBody.sessionName).toBe('test-session');
    expect(requestBody.turnNumber).toBe(5);
    expect(Object.keys(requestBody)).toHaveLength(2);
  });

  /**
   * Test updateTurn returns response correctly
   * Requirements: 2.1
   */
  it('should return response text correctly on success', async () => {
    // Setup: Mock fetch to return a successful response
    const mockResponseText = JSON.stringify({ message: 'Turn updated successfully', turnNumber: 6 });
    const mockResponse = {
      ok: true,
      status: 200,
      text: async () => mockResponseText,
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    // Act: Call updateTurn
    const result = await SessionAPI.updateTurn('test-session', 5);

    // Assert: Verify the function returns the response text
    expect(result).toBe(mockResponseText);
  });

  /**
   * Test updateTurn handles errors
   * Requirements: 2.5
   */
  it('should return empty string on 404 error', async () => {
    // Setup: Mock fetch to return a 404 response
    const mockResponse = {
      ok: false,
      status: 404,
      text: async () => JSON.stringify({ error: 'Not found' }),
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    // Act: Call updateTurn
    const result = await SessionAPI.updateTurn('test-session', 5);

    // Assert: Verify the function returns empty string
    expect(result).toBe('');
  });

  it('should return empty string on 500 error', async () => {
    // Setup: Mock fetch to return a 500 response
    const mockResponse = {
      ok: false,
      status: 500,
      text: async () => JSON.stringify({ error: 'Internal server error' }),
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    // Act: Call updateTurn
    const result = await SessionAPI.updateTurn('test-session', 5);

    // Assert: Verify the function returns empty string
    expect(result).toBe('');
  });

  it('should throw error on network failure', async () => {
    // Setup: Mock fetch to throw a network error
    const networkError = new Error('Network error');
    (global.fetch as any).mockRejectedValue(networkError);

    // Act & Assert: Verify the function throws the error
    await expect(SessionAPI.updateTurn('test-session', 5)).rejects.toThrow('Network error');
  });
});
