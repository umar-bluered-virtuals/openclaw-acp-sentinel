// =============================================================================
// Thin wrapper around the Lite Agent API to resolve our wallet address.
// Uses the same auth style as scripts/index.ts (x-api-key header).
// =============================================================================

import axios from "axios";

const CLAW_API_BASE = "https://claw-api.virtuals.io";

// ---------------------------------------------------------------------------
// Types (mirrors the minimal subset we need for job offerings)
// ---------------------------------------------------------------------------

export interface PriceV2 {
  type: "fixed";
  value: number;
}

export interface JobOfferingData {
  name: string;
  description: string;
  priceV2: PriceV2;
  slaMinutes: number;
  requiredFunds: boolean;
  requirement: Record<string, any>;
  deliverable: string;
}

export interface CreateJobOfferingResponse {
  success: boolean;
  /** Raw response body from the ACP API (shape may evolve). */
  data?: unknown;
}

/**
 * Fetch the current agent's wallet address from the Lite Agent API.
 */
export async function getWalletAddress(apiKey: string): Promise<string> {
  const { data } = await axios.get<{ data: { walletAddress: string } }>(
    `${CLAW_API_BASE}/acp/me`,
    {
      headers: { "x-api-key": apiKey },
    },
  );

  const wallet = data?.data?.walletAddress;
  if (!wallet) {
    throw new Error("Could not resolve walletAddress from /acp/me");
  }
  return wallet;
}

// ---------------------------------------------------------------------------
// ACP job offerings (register / delist)
// ---------------------------------------------------------------------------

/**
 * Register a job offering on ACP by calling POST /acp/job-offerings.
 *
 * @param apiKey   - The x-api-key for authenticating with the ACP service.
 * @param offering - The job offering payload.
 */
export async function createJobOffering(
  apiKey: string,
  offering: JobOfferingData,
): Promise<CreateJobOfferingResponse> {
  try {
    const { data } = await axios.post(
      `${CLAW_API_BASE}/acp/job-offerings`,
      { data: offering },
      {
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
      },
    );
    return { success: true, data };
  } catch (error: any) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`❌ ACP createJobOffering failed: ${msg}`);
    if (error?.response?.data) {
      console.error(`   Response body:`, JSON.stringify(error.response.data, null, 2));
    }
    return { success: false };
  }
}

export async function deleteJobOffering(
  apiKey: string,
  offeringName: string,
): Promise<{ success: boolean }> {
  try {
    await axios.delete(
      `${CLAW_API_BASE}/acp/job-offerings/${encodeURIComponent(offeringName)}`,
      {
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
      },
    );
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`❌ ACP deleteJobOffering failed: ${msg}`);
    return { success: false };
  }
}
