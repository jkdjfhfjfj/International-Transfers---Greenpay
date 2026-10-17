import { and, eq, isNull, lte } from "drizzle-orm";
import { db } from "../db";
import { accountDeletionRequests, advancedKycDocuments, kycDocuments } from "@shared/schema";
import { cloudinaryStorage } from "../cloudinaryStorage";

export async function purgeExpiredKycEvidence() {
  if (!db) return;
  const dueRequests = await db.select({
    id: accountDeletionRequests.id,
    userId: accountDeletionRequests.userId,
  }).from(accountDeletionRequests).where(and(
    eq(accountDeletionRequests.status, "approved"),
    lte(accountDeletionRequests.kycEvidenceExpiresAt, new Date()),
    isNull(accountDeletionRequests.kycEvidenceDeletedAt),
  )).limit(100);

  for (const request of dueRequests) {
    try {
      const [basic, advanced] = await Promise.all([
        db.select().from(kycDocuments).where(eq(kycDocuments.userId, request.userId)),
        db.select().from(advancedKycDocuments).where(eq(advancedKycDocuments.userId, request.userId)),
      ]);
      const files = [
        ...basic.flatMap((row: any) => [row.frontImageUrl, row.backImageUrl, row.selfieUrl]),
        ...advanced.flatMap((row: any) => [row.facialPhotoUrl, row.addressProofUrl]),
      ].filter((url): url is string => Boolean(url) && String(url).includes("cloudinary.com"));
      for (const url of Array.from(new Set(files))) await cloudinaryStorage.deleteFile(url);

      await db.delete(kycDocuments).where(eq(kycDocuments.userId, request.userId));
      await db.delete(advancedKycDocuments).where(eq(advancedKycDocuments.userId, request.userId));
      await db.update(accountDeletionRequests)
        .set({ kycEvidenceDeletedAt: new Date() })
        .where(and(
          eq(accountDeletionRequests.id, request.id),
          isNull(accountDeletionRequests.kycEvidenceDeletedAt),
        ));
    } catch (error) {
      console.error("[KYC retention] Evidence purge will retry:", error);
    }
  }
}

let retentionTimerStarted = false;
export function startKycRetentionPurge() {
  if (retentionTimerStarted) return;
  retentionTimerStarted = true;
  void purgeExpiredKycEvidence().catch(error => console.error("[KYC retention] Startup purge failed:", error));
  const timer = setInterval(() => {
    void purgeExpiredKycEvidence().catch(error => console.error("[KYC retention] Scheduled purge failed:", error));
  }, 24 * 60 * 60 * 1000);
  timer.unref?.();
}
