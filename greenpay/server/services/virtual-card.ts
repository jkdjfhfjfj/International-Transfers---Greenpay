import { storage } from "../storage";
import type { VirtualCard } from "@shared/schema";

const generationLocks = new Map<string, Promise<VirtualCard>>();

/**
 * Generates one card per successful purchase. The purchase reference, rather
 * than the user, is the idempotency key so later successful purchases can
 * create additional cards.
 */
async function createCardForUser(
  userId: string,
  purchaseAmount = "60.00",
  purchaseReference?: string,
): Promise<VirtualCard> {
  const existingCards = await storage.getVirtualCardsByUserId(userId);
  if (purchaseReference) {
    const existingPurchase = existingCards.find(
      card => card.paystackReference === purchaseReference,
    );
    if (existingPurchase) return existingPurchase;
  }

  return storage.createVirtualCard({
    userId,
    currency: "USD",
    purchaseAmount,
    paystackReference: purchaseReference ?? null,
  });
}

export const virtualCardService = {
  async generateCard(
    userId: string,
    purchaseAmount = "60.00",
    purchaseReference?: string,
  ): Promise<VirtualCard> {
    const lockKey = purchaseReference ? `${userId}:${purchaseReference}` : userId;
    const existingGeneration = generationLocks.get(lockKey);
    if (existingGeneration) return existingGeneration;

    const generation = createCardForUser(userId, purchaseAmount, purchaseReference).finally(() => {
      generationLocks.delete(lockKey);
    });
    generationLocks.set(lockKey, generation);
    return generation;
  },
};