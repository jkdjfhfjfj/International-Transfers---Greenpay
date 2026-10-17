CREATE TABLE "account_deletion_requests" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL,
  "reason" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "admin_note" text,
  "reviewed_by" text,
  "requested_at" timestamp DEFAULT now(),
  "reviewed_at" timestamp,
  CONSTRAINT "account_deletion_requests_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action
);
