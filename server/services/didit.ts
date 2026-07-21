import fetch from 'node-fetch';
import crypto from 'crypto';

const DIDIT_BASE_URL = 'https://verification.didit.me';

export interface DiditSession {
  session_id: string;
  session_number: number;
  session_token: string;
  url: string;
  vendor_data: string | null;
  status: string;
  workflow_id: string;
  callback: string | null;
}

export interface DiditDecision {
  session_id: string;
  session_kind: string;
  session_number: number;
  status: string;
  environment: string;
  workflow_id: string;
  vendor_data: string | null;
  features?: any;
}

export interface DiditWebhookPayload {
  session_id: string;
  session_number: number;
  vendor_data: string | null;
  status: string;
  workflow_id: string;
  [key: string]: any;
}

function getApiKey(): string | null {
  return process.env.DIDIT_API_KEY || null;
}

function getWorkflowId(): string | null {
  return process.env.DIDIT_WORKFLOW_ID || null;
}

/**
 * Map a didit session status to a GreenPay KYC status
 */
export function mapDiditStatusToKyc(diditStatus: string): 'pending' | 'verified' | 'rejected' {
  switch (diditStatus) {
    case 'Approved':
      return 'verified';
    case 'Declined':
      return 'rejected';
    case 'Expired':
    case 'Abandoned':
    case 'Kyc Expired':
      return 'rejected';
    case 'In Review':
    case 'Awaiting User':
    case 'Resubmitted':
    case 'In Progress':
    case 'Not Started':
    default:
      return 'pending';
  }
}

/**
 * Determine if a didit status is terminal (won't change further)
 */
export function isTerminalStatus(diditStatus: string): boolean {
  return ['Approved', 'Declined', 'Expired', 'Abandoned', 'Kyc Expired'].includes(diditStatus);
}

/**
 * Create a new didit verification session for a user
 */
export async function createDiditSession(
  userId: string,
  callbackUrl: string
): Promise<DiditSession | null> {
  const apiKey = getApiKey();
  const workflowId = getWorkflowId();

  if (!apiKey || !workflowId) {
    console.error('[Didit] Missing DIDIT_API_KEY or DIDIT_WORKFLOW_ID environment variables');
    return null;
  }

  try {
    const response = await fetch(`${DIDIT_BASE_URL}/v3/session/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        workflow_id: workflowId,
        vendor_data: userId,
        callback: callbackUrl,
        callback_method: 'both',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`[Didit] Session creation failed (${response.status}):`, error);
      return null;
    }

    const session = await response.json() as DiditSession;
    console.log(`[Didit] Session created: ${session.session_id} for user ${userId}`);
    return session;
  } catch (error) {
    console.error('[Didit] Session creation error:', error);
    return null;
  }
}

/**
 * Fetch the full decision for a verification session
 */
export async function getSessionDecision(sessionId: string): Promise<DiditDecision | null> {
  const apiKey = getApiKey();

  if (!apiKey) {
    console.error('[Didit] Missing DIDIT_API_KEY');
    return null;
  }

  try {
    const response = await fetch(`${DIDIT_BASE_URL}/v3/session/${sessionId}/decision/`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`[Didit] Decision fetch failed (${response.status}):`, error);
      return null;
    }

    const decision = await response.json() as DiditDecision;
    return decision;
  } catch (error) {
    console.error('[Didit] Decision fetch error:', error);
    return null;
  }
}

/**
 * Verify a webhook signature from didit
 * didit sends HMAC-SHA256 signature in the x-didit-signature header
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSig)
    );
  } catch {
    return false;
  }
}

/**
 * Check if didit is properly configured
 */
export function isDiditConfigured(): boolean {
  return !!(process.env.DIDIT_API_KEY && process.env.DIDIT_WORKFLOW_ID);
}
