import crypto from "crypto";

export interface StoredCredential {
  credentialId: string;
  publicKey: string;
  counter: number;
  rpId: string;
  origin: string;
}

type PendingChallenge = { challenge: string; timestamp: number };

function decodeBase64Url(value: string): Buffer {
  return Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function encodeBase64Url(value: Uint8Array): string {
  return Buffer.from(value).toString("base64url");
}

export class BiometricService {
  private challenges = new Map<string, PendingChallenge>();
  private readonly challengeTimeout = 5 * 60 * 1000;

  issueChallenge(scope: string): string {
    const challenge = crypto.randomBytes(32).toString("base64url");
    this.challenges.set(scope, { challenge, timestamp: Date.now() });
    return challenge;
  }

  consumeChallenge(scope: string, challenge: string): boolean {
    const pending = this.challenges.get(scope);
    this.challenges.delete(scope);
    return Boolean(
      pending &&
      pending.challenge === challenge &&
      Date.now() - pending.timestamp <= this.challengeTimeout,
    );
  }

  // Kept for older callers, but now uses the same one-time challenge store.
  generateChallenge(userId: string): string {
    return this.issueChallenge(userId);
  }

  verifyChallenge(userId: string, challenge: string): boolean {
    return this.consumeChallenge(userId, challenge);
  }

  verifyRegistration(params: {
    scope: string;
    challenge: string;
    credentialId: string;
    clientDataJSON: string;
    publicKey: string;
    rpId: string;
    origin: string;
  }): StoredCredential | null {
    if (!this.consumeChallenge(params.scope, params.challenge)) return null;
    try {
      const clientData = JSON.parse(decodeBase64Url(params.clientDataJSON).toString("utf8"));
      if (
        clientData.type !== "webauthn.create" ||
        clientData.challenge !== params.challenge ||
        clientData.origin !== params.origin
      ) return null;

      // getPublicKey() returns the credential's DER SubjectPublicKeyInfo.
      const key = crypto.createPublicKey({
        key: decodeBase64Url(params.publicKey),
        format: "der",
        type: "spki",
      });
      if (!key) return null;

      return {
        credentialId: params.credentialId,
        publicKey: params.publicKey,
        counter: 0,
        rpId: params.rpId,
        origin: params.origin,
      };
    } catch {
      return null;
    }
  }

  verifyAssertion(params: {
    scope: string;
    challenge: string;
    credential: StoredCredential;
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
  }): boolean {
    if (!this.consumeChallenge(params.scope, params.challenge)) return false;
    try {
      const clientDataBytes = decodeBase64Url(params.clientDataJSON);
      const clientData = JSON.parse(clientDataBytes.toString("utf8"));
      if (
        clientData.type !== "webauthn.get" ||
        clientData.challenge !== params.challenge ||
        clientData.origin !== params.credential.origin
      ) return false;

      const authenticatorData = decodeBase64Url(params.authenticatorData);
      if (authenticatorData.length < 37) return false;
      const expectedRpHash = crypto.createHash("sha256").update(params.credential.rpId).digest();
      if (!authenticatorData.subarray(0, 32).equals(expectedRpHash)) return false;
      // User present is mandatory. User verified is preferred, not required,
      // because platform authenticators can report UV according to device policy.
      if ((authenticatorData[32] & 0x01) === 0) return false;

      const clientDataHash = crypto.createHash("sha256").update(clientDataBytes).digest();
      const signedData = Buffer.concat([authenticatorData, clientDataHash]);
      const publicKey = crypto.createPublicKey({
        key: decodeBase64Url(params.credential.publicKey),
        format: "der",
        type: "spki",
      });
      const valid = crypto.verify(
        "sha256",
        signedData,
        publicKey,
        decodeBase64Url(params.signature),
      );
      if (!valid) return false;

      const counter = authenticatorData.readUInt32BE(33);
      // A non-zero stored counter must advance. Counter 0 is allowed for
      // authenticators that do not maintain a signature counter.
      if (params.credential.counter > 0 && counter > 0 && counter <= params.credential.counter) {
        return false;
      }
      params.credential.counter = counter;
      return true;
    } catch {
      return false;
    }
  }

  // Compatibility shim: no credential ID alone is ever accepted anymore.
  verifyBiometric(): boolean {
    return false;
  }

  async registerBiometric(_userId: string, credential: StoredCredential): Promise<boolean> {
    return Boolean(credential?.credentialId && credential?.publicKey);
  }
}

export const biometricService = new BiometricService();