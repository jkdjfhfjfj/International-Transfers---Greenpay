import { apiRequest } from "@/lib/queryClient";

function toBase64Url(value: ArrayBuffer | ArrayBufferView): string {
  const bytes = value instanceof ArrayBuffer
    ? new Uint8Array(value)
    : new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export async function enrollBiometric(userName: string, userEmail: string): Promise<any> {
  const optionsResponse = await apiRequest("GET", "/api/auth/biometric/options");
  const options = await optionsResponse.json();
  if (!optionsResponse.ok) throw new Error(options.message || "Unable to start biometric setup");

  const creationOptions = {
      challenge: fromBase64Url(options.challenge),
      rp: { name: "Geepay", id: options.rpId },
      user: {
        id: crypto.getRandomValues(new Uint8Array(16)),
        name: userEmail,
        displayName: userName,
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" },
        { alg: -257, type: "public-key" },
      ],
      timeout: 60000,
      authenticatorSelection: {
        residentKey: "required",
        requireResidentKey: true,
        userVerification: "required",
      },
      userVerification: "required",
  } as PublicKeyCredentialCreationOptions;
  const credential = await navigator.credentials.create({ publicKey: creationOptions }) as PublicKeyCredential | null;
  if (!credential) throw new Error("Biometric enrollment was cancelled");

  const response = credential.response as AuthenticatorAttestationResponse;
  const publicKey = response.getPublicKey?.();
  if (!publicKey) {
    throw new Error("This browser did not provide a verifiable public key. Please use a current browser.");
  }
  return {
    scope: options.scope,
    challenge: options.challenge,
    credentialId: credential.id,
    clientDataJSON: toBase64Url(response.clientDataJSON),
    publicKey: toBase64Url(publicKey),
    rpId: options.rpId,
    origin: options.origin,
  };
}

export async function verifyBiometric(): Promise<any> {
  const optionsResponse = await apiRequest("GET", "/api/auth/biometric/login-options");
  const options = await optionsResponse.json();
  if (!optionsResponse.ok) throw new Error(options.message || "Unable to start biometric login");

  const credential = await navigator.credentials.get({
    publicKey: {
      challenge: fromBase64Url(options.challenge),
      timeout: 60000,
      userVerification: "preferred",
      rpId: options.rpId,
    },
  }) as PublicKeyCredential | null;
  if (!credential) throw new Error("Biometric authentication cancelled");

  const response = credential.response as AuthenticatorAssertionResponse;
  return {
    scope: options.scope,
    challenge: options.challenge,
    credentialId: credential.id,
    clientDataJSON: toBase64Url(response.clientDataJSON),
    authenticatorData: toBase64Url(response.authenticatorData),
    signature: toBase64Url(response.signature),
  };
}