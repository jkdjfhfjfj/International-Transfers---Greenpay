import assert from "node:assert/strict";
import test from "node:test";
import { PayzaApiService } from "../server/services/payzaapi";

test("Payza hosted USD checkout sends the card-checkout payload and verifies the charge", async () => {
  const requests: Array<{ url: string; init?: any }> = [];
  const fetcher = async (url: any, init?: any) => {
    requests.push({ url: String(url), init });
    const responseBody = requests.length === 1
      ? {
          success: true,
          data: {
            reference: "GP-SANDBOX-1",
            status: "success",
            payment_url: "https://checkout.payzaapi.co.ke/pay/GP-SANDBOX-1",
            amount: 1,
            currency: "USD",
          },
        }
      : {
          success: true,
          data: {
            reference: "GP-SANDBOX-1",
            status: "success",
            amount: 1,
            currency: "USD",
          },
        };
    return { ok: true, status: 200, json: async () => responseBody } as any;
  };
  const service = new PayzaApiService({
    credentials: { publicKey: "pk_test_fake", secretKey: "sk_test_fake" },
    fetcher: fetcher as any,
  });

  const payment = await service.initializePayment({
    amount: 1,
    currency: "USD",
    reference: "GP-SANDBOX-1",
    email: "sandbox-checkout@example.com",
    callbackUrl: "https://example.com/payzaapi-sandbox-callback",
  });
  const verified = await service.verifyPayment(payment.reference);

  assert.equal(payment.paymentUrl, "https://checkout.payzaapi.co.ke/pay/GP-SANDBOX-1");
  assert.equal(verified.status, "completed");
  assert.equal(verified.amount, 1);
  assert.equal(verified.currency, "USD");
  assert.equal(requests[0].url, "https://payzaapi.co.ke/api/v1/pay");
  assert.equal(requests[1].url, "https://payzaapi.co.ke/api/v1/verify/GP-SANDBOX-1");
  assert.equal(requests[0].init.headers["X-Public-Key"], "pk_test_fake");
  const body = JSON.parse(requests[0].init.body);
  assert.equal(body.amount, 1);
  assert.equal(body.currency, "USD");
  assert.equal(body.stk_push, false);
});
