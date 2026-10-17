import { randomUUID } from "node:crypto";
import { PayzaApiService } from "../server/services/payzaapi";

const publicKey = process.env.PAYZA_SANDBOX_PUBLIC_KEY || "";
const secretKey = process.env.PAYZA_SANDBOX_SECRET_KEY || "";

if (!publicKey.startsWith("pk_test_") || !secretKey.startsWith("sk_test_")) {
  console.error("Payza sandbox check requires pk_test_ and sk_test_ credentials.");
  process.exitCode = 1;
} else {
  const reference = `GP-SANDBOX-${randomUUID()}`;
  const service = new PayzaApiService({
    credentials: { publicKey, secretKey },
  });

  try {
    const initialized = await service.initializePayment({
      amount: 1,
      currency: "USD",
      reference,
      email: "sandbox-checkout@example.com",
      callbackUrl: "https://example.com/payzaapi-sandbox-callback",
      redirectUrl: "https://example.com/payzaapi-sandbox-return",
      cancelUrl: "https://example.com/payzaapi-sandbox-cancel",
      description: "GreenPay hosted-card sandbox verification",
    });
    const verified = await service.verifyPayment(initialized.reference);

    if (
      verified.status !== "completed" ||
      verified.amount !== 1 ||
      verified.currency !== "USD"
    ) {
      throw new Error("Sandbox verification did not return completed USD 1.00.");
    }

    console.log("PASS: PayzaAPI test keys initialized and verified a completed USD hosted checkout.");
  } catch (error) {
    console.error(
      "FAIL: PayzaAPI sandbox checkout could not be confirmed.",
      error instanceof Error ? error.message : "Unknown provider error.",
    );
    process.exitCode = 1;
  }
}
