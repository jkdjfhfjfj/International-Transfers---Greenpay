import { storage } from "../storage";
import type { VirtualCard } from "@shared/schema";

const generationLocks = new Map<string, Promise<VirtualCard>>();

/**
 * Generates one card per successful purchase. The lock and existing-card
 * check make webhook retries and polling races safe on a single app instance.
 */
async function createCardForUser(userId: string, purchaseAmount = "60.00"): Promise<VirtualCard> {
  const existingCards = await storage.getVirtualCardsByUserId(userId);
  if (existingCards[0]) return existingCards[0];

  return storage.createVirtualCard({
    userId,
    currency: "USD",
    purchaseAmount,
  });
}

export const virtualCardService = {
  async generateCard(userId: string, purchaseAmount = "60.00"): Promise<VirtualCard> {
    const existingGeneration = generationLocks.get(userId);
    if (existingGeneration) return existingGeneration;

    const generation = createCardForUser(userId, purchaseAmount).finally(() => {
      generationLocks.delete(userId);
    });
    generationLocks.set(userId, generation);
    return generation;
  },
};