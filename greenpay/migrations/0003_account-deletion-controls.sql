ALTER TABLE "account_deletion_requests"
  ADD COLUMN "confirmation_code_hash" text,
  ADD COLUMN "confirmation_expires_at" timestamp,
  ADD COLUMN "confirmation_attempts" integer NOT NULL DEFAULT 0,
  ADD COLUMN "confirmation_sent_at" timestamp,
  ADD COLUMN "kyc_evidence_expires_at" timestamp,
  ADD COLUMN "kyc_evidence_deleted_at" timestamp;
