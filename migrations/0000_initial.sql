CREATE TABLE "admin_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" varchar,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" text,
	"details" json,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "admins" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"full_name" text NOT NULL,
	"role" text DEFAULT 'admin' NOT NULL,
	"two_factor_secret" text,
	"two_factor_enabled" boolean DEFAULT false,
	"last_login_at" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "advanced_kyc_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"facial_photo_url" text,
	"address_proof_url" text,
	"address_proof_type" text,
	"full_address" text,
	"city" text,
	"postal_code" text,
	"country" text,
	"status" text DEFAULT 'pending',
	"verification_notes" text,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_usage" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"tracking_id" varchar NOT NULL,
	"daily_count" integer DEFAULT 0,
	"last_reset_date" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"type" text DEFAULT 'announcement',
	"image_url" text,
	"action_url" text,
	"is_active" boolean DEFAULT true,
	"priority" integer DEFAULT 0,
	"starts_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "api_configurations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"display_name" text NOT NULL,
	"api_key" text,
	"api_secret" text,
	"base_url" text,
	"webhook_secret" text,
	"is_enabled" boolean DEFAULT true,
	"configuration" jsonb,
	"last_tested" timestamp,
	"test_status" text,
	"test_message" text,
	"updated_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "api_configurations_provider_unique" UNIQUE("provider")
);
--> statement-breakpoint
CREATE TABLE "bill_payments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"provider" text NOT NULL,
	"meter_number" text,
	"account_number" text,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'KES' NOT NULL,
	"status" text DEFAULT 'pending',
	"reference" text,
	"description" text,
	"fee" numeric(10, 2) DEFAULT '0.00',
	"metadata" jsonb,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"category" text NOT NULL,
	"budget_amount" numeric(10, 2) NOT NULL,
	"spent_amount" numeric(10, 2) DEFAULT '0.00',
	"period" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"alert_threshold" text DEFAULT '80',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"message" text NOT NULL,
	"is_from_admin" boolean DEFAULT false,
	"admin_id" varchar,
	"conversation_id" varchar NOT NULL,
	"status" text DEFAULT 'sent',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"admin_id" varchar,
	"status" text DEFAULT 'active',
	"title" text,
	"last_message_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "crypto_deposit_addresses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coin" text NOT NULL,
	"network" text NOT NULL,
	"network_label" text NOT NULL,
	"address" text NOT NULL,
	"memo" text,
	"qr_code_url" text,
	"min_deposit" numeric(18, 8) DEFAULT '0.00000000',
	"is_active" boolean DEFAULT true,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "crypto_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" text NOT NULL,
	"coin" text NOT NULL,
	"network" text NOT NULL,
	"amount" numeric(18, 8) NOT NULL,
	"usd_value" numeric(10, 2) NOT NULL,
	"tx_hash" text,
	"from_address" text,
	"to_address" text,
	"status" text DEFAULT 'pending',
	"confirmations" integer DEFAULT 0,
	"required_confirmations" integer DEFAULT 3,
	"fee" numeric(18, 8) DEFAULT '0.00000000',
	"admin_notes" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "crypto_wallets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"coin" text NOT NULL,
	"network" text NOT NULL,
	"address" text NOT NULL,
	"balance" numeric(18, 8) DEFAULT '0.00000000',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "deposit_bonuses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"method" text NOT NULL,
	"min_amount" numeric(18, 2) DEFAULT '0.00' NOT NULL,
	"bonus_amount" numeric(18, 2) NOT NULL,
	"bonus_type" text DEFAULT 'fixed' NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "kyc_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"document_type" text NOT NULL,
	"front_image_url" text,
	"back_image_url" text,
	"selfie_url" text,
	"date_of_birth" text,
	"address" text,
	"status" text DEFAULT 'pending',
	"verification_notes" text,
	"verified_at" timestamp,
	"didit_session_id" text,
	"didit_status" text,
	"didit_decision" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"currency" text NOT NULL,
	"wallet_id" varchar,
	"virtual_account_id" varchar,
	"card_id" varchar,
	"amount" numeric(18, 4) NOT NULL,
	"entry_type" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"transaction_id" varchar,
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "ledger_entries_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "loans" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" text DEFAULT 'active',
	"interest_rate" numeric(5, 2) DEFAULT '5.00',
	"repayment_period_months" integer DEFAULT 12,
	"monthly_payment" numeric(10, 2) NOT NULL,
	"remaining_balance" numeric(10, 2) NOT NULL,
	"disbursed_at" timestamp DEFAULT now(),
	"due_date" timestamp NOT NULL,
	"next_payment_date" timestamp,
	"total_payments_made" numeric(10, 2) DEFAULT '0.00',
	"payments_missed" integer DEFAULT 0,
	"performance_score" integer DEFAULT 100,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "login_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"device_type" text,
	"browser" text,
	"location" text,
	"status" text DEFAULT 'success',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"sender_id" varchar NOT NULL,
	"sender_type" text NOT NULL,
	"content" text NOT NULL,
	"message_type" text DEFAULT 'text',
	"file_url" text,
	"file_name" text,
	"file_size" integer,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text DEFAULT 'info',
	"is_global" boolean DEFAULT false,
	"user_id" varchar,
	"is_read" boolean DEFAULT false,
	"action_url" text,
	"metadata" jsonb,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payment_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_user_id" varchar NOT NULL,
	"recipient_id" varchar,
	"to_email" text,
	"to_phone" text,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'KES' NOT NULL,
	"message" text,
	"payment_link" text,
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "qr_payments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"payment_code" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"processed_at" timestamp,
	CONSTRAINT "qr_payments_payment_code_unique" UNIQUE("payment_code")
);
--> statement-breakpoint
CREATE TABLE "recipients" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"email" text,
	"account_number" text,
	"bank_name" text,
	"bank_code" text,
	"country" text NOT NULL,
	"currency" text DEFAULT 'KES' NOT NULL,
	"recipient_type" text DEFAULT 'mobile_wallet',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "savings_goals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text NOT NULL,
	"target_amount" numeric(10, 2) NOT NULL,
	"current_amount" numeric(10, 2) DEFAULT '0.00',
	"target_date" timestamp,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "scheduled_payments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"recipient_id" varchar,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"frequency" text NOT NULL,
	"next_payment_date" timestamp NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"last_payment_at" timestamp,
	"total_payments_made" text DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"issue_type" text NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'open',
	"priority" text DEFAULT 'medium',
	"assigned_admin_id" varchar,
	"admin_notes" text,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "system_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"level" text NOT NULL,
	"message" text NOT NULL,
	"source" text,
	"data" json,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" text NOT NULL,
	"key" text NOT NULL,
	"value" json NOT NULL,
	"description" text,
	"updated_by" varchar,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ticket_replies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"sender_type" text NOT NULL,
	"content" text NOT NULL,
	"file_url" text,
	"file_name" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transaction_disputes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"transaction_id" varchar NOT NULL,
	"reason" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'open',
	"admin_notes" text,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text NOT NULL,
	"recipient_id" varchar,
	"recipient_details" jsonb,
	"status" text DEFAULT 'pending',
	"failure_reason" text,
	"fee" numeric(10, 2) DEFAULT '0.00',
	"exchange_rate" numeric(10, 4),
	"description" text,
	"reference" text,
	"paystack_reference" text,
	"metadata" jsonb,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_activity_log" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"activity_type" text NOT NULL,
	"page" text,
	"action" text,
	"description" text,
	"status" text,
	"metadata" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"theme" text DEFAULT 'light',
	"language" text DEFAULT 'en',
	"biometric_enabled" boolean DEFAULT false,
	"transaction_limit" numeric(10, 2) DEFAULT '1000.00',
	"daily_limit" numeric(10, 2) DEFAULT '5000.00',
	"monthly_limit" numeric(10, 2) DEFAULT '50000.00',
	"email_notifications" boolean DEFAULT true,
	"sms_notifications" boolean DEFAULT true,
	"marketing_emails" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"country" text NOT NULL,
	"password" text NOT NULL,
	"profile_photo_url" text,
	"is_email_verified" boolean DEFAULT false,
	"is_phone_verified" boolean DEFAULT false,
	"kyc_status" text DEFAULT 'not_submitted',
	"advanced_kyc_status" text DEFAULT 'not_submitted',
	"advanced_kyc_requested" boolean DEFAULT false,
	"has_virtual_card" boolean DEFAULT false,
	"two_factor_secret" text,
	"two_factor_enabled" boolean DEFAULT false,
	"two_factor_backup_codes" text,
	"biometric_enabled" boolean DEFAULT false,
	"biometric_credentials" text,
	"dark_mode" boolean DEFAULT false,
	"push_notifications_enabled" boolean DEFAULT true,
	"balance" numeric(10, 2) DEFAULT '0.00',
	"kes_balance" numeric(10, 2) DEFAULT '0.00',
	"has_received_welcome_bonus" boolean DEFAULT false,
	"has_claimed_airtime_bonus" boolean DEFAULT false,
	"otp_code" text,
	"otp_expiry" timestamp,
	"paystack_customer_id" text,
	"default_currency" text DEFAULT 'KES',
	"pin_enabled" boolean DEFAULT false,
	"pin_code" text,
	"is_suspended" boolean DEFAULT false,
	"suspended_at" timestamp,
	"suspension_reason" text,
	"fcm_token" text,
	"last_login_at" timestamp,
	"google_id" text,
	"kyc_full_name" text,
	"kyc_date_of_birth" text,
	"kyc_id_number" text,
	"kyc_nationality" text,
	"kyc_gender" text,
	"kyc_address" text,
	"kyc_document_type" text,
	"kyc_id_expiry_date" text,
	"kyc_issuing_country" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "virtual_account_applications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"currency" text NOT NULL,
	"status" text DEFAULT 'pending',
	"source_of_income" text NOT NULL,
	"monthly_volume" text NOT NULL,
	"purpose" text NOT NULL,
	"expected_senders" text,
	"declarations" jsonb NOT NULL,
	"admin_notes" text,
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "virtual_account_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"currency" text NOT NULL,
	"account_name" text NOT NULL,
	"bank_name" text NOT NULL,
	"account_number" text NOT NULL,
	"routing_number" text,
	"sort_code" text,
	"iban" text,
	"swift_code" text,
	"bank_address" text,
	"beneficiary_address" text,
	"payment_instructions" text,
	"is_active" boolean DEFAULT true,
	"updated_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "virtual_account_settings_currency_unique" UNIQUE("currency")
);
--> statement-breakpoint
CREATE TABLE "virtual_accounts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"application_id" varchar NOT NULL,
	"currency" text NOT NULL,
	"balance" numeric(18, 4) DEFAULT '0.0000',
	"hold_amount" numeric(18, 4) DEFAULT '0.0000',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "virtual_accounts_application_id_unique" UNIQUE("application_id")
);
--> statement-breakpoint
CREATE TABLE "virtual_cards" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"card_number" text NOT NULL,
	"expiry_date" text NOT NULL,
	"cvv" text NOT NULL,
	"balance" numeric(10, 2) DEFAULT '0.00',
	"status" text DEFAULT 'active',
	"freeze_reason" text,
	"block_reason" text,
	"purchase_amount" numeric(10, 2) DEFAULT '60.00',
	"paystack_reference" text,
	"purchase_date" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"currency" text NOT NULL,
	"label" text,
	"balance" numeric(18, 4) DEFAULT '0.0000',
	"hold_amount" numeric(18, 4) DEFAULT '0.0000',
	"withdrawal_hold_amount" numeric(18, 4) DEFAULT '0.0000',
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"is_suspended" boolean DEFAULT false,
	"suspend_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "whatsapp_config" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone_number_id" text NOT NULL,
	"business_account_id" text NOT NULL,
	"access_token" text NOT NULL,
	"verify_token" text DEFAULT 'greenpay_verify_token_2024' NOT NULL,
	"webhook_url" text,
	"is_active" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "whatsapp_conversations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone_number" text NOT NULL,
	"display_name" text,
	"last_message_at" timestamp,
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "whatsapp_conversations_phone_number_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
CREATE TABLE "whatsapp_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar NOT NULL,
	"phone_number" text NOT NULL,
	"content" text NOT NULL,
	"is_from_admin" boolean DEFAULT false,
	"status" text DEFAULT 'sent',
	"message_id" text,
	"message_type" text DEFAULT 'text',
	"file_url" text,
	"file_name" text,
	"file_size" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "withdrawal_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"status" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"provider" text,
	"provider_reference" text,
	"retry_count" integer DEFAULT 0,
	"refund_status" text DEFAULT 'not_applicable',
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "advanced_kyc_documents" ADD CONSTRAINT "advanced_kyc_documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_configurations" ADD CONSTRAINT "api_configurations_updated_by_admins_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_payments" ADD CONSTRAINT "bill_payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crypto_transactions" ADD CONSTRAINT "crypto_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crypto_wallets" ADD CONSTRAINT "crypto_wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_virtual_account_id_virtual_accounts_id_fk" FOREIGN KEY ("virtual_account_id") REFERENCES "public"."virtual_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_card_id_virtual_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."virtual_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "login_history" ADD CONSTRAINT "login_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_requests" ADD CONSTRAINT "payment_requests_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_requests" ADD CONSTRAINT "payment_requests_recipient_id_recipients_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."recipients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_payments" ADD CONSTRAINT "qr_payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipients" ADD CONSTRAINT "recipients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savings_goals" ADD CONSTRAINT "savings_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_payments" ADD CONSTRAINT "scheduled_payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_payments" ADD CONSTRAINT "scheduled_payments_recipient_id_recipients_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."recipients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_admin_id_users_id_fk" FOREIGN KEY ("assigned_admin_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_updated_by_admins_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_replies" ADD CONSTRAINT "ticket_replies_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_disputes" ADD CONSTRAINT "transaction_disputes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_disputes" ADD CONSTRAINT "transaction_disputes_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity_log" ADD CONSTRAINT "user_activity_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "virtual_account_applications" ADD CONSTRAINT "virtual_account_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "virtual_account_applications" ADD CONSTRAINT "virtual_account_applications_reviewed_by_admins_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "virtual_account_settings" ADD CONSTRAINT "virtual_account_settings_updated_by_admins_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "virtual_accounts" ADD CONSTRAINT "virtual_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "virtual_accounts" ADD CONSTRAINT "virtual_accounts_application_id_virtual_account_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."virtual_account_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "virtual_cards" ADD CONSTRAINT "virtual_cards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_conversation_id_whatsapp_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."whatsapp_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawal_events" ADD CONSTRAINT "withdrawal_events_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawal_events" ADD CONSTRAINT "withdrawal_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;