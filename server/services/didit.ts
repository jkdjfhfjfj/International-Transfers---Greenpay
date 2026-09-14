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
  id_verifications?: any[];
  liveness_checks?: any[];
}

export interface DiditWebhookPayload {
  session_id: string;
  session_number: number;
  vendor_data: string | null;
  status: string;
  workflow_id: string;
  [key: string]: any;
}

export interface DiditIdentityData {
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  dateOfBirth: string | null;
  idNumber: string | null;
  documentType: string | null;
  nationality: string | null;
  gender: string | null;
  expiryDate: string | null;
  address: string | null;
  issuingCountry: string | null;
}

export interface DiditRiskSignals {
  level: 'high' | 'medium' | 'low' | 'unknown';
  score: number | null;
  flags: string[];
  indicators: string[];
}

function readNestedValue(source: any, paths: string[][]): any {
  for (const path of paths) {
    let current = source;
    for (const key of path) current = current?.[key];
    if (current !== undefined && current !== null && current !== '') return current;
  }
  return null;
}

function normalizeRiskFlag(value: unknown): string | null {
  if (typeof value === 'string' || typeof value === 'number') {
    const label = String(value).trim().replace(/[_-]+/g, ' ');
    return label ? label.replace(/\b\w/g, char => char.toUpperCase()) : null;
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, any>;
    const label = record.label || record.name || record.type || record.reason || record.code;
    return normalizeRiskFlag(label);
  }
  return null;
}

/**
 * Normalize the risk-related parts of a Didit decision without exposing the
 * full provider payload to the admin UI.
 */
export function extractDiditRiskSignals(payload: any): DiditRiskSignals {
  const data = payload?.decision && typeof payload.decision === 'object'
    ? { ...payload, ...payload.decision }
    : payload || {};

  const rawLevel = readNestedValue(data, [
    ['risk_level'],
    ['riskLevel'],
    ['risk', 'level'],
    ['fraud', 'risk_level'],
    ['fraud', 'riskLevel'],
  ]);
  const normalizedLevel = String(rawLevel || '').toLowerCase();
  const level: DiditRiskSignals['level'] =
    ['critical', 'high', 'elevated'].includes(normalizedLevel) ? 'high' :
    ['medium', 'moderate'].includes(normalizedLevel) ? 'medium' :
    ['low', 'clear', 'none', 'pass', 'passed'].includes(normalizedLevel) ? 'low' :
    'unknown';

  const rawScore = readNestedValue(data, [
    ['risk_score'],
    ['riskScore'],
    ['risk', 'score'],
    ['fraud', 'risk_score'],
    ['fraud', 'riskScore'],
  ]);
  let score = typeof rawScore === 'number' ? rawScore : Number(rawScore);
  if (!Number.isFinite(score)) score = Number.NaN;
  if (Number.isFinite(score) && score >= 0 && score <= 1) score *= 100;
  score = Number.isFinite(score) ? Math.round(score * 100) / 100 : Number.NaN;

  const flags: string[] = [];
  const rawFlagLists = [
    readNestedValue(data, [['risk_flags']]),
    readNestedValue(data, [['riskFlags']]),
    readNestedValue(data, [['fraud_flags']]),
    readNestedValue(data, [['fraudFlags']]),
    readNestedValue(data, [['watchlist_matches']]),
    readNestedValue(data, [['sanctions_matches']]),
    readNestedValue(data, [['risk', 'flags']]),
  ];
  for (const rawFlags of rawFlagLists) {
    const values = Array.isArray(rawFlags) ? rawFlags : rawFlags ? [rawFlags] : [];
    for (const value of values) {
      const flag = normalizeRiskFlag(value);
      if (flag && !flags.includes(flag)) flags.push(flag);
    }
  }

  const indicators: string[] = [];
  const booleanIndicators: Array<[string[], string]> = [
    [['face_match'], 'Face match failed'],
    [['faceMatch'], 'Face match failed'],
    [['liveness'], 'Liveness check failed'],
    [['liveness_check'], 'Liveness check failed'],
    [['document_authenticity'], 'Document authenticity failed'],
    [['documentAuthenticity'], 'Document authenticity failed'],
    [['watchlist_match'], 'Watchlist match'],
    [['sanctions_match'], 'Sanctions match'],
    [['duplicate_identity'], 'Duplicate identity signal'],
  ];
  for (const [path, label] of booleanIndicators) {
    const value = readNestedValue(data, [path]);
    if (value === false || value === true && /match|duplicate/.test(path[0])) {
      if (!indicators.includes(label)) indicators.push(label);
    }
  }

  const hasHighSignal = flags.some(flag => /sanction|watchlist|duplicate|fraud/i.test(flag))
    || indicators.some(indicator => /sanction|watchlist|duplicate/i.test(indicator));
  const resolvedLevel = level === 'unknown'
    ? hasHighSignal
      ? 'high'
      : Number.isFinite(score)
        ? score >= 70 ? 'high' : score >= 35 ? 'medium' : 'low'
        : flags.length || indicators.length ? 'medium' : 'unknown'
    : level;

  return {
    level: resolvedLevel,
    score: Number.isFinite(score) ? score : null,
    flags,
    indicators,
  };
}

function firstValue(source: Record<string, any>, keys: string[]): string | null {
  for (const key of keys) {
    const value = source?.[key];
    if (value === undefined || value === null || value === '') continue;
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (typeof value === 'object' && !Array.isArray(value)) {
      const nested = firstValue(value, ['value', 'text', 'formatted', 'full', 'name']);
      if (nested) return nested;
    }
  }
  return null;
}

/**
 * Didit has returned identity data in both features.document and the newer
 * id_verifications array. Keep the normalization in one place so webhook,
 * polling, and admin/user fallbacks cannot drift apart.
 */
export function extractDiditIdentity(payload: any): DiditIdentityData {
  const data = payload?.decision && typeof payload.decision === 'object'
    ? { ...payload, ...payload.decision }
    : payload || {};
  const verification = Array.isArray(data?.id_verifications)
    ? data.id_verifications.find((item: any) => item && typeof item === 'object') || {}
    : data?.id_verifications && typeof data.id_verifications === 'object'
      ? data.id_verifications
      : {};
  const document = data?.features?.document || data?.document || {};
  const verificationDetails = verification?.document || verification?.identity || verification;
  const liveness = Array.isArray(data?.liveness_checks)
    ? data.liveness_checks.find((item: any) => item && typeof item === 'object') || {}
    : {};
  const source = { ...document, ...liveness, ...verificationDetails };

  const firstName = firstValue(source, ['first_name', 'firstName']);
  const lastName = firstValue(source, ['last_name', 'lastName']);
  const fullName = firstValue(source, ['full_name', 'fullName', 'name'])
    || [firstName, lastName].filter(Boolean).join(' ')
    || null;

  return {
    firstName,
    lastName,
    fullName,
    dateOfBirth: firstValue(source, ['date_of_birth', 'dateOfBirth', 'birth_date']),
    idNumber: firstValue(source, ['document_number', 'documentNumber', 'id_number', 'idNumber']),
    documentType: firstValue(source, ['document_type', 'documentType', 'type']),
    nationality: firstValue(source, ['nationality', 'nationality_code']),
    gender: firstValue(source, ['gender', 'sex']),
    expiryDate: firstValue(source, ['expiry_date', 'expiryDate', 'expiration_date']),
    address: firstValue(source, ['address', 'full_address', 'residential_address']),
    issuingCountry: firstValue(source, ['issuing_country', 'issuingCountry', 'country_of_issue']),
  };
}

export function diditIdentityToUserFields(identity: DiditIdentityData): Record<string, string> {
  return Object.fromEntries(
    Object.entries({
      kycFullName: identity.fullName,
      kycDateOfBirth: identity.dateOfBirth,
      kycIdNumber: identity.idNumber,
      kycNationality: identity.nationality,
      kycGender: identity.gender,
      kycAddress: identity.address,
      kycDocumentType: identity.documentType,
      kycIdExpiryDate: identity.expiryDate,
      kycIssuingCountry: identity.issuingCountry,
    }).filter(([, value]) => value !== null && value !== undefined && value !== ''),
  ) as Record<string, string>;
}

export function diditIdentityToUserProfileFields(identity: DiditIdentityData): Record<string, string> {
  const country = identity.nationality || identity.issuingCountry;
  return Object.fromEntries(
    Object.entries({
      fullName: identity.fullName,
      country,
    }).filter(([, value]) => value !== null && value !== undefined && value !== ''),
  ) as Record<string, string>;
}

function getApiKey(): string | null {
  return process.env.DIDIT_API_KEY || null;
}

function getWorkflowId(): string | null {
  return process.env.DIDIT_WORKFLOW_ID || null;
}

/**
 * Map a didit session status to a Geepay KYC status
 */
export function mapDiditStatusToKyc(diditStatus: string): 'not_submitted' | 'pending' | 'verified' | 'rejected' {
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
      return 'pending';
    case 'Not Started':
      return 'not_submitted';
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
  secret: string,
  timestamp?: string
): boolean {
  try {
    const signedPayloads = [
      payload,
      ...(timestamp
        ? [`${timestamp}.${payload}`, `${timestamp}:${payload}`, `${timestamp}${payload}`]
        : []),
    ];
    const candidates = signature
      .trim()
      .split(/[.,]/)
      .flatMap(part => [part, part.replace(/^sha256=/i, '')])
      .filter(Boolean);

    return signedPayloads.some(signedPayload => {
      const expectedHex = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
      const expectedBase64 = crypto.createHmac('sha256', secret).update(signedPayload).digest('base64');
      return [expectedHex, expectedBase64].some(expected =>
        candidates.some(candidate => {
          const left = Buffer.from(candidate);
          const right = Buffer.from(expected);
          return left.length === right.length && crypto.timingSafeEqual(left, right);
        }),
      );
    });
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
