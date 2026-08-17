var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  adminLogs: () => adminLogs,
  admins: () => admins,
  advancedKycDocuments: () => advancedKycDocuments,
  aiUsage: () => aiUsage,
  announcements: () => announcements,
  apiConfigurations: () => apiConfigurations,
  billPayments: () => billPayments,
  budgets: () => budgets,
  chatMessages: () => chatMessages,
  conversations: () => conversations,
  cryptoDepositAddresses: () => cryptoDepositAddresses,
  cryptoTransactions: () => cryptoTransactions,
  cryptoWallets: () => cryptoWallets,
  depositBonuses: () => depositBonuses,
  insertAdminLogSchema: () => insertAdminLogSchema,
  insertAdminSchema: () => insertAdminSchema,
  insertAdvancedKycSchema: () => insertAdvancedKycSchema,
  insertAiUsageSchema: () => insertAiUsageSchema,
  insertAnnouncementSchema: () => insertAnnouncementSchema,
  insertApiConfigurationSchema: () => insertApiConfigurationSchema,
  insertBillPaymentSchema: () => insertBillPaymentSchema,
  insertBudgetSchema: () => insertBudgetSchema,
  insertChatMessageSchema: () => insertChatMessageSchema,
  insertConversationSchema: () => insertConversationSchema,
  insertCryptoDepositAddressSchema: () => insertCryptoDepositAddressSchema,
  insertCryptoTransactionSchema: () => insertCryptoTransactionSchema,
  insertCryptoWalletSchema: () => insertCryptoWalletSchema,
  insertDepositBonusSchema: () => insertDepositBonusSchema,
  insertKycDocumentSchema: () => insertKycDocumentSchema,
  insertLoginHistorySchema: () => insertLoginHistorySchema,
  insertMessageSchema: () => insertMessageSchema,
  insertNotificationSchema: () => insertNotificationSchema,
  insertPaymentRequestSchema: () => insertPaymentRequestSchema,
  insertQRPaymentSchema: () => insertQRPaymentSchema,
  insertRecipientSchema: () => insertRecipientSchema,
  insertSavingsGoalSchema: () => insertSavingsGoalSchema,
  insertScheduledPaymentSchema: () => insertScheduledPaymentSchema,
  insertSupportTicketSchema: () => insertSupportTicketSchema,
  insertSystemLogSchema: () => insertSystemLogSchema,
  insertSystemSettingSchema: () => insertSystemSettingSchema,
  insertTicketReplySchema: () => insertTicketReplySchema,
  insertTransactionDisputeSchema: () => insertTransactionDisputeSchema,
  insertTransactionSchema: () => insertTransactionSchema,
  insertUserActivityLogSchema: () => insertUserActivityLogSchema,
  insertUserPreferencesSchema: () => insertUserPreferencesSchema,
  insertUserSchema: () => insertUserSchema,
  insertVirtualAccountApplicationSchema: () => insertVirtualAccountApplicationSchema,
  insertVirtualAccountSettingSchema: () => insertVirtualAccountSettingSchema,
  insertVirtualCardSchema: () => insertVirtualCardSchema,
  insertWalletSchema: () => insertWalletSchema,
  insertWhatsappConfigSchema: () => insertWhatsappConfigSchema,
  insertWhatsappConversationSchema: () => insertWhatsappConversationSchema,
  insertWhatsappMessageSchema: () => insertWhatsappMessageSchema,
  kycDocuments: () => kycDocuments,
  loans: () => loans,
  loginHistory: () => loginHistory,
  messages: () => messages,
  notifications: () => notifications,
  paymentRequests: () => paymentRequests,
  qrPayments: () => qrPayments,
  recipients: () => recipients,
  savingsGoals: () => savingsGoals,
  scheduledPayments: () => scheduledPayments,
  supportTickets: () => supportTickets,
  systemLogs: () => systemLogs,
  systemSettings: () => systemSettings,
  ticketReplies: () => ticketReplies,
  transactionDisputes: () => transactionDisputes,
  transactions: () => transactions,
  userActivityLog: () => userActivityLog,
  userPreferences: () => userPreferences,
  userSessions: () => userSessions,
  users: () => users,
  virtualAccountApplications: () => virtualAccountApplications,
  virtualAccountSettings: () => virtualAccountSettings,
  virtualCards: () => virtualCards,
  wallets: () => wallets,
  whatsappConfig: () => whatsappConfig,
  whatsappConversations: () => whatsappConversations,
  whatsappMessages: () => whatsappMessages
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, boolean, jsonb, json, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users, kycDocuments, virtualCards, transactions, recipients, paymentRequests, chatMessages, notifications, supportTickets, ticketReplies, conversations, messages, insertUserSchema, insertKycDocumentSchema, insertVirtualCardSchema, insertTransactionSchema, insertRecipientSchema, insertPaymentRequestSchema, insertSupportTicketSchema, insertConversationSchema, insertMessageSchema, insertChatMessageSchema, insertNotificationSchema, admins, adminLogs, systemLogs, systemSettings, apiConfigurations, insertAdminSchema, insertAdminLogSchema, insertSystemSettingSchema, insertSystemLogSchema, insertApiConfigurationSchema, savingsGoals, qrPayments, scheduledPayments, budgets, userPreferences, loginHistory, announcements, insertAnnouncementSchema, userSessions, whatsappConversations, whatsappMessages, whatsappConfig, userActivityLog, billPayments, loans, insertBillPaymentSchema, insertSavingsGoalSchema, insertQRPaymentSchema, insertScheduledPaymentSchema, insertBudgetSchema, insertUserPreferencesSchema, insertLoginHistorySchema, insertWhatsappConversationSchema, insertWhatsappMessageSchema, insertWhatsappConfigSchema, insertUserActivityLogSchema, insertTicketReplySchema, transactionDisputes, cryptoWallets, cryptoTransactions, aiUsage, insertAiUsageSchema, insertTransactionDisputeSchema, insertCryptoWalletSchema, insertCryptoTransactionSchema, cryptoDepositAddresses, insertCryptoDepositAddressSchema, depositBonuses, insertDepositBonusSchema, advancedKycDocuments, insertAdvancedKycSchema, wallets, insertWalletSchema, virtualAccountSettings, virtualAccountApplications, insertVirtualAccountSettingSchema, insertVirtualAccountApplicationSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    users = pgTable("users", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      fullName: text("full_name").notNull(),
      email: text("email").notNull().unique(),
      phone: text("phone").notNull().unique(),
      country: text("country").notNull(),
      password: text("password").notNull(),
      profilePhotoUrl: text("profile_photo_url"),
      isEmailVerified: boolean("is_email_verified").default(false),
      isPhoneVerified: boolean("is_phone_verified").default(false),
      kycStatus: text("kyc_status").default("not_submitted"),
      // not_submitted, pending, verified, rejected
      advancedKycStatus: text("advanced_kyc_status").default("not_submitted"),
      // not_submitted, pending, verified, rejected
      advancedKycRequested: boolean("advanced_kyc_requested").default(false),
      // admin-requested advanced KYC
      hasVirtualCard: boolean("has_virtual_card").default(false),
      twoFactorSecret: text("two_factor_secret"),
      twoFactorEnabled: boolean("two_factor_enabled").default(false),
      twoFactorBackupCodes: text("two_factor_backup_codes"),
      // JSON stringified array
      biometricEnabled: boolean("biometric_enabled").default(false),
      biometricCredentialId: text("biometric_credentials"),
      // WebAuthn credential ID - stored as JSON
      darkMode: boolean("dark_mode").default(false),
      pushNotificationsEnabled: boolean("push_notifications_enabled").default(true),
      balance: decimal("balance", { precision: 10, scale: 2 }).default("0.00"),
      // USD balance
      kesBalance: decimal("kes_balance", { precision: 10, scale: 2 }).default("0.00"),
      // KES balance
      hasReceivedWelcomeBonus: boolean("has_received_welcome_bonus").default(false),
      hasClaimedAirtimeBonus: boolean("has_claimed_airtime_bonus").default(false),
      otpCode: text("otp_code"),
      otpExpiry: timestamp("otp_expiry"),
      paystackCustomerId: text("paystack_customer_id"),
      defaultCurrency: text("default_currency").default("KES"),
      pinEnabled: boolean("pin_enabled").default(false),
      pinCode: text("pin_code"),
      isSuspended: boolean("is_suspended").default(false),
      suspendedAt: timestamp("suspended_at"),
      suspensionReason: text("suspension_reason"),
      fcmToken: text("fcm_token"),
      // Firebase Cloud Messaging token for push notifications
      lastLoginAt: timestamp("last_login_at"),
      googleId: text("google_id"),
      // KYC-extracted identity fields (auto-populated on verification, editable by admin only)
      kycFullName: text("kyc_full_name"),
      kycDateOfBirth: text("kyc_date_of_birth"),
      kycIdNumber: text("kyc_id_number"),
      // unique per verified identity
      kycNationality: text("kyc_nationality"),
      kycGender: text("kyc_gender"),
      kycAddress: text("kyc_address"),
      kycDocumentType: text("kyc_document_type"),
      kycIdExpiryDate: text("kyc_id_expiry_date"),
      kycIssuingCountry: text("kyc_issuing_country"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    kycDocuments = pgTable("kyc_documents", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      documentType: text("document_type").notNull(),
      // national_id, passport, drivers_license, didit_verification
      frontImageUrl: text("front_image_url"),
      backImageUrl: text("back_image_url"),
      selfieUrl: text("selfie_url"),
      dateOfBirth: text("date_of_birth"),
      address: text("address"),
      status: text("status").default("pending"),
      // pending, verified, rejected, re_verification_requested
      verificationNotes: text("verification_notes"),
      verifiedAt: timestamp("verified_at"),
      // Didit automated verification fields
      diditSessionId: text("didit_session_id"),
      diditStatus: text("didit_status"),
      // raw Didit status string
      diditDecision: jsonb("didit_decision"),
      // full Didit decision payload with features/extracted data
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    virtualCards = pgTable("virtual_cards", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      cardNumber: text("card_number").notNull(),
      expiryDate: text("expiry_date").notNull(),
      cvv: text("cvv").notNull(),
      balance: decimal("balance", { precision: 10, scale: 2 }).default("0.00"),
      status: text("status").default("active"),
      // active, frozen, expired, blocked
      freezeReason: text("freeze_reason"),
      blockReason: text("block_reason"),
      purchaseAmount: decimal("purchase_amount", { precision: 10, scale: 2 }).default("60.00"),
      paystackReference: text("paystack_reference"),
      purchaseDate: timestamp("purchase_date").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    transactions = pgTable("transactions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      type: text("type").notNull(),
      // send, receive, deposit, withdraw, card_purchase
      amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
      currency: text("currency").notNull(),
      recipientId: varchar("recipient_id").references(() => users.id),
      recipientDetails: jsonb("recipient_details"),
      // name, phone, email, bank details
      status: text("status").default("pending"),
      // pending, processing, completed, failed, cancelled
      failureReason: text("failure_reason"),
      fee: decimal("fee", { precision: 10, scale: 2 }).default("0.00"),
      exchangeRate: decimal("exchange_rate", { precision: 10, scale: 4 }),
      description: text("description"),
      reference: text("reference"),
      paystackReference: text("paystack_reference"),
      metadata: jsonb("metadata"),
      completedAt: timestamp("completed_at"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    recipients = pgTable("recipients", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      name: text("name").notNull(),
      phone: text("phone"),
      email: text("email"),
      accountNumber: text("account_number"),
      bankName: text("bank_name"),
      bankCode: text("bank_code"),
      country: text("country").notNull(),
      currency: text("currency").notNull().default("KES"),
      recipientType: text("recipient_type").default("mobile_wallet"),
      // bank, mobile_wallet, cash_pickup
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    paymentRequests = pgTable("payment_requests", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      fromUserId: varchar("from_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      recipientId: varchar("recipient_id").references(() => recipients.id),
      toEmail: text("to_email"),
      toPhone: text("to_phone"),
      amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
      currency: text("currency").notNull().default("KES"),
      message: text("message"),
      paymentLink: text("payment_link"),
      status: text("status").default("pending"),
      // pending, paid, expired
      createdAt: timestamp("created_at").defaultNow()
    });
    chatMessages = pgTable("chat_messages", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      message: text("message").notNull(),
      isFromAdmin: boolean("is_from_admin").default(false),
      adminId: varchar("admin_id").references(() => users.id, { onDelete: "cascade" }),
      conversationId: varchar("conversation_id").notNull(),
      // Groups messages by support session
      status: text("status").default("sent"),
      // sent, delivered, read
      createdAt: timestamp("created_at").defaultNow()
    });
    notifications = pgTable("notifications", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      title: text("title").notNull(),
      message: text("message").notNull(),
      type: text("type").default("info"),
      // info, success, warning, error
      isGlobal: boolean("is_global").default(false),
      // true for admin broadcasts
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
      // null for global notifications
      isRead: boolean("is_read").default(false),
      actionUrl: text("action_url"),
      metadata: jsonb("metadata"),
      expiresAt: timestamp("expires_at"),
      createdAt: timestamp("created_at").defaultNow()
    });
    supportTickets = pgTable("support_tickets", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      issueType: text("issue_type").notNull(),
      description: text("description").notNull(),
      status: text("status").default("open"),
      // open, in_progress, resolved, closed
      priority: text("priority").default("medium"),
      // low, medium, high, urgent
      assignedAdminId: varchar("assigned_admin_id").references(() => users.id, { onDelete: "set null" }),
      adminNotes: text("admin_notes"),
      resolvedAt: timestamp("resolved_at"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    ticketReplies = pgTable("ticket_replies", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      ticketId: varchar("ticket_id").references(() => supportTickets.id, { onDelete: "cascade" }).notNull(),
      userId: varchar("user_id").notNull(),
      // Can be user ID or admin ID
      senderType: text("sender_type").notNull(),
      // user, admin
      content: text("content").notNull(),
      fileUrl: text("file_url"),
      fileName: text("file_name"),
      createdAt: timestamp("created_at").defaultNow()
    });
    conversations = pgTable("conversations", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      adminId: varchar("admin_id").references(() => admins.id),
      status: text("status").default("active"),
      // active, closed
      title: text("title"),
      lastMessageAt: timestamp("last_message_at"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    messages = pgTable("messages", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      conversationId: varchar("conversation_id").references(() => conversations.id).notNull(),
      senderId: varchar("sender_id").notNull(),
      senderType: text("sender_type").notNull(),
      // user, admin
      content: text("content").notNull(),
      messageType: text("message_type").default("text"),
      // text, file, image
      fileUrl: text("file_url"),
      fileName: text("file_name"),
      fileSize: integer("file_size"),
      readAt: timestamp("read_at"),
      createdAt: timestamp("created_at").defaultNow()
    });
    insertUserSchema = createInsertSchema(users).omit({
      id: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      kycStatus: true,
      hasVirtualCard: true,
      createdAt: true
    });
    insertKycDocumentSchema = createInsertSchema(kycDocuments).omit({
      id: true,
      status: true,
      createdAt: true
    });
    insertVirtualCardSchema = createInsertSchema(virtualCards).omit({
      id: true,
      cardNumber: true,
      expiryDate: true,
      cvv: true,
      balance: true,
      status: true,
      purchaseDate: true
    });
    insertTransactionSchema = createInsertSchema(transactions).omit({
      id: true,
      createdAt: true
    });
    insertRecipientSchema = createInsertSchema(recipients).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertPaymentRequestSchema = createInsertSchema(paymentRequests).omit({
      id: true,
      status: true,
      createdAt: true
    });
    insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
      id: true,
      userId: true,
      // userId comes from session, not request body
      status: true,
      priority: true,
      resolvedAt: true,
      createdAt: true,
      updatedAt: true
    });
    insertConversationSchema = createInsertSchema(conversations).omit({
      id: true,
      status: true,
      lastMessageAt: true,
      createdAt: true,
      updatedAt: true
    });
    insertMessageSchema = createInsertSchema(messages).omit({
      id: true,
      senderId: true,
      // senderId comes from session, not request body
      senderType: true,
      // senderType comes from session, not request body
      readAt: true,
      createdAt: true
    });
    insertChatMessageSchema = createInsertSchema(chatMessages).omit({
      id: true,
      createdAt: true
    });
    insertNotificationSchema = createInsertSchema(notifications).omit({
      id: true,
      createdAt: true
    });
    admins = pgTable("admins", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      email: text("email").notNull().unique(),
      password: text("password").notNull(),
      fullName: text("full_name").notNull(),
      role: text("role").notNull().default("admin"),
      twoFactorSecret: text("two_factor_secret"),
      twoFactorEnabled: boolean("two_factor_enabled").default(false),
      lastLoginAt: timestamp("last_login_at"),
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    adminLogs = pgTable("admin_logs", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      adminId: varchar("admin_id").references(() => admins.id),
      action: text("action").notNull(),
      targetType: text("target_type"),
      // user, transaction, kyc, etc.
      targetId: text("target_id"),
      details: json("details"),
      ipAddress: text("ip_address"),
      userAgent: text("user_agent"),
      createdAt: timestamp("created_at").defaultNow()
    });
    systemLogs = pgTable("system_logs", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      level: text("level").notNull(),
      // info, warn, error, debug, api
      message: text("message").notNull(),
      source: text("source"),
      data: json("data"),
      timestamp: timestamp("timestamp").defaultNow()
    });
    systemSettings = pgTable("system_settings", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      category: text("category").notNull(),
      // fees, limits, currencies, etc.
      key: text("key").notNull(),
      value: json("value").notNull(),
      description: text("description"),
      updatedBy: varchar("updated_by").references(() => admins.id),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    apiConfigurations = pgTable("api_configurations", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      provider: text("provider").notNull().unique(),
      // 'exchange_rate', 'paystack', 'payhero'
      displayName: text("display_name").notNull(),
      apiKey: text("api_key"),
      apiSecret: text("api_secret"),
      baseUrl: text("base_url"),
      webhookSecret: text("webhook_secret"),
      isEnabled: boolean("is_enabled").default(true),
      configuration: jsonb("configuration"),
      // Additional provider-specific settings
      lastTested: timestamp("last_tested"),
      testStatus: text("test_status"),
      // 'success', 'failed', 'pending'
      testMessage: text("test_message"),
      updatedBy: varchar("updated_by").references(() => admins.id),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertAdminSchema = createInsertSchema(admins).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertAdminLogSchema = createInsertSchema(adminLogs).omit({
      id: true,
      createdAt: true
    });
    insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
      id: true,
      updatedAt: true
    });
    insertSystemLogSchema = createInsertSchema(systemLogs).omit({
      id: true,
      timestamp: true
    });
    insertApiConfigurationSchema = createInsertSchema(apiConfigurations).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    savingsGoals = pgTable("savings_goals", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      title: text("title").notNull(),
      targetAmount: decimal("target_amount", { precision: 10, scale: 2 }).notNull(),
      currentAmount: decimal("current_amount", { precision: 10, scale: 2 }).default("0.00"),
      targetDate: timestamp("target_date"),
      description: text("description"),
      isActive: boolean("is_active").notNull().default(true),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    qrPayments = pgTable("qr_payments", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      paymentCode: text("payment_code").notNull().unique(),
      amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
      currency: text("currency").notNull().default("USD"),
      description: text("description"),
      isActive: boolean("is_active").notNull().default(true),
      expiresAt: timestamp("expires_at").notNull(),
      createdAt: timestamp("created_at").defaultNow(),
      processedAt: timestamp("processed_at")
    });
    scheduledPayments = pgTable("scheduled_payments", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      recipientId: varchar("recipient_id").references(() => recipients.id),
      amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
      currency: text("currency").notNull().default("USD"),
      frequency: text("frequency").notNull(),
      // daily, weekly, monthly, yearly
      nextPaymentDate: timestamp("next_payment_date").notNull(),
      description: text("description"),
      isActive: boolean("is_active").notNull().default(true),
      createdAt: timestamp("created_at").defaultNow(),
      lastPaymentAt: timestamp("last_payment_at"),
      totalPaymentsMade: text("total_payments_made").notNull().default("0")
    });
    budgets = pgTable("budgets", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      category: text("category").notNull(),
      budgetAmount: decimal("budget_amount", { precision: 10, scale: 2 }).notNull(),
      spentAmount: decimal("spent_amount", { precision: 10, scale: 2 }).default("0.00"),
      period: text("period").notNull(),
      // monthly, weekly, yearly
      startDate: timestamp("start_date").notNull(),
      endDate: timestamp("end_date").notNull(),
      isActive: boolean("is_active").notNull().default(true),
      alertThreshold: text("alert_threshold").default("80"),
      // Alert when 80% of budget is spent
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    userPreferences = pgTable("user_preferences", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
      theme: text("theme").default("light"),
      // light, dark, auto
      language: text("language").default("en"),
      biometricEnabled: boolean("biometric_enabled").default(false),
      transactionLimit: decimal("transaction_limit", { precision: 10, scale: 2 }).default("1000.00"),
      dailyLimit: decimal("daily_limit", { precision: 10, scale: 2 }).default("5000.00"),
      monthlyLimit: decimal("monthly_limit", { precision: 10, scale: 2 }).default("50000.00"),
      emailNotifications: boolean("email_notifications").default(true),
      smsNotifications: boolean("sms_notifications").default(true),
      marketingEmails: boolean("marketing_emails").default(false),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    loginHistory = pgTable("login_history", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      ipAddress: text("ip_address"),
      userAgent: text("user_agent"),
      deviceType: text("device_type"),
      // mobile, desktop, tablet
      browser: text("browser"),
      location: text("location"),
      // City, Country
      status: text("status").default("success"),
      // success, failed
      createdAt: timestamp("created_at").defaultNow()
    });
    announcements = pgTable("announcements", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      title: text("title").notNull(),
      content: text("content").notNull(),
      type: text("type").default("announcement"),
      // announcement, offer, promotion
      imageUrl: text("image_url"),
      actionUrl: text("action_url"),
      isActive: boolean("is_active").default(true),
      priority: integer("priority").default(0),
      startsAt: timestamp("starts_at").defaultNow(),
      expiresAt: timestamp("expires_at"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertAnnouncementSchema = createInsertSchema(announcements).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    userSessions = pgTable("user_sessions", {
      sid: varchar("sid").primaryKey(),
      sess: jsonb("sess").notNull(),
      expire: timestamp("expire").notNull()
    });
    whatsappConversations = pgTable("whatsapp_conversations", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      phoneNumber: text("phone_number").notNull().unique(),
      displayName: text("display_name"),
      lastMessageAt: timestamp("last_message_at"),
      status: text("status").default("active"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    whatsappMessages = pgTable("whatsapp_messages", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      conversationId: varchar("conversation_id").references(() => whatsappConversations.id, { onDelete: "cascade" }).notNull(),
      phoneNumber: text("phone_number").notNull(),
      content: text("content").notNull(),
      isFromAdmin: boolean("is_from_admin").default(false),
      status: text("status").default("sent"),
      messageId: text("message_id"),
      messageType: text("message_type").default("text"),
      // text, file, image, video
      fileUrl: text("file_url"),
      fileName: text("file_name"),
      fileSize: integer("file_size"),
      createdAt: timestamp("created_at").defaultNow()
    });
    whatsappConfig = pgTable("whatsapp_config", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      phoneNumberId: text("phone_number_id").notNull(),
      businessAccountId: text("business_account_id").notNull(),
      accessToken: text("access_token").notNull(),
      verifyToken: text("verify_token").notNull().default("greenpay_verify_token_2024"),
      webhookUrl: text("webhook_url"),
      isActive: boolean("is_active").default(false),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    userActivityLog = pgTable("user_activity_log", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      activityType: text("activity_type").notNull(),
      // page_visit, action, attempt, form_submission
      page: text("page"),
      // /send-money, /airtime, /dashboard, etc.
      action: text("action"),
      // submit_transfer, buy_airtime, fill_kyc, etc.
      description: text("description"),
      // Human-readable description
      status: text("status"),
      // success, failed, pending
      metadata: jsonb("metadata"),
      // Additional details like form data, errors
      ipAddress: text("ip_address"),
      userAgent: text("user_agent"),
      createdAt: timestamp("created_at").defaultNow()
    });
    billPayments = pgTable("bill_payments", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      provider: text("provider").notNull(),
      // KPLC, Zuku, StarimesTV, Nairobi_Water, Kenya_Power, Airtel_Money, etc
      meterNumber: text("meter_number"),
      // For electricity/water bills
      accountNumber: text("account_number"),
      // For cable/internet bills
      amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
      currency: text("currency").default("KES").notNull(),
      status: text("status").default("pending"),
      // pending, processing, completed, failed
      reference: text("reference"),
      // Transaction reference from provider
      description: text("description"),
      fee: decimal("fee", { precision: 10, scale: 2 }).default("0.00"),
      metadata: jsonb("metadata"),
      // Provider-specific response data
      completedAt: timestamp("completed_at"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    loans = pgTable("loans", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
      currency: text("currency").notNull().default("USD"),
      status: text("status").default("active"),
      // active, completed, defaulted, cancelled
      interestRate: decimal("interest_rate", { precision: 5, scale: 2 }).default("5.00"),
      // Annual percentage
      repaymentPeriodMonths: integer("repayment_period_months").default(12),
      monthlyPayment: decimal("monthly_payment", { precision: 10, scale: 2 }).notNull(),
      remainingBalance: decimal("remaining_balance", { precision: 10, scale: 2 }).notNull(),
      disbursedAt: timestamp("disbursed_at").defaultNow(),
      dueDate: timestamp("due_date").notNull(),
      nextPaymentDate: timestamp("next_payment_date"),
      totalPaymentsMade: decimal("total_payments_made", { precision: 10, scale: 2 }).default("0.00"),
      paymentsMissed: integer("payments_missed").default(0),
      performanceScore: integer("performance_score").default(100),
      // 0-100 based on account activity
      adminNotes: text("admin_notes"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertBillPaymentSchema = createInsertSchema(billPayments).omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      completedAt: true
    });
    insertSavingsGoalSchema = createInsertSchema(savingsGoals).omit({
      id: true,
      currentAmount: true,
      createdAt: true,
      updatedAt: true
    });
    insertQRPaymentSchema = createInsertSchema(qrPayments).omit({
      id: true,
      paymentCode: true,
      createdAt: true,
      processedAt: true
    });
    insertScheduledPaymentSchema = createInsertSchema(scheduledPayments).omit({
      id: true,
      createdAt: true,
      lastPaymentAt: true,
      totalPaymentsMade: true
    });
    insertBudgetSchema = createInsertSchema(budgets).omit({
      id: true,
      spentAmount: true,
      createdAt: true,
      updatedAt: true
    });
    insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertLoginHistorySchema = createInsertSchema(loginHistory).omit({
      id: true,
      createdAt: true
    });
    insertWhatsappConversationSchema = createInsertSchema(whatsappConversations).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertWhatsappMessageSchema = createInsertSchema(whatsappMessages).omit({
      id: true,
      createdAt: true
    });
    insertWhatsappConfigSchema = createInsertSchema(whatsappConfig).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertUserActivityLogSchema = createInsertSchema(userActivityLog).omit({
      id: true,
      createdAt: true
    });
    insertTicketReplySchema = createInsertSchema(ticketReplies).omit({ id: true, createdAt: true });
    transactionDisputes = pgTable("transaction_disputes", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      transactionId: varchar("transaction_id").references(() => transactions.id, { onDelete: "cascade" }).notNull(),
      reason: text("reason").notNull(),
      // unauthorized, duplicate, wrong_amount, fraud, other
      description: text("description"),
      status: text("status").default("open"),
      // open, under_review, resolved, rejected
      adminNotes: text("admin_notes"),
      resolvedAt: timestamp("resolved_at"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    cryptoWallets = pgTable("crypto_wallets", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      coin: text("coin").notNull(),
      // BTC, ETH, USDT, USDC
      network: text("network").notNull(),
      // bitcoin, ethereum, tron (for USDT TRC-20)
      address: text("address").notNull(),
      balance: decimal("balance", { precision: 18, scale: 8 }).default("0.00000000"),
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    cryptoTransactions = pgTable("crypto_transactions", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      type: text("type").notNull(),
      // deposit, withdrawal, card_purchase
      coin: text("coin").notNull(),
      // BTC, ETH, USDT, USDC
      network: text("network").notNull(),
      amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
      // crypto amount
      usdValue: decimal("usd_value", { precision: 10, scale: 2 }).notNull(),
      // equivalent USD
      txHash: text("tx_hash"),
      // blockchain transaction hash
      fromAddress: text("from_address"),
      toAddress: text("to_address"),
      status: text("status").default("pending"),
      // pending, confirming, completed, failed
      confirmations: integer("confirmations").default(0),
      requiredConfirmations: integer("required_confirmations").default(3),
      fee: decimal("fee", { precision: 18, scale: 8 }).default("0.00000000"),
      adminNotes: text("admin_notes"),
      completedAt: timestamp("completed_at"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    aiUsage = pgTable("ai_usage", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id"),
      // Can be null for guest users tracked by IP
      trackingId: varchar("tracking_id").notNull(),
      // user_id or guest-{ip}
      dailyCount: integer("daily_count").default(0),
      lastResetDate: timestamp("last_reset_date").defaultNow(),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertAiUsageSchema = createInsertSchema(aiUsage).omit({ id: true, createdAt: true, updatedAt: true });
    insertTransactionDisputeSchema = createInsertSchema(transactionDisputes).omit({ id: true, createdAt: true, updatedAt: true, resolvedAt: true, status: true, adminNotes: true });
    insertCryptoWalletSchema = createInsertSchema(cryptoWallets).omit({ id: true, createdAt: true, updatedAt: true, balance: true });
    insertCryptoTransactionSchema = createInsertSchema(cryptoTransactions).omit({ id: true, createdAt: true, updatedAt: true, completedAt: true });
    cryptoDepositAddresses = pgTable("crypto_deposit_addresses", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      coin: text("coin").notNull(),
      // BTC, ETH, USDT, USDC
      network: text("network").notNull(),
      // bitcoin, ethereum, tron, bsc, polygon, etc.
      networkLabel: text("network_label").notNull(),
      // "Bitcoin Network", "Ethereum (ERC-20)", "TRON (TRC-20)"
      address: text("address").notNull(),
      memo: text("memo"),
      // optional memo/tag for some networks
      qrCodeUrl: text("qr_code_url"),
      // optional admin-uploaded QR
      minDeposit: decimal("min_deposit", { precision: 18, scale: 8 }).default("0.00000000"),
      isActive: boolean("is_active").default(true),
      notes: text("notes"),
      // optional admin notes shown to users
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertCryptoDepositAddressSchema = createInsertSchema(cryptoDepositAddresses).omit({ id: true, createdAt: true, updatedAt: true });
    depositBonuses = pgTable("deposit_bonuses", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      method: text("method").notNull(),
      // mpesa | crypto | bank_transfer | card | any
      minAmount: decimal("min_amount", { precision: 18, scale: 2 }).notNull().default("0.00"),
      bonusAmount: decimal("bonus_amount", { precision: 18, scale: 2 }).notNull(),
      bonusType: text("bonus_type").notNull().default("fixed"),
      // fixed | percentage
      description: text("description"),
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertDepositBonusSchema = createInsertSchema(depositBonuses).omit({ id: true, createdAt: true, updatedAt: true });
    advancedKycDocuments = pgTable("advanced_kyc_documents", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      facialPhotoUrl: text("facial_photo_url"),
      addressProofUrl: text("address_proof_url"),
      addressProofType: text("address_proof_type"),
      // utility_bill, bank_statement, lease, government_letter, other
      fullAddress: text("full_address"),
      city: text("city"),
      postalCode: text("postal_code"),
      country: text("country"),
      status: text("status").default("pending"),
      // pending, verified, rejected
      verificationNotes: text("verification_notes"),
      verifiedAt: timestamp("verified_at"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertAdvancedKycSchema = createInsertSchema(advancedKycDocuments).omit({ id: true, createdAt: true, updatedAt: true });
    wallets = pgTable("wallets", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      currency: text("currency").notNull(),
      // 'USD', 'KES', 'UGX', etc.
      label: text("label"),
      // Optional custom name
      balance: decimal("balance", { precision: 18, scale: 4 }).default("0.0000"),
      holdAmount: decimal("hold_amount", { precision: 18, scale: 4 }).default("0.0000"),
      withdrawalHoldAmount: decimal("withdrawal_hold_amount", { precision: 18, scale: 4 }).default("0.0000"),
      isDefault: boolean("is_default").default(false),
      isActive: boolean("is_active").default(true),
      isSuspended: boolean("is_suspended").default(false),
      suspendReason: text("suspend_reason"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertWalletSchema = createInsertSchema(wallets).omit({ id: true, createdAt: true, updatedAt: true });
    virtualAccountSettings = pgTable("virtual_account_settings", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      currency: text("currency").notNull().unique(),
      accountName: text("account_name").notNull(),
      bankName: text("bank_name").notNull(),
      accountNumber: text("account_number").notNull(),
      routingNumber: text("routing_number"),
      sortCode: text("sort_code"),
      iban: text("iban"),
      swiftCode: text("swift_code"),
      bankAddress: text("bank_address"),
      beneficiaryAddress: text("beneficiary_address"),
      paymentInstructions: text("payment_instructions"),
      isActive: boolean("is_active").default(true),
      updatedBy: varchar("updated_by").references(() => admins.id),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    virtualAccountApplications = pgTable("virtual_account_applications", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      currency: text("currency").notNull(),
      status: text("status").default("pending"),
      // pending, approved, rejected
      sourceOfIncome: text("source_of_income").notNull(),
      monthlyVolume: text("monthly_volume").notNull(),
      purpose: text("purpose").notNull(),
      expectedSenders: text("expected_senders"),
      declarations: jsonb("declarations").notNull(),
      adminNotes: text("admin_notes"),
      reviewedBy: varchar("reviewed_by").references(() => admins.id),
      reviewedAt: timestamp("reviewed_at"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    insertVirtualAccountSettingSchema = createInsertSchema(virtualAccountSettings).omit({ id: true, createdAt: true, updatedAt: true });
    insertVirtualAccountApplicationSchema = createInsertSchema(virtualAccountApplications).omit({ id: true, status: true, adminNotes: true, reviewedBy: true, reviewedAt: true, createdAt: true, updatedAt: true });
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  db: () => db,
  ensureSchema: () => ensureSchema,
  pool: () => pool
});
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
function resolveConnectionString() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL.replace(/^"(.*)"$/, "$1").trim();
  }
  const { PGHOST, PGUSER, PGPASSWORD, PGDATABASE, PGPORT } = process.env;
  if (PGHOST && PGUSER && PGPASSWORD && PGDATABASE) {
    const port = PGPORT || "5432";
    return `postgresql://${PGUSER}:${encodeURIComponent(PGPASSWORD)}@${PGHOST}:${port}/${PGDATABASE}?sslmode=require`;
  }
  return null;
}
async function alterMissingColumns() {
  const migrations = [
    // Multi-currency wallets table
    `CREATE TABLE IF NOT EXISTS wallets (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      currency TEXT NOT NULL,
      label TEXT,
      balance DECIMAL(18,4) DEFAULT 0.0000,
      hold_amount DECIMAL(18,4) DEFAULT 0.0000,
      is_default BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      is_suspended BOOLEAN DEFAULT false,
      suspend_reason TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS wallets_user_currency_idx ON wallets(user_id, currency)`,
    `ALTER TABLE wallets ADD COLUMN IF NOT EXISTS withdrawal_hold_amount DECIMAL(18,4) DEFAULT 0.0000`,
    `UPDATE wallets SET withdrawal_hold_amount = 0.0000 WHERE withdrawal_hold_amount IS NULL`,
    // Migrate existing USD balances to wallets
    `INSERT INTO wallets (user_id, currency, balance, is_default, is_active)
     SELECT id, 'USD', COALESCE(balance, 0), true, true FROM users
     WHERE NOT EXISTS (SELECT 1 FROM wallets w WHERE w.user_id = users.id AND w.currency = 'USD')
     ON CONFLICT DO NOTHING`,
    // Migrate existing KES balances to wallets
    `INSERT INTO wallets (user_id, currency, balance, is_default, is_active)
     SELECT id, 'KES', COALESCE(kes_balance, 0), false, true FROM users
     WHERE NOT EXISTS (SELECT 1 FROM wallets w WHERE w.user_id = users.id AND w.currency = 'KES')
     ON CONFLICT DO NOTHING`,
    // NexusPay API key in api_configurations table (safe fallback)
    `INSERT INTO api_configurations (service_name, config_key, config_value, is_active) VALUES ('nexuspay', 'api_key', '""', true) ON CONFLICT (service_name, config_key) DO NOTHING`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS suspension_reason TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS fcm_token TEXT`,
    `ALTER TABLE announcements ADD COLUMN IF NOT EXISTS image_url TEXT`,
    // Virtual cards table - auto-created on existing databases that predate card support
    `CREATE TABLE IF NOT EXISTS virtual_cards (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      card_number TEXT NOT NULL,
      expiry_date TEXT NOT NULL,
      cvv TEXT NOT NULL,
      balance DECIMAL(10,2) DEFAULT 0.00,
      status TEXT DEFAULT 'active',
      freeze_reason TEXT,
      block_reason TEXT,
      purchase_amount DECIMAL(10,2) DEFAULT 60.00,
      paystack_reference TEXT,
      purchase_date TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    `ALTER TABLE virtual_cards ADD COLUMN IF NOT EXISTS freeze_reason TEXT`,
    `ALTER TABLE virtual_cards ADD COLUMN IF NOT EXISTS block_reason TEXT`,
    // Admin-configured virtual account details shared by approved users
    `CREATE TABLE IF NOT EXISTS virtual_account_settings (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      currency TEXT NOT NULL UNIQUE,
      account_name TEXT NOT NULL,
      bank_name TEXT NOT NULL,
      account_number TEXT NOT NULL,
      routing_number TEXT,
      sort_code TEXT,
      iban TEXT,
      swift_code TEXT,
      bank_address TEXT,
      beneficiary_address TEXT,
      payment_instructions TEXT,
      is_active BOOLEAN DEFAULT true,
      updated_by VARCHAR REFERENCES admins(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    // User applications for approved access to virtual account details
    `CREATE TABLE IF NOT EXISTS virtual_account_applications (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      currency TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      source_of_income TEXT NOT NULL,
      monthly_volume TEXT NOT NULL,
      purpose TEXT NOT NULL,
      expected_senders TEXT,
      declarations JSONB NOT NULL,
      admin_notes TEXT,
      reviewed_by VARCHAR REFERENCES admins(id),
      reviewed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS virtual_account_applications_user_currency_idx ON virtual_account_applications(user_id, currency)`,
    // Deposit bonuses table (admin-configured bonus offers per deposit method)
    `CREATE TABLE IF NOT EXISTS deposit_bonuses (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      method TEXT NOT NULL,
      min_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
      bonus_amount DECIMAL(18,2) NOT NULL,
      bonus_type TEXT NOT NULL DEFAULT 'fixed',
      description TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    // Advanced KYC documents table
    `CREATE TABLE IF NOT EXISTS advanced_kyc_documents (
      id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      facial_photo_url TEXT,
      address_proof_url TEXT,
      address_proof_type TEXT,
      full_address TEXT,
      city TEXT,
      postal_code TEXT,
      country TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      verification_notes TEXT,
      verified_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    // Advanced KYC status column on users
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS advanced_kyc_status TEXT DEFAULT 'not_submitted'`,
    // Admin-requested advanced KYC flag
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS advanced_kyc_requested BOOLEAN DEFAULT false`,
    // Google OAuth
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT`,
    // Didit.me KYC integration
    `ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS didit_session_id TEXT`,
    `ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS didit_status TEXT`,
    `ALTER TABLE kyc_documents ADD COLUMN IF NOT EXISTS didit_decision JSONB`,
    // KYC-extracted identity fields on users (auto-populated on verification)
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_full_name TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_date_of_birth TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_id_number TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_nationality TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_gender TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_address TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_document_type TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_id_expiry_date TEXT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_issuing_country TEXT`
  ];
  for (const sql4 of migrations) {
    try {
      await pool.query(sql4);
    } catch (err) {
      console.warn(`\u26A0\uFE0F Migration skipped (${sql4.slice(0, 50)}...): ${err.message}`);
    }
  }
}
async function tablesExist() {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'`
    );
    return parseInt(result.rows[0].count, 10) > 0;
  } catch {
    return false;
  }
}
async function ensureSchema() {
  if (!pool) return;
  const exists = await tablesExist();
  if (!exists) {
    console.warn('\u26A0\uFE0F  Database tables not found. If this is a fresh database, run "npm run db:push" manually to create the schema.');
  } else {
    await alterMissingColumns();
    console.log("\u2705 Schema up to date (existing database \u2014 no destructive changes)");
  }
}
var connectionString, pool, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    neonConfig.webSocketConstructor = ws;
    connectionString = resolveConnectionString();
    pool = connectionString ? new Pool({ connectionString }) : null;
    db = connectionString ? drizzle({ client: pool, schema: schema_exports }) : null;
  }
});

// server/storage.ts
import { randomUUID } from "crypto";
import { eq, desc, count, sum, or, isNull, gte, lt, and, sql as sql2, asc } from "drizzle-orm";
import bcrypt from "bcrypt";
var MemStorage, DatabaseStorage, storage, memStorage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_schema();
    init_db();
    MemStorage = class {
      users = /* @__PURE__ */ new Map();
      kycDocuments = /* @__PURE__ */ new Map();
      virtualCards = /* @__PURE__ */ new Map();
      transactions = /* @__PURE__ */ new Map();
      paymentRequests = /* @__PURE__ */ new Map();
      recipients = /* @__PURE__ */ new Map();
      conversations = /* @__PURE__ */ new Map();
      messages = /* @__PURE__ */ new Map();
      chatMessages = /* @__PURE__ */ new Map();
      notifications = /* @__PURE__ */ new Map();
      admins = /* @__PURE__ */ new Map();
      supportTickets = /* @__PURE__ */ new Map();
      systemSettings = /* @__PURE__ */ new Map();
      adminLogs = /* @__PURE__ */ new Map();
      systemLogs = /* @__PURE__ */ new Map();
      announcements = /* @__PURE__ */ new Map();
      constructor() {
        this.initMockData();
      }
      initMockData() {
      }
      // Announcement operations
      async getAnnouncements() {
        if (db) {
          return await db.select().from(announcements).orderBy(desc(announcements.priority));
        }
        return Array.from(this.announcements.values()).sort((a, b) => (b.priority || 0) - (a.priority || 0));
      }
      async getActiveAnnouncements() {
        const now = /* @__PURE__ */ new Date();
        if (db) {
          return await db.select().from(announcements).where(
            and(
              eq(announcements.isActive, true),
              or(isNull(announcements.startsAt), lte(announcements.startsAt, now)),
              or(isNull(announcements.expiresAt), gte(announcements.expiresAt, now))
            )
          ).orderBy(desc(announcements.priority));
        }
        return Array.from(this.announcements.values()).filter((a) => a.isActive && (!a.startsAt || a.startsAt <= now) && (!a.expiresAt || a.expiresAt >= now)).sort((a, b) => (b.priority || 0) - (a.priority || 0));
      }
      async createAnnouncement(insertAnnouncement) {
        if (db) {
          const [announcement2] = await db.insert(announcements).values(insertAnnouncement).returning();
          return announcement2;
        }
        const id = randomUUID();
        const announcement = {
          ...insertAnnouncement,
          id,
          imageUrl: insertAnnouncement.imageUrl ?? null,
          actionUrl: insertAnnouncement.actionUrl ?? null,
          isActive: insertAnnouncement.isActive ?? true,
          priority: insertAnnouncement.priority ?? 0,
          startsAt: insertAnnouncement.startsAt ?? /* @__PURE__ */ new Date(),
          expiresAt: insertAnnouncement.expiresAt ?? null,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.announcements.set(id, announcement);
        return announcement;
      }
      async updateAnnouncement(id, updates) {
        if (db) {
          const [announcement2] = await db.update(announcements).set(updates).where(eq(announcements.id, id)).returning();
          return announcement2;
        }
        const announcement = this.announcements.get(id);
        if (!announcement) return void 0;
        const updated = { ...announcement, ...updates, updatedAt: /* @__PURE__ */ new Date() };
        this.announcements.set(id, updated);
        return updated;
      }
      async deleteAnnouncement(id) {
        if (db) {
          await db.delete(announcements).where(eq(announcements.id, id));
          return;
        }
        this.announcements.delete(id);
      }
      initMockData() {
        const demoUser = {
          id: "demo-user-1",
          fullName: "John Doe",
          email: "john.doe@email.com",
          phone: "+15551234567",
          country: "United States",
          password: "hashedpassword",
          isEmailVerified: true,
          isPhoneVerified: true,
          kycStatus: "verified",
          hasVirtualCard: true,
          twoFactorSecret: null,
          twoFactorEnabled: false,
          twoFactorBackupCodes: null,
          biometricEnabled: false,
          biometricCredentialId: null,
          darkMode: false,
          pushNotificationsEnabled: true,
          balance: "0.00",
          otpCode: null,
          otpExpiry: null,
          paystackCustomerId: null,
          defaultCurrency: "USD",
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.users.set(demoUser.id, demoUser);
        const demoCard = {
          id: "demo-card-1",
          userId: demoUser.id,
          cardNumber: "4567123456784567",
          expiryDate: "12/27",
          cvv: "123",
          balance: "2847.65",
          status: "active",
          purchaseAmount: "60.00",
          paystackReference: null,
          purchaseDate: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.virtualCards.set(demoCard.id, demoCard);
        const transactions2 = [
          {
            id: "txn-1",
            userId: demoUser.id,
            type: "send",
            amount: "150.00",
            currency: "USD",
            recipientId: null,
            recipientDetails: { name: "Mary Okafor", phone: "+2348031234567", country: "Nigeria" },
            status: "completed",
            fee: "2.99",
            exchangeRate: "820.0000",
            description: "Sent to Mary Okafor",
            reference: null,
            paystackReference: null,
            metadata: null,
            completedAt: /* @__PURE__ */ new Date(),
            createdAt: /* @__PURE__ */ new Date(),
            updatedAt: /* @__PURE__ */ new Date()
          },
          {
            id: "txn-2",
            userId: demoUser.id,
            type: "receive",
            amount: "85.50",
            currency: "USD",
            recipientId: null,
            recipientDetails: { name: "James Kone", email: "james@email.com", country: "Ghana" },
            status: "completed",
            fee: "0.00",
            exchangeRate: null,
            description: "Received from James Kone",
            reference: null,
            paystackReference: null,
            metadata: null,
            completedAt: new Date(Date.now() - 864e5),
            createdAt: new Date(Date.now() - 864e5),
            // Yesterday
            updatedAt: new Date(Date.now() - 864e5)
          },
          {
            id: "txn-3",
            userId: demoUser.id,
            type: "deposit",
            amount: "500.00",
            currency: "USD",
            recipientId: null,
            recipientDetails: null,
            status: "completed",
            fee: "0.00",
            exchangeRate: null,
            description: "Card Top-up",
            reference: null,
            paystackReference: null,
            metadata: null,
            completedAt: new Date(Date.now() - 432e6),
            createdAt: new Date(Date.now() - 432e6),
            // 5 days ago
            updatedAt: new Date(Date.now() - 432e6)
          }
        ];
        transactions2.forEach((txn) => this.transactions.set(txn.id, txn));
      }
      // User operations
      async getUser(id) {
        return this.users.get(id);
      }
      async getUserByEmail(email) {
        return Array.from(this.users.values()).find((user) => user.email === email);
      }
      async getUserByPhone(phone) {
        return Array.from(this.users.values()).find((user) => user.phone === phone);
      }
      async createUser(insertUser) {
        const id = randomUUID();
        const user = {
          ...insertUser,
          id,
          isEmailVerified: false,
          isPhoneVerified: false,
          kycStatus: "not_submitted",
          hasVirtualCard: false,
          twoFactorSecret: insertUser.twoFactorSecret ?? null,
          twoFactorEnabled: insertUser.twoFactorEnabled ?? false,
          biometricEnabled: insertUser.biometricEnabled ?? false,
          pushNotificationsEnabled: insertUser.pushNotificationsEnabled ?? true,
          balance: insertUser.balance ?? "0.00",
          otpCode: insertUser.otpCode ?? null,
          otpExpiry: insertUser.otpExpiry ?? null,
          paystackCustomerId: insertUser.paystackCustomerId ?? null,
          defaultCurrency: insertUser.defaultCurrency ?? "KES",
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.users.set(id, user);
        return user;
      }
      async updateUser(id, updates) {
        const user = this.users.get(id);
        if (!user) return void 0;
        const updatedUser = { ...user, ...updates };
        this.users.set(id, updatedUser);
        return updatedUser;
      }
      async deleteUser(id) {
        this.users.delete(id);
        const kyc = Array.from(this.kycDocuments.values()).find((doc) => doc.userId === id);
        if (kyc) {
          this.kycDocuments.delete(kyc.id);
        }
        const card = Array.from(this.virtualCards.values()).find((c) => c.userId === id);
        if (card) {
          this.virtualCards.delete(card.id);
        }
        Array.from(this.transactions.entries()).forEach(([txId, tx]) => {
          if (tx.userId === id) {
            this.transactions.delete(txId);
          }
        });
        Array.from(this.paymentRequests.entries()).forEach(([reqId, req]) => {
          if (req.fromUserId === id) {
            this.paymentRequests.delete(reqId);
          }
        });
        Array.from(this.recipients.entries()).forEach(([recipientId, recipient]) => {
          if (recipient.userId === id) {
            this.recipients.delete(recipientId);
          }
        });
      }
      // KYC operations
      async createKycDocument(insertKyc) {
        const id = randomUUID();
        const kyc = {
          ...insertKyc,
          id,
          status: "pending",
          frontImageUrl: insertKyc.frontImageUrl ?? null,
          backImageUrl: insertKyc.backImageUrl ?? null,
          selfieUrl: insertKyc.selfieUrl ?? null,
          dateOfBirth: insertKyc.dateOfBirth ?? null,
          address: insertKyc.address ?? null,
          verificationNotes: insertKyc.verificationNotes ?? null,
          verifiedAt: insertKyc.verifiedAt ?? null,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.kycDocuments.set(id, kyc);
        return kyc;
      }
      async getKycByUserId(userId) {
        return Array.from(this.kycDocuments.values()).find((kyc) => kyc.userId === userId);
      }
      async updateKycDocument(id, updates) {
        const kyc = this.kycDocuments.get(id);
        if (!kyc) return void 0;
        const updatedKyc = { ...kyc, ...updates };
        this.kycDocuments.set(id, updatedKyc);
        return updatedKyc;
      }
      // Virtual Card operations
      async createVirtualCard(insertCard) {
        const id = randomUUID();
        const card = {
          ...insertCard,
          id,
          cardNumber: this.generateCardNumber(),
          expiryDate: "12/27",
          cvv: this.generateCVV(),
          balance: "0.00",
          status: "active",
          purchaseAmount: insertCard.purchaseAmount ?? "60.00",
          paystackReference: insertCard.paystackReference ?? null,
          purchaseDate: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.virtualCards.set(id, card);
        return card;
      }
      async getVirtualCardByUserId(userId) {
        const allCards = Array.from(this.virtualCards.values()).filter((card) => card.userId === userId).sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
        return allCards.find((c) => c.status === "active") || allCards[0];
      }
      async getVirtualCardsByUserId(userId) {
        return Array.from(this.virtualCards.values()).filter((card) => card.userId === userId).sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
      }
      async getVirtualCardById(id) {
        return this.virtualCards.get(id);
      }
      async updateVirtualCard(id, updates) {
        const card = this.virtualCards.get(id);
        if (!card) return void 0;
        const updatedCard = { ...card, ...updates };
        this.virtualCards.set(id, updatedCard);
        return updatedCard;
      }
      // Transaction operations
      async createTransaction(insertTransaction) {
        const id = randomUUID();
        const transaction = {
          ...insertTransaction,
          id,
          status: insertTransaction.status ?? "pending",
          recipientId: insertTransaction.recipientId ?? null,
          recipientDetails: insertTransaction.recipientDetails ?? null,
          description: insertTransaction.description ?? null,
          reference: insertTransaction.reference ?? null,
          paystackReference: insertTransaction.paystackReference ?? null,
          metadata: insertTransaction.metadata ?? null,
          fee: insertTransaction.fee ?? "0.00",
          exchangeRate: insertTransaction.exchangeRate ?? null,
          completedAt: insertTransaction.completedAt ?? null,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.transactions.set(id, transaction);
        return transaction;
      }
      async getTransactionsByUserId(userId) {
        return Array.from(this.transactions.values()).filter((txn) => txn.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      async getTransaction(id) {
        return this.transactions.get(id);
      }
      async updateTransaction(id, updates) {
        const transaction = this.transactions.get(id);
        if (!transaction) return void 0;
        const updatedTransaction = { ...transaction, ...updates };
        this.transactions.set(id, updatedTransaction);
        return updatedTransaction;
      }
      async updateWithdrawalRequest(id, updates) {
        return this.updateTransaction(id, updates);
      }
      // Payment Request operations
      async createPaymentRequest(insertRequest) {
        const id = randomUUID();
        const request = {
          ...insertRequest,
          id,
          status: "pending",
          message: insertRequest.message ?? null,
          currency: insertRequest.currency ?? "KES",
          recipientId: insertRequest.recipientId ?? null,
          toEmail: insertRequest.toEmail ?? null,
          toPhone: insertRequest.toPhone ?? null,
          paymentLink: insertRequest.paymentLink ?? null,
          createdAt: /* @__PURE__ */ new Date()
        };
        this.paymentRequests.set(id, request);
        return request;
      }
      async getPaymentRequestsByUserId(userId) {
        return Array.from(this.paymentRequests.values()).filter((req) => req.fromUserId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      async updatePaymentRequest(id, updates) {
        const request = this.paymentRequests.get(id);
        if (!request) return void 0;
        const updatedRequest = { ...request, ...updates };
        this.paymentRequests.set(id, updatedRequest);
        return updatedRequest;
      }
      generateCardNumber() {
        return "4567" + Math.random().toString().slice(2, 14);
      }
      generateCVV() {
        return Math.floor(Math.random() * 900 + 100).toString();
      }
      // Recipient operations
      async createRecipient(insertRecipient) {
        const id = randomUUID();
        const recipient = {
          ...insertRecipient,
          id,
          email: insertRecipient.email ?? null,
          phone: insertRecipient.phone ?? null,
          accountNumber: insertRecipient.accountNumber ?? null,
          bankName: insertRecipient.bankName ?? null,
          bankCode: insertRecipient.bankCode ?? null,
          currency: insertRecipient.currency ?? "KES",
          recipientType: insertRecipient.recipientType ?? "mobile_wallet",
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.recipients.set(id, recipient);
        return recipient;
      }
      async getRecipientsByUserId(userId) {
        return Array.from(this.recipients.values()).filter((r) => r.userId === userId);
      }
      async getRecipient(id) {
        return this.recipients.get(id);
      }
      async updateRecipient(id, updates) {
        const recipient = this.recipients.get(id);
        if (!recipient) return void 0;
        const updatedRecipient = { ...recipient, ...updates, updatedAt: /* @__PURE__ */ new Date() };
        this.recipients.set(id, updatedRecipient);
        return updatedRecipient;
      }
      async deleteRecipient(id) {
        this.recipients.delete(id);
      }
      // Conversation operations
      async createConversation(insertConversation) {
        const id = randomUUID();
        const conversation = {
          ...insertConversation,
          id,
          status: "active",
          adminId: insertConversation.adminId ?? null,
          title: insertConversation.title ?? null,
          lastMessageAt: null,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.conversations.set(id, conversation);
        return conversation;
      }
      async getConversationsByUserId(userId) {
        return Array.from(this.conversations.values()).filter((c) => c.userId === userId).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      }
      async getConversationsByAdminId(adminId) {
        return Array.from(this.conversations.values()).filter((c) => c.adminId === adminId).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      }
      async getAllActiveConversations() {
        return Array.from(this.conversations.values()).filter((c) => c.status === "active").sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      }
      async getConversation(id) {
        return this.conversations.get(id);
      }
      async updateConversation(id, updates) {
        const conversation = this.conversations.get(id);
        if (!conversation) return void 0;
        const updatedConversation = { ...conversation, ...updates, updatedAt: /* @__PURE__ */ new Date() };
        this.conversations.set(id, updatedConversation);
        return updatedConversation;
      }
      async deleteConversation(id) {
        this.conversations.delete(id);
      }
      // Message operations
      async createMessage(insertMessage) {
        const id = randomUUID();
        const message = {
          ...insertMessage,
          id,
          senderId: insertMessage.senderId,
          senderType: insertMessage.senderType,
          messageType: insertMessage.messageType ?? "text",
          fileUrl: insertMessage.fileUrl ?? null,
          fileName: insertMessage.fileName ?? null,
          fileSize: insertMessage.fileSize ?? null,
          readAt: null,
          createdAt: /* @__PURE__ */ new Date()
        };
        this.messages.set(id, message);
        await this.updateConversation(insertMessage.conversationId, {
          lastMessageAt: message.createdAt
        });
        return message;
      }
      async getMessagesByConversationId(conversationId) {
        return Array.from(this.messages.values()).filter((m) => m.conversationId === conversationId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }
      async getMessage(id) {
        return this.messages.get(id);
      }
      async deleteMessage(id) {
        this.messages.delete(id);
      }
      async markMessageAsRead(id) {
        const message = this.messages.get(id);
        if (!message) return void 0;
        const updatedMessage = { ...message, readAt: /* @__PURE__ */ new Date() };
        this.messages.set(id, updatedMessage);
        return updatedMessage;
      }
      async getUnreadMessagesCount(conversationId, userId) {
        return Array.from(this.messages.values()).filter(
          (m) => m.conversationId === conversationId && m.senderId !== userId && !m.readAt
        ).length;
      }
      // Chat message operations (legacy support)
      async createChatMessage(insertChatMessage) {
        const id = randomUUID();
        const chatMessage = {
          ...insertChatMessage,
          id,
          status: insertChatMessage.status ?? "sent",
          isFromAdmin: insertChatMessage.isFromAdmin ?? false,
          adminId: insertChatMessage.adminId ?? null,
          createdAt: /* @__PURE__ */ new Date()
        };
        this.chatMessages.set(id, chatMessage);
        return chatMessage;
      }
      async getChatMessagesByConversation(conversationId) {
        return Array.from(this.chatMessages.values()).filter((m) => m.conversationId === conversationId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }
      async getChatMessagesByUserId(userId) {
        return Array.from(this.chatMessages.values()).filter((m) => m.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      async updateChatMessageStatus(id, status) {
        const message = this.chatMessages.get(id);
        if (!message) return void 0;
        const updatedMessage = { ...message, status };
        this.chatMessages.set(id, updatedMessage);
        return updatedMessage;
      }
      // Notification operations
      async createNotification(insertNotification) {
        const id = randomUUID();
        const notification = {
          ...insertNotification,
          id,
          type: insertNotification.type ?? "info",
          isGlobal: insertNotification.isGlobal ?? false,
          userId: insertNotification.userId ?? null,
          actionUrl: insertNotification.actionUrl ?? null,
          metadata: insertNotification.metadata ?? null,
          expiresAt: insertNotification.expiresAt ?? null,
          isRead: false,
          createdAt: /* @__PURE__ */ new Date()
        };
        this.notifications.set(id, notification);
        return notification;
      }
      async getNotificationsByUserId(userId) {
        return Array.from(this.notifications.values()).filter((n) => n.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      async getGlobalNotifications() {
        return Array.from(this.notifications.values()).filter((n) => n.isGlobal).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      async markNotificationAsRead(id) {
        const notification = this.notifications.get(id);
        if (notification) {
          const updatedNotification = { ...notification, isRead: true };
          this.notifications.set(id, updatedNotification);
        }
      }
      async deleteNotification(id) {
        this.notifications.delete(id);
      }
      // Admin operations (basic stubs)
      async getAdminByEmail(email) {
        return Array.from(this.admins.values()).find((admin) => admin.email === email);
      }
      async getAdminById(id) {
        return this.admins.get(String(id));
      }
      async createAdmin(insertAdmin) {
        const id = randomUUID();
        const hashedPassword = await bcrypt.hash(insertAdmin.password, 10);
        const admin = {
          ...insertAdmin,
          id,
          password: hashedPassword,
          role: insertAdmin.role || "admin",
          twoFactorSecret: insertAdmin.twoFactorSecret ?? null,
          twoFactorEnabled: insertAdmin.twoFactorEnabled ?? false,
          lastLoginAt: insertAdmin.lastLoginAt ?? null,
          isActive: true,
          createdAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.admins.set(id, admin);
        return admin;
      }
      // Admin operations with proper return types
      async getAllUsers(filters) {
        const users2 = Array.from(this.users.values());
        return {
          users: users2,
          total: users2.length,
          page: filters?.page || 1,
          totalPages: Math.ceil(users2.length / (filters?.limit || 10))
        };
      }
      async getAllKycDocuments() {
        return Array.from(this.kycDocuments.values());
      }
      async getAllTransactions(filters) {
        const transactions2 = Array.from(this.transactions.values());
        return {
          transactions: transactions2,
          total: transactions2.length,
          page: filters?.page || 1,
          totalPages: Math.ceil(transactions2.length / (filters?.limit || 10))
        };
      }
      async getAllVirtualCards() {
        return Array.from(this.virtualCards.values());
      }
      async getUsersCount() {
        return this.users.size;
      }
      async getTransactionsCount() {
        return this.transactions.size;
      }
      async getTotalVolume() {
        return { volume: 0, revenue: 0 };
      }
      async getDashboardMetrics() {
        return {};
      }
      async createAdminLog(log2) {
        const id = randomUUID();
        const adminLog = {
          ...log2,
          id,
          adminId: log2.adminId ?? null,
          targetType: log2.targetType ?? null,
          targetId: log2.targetId ?? null,
          details: log2.details ?? null,
          ipAddress: log2.ipAddress ?? null,
          userAgent: log2.userAgent ?? null,
          createdAt: /* @__PURE__ */ new Date()
        };
        this.adminLogs.set(id, adminLog);
        return adminLog;
      }
      async getAdminLogs() {
        return [];
      }
      async createSystemLog(log2) {
        const id = randomUUID();
        const systemLog = {
          ...log2,
          id,
          data: log2.data ?? {},
          source: log2.source ?? null,
          timestamp: /* @__PURE__ */ new Date()
        };
        this.systemLogs.set(id, systemLog);
        return systemLog;
      }
      async getSystemLogs() {
        return [];
      }
      async deleteOldSystemLogs() {
      }
      async getSystemSettings() {
        return Array.from(this.systemSettings.values());
      }
      async updateSystemSetting(keyOrId, valueOrUpdates) {
        if (typeof valueOrUpdates === "string") {
          const setting = Array.from(this.systemSettings.values()).find((s) => s.key === keyOrId);
          if (setting) {
            const updated = { ...setting, value: JSON.parse(valueOrUpdates), updatedAt: /* @__PURE__ */ new Date() };
            this.systemSettings.set(setting.id, updated);
            return updated;
          }
          return void 0;
        } else {
          const setting = this.systemSettings.get(keyOrId);
          if (!setting) return void 0;
          const updatedSetting = {
            ...setting,
            ...valueOrUpdates,
            description: valueOrUpdates.description ?? setting.description,
            updatedBy: valueOrUpdates.updatedBy ?? setting.updatedBy,
            updatedAt: /* @__PURE__ */ new Date()
          };
          this.systemSettings.set(keyOrId, updatedSetting);
          return updatedSetting;
        }
      }
      async createSystemSetting(setting) {
        const id = randomUUID();
        const systemSetting = {
          ...setting,
          id,
          description: setting.description ?? null,
          updatedBy: setting.updatedBy ?? null,
          updatedAt: /* @__PURE__ */ new Date()
        };
        this.systemSettings.set(id, systemSetting);
        return systemSetting;
      }
      async updateAdmin(id, updates) {
        const admin = this.admins.get(id);
        if (admin) {
          const updated = { ...admin, ...updates, updatedAt: /* @__PURE__ */ new Date() };
          this.admins.set(id, updated);
          return updated;
        }
        return void 0;
      }
      async createSupportTicket() {
        throw new Error("Not implemented");
      }
      async getSupportTicketsByUserId() {
        return [];
      }
      async getAllSupportTickets() {
        return { tickets: [], total: 0, page: 1, totalPages: 1 };
      }
      async getSupportTicket() {
        return void 0;
      }
      async updateSupportTicket() {
        return void 0;
      }
      async deleteSupportTicket(id) {
        this.supportTickets.delete(id);
      }
      async assignSupportTicket() {
        return void 0;
      }
      async getSystemSetting(category, key) {
        return Array.from(this.systemSettings?.values?.() || []).find(
          (s) => s.category === category && s.key === key
        );
      }
      async getSystemSettingsByCategory(category) {
        return Array.from(this.systemSettings?.values?.() || []).filter(
          (s) => s.category === category
        );
      }
      async setSystemSetting(setting) {
        const id = randomUUID();
        const existing = Array.from(this.systemSettings.values()).find(
          (s) => s.category === setting.category && s.key === setting.key
        );
        if (existing) {
          const updated = { ...existing, value: setting.value, updatedAt: /* @__PURE__ */ new Date() };
          this.systemSettings.set(existing.id, updated);
          return updated;
        }
        const newSetting = { id, ...setting, createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() };
        this.systemSettings.set(id, newSetting);
        return newSetting;
      }
      async updateUserOtp(id, otpCode, otpExpiry) {
        const user = this.users.get(id);
        if (user) {
          const updated = { ...user, otpCode, otpExpiry, updatedAt: /* @__PURE__ */ new Date() };
          this.users.set(id, updated);
          return updated;
        }
        return void 0;
      }
      async verifyUserOtp(id, otpCode) {
        const user = this.users.get(id);
        if (!user || !user.otpCode || !user.otpExpiry) return false;
        const now = /* @__PURE__ */ new Date();
        const isExpired = now > user.otpExpiry;
        const isValid = user.otpCode === otpCode;
        if (isValid && !isExpired) {
          const updated = { ...user, otpCode: null, otpExpiry: null, isPhoneVerified: true, updatedAt: /* @__PURE__ */ new Date() };
          this.users.set(id, updated);
          return true;
        }
        return false;
      }
      async updateUserPassword(id, hashedPassword) {
        const user = this.users.get(id);
        if (user) {
          const updated = { ...user, password: hashedPassword, updatedAt: /* @__PURE__ */ new Date() };
          this.users.set(id, updated);
          return updated;
        }
        return void 0;
      }
      async getPaymentRequest(id) {
        return this.paymentRequests.get(id);
      }
      // Savings Goals operations (stubs for MemStorage)
      async createSavingsGoal() {
        throw new Error("Not implemented");
      }
      async getSavingsGoalsByUserId() {
        return [];
      }
      async getSavingsGoal() {
        return void 0;
      }
      async updateSavingsGoal() {
        return void 0;
      }
      // QR Payment operations (stubs for MemStorage)  
      async createQRPayment() {
        throw new Error("Not implemented");
      }
      async getQRPaymentByCode() {
        return void 0;
      }
      async updateQRPayment() {
        return void 0;
      }
      // Login History operations (stubs for MemStorage)
      async createLoginHistory() {
        throw new Error("Not implemented");
      }
      async getLoginHistoryByUserId() {
        return [];
      }
      // API Configuration operations (stubs for MemStorage)
      async getApiConfiguration() {
        return void 0;
      }
      async getAllApiConfigurations() {
        return [];
      }
      async createApiConfiguration() {
        throw new Error("Not implemented");
      }
      async updateApiConfiguration() {
        return void 0;
      }
      async deleteApiConfiguration() {
      }
    };
    DatabaseStorage = class {
      async getUser(id) {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user || void 0;
      }
      async getUserByEmail(email) {
        const [user] = await db.select().from(users).where(eq(users.email, email));
        return user || void 0;
      }
      async getUserByPhone(phone) {
        const [user] = await db.select().from(users).where(eq(users.phone, phone));
        return user || void 0;
      }
      async createUser(insertUser) {
        const hashedPassword = await bcrypt.hash(insertUser.password, 10);
        const [user] = await db.insert(users).values({ ...insertUser, password: hashedPassword }).returning();
        return user;
      }
      async updateUser(id, updates) {
        const [user] = await db.update(users).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
        return user || void 0;
      }
      async updateUserOtp(id, otpCode, otpExpiry) {
        const [user] = await db.update(users).set({ otpCode, otpExpiry, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
        return user || void 0;
      }
      async verifyUserOtp(id, otpCode) {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        if (!user || !user.otpCode || !user.otpExpiry) return false;
        const now = /* @__PURE__ */ new Date();
        const isExpired = now > user.otpExpiry;
        const isValid = user.otpCode === otpCode;
        if (isValid && !isExpired) {
          await db.update(users).set({ otpCode: null, otpExpiry: null, isPhoneVerified: true, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id));
          return true;
        }
        return false;
      }
      async updateUserPassword(id, hashedPassword) {
        const [user] = await db.update(users).set({ password: hashedPassword, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
        return user || void 0;
      }
      async deleteUser(id) {
        const userConversations = await db.select().from(conversations).where(eq(conversations.userId, id));
        for (const conversation of userConversations) {
          await db.delete(messages).where(eq(messages.conversationId, conversation.id));
          await db.delete(conversations).where(eq(conversations.id, conversation.id));
        }
        await db.delete(kycDocuments).where(eq(kycDocuments.userId, id));
        await db.delete(virtualCards).where(eq(virtualCards.userId, id));
        await db.delete(transactions).where(eq(transactions.userId, id));
        await db.delete(transactions).where(eq(transactions.recipientId, id));
        await db.delete(paymentRequests).where(eq(paymentRequests.fromUserId, id));
        await db.delete(recipients).where(eq(recipients.userId, id));
        await db.delete(notifications).where(eq(notifications.userId, id));
        await db.delete(supportTickets).where(eq(supportTickets.userId, id));
        await db.delete(supportTickets).where(eq(supportTickets.assignedAdminId, id));
        await db.delete(chatMessages).where(eq(chatMessages.userId, id));
        await db.delete(chatMessages).where(eq(chatMessages.adminId, id));
        await db.delete(savingsGoals).where(eq(savingsGoals.userId, id));
        await db.delete(qrPayments).where(eq(qrPayments.userId, id));
        await db.delete(scheduledPayments).where(eq(scheduledPayments.userId, id));
        await db.delete(budgets).where(eq(budgets.userId, id));
        await db.delete(userPreferences).where(eq(userPreferences.userId, id));
        await db.delete(users).where(eq(users.id, id));
      }
      // KYC operations
      async createKycDocument(insertKyc) {
        const [kyc] = await db.insert(kycDocuments).values(insertKyc).returning();
        return kyc;
      }
      async getKycByUserId(userId) {
        const [kyc] = await db.select().from(kycDocuments).where(eq(kycDocuments.userId, userId));
        return kyc || void 0;
      }
      async updateKycDocument(id, updates) {
        const [kyc] = await db.update(kycDocuments).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(kycDocuments.id, id)).returning();
        return kyc || void 0;
      }
      // Virtual Card operations
      async createVirtualCard(insertCard) {
        const cardNumber = this.generateCardNumber();
        const cvv = this.generateCVV();
        const expiryDate = this.generateExpiryDate();
        const [card] = await db.insert(virtualCards).values({
          ...insertCard,
          cardNumber,
          cvv,
          expiryDate,
          purchaseAmount: "60.00"
        }).returning();
        return card;
      }
      async getVirtualCardByUserId(userId) {
        const allCards = await db.select().from(virtualCards).where(eq(virtualCards.userId, userId)).orderBy(desc(virtualCards.purchaseDate));
        return allCards.find((c) => c.status === "active") || allCards[0] || void 0;
      }
      async getVirtualCardsByUserId(userId) {
        return await db.select().from(virtualCards).where(eq(virtualCards.userId, userId)).orderBy(desc(virtualCards.purchaseDate));
      }
      async getVirtualCardById(id) {
        const [card] = await db.select().from(virtualCards).where(eq(virtualCards.id, id));
        return card || void 0;
      }
      async updateVirtualCard(id, updates) {
        const [card] = await db.update(virtualCards).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(virtualCards.id, id)).returning();
        return card || void 0;
      }
      // Transaction operations
      async createTransaction(insertTransaction) {
        const reference = this.generateTransactionReference();
        const [transaction] = await db.insert(transactions).values({ ...insertTransaction, reference }).returning();
        return transaction;
      }
      async getTransactionsByUserId(userId) {
        return await db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt));
      }
      async getTransaction(id) {
        const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
        return transaction || void 0;
      }
      async updateTransaction(id, updates) {
        const [transaction] = await db.update(transactions).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(transactions.id, id)).returning();
        return transaction || void 0;
      }
      async updateWithdrawalRequest(id, updates) {
        return this.updateTransaction(id, updates);
      }
      // Payment Request operations
      async createPaymentRequest(insertRequest) {
        const [request] = await db.insert(paymentRequests).values(insertRequest).returning();
        return request;
      }
      async getPaymentRequestsByUserId(userId) {
        return await db.select().from(paymentRequests).where(eq(paymentRequests.fromUserId, userId)).orderBy(desc(paymentRequests.createdAt));
      }
      async updatePaymentRequest(id, updates) {
        const [request] = await db.update(paymentRequests).set(updates).where(eq(paymentRequests.id, id)).returning();
        return request || void 0;
      }
      async getPaymentRequest(id) {
        const [request] = await db.select().from(paymentRequests).where(eq(paymentRequests.id, id));
        return request || void 0;
      }
      // Recipient operations
      async createRecipient(data) {
        const [recipient] = await db.insert(recipients).values(data).returning();
        return recipient;
      }
      async getRecipientsByUserId(userId) {
        return db.select().from(recipients).where(eq(recipients.userId, userId)).orderBy(desc(recipients.createdAt));
      }
      async getRecipient(id) {
        const [recipient] = await db.select().from(recipients).where(eq(recipients.id, id));
        return recipient;
      }
      async updateRecipient(id, data) {
        const [recipient] = await db.update(recipients).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(recipients.id, id)).returning();
        return recipient;
      }
      async deleteRecipient(id) {
        await db.delete(recipients).where(eq(recipients.id, id));
      }
      // Chat message operations
      async createChatMessage(message) {
        const [chatMessage] = await db.insert(chatMessages).values({
          ...message,
          id: randomUUID()
        }).returning();
        return chatMessage;
      }
      async getChatMessagesByConversation(conversationId) {
        return await db.select().from(chatMessages).where(eq(chatMessages.conversationId, conversationId)).orderBy(chatMessages.createdAt);
      }
      async getChatMessagesByUserId(userId) {
        return await db.select().from(chatMessages).where(eq(chatMessages.userId, userId)).orderBy(desc(chatMessages.createdAt));
      }
      async updateChatMessageStatus(id, status) {
        const [chatMessage] = await db.update(chatMessages).set({ status }).where(eq(chatMessages.id, id)).returning();
        return chatMessage;
      }
      generateCardNumber() {
        return "4567" + Math.random().toString().slice(2, 14);
      }
      generateCVV() {
        return Math.floor(Math.random() * 900 + 100).toString();
      }
      generateExpiryDate() {
        const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
        const expiryYear = currentYear + 4;
        return `12/${expiryYear.toString().slice(-2)}`;
      }
      generateTransactionReference() {
        return "GP" + Date.now().toString() + Math.random().toString(36).substr(2, 5).toUpperCase();
      }
      // Admin operations
      async getAdminByEmail(email) {
        const [admin] = await db.select().from(admins).where(eq(admins.email, email));
        return admin || void 0;
      }
      async getAdminById(id) {
        const [admin] = await db.select().from(admins).where(eq(admins.id, id));
        return admin || void 0;
      }
      async createAdmin(insertAdmin) {
        const hashedPassword = await bcrypt.hash(insertAdmin.password, 10);
        const [admin] = await db.insert(admins).values({ ...insertAdmin, password: hashedPassword }).returning();
        return admin;
      }
      async updateAdmin(id, updates) {
        const [admin] = await db.update(admins).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(admins.id, id)).returning();
        return admin || void 0;
      }
      async createAdminLog(insertLog) {
        const [log2] = await db.insert(adminLogs).values(insertLog).returning();
        return log2;
      }
      async getAdminLogs() {
        return await db.select().from(adminLogs).orderBy(desc(adminLogs.createdAt));
      }
      async createSystemLog(insertLog) {
        const [log2] = await db.insert(systemLogs).values(insertLog).returning();
        return log2;
      }
      async getSystemLogs(minutes = 30) {
        const timeAgo = new Date(Date.now() - minutes * 60 * 1e3);
        return await db.select().from(systemLogs).where(gte(systemLogs.timestamp, timeAgo)).orderBy(desc(systemLogs.timestamp));
      }
      async deleteOldSystemLogs(minutes = 30) {
        const timeAgo = new Date(Date.now() - minutes * 60 * 1e3);
        await db.delete(systemLogs).where(lt(systemLogs.timestamp, timeAgo));
      }
      // Admin data operations
      async getAllUsers() {
        return await db.select().from(users).orderBy(desc(users.createdAt));
      }
      async getAllTransactions() {
        return await db.select().from(transactions).orderBy(desc(transactions.createdAt));
      }
      async getAllKycDocuments() {
        return await db.select().from(kycDocuments).orderBy(desc(kycDocuments.createdAt));
      }
      async getAllVirtualCards() {
        return await db.select().from(virtualCards).orderBy(desc(virtualCards.purchaseDate));
      }
      async getVirtualCardsByUserId(userId) {
        return await db.select().from(virtualCards).where(eq(virtualCards.userId, userId)).orderBy(desc(virtualCards.purchaseDate));
      }
      async getUsersCount() {
        const result = await db.select({ count: count() }).from(users);
        return result[0].count;
      }
      async getTransactionsCount() {
        const result = await db.select({ count: count() }).from(transactions);
        return result[0].count;
      }
      async getTotalVolume() {
        const volumeResult = await db.select({
          totalVolume: sum(transactions.amount).mapWith(Number),
          totalFees: sum(transactions.fee).mapWith(Number)
        }).from(transactions).where(eq(transactions.status, "completed"));
        return {
          volume: volumeResult[0].totalVolume || 0,
          revenue: volumeResult[0].totalFees || 0
        };
      }
      // System settings
      async getSystemSetting(category, key) {
        const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.category, category)).where(eq(systemSettings.key, key)).orderBy(desc(systemSettings.updatedAt)).limit(1);
        return setting || void 0;
      }
      async setSystemSetting(insertSetting) {
        const existing = await this.getSystemSetting(insertSetting.category, insertSetting.key);
        if (existing) {
          const [updated] = await db.update(systemSettings).set({
            value: insertSetting.value,
            description: insertSetting.description,
            updatedAt: /* @__PURE__ */ new Date()
          }).where(eq(systemSettings.id, existing.id)).returning();
          return updated;
        } else {
          const [setting] = await db.insert(systemSettings).values(insertSetting).returning();
          return setting;
        }
      }
      async updateSystemSetting(id, updates) {
        const [setting] = await db.update(systemSettings).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(systemSettings.id, id)).returning();
        return setting || void 0;
      }
      async getSystemSettingsByCategory(category) {
        return await db.select().from(systemSettings).where(eq(systemSettings.category, category)).orderBy(systemSettings.key);
      }
      async getSystemSettings() {
        return await db.select().from(systemSettings).orderBy(systemSettings.category, systemSettings.key);
      }
      async createSystemSetting(setting) {
        return await this.setSystemSetting(setting);
      }
      // API Configuration operations
      async getApiConfiguration(provider) {
        const [config] = await db.select().from(apiConfigurations).where(eq(apiConfigurations.provider, provider));
        return config || void 0;
      }
      async getAllApiConfigurations() {
        return await db.select().from(apiConfigurations).orderBy(apiConfigurations.provider);
      }
      async createApiConfiguration(insertConfig) {
        const [config] = await db.insert(apiConfigurations).values(insertConfig).returning();
        return config;
      }
      async updateApiConfiguration(provider, updates) {
        const [config] = await db.update(apiConfigurations).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(apiConfigurations.provider, provider)).returning();
        return config || void 0;
      }
      async deleteApiConfiguration(provider) {
        await db.delete(apiConfigurations).where(eq(apiConfigurations.provider, provider));
      }
      // Notification operations
      async createNotification(notification) {
        const [newNotification] = await db.insert(notifications).values(notification).returning();
        return newNotification;
      }
      async getNotificationsByUserId(userId) {
        return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
      }
      async getGlobalNotifications() {
        return await db.select().from(notifications).where(eq(notifications.isGlobal, true)).orderBy(desc(notifications.createdAt));
      }
      async markNotificationAsRead(id) {
        await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
      }
      async deleteNotification(id) {
        await db.delete(notifications).where(eq(notifications.id, id));
      }
      // Support Ticket operations
      async createSupportTicket(ticket) {
        const [newTicket] = await db.insert(supportTickets).values(ticket).returning();
        return newTicket;
      }
      async getSupportTicketsByUserId(userId) {
        return await db.select().from(supportTickets).where(eq(supportTickets.userId, userId)).orderBy(desc(supportTickets.createdAt));
      }
      async getAllSupportTickets(filters = {}) {
        const { status, priority, page = 1, limit = 20 } = filters;
        const offset = (page - 1) * limit;
        let query = db.select().from(supportTickets);
        let countQuery = db.select({ count: count() }).from(supportTickets);
        const conditions = [];
        if (status) {
          conditions.push(eq(supportTickets.status, status));
        }
        if (priority) {
          conditions.push(eq(supportTickets.priority, priority));
        }
        if (conditions.length > 0) {
          const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);
          query = query.where(whereClause);
          countQuery = countQuery.where(whereClause);
        }
        const [tickets, totalResult] = await Promise.all([
          query.orderBy(desc(supportTickets.createdAt)).limit(limit).offset(offset),
          countQuery
        ]);
        const total = Array.isArray(totalResult) ? totalResult[0]?.count || 0 : totalResult?.count || 0;
        const totalPages = Math.ceil(Number(total) / limit);
        return { tickets, total: Number(total), page, totalPages };
      }
      async getSupportTicket(id) {
        const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, id));
        return ticket;
      }
      async updateSupportTicket(id, updates) {
        const [updatedTicket] = await db.update(supportTickets).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(supportTickets.id, id)).returning();
        return updatedTicket;
      }
      async deleteSupportTicket(id) {
        await db.delete(supportTickets).where(eq(supportTickets.id, id));
      }
      async assignSupportTicket(id, adminId) {
        const [updatedTicket] = await db.update(supportTickets).set({
          assignedAdminId: adminId,
          status: "in_progress",
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(supportTickets.id, id)).returning();
        return updatedTicket;
      }
      // Ticket Replies operations
      async createTicketReply(reply) {
        const [newReply] = await db.insert(ticketReplies).values(reply).returning();
        return newReply;
      }
      async getTicketReplies(ticketId) {
        return await db.select().from(ticketReplies).where(eq(ticketReplies.ticketId, ticketId)).orderBy(asc(ticketReplies.createdAt));
      }
      // Conversation operations
      async createConversation(insertConversation) {
        const [conversation] = await db.insert(conversations).values(insertConversation).returning();
        return conversation;
      }
      async getConversationsByUserId(userId) {
        return await db.select().from(conversations).where(eq(conversations.userId, userId)).orderBy(desc(conversations.updatedAt));
      }
      async getConversationsByAdminId(adminId) {
        return await db.select().from(conversations).where(eq(conversations.adminId, adminId)).orderBy(desc(conversations.updatedAt));
      }
      async getAllActiveConversations() {
        return await db.select().from(conversations).where(eq(conversations.status, "active")).orderBy(desc(conversations.updatedAt));
      }
      async getConversation(id) {
        const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
        return conversation;
      }
      async updateConversation(id, updates) {
        const [conversation] = await db.update(conversations).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(conversations.id, id)).returning();
        return conversation;
      }
      async deleteConversation(id) {
        await db.delete(messages).where(eq(messages.conversationId, id));
        await db.delete(conversations).where(eq(conversations.id, id));
      }
      // Message operations
      async createMessage(insertMessage) {
        const [message] = await db.insert(messages).values(insertMessage).returning();
        await this.updateConversation(insertMessage.conversationId, {
          lastMessageAt: message.createdAt
        });
        return message;
      }
      async getMessagesByConversationId(conversationId) {
        return await db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
      }
      async getMessage(id) {
        const [message] = await db.select().from(messages).where(eq(messages.id, id));
        return message;
      }
      async deleteMessage(id) {
        await db.delete(messages).where(eq(messages.id, id));
      }
      async markMessageAsRead(id) {
        const [message] = await db.update(messages).set({ readAt: /* @__PURE__ */ new Date() }).where(eq(messages.id, id)).returning();
        return message;
      }
      async getUnreadMessagesCount(conversationId, userId) {
        const result = await db.select({ count: count() }).from(messages).where(
          eq(messages.conversationId, conversationId)
        ).where(
          isNull(messages.readAt)
        );
        const unreadMessages = await db.select().from(messages).where(
          eq(messages.conversationId, conversationId)
        ).where(
          isNull(messages.readAt)
        );
        return unreadMessages.filter((m) => m.senderId !== userId).length;
      }
      // Savings Goals operations
      async createSavingsGoal(goal) {
        const [savingsGoal] = await db.insert(savingsGoals).values(goal).returning();
        return savingsGoal;
      }
      async getSavingsGoalsByUserId(userId) {
        return await db.select().from(savingsGoals).where(eq(savingsGoals.userId, userId)).orderBy(desc(savingsGoals.createdAt));
      }
      async getSavingsGoal(id) {
        const [goal] = await db.select().from(savingsGoals).where(eq(savingsGoals.id, id));
        return goal || void 0;
      }
      async updateSavingsGoal(id, updates) {
        const [goal] = await db.update(savingsGoals).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(savingsGoals.id, id)).returning();
        return goal || void 0;
      }
      // QR Payment operations
      async createQRPayment(payment) {
        const [qrPayment] = await db.insert(qrPayments).values(payment).returning();
        return qrPayment;
      }
      async getQRPaymentByCode(paymentCode) {
        const [payment] = await db.select().from(qrPayments).where(eq(qrPayments.paymentCode, paymentCode));
        return payment || void 0;
      }
      async updateQRPayment(id, updates) {
        const [payment] = await db.update(qrPayments).set(updates).where(eq(qrPayments.id, id)).returning();
        return payment || void 0;
      }
      // Login History operations
      async createLoginHistory(history) {
        const [loginRecord] = await db.insert(loginHistory).values(history).returning();
        return loginRecord;
      }
      async getLoginHistoryByUserId(userId, limit = 10) {
        const history = await db.select().from(loginHistory).where(eq(loginHistory.userId, userId)).orderBy(desc(loginHistory.createdAt)).limit(limit);
        return history;
      }
      // User Activity Log operations
      async createUserActivity(activity) {
        const [log2] = await db.insert(userActivityLog).values(activity).returning();
        return log2;
      }
      async getUserActivitiesByUserId(userId, limit = 100) {
        const activities = await db.select().from(userActivityLog).where(eq(userActivityLog.userId, userId)).orderBy(desc(userActivityLog.createdAt)).limit(limit);
        return activities;
      }
      // WhatsApp operations
      async getWhatsappConversations() {
        return await db.select().from(whatsappConversations).orderBy(desc(whatsappConversations.lastMessageAt));
      }
      async getWhatsappConversation(phoneNumber) {
        const [conv] = await db.select().from(whatsappConversations).where(eq(whatsappConversations.phoneNumber, phoneNumber));
        return conv || void 0;
      }
      async createWhatsappConversation(conversation) {
        const [conv] = await db.insert(whatsappConversations).values(conversation).returning();
        return conv;
      }
      async updateWhatsappConversation(id, updates) {
        const [conv] = await db.update(whatsappConversations).set(updates).where(eq(whatsappConversations.id, id)).returning();
        return conv || void 0;
      }
      async createWhatsappMessage(message) {
        const [msg] = await db.insert(whatsappMessages).values(message).returning();
        return msg;
      }
      async getWhatsappMessages(conversationId) {
        const messages2 = await db.select({
          id: whatsappMessages.id,
          conversationId: whatsappMessages.conversationId,
          phoneNumber: whatsappMessages.phoneNumber,
          content: whatsappMessages.content,
          isFromAdmin: whatsappMessages.isFromAdmin,
          status: whatsappMessages.status,
          messageId: whatsappMessages.messageId,
          messageType: whatsappMessages.messageType,
          fileUrl: whatsappMessages.fileUrl,
          fileName: whatsappMessages.fileName,
          fileSize: whatsappMessages.fileSize,
          createdAt: whatsappMessages.createdAt
        }).from(whatsappMessages).where(eq(whatsappMessages.conversationId, conversationId)).orderBy(desc(whatsappMessages.createdAt));
        return messages2;
      }
      async getWhatsappMessageByMessageId(messageId) {
        const messages2 = await db.select().from(whatsappMessages).where(eq(whatsappMessages.messageId, messageId));
        return messages2;
      }
      async updateWhatsappMessageStatus(id, status) {
        const [msg] = await db.update(whatsappMessages).set({ status }).where(eq(whatsappMessages.id, id)).returning();
        return msg || void 0;
      }
      async getWhatsappConfig() {
        const [config] = await db.select().from(whatsappConfig);
        return config || void 0;
      }
      async updateWhatsappConfig(updates) {
        const [config] = await db.select().from(whatsappConfig).limit(1);
        if (!config) return await this.initWhatsappConfig();
        const [updated] = await db.update(whatsappConfig).set(updates).where(eq(whatsappConfig.id, config.id)).returning();
        return updated || void 0;
      }
      // Bill Payment operations
      async createBillPayment(payment) {
        const [billPayment] = await db.insert(billPayments).values(payment).returning();
        return billPayment;
      }
      async getBillPaymentsByUserId(userId) {
        const payments = await db.select().from(billPayments).where(eq(billPayments.userId, userId)).orderBy(desc(billPayments.createdAt));
        return payments;
      }
      async getBillPayment(id) {
        const [payment] = await db.select().from(billPayments).where(eq(billPayments.id, id));
        return payment || void 0;
      }
      async updateBillPayment(id, updates) {
        const [payment] = await db.update(billPayments).set(updates).where(eq(billPayments.id, id)).returning();
        return payment || void 0;
      }
      async initWhatsappConfig() {
        const existing = await this.getWhatsappConfig();
        if (existing) return existing;
        const [config] = await db.insert(whatsappConfig).values({
          phoneNumberId: "",
          businessAccountId: "",
          accessToken: "",
          verifyToken: "greenpay_verify_token_2024",
          isActive: false
        }).returning();
        return config;
      }
      // Announcement operations
      async getAnnouncements() {
        return await db.select().from(announcements).orderBy(desc(announcements.priority));
      }
      async getActiveAnnouncements() {
        const now = /* @__PURE__ */ new Date();
        return await db.select().from(announcements).where(
          and(
            eq(announcements.isActive, true),
            or(isNull(announcements.startsAt), sql2`${announcements.startsAt} <= ${now}`),
            or(isNull(announcements.expiresAt), sql2`${announcements.expiresAt} >= ${now}`)
          )
        ).orderBy(desc(announcements.priority));
      }
      async createAnnouncement(insertAnnouncement) {
        const [announcement] = await db.insert(announcements).values(insertAnnouncement).returning();
        return announcement;
      }
      async updateAnnouncement(id, updates) {
        const [announcement] = await db.update(announcements).set(updates).where(eq(announcements.id, id)).returning();
        return announcement;
      }
      async deleteAnnouncement(id) {
        await db.delete(announcements).where(eq(announcements.id, id));
      }
    };
    storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();
    memStorage = new MemStorage();
  }
});

// server/services/exchange-rate.ts
var exchange_rate_exports = {};
__export(exchange_rate_exports, {
  ExchangeRateService: () => ExchangeRateService,
  createExchangeRateService: () => createExchangeRateService,
  exchangeRateService: () => exchangeRateService
});
import fetch3 from "node-fetch";
var ExchangeRateService, createExchangeRateService, exchangeRateService;
var init_exchange_rate = __esm({
  "server/services/exchange-rate.ts"() {
    "use strict";
    ExchangeRateService = class {
      apiKey;
      baseUrl = "https://v6.exchangerate-api.com/v6";
      storage;
      constructor(storage2) {
        this.storage = storage2;
        this.apiKey = process.env.EXCHANGERATE_API_KEY;
        if (!this.apiKey) {
          console.warn("Exchange rate API key not configured - using fallback rates");
        }
      }
      async getApiKey() {
        if (this.storage) {
          try {
            const config = await this.storage.getApiConfiguration("exchange_rate");
            if (config && config.isEnabled && config.apiKey) {
              return config.apiKey;
            }
          } catch (error) {
            console.error("Error fetching exchange rate config from database:", error);
          }
        }
        return this.apiKey;
      }
      async hasApiKey() {
        const key = await this.getApiKey();
        return !!key;
      }
      async getExchangeRate(from, to) {
        const apiKey = await this.getApiKey();
        if (!apiKey) {
          return this.getFallbackRate(from, to);
        }
        try {
          const url = `${this.baseUrl}/${apiKey}/pair/${from}/${to}`;
          const response = await fetch3(url);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          if (data.result !== "success") {
            throw new Error(`API error: ${data["error-type"]}`);
          }
          return data.conversion_rate;
        } catch (error) {
          console.error("Exchange rate fetch error:", error);
          return this.getFallbackRate(from, to);
        }
      }
      getFallbackRate(from, to) {
        const fallbackRates = {
          "USD": {
            "KES": 129
          },
          "KES": {
            "USD": 77e-4
          }
        };
        return fallbackRates[from]?.[to] || 1;
      }
      async getMultipleRates(base, targets) {
        const apiKey = await this.getApiKey();
        if (!apiKey) {
          return this.getMultipleFallbackRates(base, targets);
        }
        try {
          const url = `${this.baseUrl}/${apiKey}/latest/${base}`;
          const response = await fetch3(url);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          if (data.result !== "success") {
            throw new Error(`API error: ${data["error-type"]}`);
          }
          const rates = {};
          targets.forEach((target) => {
            rates[target] = data.conversion_rates[target] || 1;
          });
          return rates;
        } catch (error) {
          console.error("Multiple exchange rates fetch error:", error);
          return this.getMultipleFallbackRates(base, targets);
        }
      }
      getMultipleFallbackRates(base, targets) {
        const usdRates = {
          "KES": 129.5,
          "EUR": 0.9215,
          "GBP": 0.7891,
          "NGN": 1601,
          "GHS": 15.6,
          "TZS": 2645,
          "UGX": 3720,
          "ZAR": 18.63,
          "CAD": 1.3615,
          "AUD": 1.543,
          "JPY": 154.8,
          "CNY": 7.241,
          "INR": 83.45,
          "AED": 3.6725,
          "SAR": 3.75,
          "USD": 1
        };
        if (base === "USD") {
          return Object.fromEntries(
            targets.map((target) => [target, usdRates[target] ?? 1])
          );
        }
        const baseToUsd = usdRates[base] ? 1 / usdRates[base] : 1;
        return Object.fromEntries(
          targets.map((target) => [target, parseFloat(((usdRates[target] ?? 1) * baseToUsd).toFixed(6))])
        );
      }
    };
    createExchangeRateService = (storage2) => new ExchangeRateService(storage2);
    exchangeRateService = new ExchangeRateService();
  }
});

// server/services/mailtrap.ts
var mailtrap_exports = {};
__export(mailtrap_exports, {
  MailtrapService: () => MailtrapService,
  mailtrapService: () => mailtrapService2
});
import fetch7 from "node-fetch";
var DEFAULT_TEMPLATE_UUIDs, MailtrapService, mailtrapService2;
var init_mailtrap = __esm({
  "server/services/mailtrap.ts"() {
    "use strict";
    init_storage();
    DEFAULT_TEMPLATE_UUIDs = {
      otp: "64254a5b-a2ba-4b7d-aa41-5a0907c836db",
      password_reset: "97fe2c00-4cfd-433b-b262-25632cbdbed7",
      welcome: "7711c72e-431b-4fb9-bea9-9738d4d8bfe7",
      kyc_submitted: "dd087e67-8a7b-4bb8-9645-acbd61666d76",
      kyc_verified: "c6353bf3-8e12-4852-8607-82223f49a4aa",
      login_alert: "42ce5e3b-eed9-41aa-808c-cfecbd906e60",
      fund_receipt: "5e2a2ec4-37fb-4178-96c4-598977065f9c",
      card_activation: "a1b2c3d4-e5f6-4789-0123-456789abcdef",
      transaction_export: "307e5609-66bb-4235-8653-27f0d5d74a39",
      transaction_completed: "",
      virtual_account_approved: ""
    };
    MailtrapService = class {
      apiKey = null;
      apiUrl = "https://send.api.mailtrap.io/api/send";
      fromEmail = "support@greenpay.world";
      fromName = "GreenPay";
      constructor() {
        this.apiKey = process.env.MAILTRAP_API_KEY || null;
        this.loadApiKey().catch((err) => console.error("[Mailtrap] Background load error:", err));
      }
      async loadApiKey() {
        try {
          const setting = await storage.getSystemSetting("email", "mailtrap_api_key");
          if (setting?.value) {
            this.apiKey = setting.value;
            process.env.MAILTRAP_API_KEY = setting.value;
          } else {
            this.apiKey = process.env.MAILTRAP_API_KEY || null;
          }
        } catch {
          this.apiKey = process.env.MAILTRAP_API_KEY || null;
        }
      }
      async refreshApiKey() {
        await this.loadApiKey();
      }
      /**
       * Get template UUID — checks DB first, falls back to hardcoded defaults
       */
      async getTemplateUuid(templateName) {
        try {
          const setting = await storage.getSystemSetting("email_templates", templateName);
          if (setting?.value && setting.value.trim()) return setting.value.trim();
        } catch {
        }
        return DEFAULT_TEMPLATE_UUIDs[templateName] || null;
      }
      /**
       * Send email using Mailtrap template
       */
      async sendTemplate(toEmail, templateUuid, variables, attachments) {
        try {
          if (!this.apiKey) {
            console.error("[Mailtrap] API key not configured");
            return false;
          }
          if (!templateUuid) {
            console.warn("[Mailtrap] Template UUID not configured \u2014 skipping email");
            return false;
          }
          const payload = {
            template_uuid: templateUuid,
            template_variables: variables,
            from: { email: this.fromEmail, name: this.fromName },
            to: [{ email: toEmail }]
          };
          if (attachments?.length) payload.attachments = attachments;
          const response = await fetch7(this.apiUrl, {
            method: "POST",
            headers: {
              "Api-Token": this.apiKey,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          });
          if (!response.ok) {
            const error = await response.text();
            console.error(`[Mailtrap] Send failed ${response.status}: ${error}`);
            return false;
          }
          const result = await response.json();
          if (result.success || result.message_id || result.messages) {
            console.log(`[Mailtrap] \u2713 Sent template ${templateUuid} to ${toEmail}`);
            return true;
          }
          console.warn("[Mailtrap] Unexpected response:", result);
          return true;
        } catch (error) {
          console.error("[Mailtrap] Error:", error);
          return false;
        }
      }
      async sendOTP(toEmail, firstName, lastName, otp) {
        const uuid = await this.getTemplateUuid("otp");
        if (!uuid) return false;
        return this.sendTemplate(toEmail, uuid, { first_name: firstName, last_name: lastName, otp });
      }
      async sendPasswordReset(toEmail, firstName, lastName, resetCode) {
        const uuid = await this.getTemplateUuid("password_reset");
        if (!uuid) return false;
        return this.sendTemplate(toEmail, uuid, { first_name: firstName, last_name: lastName, reset_code: resetCode });
      }
      async sendWelcome(toEmail, firstName, lastName) {
        const uuid = await this.getTemplateUuid("welcome");
        if (!uuid) return false;
        return this.sendTemplate(toEmail, uuid, { first_name: firstName, last_name: lastName });
      }
      async sendKYCSubmitted(toEmail, firstName, lastName) {
        const uuid = await this.getTemplateUuid("kyc_submitted");
        if (!uuid) return false;
        return this.sendTemplate(toEmail, uuid, { first_name: firstName, last_name: lastName });
      }
      async sendKYCVerified(toEmail, firstName, lastName) {
        const uuid = await this.getTemplateUuid("kyc_verified");
        if (!uuid) return false;
        return this.sendTemplate(toEmail, uuid, { first_name: firstName, last_name: lastName });
      }
      async sendLoginAlert(toEmail, firstName, lastName, location, ipAddress, device) {
        const uuid = await this.getTemplateUuid("login_alert");
        if (!uuid) return false;
        return this.sendTemplate(toEmail, uuid, {
          first_name: firstName,
          last_name: lastName,
          location,
          ip_address: ipAddress,
          device
        });
      }
      async sendFundReceipt(toEmail, firstName, lastName, amount, currency, sender) {
        const uuid = await this.getTemplateUuid("fund_receipt");
        if (!uuid) return false;
        return this.sendTemplate(toEmail, uuid, {
          first_name: firstName,
          last_name: lastName,
          amount,
          currency,
          sender
        });
      }
      async sendCardActivation(toEmail, firstName, lastName, cardLastFour) {
        const uuid = await this.getTemplateUuid("card_activation");
        if (!uuid) return false;
        return this.sendTemplate(toEmail, uuid, {
          first_name: firstName,
          last_name: lastName,
          card_last_four: cardLastFour
        });
      }
      async sendCustomTemplate(toEmail, templateUuid, variables) {
        return this.sendTemplate(toEmail, templateUuid, variables);
      }
      async sendTransactionCompleted(toEmail, firstName, lastName, amount, currency, transactionType, transactionId, date) {
        const uuid = await this.getTemplateUuid("transaction_completed");
        if (!uuid) {
          console.warn("[Mailtrap] transaction_completed template UUID not configured \u2014 skipping email");
          return false;
        }
        const typeLabel = transactionType === "deposit" ? "Deposit" : transactionType === "withdraw" ? "Withdrawal" : transactionType === "send" ? "Transfer Sent" : transactionType === "receive" ? "Transfer Received" : "Transaction";
        return this.sendTemplate(toEmail, uuid, {
          first_name: firstName,
          last_name: lastName,
          amount,
          currency,
          transaction_type: typeLabel,
          transaction_id: transactionId,
          status: "Completed",
          date: date || (/* @__PURE__ */ new Date()).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
        });
      }
      async sendVirtualAccountApproved(toEmail, firstName, lastName, variables) {
        const uuid = await this.getTemplateUuid("virtual_account_approved");
        if (!uuid) {
          console.warn("[Mailtrap] virtual_account_approved template UUID not configured \u2014 skipping email");
          return false;
        }
        return this.sendTemplate(toEmail, uuid, { first_name: firstName, last_name: lastName, ...variables });
      }
      async sendTransactionExport(toEmail, firstName, lastName, attachments) {
        const uuid = await this.getTemplateUuid("transaction_export");
        if (!uuid) return false;
        return this.sendTemplate(toEmail, uuid, { first_name: firstName, last_name: lastName }, attachments);
      }
      /** Return all template names and their current UUIDs (DB overrides + defaults) */
      async getAllTemplateUuids() {
        const result = {};
        for (const name of Object.keys(DEFAULT_TEMPLATE_UUIDs)) {
          try {
            const setting = await storage.getSystemSetting("email_templates", name);
            if (setting?.value?.trim()) {
              result[name] = { uuid: setting.value.trim(), isCustom: true };
            } else {
              result[name] = { uuid: DEFAULT_TEMPLATE_UUIDs[name], isCustom: false };
            }
          } catch {
            result[name] = { uuid: DEFAULT_TEMPLATE_UUIDs[name], isCustom: false };
          }
        }
        return result;
      }
    };
    mailtrapService2 = new MailtrapService();
  }
});

// server/services/email-templates.ts
var email_templates_exports = {};
__export(email_templates_exports, {
  emailTemplates: () => emailTemplates
});
var baseTemplate, emailTemplates;
var init_email_templates = __esm({
  "server/services/email-templates.ts"() {
    "use strict";
    baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GreenPay</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
    }
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .logo {
      width: 60px;
      height: 60px;
      background-color: #ffffff;
      border-radius: 50%;
      margin: 0 auto 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      font-weight: bold;
      color: #10b981;
    }
    .header-title {
      color: #ffffff;
      font-size: 24px;
      font-weight: bold;
      margin: 0;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      color: #1f2937;
      margin-bottom: 20px;
    }
    .text {
      font-size: 16px;
      color: #4b5563;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .otp-box {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 30px 0;
    }
    .otp-code {
      font-size: 36px;
      font-weight: bold;
      color: #ffffff;
      letter-spacing: 8px;
      margin: 0;
    }
    .otp-label {
      color: #ffffff;
      font-size: 14px;
      margin-top: 12px;
      opacity: 0.9;
    }
    .info-box {
      background-color: #f0fdf4;
      border-left: 4px solid #10b981;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .warning-box {
      background-color: #fef2f2;
      border-left: 4px solid #ef4444;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .transaction-box {
      background-color: #f9fafb;
      border-radius: 12px;
      padding: 24px;
      margin: 20px 0;
    }
    .transaction-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .transaction-row:last-child {
      border-bottom: none;
    }
    .transaction-label {
      color: #6b7280;
      font-size: 14px;
    }
    .transaction-value {
      color: #1f2937;
      font-weight: 600;
      font-size: 14px;
    }
    .amount {
      font-size: 32px;
      font-weight: bold;
      color: #10b981;
      text-align: center;
      margin: 20px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff !important;
      padding: 14px 32px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      text-align: center;
      margin: 20px 0;
    }
    .button-secondary {
      display: inline-block;
      background-color: #f3f4f6;
      color: #1f2937 !important;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 500;
      margin: 10px 5px;
    }
    .footer {
      background-color: #f9fafb;
      padding: 30px 20px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer-text {
      color: #6b7280;
      font-size: 14px;
      line-height: 1.6;
      margin: 8px 0;
    }
    .footer-links {
      margin: 20px 0;
    }
    .footer-link {
      color: #10b981;
      text-decoration: none;
      margin: 0 10px;
      font-size: 14px;
    }
    .social-icons {
      margin: 20px 0;
    }
    .social-icon {
      display: inline-block;
      width: 36px;
      height: 36px;
      background-color: #10b981;
      border-radius: 50%;
      margin: 0 8px;
      color: #ffffff;
      text-decoration: none;
      line-height: 36px;
      font-size: 18px;
    }
    .divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 30px 0;
    }
    @media only screen and (max-width: 600px) {
      .content {
        padding: 30px 20px;
      }
      .otp-code {
        font-size: 28px;
        letter-spacing: 6px;
      }
      .amount {
        font-size: 28px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="header">
      <div class="logo">$</div>
      <h1 class="header-title">GreenPay</h1>
    </div>
    ${content}
    <div class="footer">
      <p class="footer-text"><strong>GreenPay</strong></p>
      <p class="footer-text">Send money to Africa safely, quickly, and affordably</p>
      
      <div class="footer-links">
        <a href="https://greenpay.world/help" class="footer-link">Help Center</a>
        <a href="https://greenpay.world/security" class="footer-link">Security</a>
        <a href="https://greenpay.world/contact" class="footer-link">Contact Us</a>
      </div>
      
      <div class="divider"></div>
      
      <p class="footer-text">This email was sent from GreenPay. Please do not reply to this email.</p>
      <p class="footer-text">If you didn't request this email, please contact our support team.</p>
      
      <p class="footer-text" style="margin-top: 20px;">
        \xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} GreenPay. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`;
    emailTemplates = {
      /**
       * OTP Verification Email
       */
      otp: (otpCode, userName) => {
        const content = `
      <div class="content">
        <p class="greeting">Hello${userName ? ` ${userName}` : ""}! \u{1F44B}</p>
        
        <p class="text">
          We received a request to verify your GreenPay account. Use the verification code below to complete the process.
        </p>
        
        <div class="otp-box">
          <p class="otp-code">${otpCode}</p>
          <p class="otp-label">Enter this code to verify your account</p>
        </div>
        
        <div class="info-box">
          <p class="text" style="margin: 0;">
            <strong>\u23F0 This code expires in 10 minutes</strong><br>
            For your security, do not share this code with anyone.
          </p>
        </div>
        
        <p class="text">
          If you didn't request this code, please ignore this email or contact our support team if you have concerns.
        </p>
      </div>
    `;
        return baseTemplate(content);
      },
      /**
       * Password Reset Email
       */
      passwordReset: (resetCode, userName) => {
        const content = `
      <div class="content">
        <p class="greeting">Hello${userName ? ` ${userName}` : ""}! \u{1F510}</p>
        
        <p class="text">
          We received a request to reset your GreenPay account password. Use the code below to create a new password.
        </p>
        
        <div class="otp-box">
          <p class="otp-code">${resetCode}</p>
          <p class="otp-label">Password Reset Code</p>
        </div>
        
        <div class="warning-box">
          <p class="text" style="margin: 0;">
            <strong>\u26A0\uFE0F Security Alert</strong><br>
            This code expires in 10 minutes. If you didn't request a password reset, please secure your account immediately by contacting our support team.
          </p>
        </div>
        
        <p class="text">
          After entering this code, you'll be able to create a new secure password for your account.
        </p>
      </div>
    `;
        return baseTemplate(content);
      },
      /**
       * Welcome Email
       */
      welcome: (userName) => {
        const content = `
      <div class="content">
        <p class="greeting">Welcome to GreenPay, ${userName}! \u{1F389}</p>
        
        <p class="text">
          We're thrilled to have you join our community! GreenPay makes sending money to Africa simple, secure, and affordable.
        </p>
        
        <div class="info-box">
          <p class="text" style="margin: 0;">
            <strong>\u{1F680} Get Started:</strong><br>
            \u2022 Complete your profile verification<br>
            \u2022 Add funds to your account<br>
            \u2022 Send money to friends and family<br>
            \u2022 Get your virtual card for online payments
          </p>
        </div>
        
        <div style="text-align: center;">
          <a href="https://greenpay.world/dashboard" class="button">Go to Dashboard</a>
        </div>
        
        <p class="text">
          Need help? Our support team is available 24/7 to assist you with any questions.
        </p>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://greenpay.world/help" class="button-secondary">Visit Help Center</a>
          <a href="https://greenpay.world/contact" class="button-secondary">Contact Support</a>
        </div>
      </div>
    `;
        return baseTemplate(content);
      },
      /**
       * Fund Receipt Email
       */
      fundReceipt: (amount, currency, sender, userName) => {
        const content = `
      <div class="content">
        <p class="greeting">Hello${userName ? ` ${userName}` : ""}! \u{1F4B0}</p>
        
        <p class="text">
          Great news! You've received money in your GreenPay account.
        </p>
        
        <div class="amount">${currency} ${amount}</div>
        
        <div class="transaction-box">
          <div class="transaction-row">
            <span class="transaction-label">From</span>
            <span class="transaction-value">${sender}</span>
          </div>
          <div class="transaction-row">
            <span class="transaction-label">Amount</span>
            <span class="transaction-value">${currency} ${amount}</span>
          </div>
          <div class="transaction-row">
            <span class="transaction-label">Status</span>
            <span class="transaction-value" style="color: #10b981;">\u2713 Completed</span>
          </div>
          <div class="transaction-row">
            <span class="transaction-label">Date</span>
            <span class="transaction-value">${(/* @__PURE__ */ new Date()).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })}</span>
          </div>
        </div>
        
        <div style="text-align: center;">
          <a href="https://greenpay.world/transactions" class="button">View Transaction Details</a>
        </div>
        
        <p class="text">
          Your new balance is now available in your account and ready to use.
        </p>
      </div>
    `;
        return baseTemplate(content);
      },
      /**
       * Transaction Notification Email
       */
      transaction: (type, amount, currency, status, transactionId, userName) => {
        const action = type === "withdraw" ? "Withdrawal" : type === "send" ? "Transfer" : "Transaction";
        const statusColor = status === "completed" ? "#10b981" : status === "pending" ? "#f59e0b" : "#ef4444";
        const statusIcon = status === "completed" ? "\u2713" : status === "pending" ? "\u23F3" : "\u2717";
        const content = `
      <div class="content">
        <p class="greeting">Hello${userName ? ` ${userName}` : ""}!</p>
        
        <p class="text">
          Your ${action.toLowerCase()} has been ${status}.
        </p>
        
        <div class="amount">${currency} ${amount}</div>
        
        <div class="transaction-box">
          <div class="transaction-row">
            <span class="transaction-label">Type</span>
            <span class="transaction-value">${action}</span>
          </div>
          <div class="transaction-row">
            <span class="transaction-label">Amount</span>
            <span class="transaction-value">${currency} ${amount}</span>
          </div>
          <div class="transaction-row">
            <span class="transaction-label">Status</span>
            <span class="transaction-value" style="color: ${statusColor};">${statusIcon} ${status.charAt(0).toUpperCase() + status.slice(1)}</span>
          </div>
          <div class="transaction-row">
            <span class="transaction-label">Transaction ID</span>
            <span class="transaction-value">${transactionId}</span>
          </div>
          <div class="transaction-row">
            <span class="transaction-label">Date</span>
            <span class="transaction-value">${(/* @__PURE__ */ new Date()).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })}</span>
          </div>
        </div>
        
        <div style="text-align: center;">
          <a href="https://greenpay.world/transactions" class="button">View All Transactions</a>
        </div>
      </div>
    `;
        return baseTemplate(content);
      },
      /**
       * Login Alert Email
       */
      loginAlert: (location, ip, timestamp2, userName) => {
        const content = `
      <div class="content">
        <p class="greeting">Hello${userName ? ` ${userName}` : ""}! \u{1F510}</p>
        
        <p class="text">
          We detected a new login to your GreenPay account. If this was you, you can safely ignore this email.
        </p>
        
        <div class="transaction-box">
          <div class="transaction-row">
            <span class="transaction-label">Location</span>
            <span class="transaction-value">${location}</span>
          </div>
          <div class="transaction-row">
            <span class="transaction-label">IP Address</span>
            <span class="transaction-value">${ip}</span>
          </div>
          <div class="transaction-row">
            <span class="transaction-label">Time</span>
            <span class="transaction-value">${timestamp2}</span>
          </div>
        </div>
        
        <div class="warning-box">
          <p class="text" style="margin: 0;">
            <strong>\u26A0\uFE0F Was this you?</strong><br>
            If you don't recognize this login activity, please secure your account immediately by changing your password and enabling two-factor authentication.
          </p>
        </div>
        
        <div style="text-align: center;">
          <a href="https://greenpay.world/settings/security" class="button">Secure My Account</a>
        </div>
        
        <p class="text">
          For your security, we recommend using strong, unique passwords and enabling two-factor authentication.
        </p>
      </div>
    `;
        return baseTemplate(content);
      },
      /**
       * KYC Verified Email
       */
      kycVerified: (userName) => {
        const content = `
      <div class="content">
        <p class="greeting">Congratulations, ${userName}! \u2705</p>
        
        <p class="text">
          Your GreenPay account has been successfully verified! You now have full access to all our features.
        </p>
        
        <div class="info-box">
          <p class="text" style="margin: 0;">
            <strong>\u{1F389} What's now available:</strong><br>
            \u2022 Send money internationally without limits<br>
            \u2022 Request and receive payments<br>
            \u2022 Order virtual cards for online shopping<br>
            \u2022 Access premium features and lower fees
          </p>
        </div>
        
        <div style="text-align: center;">
          <a href="https://greenpay.world/dashboard" class="button">Explore Your Account</a>
        </div>
        
        <p class="text">
          Thank you for completing the verification process. We're excited to help you with all your money transfer needs!
        </p>
      </div>
    `;
        return baseTemplate(content);
      },
      /**
       * Card Activation Email
       */
      cardActivation: (cardLastFour, userName) => {
        const content = `
      <div class="content">
        <p class="greeting">Hello${userName ? ` ${userName}` : ""}! \u{1F4B3}</p>
        
        <p class="text">
          Great news! Your GreenPay virtual card is now active and ready to use.
        </p>
        
        <div class="transaction-box">
          <div style="text-align: center; padding: 20px 0;">
            <div style="font-size: 48px; margin-bottom: 12px;">\u{1F4B3}</div>
            <p class="transaction-value" style="font-size: 18px;">Card ending in \u2022\u2022\u2022\u2022 ${cardLastFour}</p>
            <p class="transaction-label">Status: <span style="color: #10b981; font-weight: 600;">Active</span></p>
          </div>
        </div>
        
        <div class="info-box">
          <p class="text" style="margin: 0;">
            <strong>\u{1F6E1}\uFE0F Security Tips:</strong><br>
            \u2022 Never share your card details with anyone<br>
            \u2022 Enable transaction notifications<br>
            \u2022 Set spending limits for extra security<br>
            \u2022 Review transactions regularly
          </p>
        </div>
        
        <div style="text-align: center;">
          <a href="https://greenpay.world/cards" class="button">View Card Details</a>
        </div>
        
        <p class="text">
          Your card can be used for online purchases anywhere that accepts virtual cards. Happy shopping!
        </p>
      </div>
    `;
        return baseTemplate(content);
      },
      /**
       * Test Email
       */
      test: () => {
        const content = `
      <div class="content">
        <p class="greeting">Email Configuration Test \u2705</p>
        
        <p class="text">
          This is a test email to verify that your GreenPay email configuration is working correctly.
        </p>
        
        <div class="info-box">
          <p class="text" style="margin: 0;">
            <strong>\u2713 Success!</strong><br>
            If you're reading this, your SMTP settings are configured correctly and emails are being sent successfully.
          </p>
        </div>
        
        <p class="text">
          Your email service is now ready to send notifications to your users for:
        </p>
        
        <ul class="text">
          <li>OTP verification codes</li>
          <li>Password reset requests</li>
          <li>Transaction notifications</li>
          <li>Login alerts</li>
          <li>Account updates</li>
        </ul>
        
        <p class="text">
          You can close this test email. Everything is working perfectly!
        </p>
      </div>
    `;
        return baseTemplate(content);
      },
      /**
       * Custom Admin Email
       */
      custom: (params) => {
        const formatMessage = (text2) => {
          return text2.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\*(.*?)\*/g, "<em>$1</em>").replace(/\n• /g, "<br>\u2022 ").replace(/\n/g, "<br>");
        };
        const imageSection = params.imageUrl ? `
      <div style="text-align: center; margin: 30px 0;">
        <img src="${params.imageUrl}" alt="Email Image" style="max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      </div>
    ` : "";
        const linkSection = params.linkText && params.linkUrl ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${params.linkUrl}" class="button" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
          ${params.linkText}
        </a>
      </div>
    ` : "";
        const content = `
      <div class="content">
        <p class="greeting">Message from GreenPay Team</p>
        
        <p class="text">
          ${formatMessage(params.message)}
        </p>

        ${imageSection}
        ${linkSection}
        
        <div class="info-box">
          <p class="text" style="margin: 0;">
            If you have any questions or need assistance, please don't hesitate to contact our support team.
          </p>
        </div>
      </div>
    `;
        return baseTemplate(content);
      }
    };
  }
});

// server/services/email.ts
var email_exports = {};
__export(email_exports, {
  EmailService: () => EmailService,
  emailService: () => emailService
});
import nodemailer from "nodemailer";
var EmailService, emailService;
var init_email = __esm({
  "server/services/email.ts"() {
    "use strict";
    init_storage();
    init_email_templates();
    EmailService = class {
      transporter = null;
      credentials = null;
      /**
       * Get email credentials from system settings
       */
      async getCredentials() {
        try {
          const settings = await storage.getSystemSettingsByCategory("email");
          const host = settings.find((s) => s.key === "smtp_host")?.value;
          const port = parseInt(settings.find((s) => s.key === "smtp_port")?.value || "465");
          const secure = settings.find((s) => s.key === "smtp_secure")?.value === "true";
          const username = settings.find((s) => s.key === "smtp_username")?.value || "smtp.zoho.com";
          const password = settings.find((s) => s.key === "smtp_password")?.value || "Kitondosch.6639";
          const fromEmail = settings.find((s) => s.key === "from_email")?.value || "support@greenpay.world";
          const fromName = settings.find((s) => s.key === "from_name")?.value || "GreenPay";
          if (!host || !username || !password || !fromEmail) {
            console.warn("Email credentials not fully configured");
            return null;
          }
          return { host, port, secure, username, password, fromEmail, fromName };
        } catch (error) {
          console.error("Error fetching email credentials:", error);
          return null;
        }
      }
      /**
       * Initialize or refresh the SMTP transporter
       */
      async initializeTransporter() {
        try {
          this.credentials = await this.getCredentials();
          if (!this.credentials) {
            return false;
          }
          this.transporter = nodemailer.createTransport({
            host: this.credentials.host,
            port: this.credentials.port,
            secure: this.credentials.secure,
            auth: {
              user: this.credentials.username,
              pass: this.credentials.password
            }
          });
          await this.transporter.verify();
          console.log("\u2705 Email service initialized successfully");
          return true;
        } catch (error) {
          console.error("Email service initialization failed:", error);
          this.transporter = null;
          return false;
        }
      }
      /**
       * Send an email
       */
      async sendEmail(to, subject, html) {
        try {
          if (!this.transporter) {
            const initialized = await this.initializeTransporter();
            if (!initialized || !this.transporter || !this.credentials) {
              console.warn("Email not sent: Service not configured");
              return false;
            }
          }
          if (!this.credentials) {
            this.credentials = await this.getCredentials();
            if (!this.credentials) {
              return false;
            }
          }
          const mailOptions = {
            from: `${this.credentials.fromName} <${this.credentials.fromEmail}>`,
            to,
            subject,
            html
          };
          const info = await this.transporter.sendMail(mailOptions);
          console.log(`\u2705 Email sent successfully to ${to} - MessageId: ${info.messageId}`);
          return true;
        } catch (error) {
          if (error.code === "EAUTH" || error.responseCode === 535) {
            console.log("Email auth failed, reinitializing transporter...");
            const initialized = await this.initializeTransporter();
            if (initialized && this.transporter) {
              try {
                const mailOptions = {
                  from: `${this.credentials?.fromName} <${this.credentials?.fromEmail}>`,
                  to,
                  subject,
                  html
                };
                await this.transporter.sendMail(mailOptions);
                console.log(`\u2705 Email sent successfully to ${to} (after reinit)`);
                return true;
              } catch (retryError) {
                console.error("Email sending error after reinit:", retryError);
                return false;
              }
            }
          }
          console.error("Email sending error:", error);
          return false;
        }
      }
      /**
       * Send OTP verification code
       */
      async sendOTP(email, otpCode, userName) {
        const subject = "Your GreenPay Verification Code";
        const html = emailTemplates.otp(otpCode, userName);
        return this.sendEmail(email, subject, html);
      }
      /**
       * Send password reset code
       */
      async sendPasswordReset(email, resetCode, userName) {
        const subject = "Reset Your GreenPay Password";
        const html = emailTemplates.passwordReset(resetCode, userName);
        return this.sendEmail(email, subject, html);
      }
      /**
       * Send welcome email
       */
      async sendWelcome(email, userName) {
        const subject = "Welcome to GreenPay! \u{1F389}";
        const html = emailTemplates.welcome(userName);
        return this.sendEmail(email, subject, html);
      }
      /**
       * Send fund receipt notification
       */
      async sendFundReceipt(email, amount, currency, sender, userName) {
        const subject = `You've Received ${currency} ${amount}`;
        const html = emailTemplates.fundReceipt(amount, currency, sender, userName);
        return this.sendEmail(email, subject, html);
      }
      /**
       * Send transaction notification
       */
      async sendTransactionNotification(email, type, amount, currency, status, transactionId, userName) {
        const action = type === "withdraw" ? "Withdrawal" : type === "send" ? "Transfer" : "Transaction";
        const subject = `${action} ${status === "completed" ? "Completed" : "Update"}: ${currency} ${amount}`;
        const html = emailTemplates.transaction(type, amount, currency, status, transactionId, userName);
        return this.sendEmail(email, subject, html);
      }
      /**
       * Send login alert
       */
      async sendLoginAlert(email, location, ip, timestamp2, userName) {
        const subject = "\u{1F510} New Login to Your GreenPay Account";
        const html = emailTemplates.loginAlert(location, ip, timestamp2, userName);
        return this.sendEmail(email, subject, html);
      }
      /**
       * Send KYC verified notification
       */
      async sendKYCVerified(email, userName) {
        const subject = "\u2705 Your Account is Now Verified!";
        const html = emailTemplates.kycVerified(userName);
        return this.sendEmail(email, subject, html);
      }
      /**
       * Send card activation notification
       */
      async sendCardActivation(email, cardLastFour, userName) {
        const subject = "\u{1F4B3} Your Virtual Card is Active!";
        const html = emailTemplates.cardActivation(cardLastFour, userName);
        return this.sendEmail(email, subject, html);
      }
      /**
       * Send test email (for admin configuration testing)
       */
      async sendTestEmail(email) {
        const subject = "Test Email from GreenPay";
        const html = emailTemplates.test();
        return this.sendEmail(email, subject, html);
      }
      /**
       * Verify email configuration
       */
      async verifyConfiguration() {
        return await this.initializeTransporter();
      }
    };
    emailService = new EmailService();
  }
});

// server/services/whatsapp.ts
var whatsapp_exports = {};
__export(whatsapp_exports, {
  WhatsAppService: () => WhatsAppService,
  whatsappService: () => whatsappService
});
import fetch8 from "node-fetch";
var WhatsAppService, whatsappService;
var init_whatsapp = __esm({
  "server/services/whatsapp.ts"() {
    "use strict";
    init_storage();
    WhatsAppService = class {
      accessToken;
      phoneNumberId;
      apiVersion = "v24.0";
      graphApiUrl = "https://graph.facebook.com";
      constructor() {
        this.loadCredentials();
      }
      /**
       * Safely extract string value from database result or env var
       */
      extractStringValue(value) {
        if (!value) return "";
        if (typeof value === "string") {
          return value.trim();
        }
        if (typeof value === "object" && value.value && typeof value.value === "string") {
          return value.value.trim();
        }
        if (typeof value === "number" || typeof value === "boolean") {
          return String(value).trim();
        }
        const strValue = String(value).trim();
        if (strValue === "[object Object]") {
          console.warn("[WhatsApp] \u26A0\uFE0F Received [object Object] - value is not serializable:", value);
          return "";
        }
        return strValue;
      }
      /**
       * Load credentials from environment variables and database
       */
      async loadCredentials() {
        try {
          const tokenSetting = await storage.getSystemSetting("messaging", "whatsapp_access_token");
          const phoneSetting = await storage.getSystemSetting("messaging", "whatsapp_phone_number_id");
          const dbToken = tokenSetting?.value ? this.extractStringValue(tokenSetting.value) : "";
          const dbPhoneId = phoneSetting?.value ? this.extractStringValue(phoneSetting.value) : "";
          this.accessToken = dbToken || process.env.WHAPP_ACCESS_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN || "";
          this.phoneNumberId = dbPhoneId || process.env.WHAPP_PHONE_NUMBER_ID || process.env.WHATSAPP_PHONE_NUMBER_ID || "";
          console.log("[WhatsApp] Credentials load result:", {
            hasTokenFromDb: !!dbToken,
            hasTokenFromEnv: !!process.env.WHATSAPP_ACCESS_TOKEN,
            hasPhoneFromDb: !!dbPhoneId,
            hasPhoneFromEnv: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
            usingToken: this.accessToken.length > 0,
            usingPhone: this.phoneNumberId.length > 0,
            tokenLength: this.accessToken.length,
            phoneIdLength: this.phoneNumberId.length
          });
          if (this.accessToken && this.phoneNumberId) {
            console.log("[WhatsApp] \u2713 Credentials loaded successfully");
          } else {
            console.warn("[WhatsApp] \u26A0\uFE0F Credentials incomplete - Token:", !!this.accessToken, "Phone ID:", !!this.phoneNumberId);
          }
        } catch (error) {
          console.error("[WhatsApp] Error loading credentials from database:", error);
          this.accessToken = this.extractStringValue(process.env.WHATSAPP_ACCESS_TOKEN);
          this.phoneNumberId = this.extractStringValue(process.env.WHATSAPP_PHONE_NUMBER_ID);
        }
      }
      /**
       * Refresh credentials when settings are updated
       */
      async refreshCredentials() {
        console.log("[WhatsApp] Refreshing credentials...");
        await this.loadCredentials();
      }
      checkCredentials() {
        const tokenStr = String(this.accessToken || "");
        const phoneStr = String(this.phoneNumberId || "");
        const hasToken = !!(tokenStr && tokenStr.trim());
        const hasPhoneId = !!(phoneStr && phoneStr.trim());
        if (!hasToken || !hasPhoneId) {
          console.warn("[WhatsApp] Configuration missing:", {
            hasToken,
            hasPhoneId,
            tokenLength: tokenStr.length,
            phoneIdLength: phoneStr.length,
            tokenType: typeof this.accessToken,
            phoneIdType: typeof this.phoneNumberId
          });
        }
        return hasToken && hasPhoneId;
      }
      /**
       * Format phone number to international format (without +)
       * WhatsApp API requires: 1XXXXXXXXXX (no + prefix)
       */
      formatPhoneNumber(phone) {
        let cleaned = phone.replace(/[\s-()]/g, "");
        if (cleaned.startsWith("+")) {
          cleaned = cleaned.substring(1);
        }
        if (cleaned.startsWith("00")) {
          cleaned = cleaned.substring(2);
        }
        return cleaned;
      }
      /**
       * Send text message via WhatsApp Business API
       * Sends custom text messages to users
       */
      async sendTextMessage(phoneNumber, message) {
        await this.refreshCredentials();
        if (!this.checkCredentials()) {
          console.error("[WhatsApp] \u2717 Credentials not configured or empty. Cannot send message.");
          return false;
        }
        try {
          const formattedPhone = this.formatPhoneNumber(phoneNumber);
          const url = `${this.graphApiUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;
          const now = /* @__PURE__ */ new Date();
          const dateStr = now.toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" });
          const timeStr = now.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
          const payload = {
            messaging_product: "whatsapp",
            to: formattedPhone,
            type: "text",
            text: {
              body: `${message}

Sent on: ${dateStr} at ${timeStr}
(This message is within 24 hours of your last interaction)`
            }
          };
          console.log("[WhatsApp] Sending text message to", formattedPhone, ":", message);
          const response = await fetch8(url, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${this.accessToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          });
          const responseData = await response.json();
          if (response.ok && responseData.messages) {
            const messageId = responseData.messages?.[0]?.id || "unknown";
            console.log("[WhatsApp] \u2713 Text message sent successfully", {
              to: phoneNumber,
              messageId,
              messageLength: message.length,
              timestamp: (/* @__PURE__ */ new Date()).toISOString(),
              response: responseData
            });
            return true;
          } else {
            const errorMsg = responseData.error?.message || "Unknown error";
            const errorCode = responseData.error?.code || "UNKNOWN_ERROR";
            console.error("[WhatsApp] \u2717 Text message failed", {
              to: phoneNumber,
              error: errorMsg,
              errorCode,
              status: response.status,
              fullError: responseData.error,
              timestamp: (/* @__PURE__ */ new Date()).toISOString()
            });
            return false;
          }
        } catch (error) {
          console.error("[WhatsApp] \u2717 Error sending text message", {
            to: phoneNumber,
            error: error?.message || "Unknown error",
            errorType: error?.constructor?.name,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
          return false;
        }
      }
      /**
       * Send OTP via template message
       * Uses Meta WhatsApp Business API v24.0
       * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/send-message
       */
      async sendOTP(phoneNumber, otpCode) {
        await this.refreshCredentials();
        if (!this.checkCredentials()) {
          console.error("[WhatsApp] \u2717 Credentials not configured - OTP not sent");
          return false;
        }
        try {
          const formattedPhone = this.formatPhoneNumber(phoneNumber);
          const url = `${this.graphApiUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;
          const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: formattedPhone,
            type: "template",
            template: {
              name: "otp",
              language: {
                code: "en_US"
              },
              components: [
                {
                  type: "body",
                  parameters: [
                    {
                      type: "text",
                      text: otpCode
                    }
                  ]
                },
                {
                  type: "button",
                  sub_type: "url",
                  index: "0",
                  parameters: [
                    {
                      type: "text",
                      text: otpCode
                    }
                  ]
                }
              ]
            }
          };
          const response = await fetch8(url, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${this.accessToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          });
          const responseData = await response.json();
          if (response.ok && responseData.messages) {
            const messageId = responseData.messages?.[0]?.id || "unknown";
            console.log("[WhatsApp] \u2713 OTP sent successfully", {
              to: phoneNumber,
              messageId,
              templateName: "otp",
              timestamp: (/* @__PURE__ */ new Date()).toISOString(),
              response: responseData
            });
            return true;
          } else {
            const errorMsg = responseData.error?.message || "Unknown error";
            const errorCode = responseData.error?.code || "UNKNOWN_ERROR";
            console.error("[WhatsApp] \u2717 OTP send failed", {
              to: phoneNumber,
              templateName: "otp",
              error: errorMsg,
              errorCode,
              status: response.status,
              fullError: responseData.error,
              timestamp: (/* @__PURE__ */ new Date()).toISOString()
            });
            return false;
          }
        } catch (error) {
          console.error("[WhatsApp] \u2717 Error sending OTP", {
            to: phoneNumber,
            error: error?.message || "Unknown error",
            errorType: error?.constructor?.name,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
          return false;
        }
      }
      /**
       * Send account verification code via template message
       */
      async sendAccountVerification(phoneNumber, verificationCode) {
        await this.refreshCredentials();
        if (!this.checkCredentials()) {
          console.error("[WhatsApp] \u2717 Credentials not configured - verification not sent");
          return false;
        }
        try {
          const formattedPhone = this.formatPhoneNumber(phoneNumber);
          const url = `${this.graphApiUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;
          const payload = {
            messaging_product: "whatsapp",
            to: formattedPhone,
            type: "template",
            template: {
              name: "account_verification",
              language: { code: "en_US" },
              components: [
                {
                  type: "body",
                  parameters: [
                    { type: "text", text: verificationCode }
                  ]
                }
              ]
            }
          };
          const response = await fetch8(url, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${this.accessToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          });
          const responseData = await response.json();
          if (response.ok && responseData.messages) {
            const messageId = responseData.messages?.[0]?.id || "unknown";
            console.log("[WhatsApp] \u2713 Account verification sent successfully", {
              to: phoneNumber,
              messageId,
              templateName: "account_verification",
              timestamp: (/* @__PURE__ */ new Date()).toISOString(),
              response: responseData
            });
            return true;
          } else {
            const errorMsg = responseData.error?.message || "Unknown error";
            console.error("[WhatsApp] \u2717 Account verification failed", {
              to: phoneNumber,
              error: errorMsg,
              status: response.status,
              fullError: responseData.error,
              timestamp: (/* @__PURE__ */ new Date()).toISOString()
            });
            return false;
          }
        } catch (error) {
          console.error("[WhatsApp] \u2717 Error sending account verification", {
            to: phoneNumber,
            error: error?.message || "Unknown error",
            errorType: error?.constructor?.name,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
          return false;
        }
      }
      /**
       * Send login alert via template message
       * Template name is configurable via system settings for flexibility
       */
      async sendLoginAlert(phoneNumber, location, ipAddress) {
        await this.refreshCredentials();
        if (!this.checkCredentials()) {
          console.error("[WhatsApp] \u2717 Credentials not configured - login alert not sent");
          return false;
        }
        try {
          const formattedPhone = this.formatPhoneNumber(phoneNumber);
          const url = `${this.graphApiUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;
          const templateNameSetting = await storage.getSystemSetting("whatsapp", "login_alert_template");
          const templateName = templateNameSetting?.value?.trim() || "login_alert";
          const payload = {
            messaging_product: "whatsapp",
            to: formattedPhone,
            type: "template",
            template: {
              name: templateName,
              language: { code: "en_US" },
              components: [
                {
                  type: "body",
                  parameters: [
                    { type: "text", text: location },
                    { type: "text", text: ipAddress }
                  ]
                }
              ]
            }
          };
          console.log("[WhatsApp] Sending login alert", {
            to: phoneNumber,
            templateName,
            location,
            ipAddress
          });
          const response = await fetch8(url, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${this.accessToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          });
          const responseData = await response.json();
          if (response.ok && responseData.messages) {
            const messageId = responseData.messages?.[0]?.id || "unknown";
            console.log("[WhatsApp] \u2713 Login alert sent successfully", {
              to: phoneNumber,
              messageId,
              templateName,
              timestamp: (/* @__PURE__ */ new Date()).toISOString(),
              response: responseData
            });
            return true;
          } else {
            const errorMsg = responseData.error?.message || "Unknown error";
            const errorCode = responseData.error?.code || "UNKNOWN_ERROR";
            console.error("[WhatsApp] \u2717 Login alert failed", {
              to: phoneNumber,
              templateName,
              error: errorMsg,
              errorCode,
              status: response.status,
              fullError: responseData.error,
              location,
              ipAddress,
              timestamp: (/* @__PURE__ */ new Date()).toISOString(),
              suggestion: "Check if template name matches your WhatsApp Business Account. Update via admin dashboard: Settings > Messaging Settings > WhatsApp Template Names"
            });
            return false;
          }
        } catch (error) {
          console.error("[WhatsApp] \u2717 Error sending login alert", {
            to: phoneNumber,
            error: error?.message || "Unknown error",
            errorType: error?.constructor?.name,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
          return false;
        }
      }
      /**
       * Send password reset code via OTP template (same as login OTP)
       */
      async sendPasswordReset(phoneNumber, resetCode) {
        await this.refreshCredentials();
        if (!this.checkCredentials()) return false;
        try {
          const formattedPhone = this.formatPhoneNumber(phoneNumber);
          const url = `${this.graphApiUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;
          const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: formattedPhone,
            type: "template",
            template: {
              name: "otp",
              language: {
                code: "en_US"
              },
              components: [
                {
                  type: "body",
                  parameters: [
                    {
                      type: "text",
                      text: resetCode
                    }
                  ]
                },
                {
                  type: "button",
                  sub_type: "url",
                  index: "0",
                  parameters: [
                    {
                      type: "text",
                      text: resetCode
                    }
                  ]
                }
              ]
            }
          };
          const response = await fetch8(url, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${this.accessToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          });
          const responseData = await response.json();
          if (response.ok && responseData.messages) {
            const messageId = responseData.messages?.[0]?.id || "unknown";
            console.log("[WhatsApp] \u2713 Password reset sent successfully", {
              to: phoneNumber,
              messageId,
              templateName: "otp",
              timestamp: (/* @__PURE__ */ new Date()).toISOString()
            });
            return true;
          } else {
            const errorMsg = responseData.error?.message || "Unknown error";
            const errorCode = responseData.error?.code || "UNKNOWN_ERROR";
            console.error("[WhatsApp] \u2717 Password reset send failed", {
              to: phoneNumber,
              templateName: "otp",
              error: errorMsg,
              errorCode,
              status: response.status,
              fullError: responseData.error,
              timestamp: (/* @__PURE__ */ new Date()).toISOString()
            });
            return false;
          }
        } catch (error) {
          console.error("[WhatsApp] \u2717 Error sending password reset", {
            to: phoneNumber,
            error: error?.message || "Unknown error",
            errorType: error?.constructor?.name,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
          return false;
        }
      }
      /**
       * Send KYC verified notification via template
       */
      async sendKYCVerified(phoneNumber) {
        await this.refreshCredentials();
        if (!this.checkCredentials()) return false;
        try {
          const formattedPhone = this.formatPhoneNumber(phoneNumber);
          const url = `${this.graphApiUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;
          const payload = {
            messaging_product: "whatsapp",
            to: formattedPhone,
            type: "template",
            template: {
              name: "kyc_verified",
              language: { code: "en_US" }
            }
          };
          const response = await fetch8(url, { method: "POST", headers: { "Authorization": `Bearer ${this.accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
          const responseData = await response.json();
          if (response.ok && responseData.messages) {
            console.log(`[WhatsApp] \u2713 KYC verified sent to ${phoneNumber}`);
            return true;
          } else {
            console.error(`[WhatsApp] \u2717 KYC verified failed: ${responseData.error?.message || "Unknown error"}`);
            return false;
          }
        } catch (error) {
          console.error("[WhatsApp] Error sending KYC verified:", error);
          return false;
        }
      }
      /**
       * Send card activation notification via template
       */
      async sendCardActivation(phoneNumber, cardLastFour) {
        await this.refreshCredentials();
        if (!this.checkCredentials()) return false;
        try {
          const formattedPhone = this.formatPhoneNumber(phoneNumber);
          const url = `${this.graphApiUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;
          const payload = {
            messaging_product: "whatsapp",
            to: formattedPhone,
            type: "template",
            template: {
              name: "card_activation",
              language: { code: "en_US" },
              components: [{ type: "body", parameters: [{ type: "text", text: cardLastFour }] }]
            }
          };
          const response = await fetch8(url, { method: "POST", headers: { "Authorization": `Bearer ${this.accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
          const responseData = await response.json();
          if (response.ok && responseData.messages) {
            console.log(`[WhatsApp] \u2713 Card activation sent to ${phoneNumber}`);
            return true;
          } else {
            console.error(`[WhatsApp] \u2717 Card activation failed: ${responseData.error?.message || "Unknown error"}`);
            return false;
          }
        } catch (error) {
          console.error("[WhatsApp] Error sending card activation:", error);
          return false;
        }
      }
      /**
       * Send fund receipt notification via template
       */
      async sendFundReceipt(phoneNumber, amount, currency, sender) {
        await this.refreshCredentials();
        if (!this.checkCredentials()) return false;
        try {
          const formattedPhone = this.formatPhoneNumber(phoneNumber);
          const url = `${this.graphApiUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;
          const payload = {
            messaging_product: "whatsapp",
            to: formattedPhone,
            type: "template",
            template: {
              name: "fund_receipt",
              language: { code: "en_US" },
              components: [{ type: "body", parameters: [{ type: "text", text: currency }, { type: "text", text: amount }, { type: "text", text: sender }] }]
            }
          };
          const response = await fetch8(url, { method: "POST", headers: { "Authorization": `Bearer ${this.accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
          const responseData = await response.json();
          if (response.ok && responseData.messages) {
            console.log(`[WhatsApp] \u2713 Fund receipt sent to ${phoneNumber}`);
            return true;
          } else {
            console.error(`[WhatsApp] \u2717 Fund receipt failed: ${responseData.error?.message || "Unknown error"}`);
            return false;
          }
        } catch (error) {
          console.error("[WhatsApp] Error sending fund receipt:", error);
          return false;
        }
      }
      /**
       * Send account creation welcome notification via template
       */
      async sendAccountCreation(phoneNumber, userName) {
        await this.refreshCredentials();
        if (!this.checkCredentials()) return false;
        try {
          const formattedPhone = this.formatPhoneNumber(phoneNumber);
          const url = `${this.graphApiUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;
          const payload = {
            messaging_product: "whatsapp",
            to: formattedPhone,
            type: "template",
            template: {
              name: "create_acc",
              language: { code: "en" },
              components: [{ type: "body", parameters: [{ type: "text", text: userName }] }]
            }
          };
          const response = await fetch8(url, { method: "POST", headers: { "Authorization": `Bearer ${this.accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
          const responseData = await response.json();
          if (response.ok && responseData.messages) {
            console.log(`[WhatsApp] \u2713 Account creation notification sent to ${phoneNumber}`);
            return true;
          } else {
            console.error(`[WhatsApp] \u2717 Account creation notification failed: ${responseData.error?.message || "Unknown error"}`);
            return false;
          }
        } catch (error) {
          console.error("[WhatsApp] Error sending account creation notification:", error);
          return false;
        }
      }
      /**
       * Check if WhatsApp is properly configured
       */
      isConfigured() {
        return this.checkCredentials();
      }
      /**
       * Generate 6-digit OTP code
       */
      generateOTP() {
        return Math.floor(1e5 + Math.random() * 9e5).toString();
      }
      /**
       * Get WhatsApp Business Account ID from database or env
       */
      async getWabaId() {
        const wabaIdSetting = await storage.getSystemSetting("messaging", "whatsapp_business_account_id");
        return wabaIdSetting?.value ? String(wabaIdSetting.value).trim() : process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "";
      }
      /**
       * Create WhatsApp template via Meta API
       * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/message-templates
       */
      async createTemplate(templateName, category, content) {
        try {
          if (!this.accessToken) {
            console.error("[WhatsApp] \u2717 Cannot create template - access token not configured");
            return false;
          }
          const wabaId = await this.getWabaId();
          if (!wabaId) {
            console.error("[WhatsApp] \u2717 WhatsApp Business Account ID not configured");
            return false;
          }
          const url = `${this.graphApiUrl}/${this.apiVersion}/${wabaId}/message_templates`;
          const payload = {
            name: templateName,
            language: "en_US",
            category,
            components: content
          };
          console.log(`[WhatsApp] Creating template "${templateName}"...`);
          const response = await fetch8(url, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${this.accessToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          });
          const responseData = await response.json();
          if (response.ok && responseData.id) {
            console.log(`[WhatsApp] \u2713 Template "${templateName}" created successfully (ID: ${responseData.id})`);
            return true;
          } else {
            console.error(`[WhatsApp] \u2717 Template creation failed: ${responseData.error?.message || "Unknown error"}`);
            return false;
          }
        } catch (error) {
          console.error("[WhatsApp] Error creating template:", error);
          return false;
        }
      }
      /**
       * Validate parameters against template requirements
       */
      async validateTemplateParameters(templateName, parameters) {
        try {
          const template = await this.getTemplateDetails(templateName);
          if (!template) {
            return { valid: false, error: `Template "${templateName}" not found in Meta`, required: 0, provided: 0 };
          }
          const paramNumbers = this.extractParametersFromComponents(template.components || []);
          const requiredCount = paramNumbers.size;
          const providedCount = Object.values(parameters).filter((p) => p && p.trim() !== "").length;
          if (requiredCount > 0 && providedCount < requiredCount) {
            return {
              valid: false,
              error: `Template requires ${requiredCount} parameters but only ${providedCount} provided`,
              required: requiredCount,
              provided: providedCount
            };
          }
          return { valid: true, required: requiredCount, provided: providedCount };
        } catch (error) {
          console.error("[WhatsApp] Error validating template parameters:", error);
          return { valid: false, error: "Failed to validate template", required: 0, provided: 0 };
        }
      }
      /**
       * Send generic template with dynamic parameters and validation
       */
      async sendTemplateGeneric(phoneNumber, templateName, parameters) {
        await this.refreshCredentials();
        if (!this.checkCredentials()) return { success: false, error: "WhatsApp credentials not configured" };
        try {
          const formattedPhone = this.formatPhoneNumber(phoneNumber);
          const url = `${this.graphApiUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;
          const template = await this.getTemplateDetails(templateName);
          const languageCode = template?.language || "en_US";
          const restrictedTemplates = ["call"];
          if (restrictedTemplates.includes(templateName)) {
            const error = `This template (${templateName}) is not available for sending. Contact Meta support to enable this feature.`;
            console.warn(`[WhatsApp] \u2717 Template "${templateName}" is restricted:`, error);
            return { success: false, error };
          }
          const validation = await this.validateTemplateParameters(templateName, parameters);
          if (!validation.valid) {
            console.warn(`[WhatsApp] Parameter validation failed for "${templateName}":`, validation.error);
            return { success: false, error: validation.error };
          }
          const paramArray = Object.values(parameters).filter((p) => p && typeof p === "string" && p.trim() !== "");
          const payload = {
            messaging_product: "whatsapp",
            to: formattedPhone,
            type: "template",
            template: {
              name: templateName,
              language: { code: languageCode },
              components: paramArray.length > 0 ? [
                {
                  type: "body",
                  parameters: paramArray.map((p) => ({ type: "text", text: String(p).trim() }))
                }
              ] : void 0
            }
          };
          if (!payload.template.components) {
            delete payload.template.components;
          }
          console.log(`[WhatsApp] Sending generic template "${templateName}"`, {
            language: languageCode,
            paramCount: paramArray.length,
            requiredParams: validation.required,
            parameters: paramArray
          });
          const response = await fetch8(url, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${this.accessToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          });
          const responseData = await response.json();
          if (response.ok && responseData.messages && !responseData.error) {
            console.log(`[WhatsApp] \u2713 Generic template "${templateName}" DELIVERED successfully`, {
              messageId: responseData.messages[0]?.id,
              language: languageCode,
              status: "queued"
            });
            return { success: true };
          } else {
            const errorMsg = responseData.error?.message || responseData.error?.type || "Template delivery failed by Meta";
            const errorCode = responseData.error?.code || responseData.error?.error_data?.messaging_product?.details?.error_code;
            console.error(`[WhatsApp] \u2717 Generic template FAILED to deliver:`, {
              templateName,
              error: errorMsg,
              errorCode,
              language: languageCode,
              sentParams: paramArray.length,
              statusCode: response.status
            });
            return { success: false, error: errorMsg };
          }
        } catch (error) {
          const errorMsg = String(error);
          console.error(`[WhatsApp] Error sending generic template "${templateName}":`, error);
          return { success: false, error: errorMsg };
        }
      }
      /**
       * Create all required WhatsApp templates via Meta API - Compliant with Meta's API requirements
       */
      async createAllTemplates() {
        await this.refreshCredentials();
        const results = { success: [], failed: [] };
        const createAccSuccess = await this.createTemplate("create_acc", "MARKETING", [
          {
            type: "BODY",
            text: "Welcome to GreenPay, {{1}}!\n\nYour account is ready. Click below to start enjoying seamless payments, virtual cards, and money transfers."
          },
          {
            type: "BUTTONS",
            buttons: [
              {
                type: "URL",
                text: "Get Started",
                url: "https://app.greenpay.world/dashboard"
              }
            ]
          }
        ]);
        if (createAccSuccess) results.success.push("create_acc");
        else results.failed.push("create_acc");
        const loginSuccess = await this.createTemplate("login_alert", "UTILITY", [
          {
            type: "BODY",
            text: "New login on your GreenPay account\n\nLocation: {{1}}\nIP: {{2}}\n\nIf this wasn't you, secure your account now."
          },
          {
            type: "BUTTONS",
            buttons: [
              {
                type: "URL",
                text: "Secure Now",
                url: "https://app.greenpay.world/security"
              }
            ]
          }
        ]);
        if (loginSuccess) results.success.push("login_alert");
        else results.failed.push("login_alert");
        const fundSuccess = await this.createTemplate("fund_receipt", "UTILITY", [
          {
            type: "BODY",
            text: "You received {{1}} {{2}} from {{3}}\n\nRef: {{4}}\n\nView your wallet for details."
          },
          {
            type: "BUTTONS",
            buttons: [
              {
                type: "URL",
                text: "View Wallet",
                url: "https://app.greenpay.world/wallet"
              }
            ]
          }
        ]);
        if (fundSuccess) results.success.push("fund_receipt");
        else results.failed.push("fund_receipt");
        const cardSuccess = await this.createTemplate("card_activation", "UTILITY", [
          {
            type: "BODY",
            text: "Your GreenPay card {{1}} is now active!\n\nReady for online purchases, bill payments, and transfers."
          },
          {
            type: "BUTTONS",
            buttons: [
              {
                type: "URL",
                text: "View Card",
                url: "https://app.greenpay.world/cards"
              }
            ]
          }
        ]);
        if (cardSuccess) results.success.push("card_activation");
        else results.failed.push("card_activation");
        const kycSuccess = await this.createTemplate("kyc_verified", "MARKETING", [
          {
            type: "BODY",
            text: "Great {{1}}! Your identity is verified.\n\nUnlock higher limits, virtual cards, and premium features."
          },
          {
            type: "BUTTONS",
            buttons: [
              {
                type: "URL",
                text: "Explore Features",
                url: "https://app.greenpay.world/dashboard"
              }
            ]
          }
        ]);
        if (kycSuccess) results.success.push("kyc_verified");
        else results.failed.push("kyc_verified");
        const pwdSuccess = await this.createTemplate("password_reset", "AUTHENTICATION", [
          {
            type: "BODY",
            text: "Your password reset code: {{1}}\n\nValid for 10 minutes. Do not share."
          }
        ]);
        if (pwdSuccess) results.success.push("password_reset");
        else results.failed.push("password_reset");
        return results;
      }
      /**
       * Extract parameters from template components - finds {{1}}, {{2}}, etc from BODY only
       * Parameters are defined in the BODY component's text field
       */
      extractParametersFromComponents(components) {
        if (!components || !Array.isArray(components)) return /* @__PURE__ */ new Set();
        const paramNumbers = /* @__PURE__ */ new Set();
        const regex = /\{\{(\d+)\}\}/g;
        const bodyComponent = components.find((comp) => comp?.type === "BODY");
        if (bodyComponent?.text) {
          try {
            const matches = [...bodyComponent.text.matchAll(regex)];
            matches.forEach((m) => {
              const num = parseInt(m[1]);
              if (!isNaN(num)) paramNumbers.add(num);
            });
          } catch (e) {
          }
        }
        return paramNumbers;
      }
      /**
       * Extract parameters from template components - returns param names like param1, param2
       */
      getComponentParameters(components) {
        const paramNumbers = this.extractParametersFromComponents(components);
        return Array.from(paramNumbers).sort((a, b) => a - b).map((n) => `param${n}`);
      }
      /**
       * Extract parameters from template text (finds {{1}}, {{2}}, etc)
       */
      extractTemplateParameters(templateText) {
        const regex = /\{\{(\d+)\}\}/g;
        const matches = [...templateText.matchAll(regex)];
        const paramNumbers = new Set(matches.map((m) => parseInt(m[1])));
        return Array.from(paramNumbers).sort((a, b) => a - b).map((n) => `param${n}`);
      }
      /**
       * Get full template details from Meta with components
       */
      async getTemplateDetails(templateName) {
        try {
          const templates = await this.fetchTemplatesFromMeta();
          const template = templates.find((t) => t.name === templateName);
          return template || null;
        } catch (error) {
          console.error("[WhatsApp] Error getting template details:", error);
          return null;
        }
      }
      /**
       * Analyze which parameters are media vs text based on component types
       */
      analyzeParameterTypes(components, allParams) {
        const metadata = {};
        if (!components || !allParams) return metadata;
        const mediaHeaderParams = /* @__PURE__ */ new Set();
        components.forEach((comp) => {
          if (!comp.type) return;
          if (comp.type === "HEADER" && comp.format && comp.format !== "TEXT") {
            const mediaType = comp.format.toLowerCase();
            if (comp.example) {
              const exampleStr = JSON.stringify(comp.example);
              const regex = /\{\{(\d+)\}\}/g;
              const matches = [...exampleStr.matchAll(regex)];
              matches.forEach((m) => {
                const paramNum = parseInt(m[1]);
                mediaHeaderParams.add(paramNum);
              });
            }
            if ((comp.example?.header_handle || comp.example?.header) && allParams.has(1)) {
              mediaHeaderParams.add(1);
            }
          }
        });
        allParams.forEach((paramNum) => {
          const paramKey = `param${paramNum}`;
          if (mediaHeaderParams.has(paramNum)) {
            let mediaType = "image";
            components.forEach((comp) => {
              if (comp.type === "HEADER" && comp.format && comp.format !== "TEXT") {
                mediaType = comp.format.toLowerCase();
              }
            });
            metadata[paramKey] = {
              type: "media",
              mediaType: mediaType === "location" ? "image" : mediaType
            };
          } else {
            metadata[paramKey] = { type: "text" };
          }
        });
        return metadata;
      }
      /**
       * Get template parameters from Meta - ALWAYS fetches directly from Meta, extracts ONLY from BODY text
       * STRICTLY: Only counts {{1}}, {{2}}, etc patterns in BODY component's text field
       */
      async getTemplateParameters(templateName) {
        try {
          const template = await this.fetchTemplateDetails(templateName);
          if (!template || !Array.isArray(template.components) || template.components.length === 0) {
            console.log(`[WhatsApp] Template "${templateName}" - No valid components found`);
            return { required: [], paramCount: 0, language: template?.language || "en_US", components: [] };
          }
          const bodyComponent = template.components.find((c) => c && typeof c === "object" && c.type === "BODY");
          if (!bodyComponent || typeof bodyComponent.text !== "string") {
            console.log(`[WhatsApp] Template "${templateName}" - No BODY component with text found`);
            return { required: [], paramCount: 0, language: template?.language || "en_US", components: template.components };
          }
          const bodyText = bodyComponent.text;
          const regex = /\{\{\s*(\d+)\s*\}\}/g;
          const paramNumbers = /* @__PURE__ */ new Set();
          let match;
          while ((match = regex.exec(bodyText)) !== null) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > 0) {
              paramNumbers.add(num);
            }
          }
          const params = Array.from(paramNumbers).sort((a, b) => a - b).map((n) => `param${n}`);
          const metadata = paramNumbers.size > 0 ? this.analyzeParameterTypes(template.components, paramNumbers) : {};
          console.log(`[WhatsApp] Template "${templateName}" parameters:`, {
            bodyText: bodyText.substring(0, 150),
            hasBodyText: !!bodyText,
            bodyLength: bodyText.length,
            parameterCount: params.length,
            parameterNames: params,
            isNoParams: params.length === 0
          });
          return {
            required: params,
            paramCount: params.length,
            language: template.language || "en_US",
            components: template.components,
            parameterMetadata: metadata
          };
        } catch (error) {
          console.error("[WhatsApp] Error getting template parameters:", error);
          return { required: [], paramCount: 0, language: "en_US", components: [] };
        }
      }
      /**
       * Fetch full template details from Meta to get parameter information
       */
      async fetchTemplateDetails(templateName) {
        try {
          if (!this.accessToken) return null;
          const wabaId = await this.getWabaId();
          if (!wabaId) return null;
          const url = `${this.graphApiUrl}/${this.apiVersion}/${wabaId}/message_templates?name=${encodeURIComponent(templateName)}&fields=name,status,language,category,components`;
          const response = await fetch8(url, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${this.accessToken}`,
              "Content-Type": "application/json"
            }
          });
          const responseData = await response.json();
          if (response.ok && responseData.data && responseData.data.length > 0) {
            const template = responseData.data[0];
            console.log(`[WhatsApp] Fetched full template details for "${templateName}":`, {
              name: template.name,
              status: template.status,
              language: template.language,
              components: JSON.stringify(template.components, null, 2).substring(0, 200)
            });
            return template;
          }
          return null;
        } catch (error) {
          console.error(`[WhatsApp] Error fetching full template "${templateName}":`, error);
          return null;
        }
      }
      /**
       * Fetch all templates from Meta Business Account with full component structure
       */
      async fetchTemplatesFromMeta() {
        try {
          if (!this.accessToken) {
            console.error("[WhatsApp] \u2717 Cannot fetch templates - access token not configured");
            return [];
          }
          const wabaId = await this.getWabaId();
          if (!wabaId) {
            console.error("[WhatsApp] \u2717 WhatsApp Business Account ID not configured");
            return [];
          }
          const url = `${this.graphApiUrl}/${this.apiVersion}/${wabaId}/message_templates?fields=name,status,language,category,components`;
          console.log(`[WhatsApp] Fetching templates from Meta...`);
          const response = await fetch8(url, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${this.accessToken}`,
              "Content-Type": "application/json"
            }
          });
          const responseData = await response.json();
          if (response.ok && responseData.data) {
            const templateList = responseData.data.map((t) => ({
              name: t.name,
              status: t.status,
              language: t.language,
              category: t.category,
              components: t.components || []
            }));
            console.log("[WhatsApp] \u2713 Successfully fetched approved templates from Meta", {
              count: responseData.data.length,
              templates: templateList.map((t) => ({ name: t.name, status: t.status, language: t.language })),
              timestamp: (/* @__PURE__ */ new Date()).toISOString()
            });
            return responseData.data;
          } else {
            const errorMsg = responseData.error?.message || "Unknown error";
            console.error("[WhatsApp] \u2717 Failed to fetch templates from Meta", {
              error: errorMsg,
              code: responseData.error?.code,
              status: response.status,
              timestamp: (/* @__PURE__ */ new Date()).toISOString(),
              suggestion: "Ensure your WhatsApp Business Account ID (WABA ID) and access token are correctly configured"
            });
            return [];
          }
        } catch (error) {
          console.error("[WhatsApp] Error fetching templates:", error);
          return [];
        }
      }
    };
    whatsappService = new WhatsAppService();
  }
});

// server/services/messaging.ts
var messaging_exports = {};
__export(messaging_exports, {
  MessagingService: () => MessagingService,
  messagingService: () => messagingService2
});
import fetch9 from "node-fetch";
var MessagingService, messagingService2;
var init_messaging = __esm({
  "server/services/messaging.ts"() {
    "use strict";
    init_storage();
    init_email();
    init_whatsapp();
    MessagingService = class {
      SMS_URL = "https://sms.paygrid.co.ke/api/sms/send";
      MESSAGE_PREFIX = "[GREENPAY] ";
      /**
       * Get messaging credentials from system settings (CommsGrid)
       */
      async getCredentials() {
        try {
          const settings = await storage.getSystemSettingsByCategory("messaging");
          let apiKey = settings.find((s) => s.key === "commsGrid_api_key")?.value;
          let senderId = settings.find((s) => s.key === "commsGrid_sender_id")?.value;
          let deviceId = settings.find((s) => s.key === "commsGrid_device_id")?.value;
          apiKey = apiKey || process.env.COMMSGRID_API_KEY || process.env.SMS_API_KEY || "";
          senderId = senderId || process.env.COMMSGRID_SENDER_ID || process.env.SMS_SENDER_ID || "GREENPAY";
          deviceId = deviceId || process.env.COMMSGRID_DEVICE_ID || void 0;
          if (!apiKey || !senderId) {
            console.warn("[SMS] CommsGrid credentials not fully configured");
            return null;
          }
          return { apiKey, senderId, deviceId };
        } catch (error) {
          console.error("[SMS] Error fetching credentials:", error);
          return null;
        }
      }
      /**
       * Format phone number to international format (254XXXXXXXXX)
       */
      formatPhoneNumber(phone) {
        let cleaned = phone.replace(/[\s\-()]/g, "");
        if (cleaned.startsWith("00")) cleaned = cleaned.substring(2);
        if (cleaned.startsWith("+")) cleaned = cleaned.substring(1);
        if (cleaned.startsWith("254") && cleaned.length >= 12) return cleaned;
        if (cleaned.startsWith("0") && cleaned.length === 10) return "254" + cleaned.substring(1);
        if (cleaned.length === 9 && (cleaned.startsWith("7") || cleaned.startsWith("1"))) return "254" + cleaned;
        if (cleaned.length >= 10) return cleaned;
        return cleaned;
      }
      /**
       * Prepend [GREENPAY] prefix and trim if needed
       */
      formatMessage(message) {
        return this.MESSAGE_PREFIX + message;
      }
      /**
       * Core SMS send via CommsGrid API
       */
      async sendSMS(phone, message, credentials) {
        try {
          const formattedPhone = this.formatPhoneNumber(phone);
          const formattedMessage = this.formatMessage(message);
          const body = {
            recipient: [formattedPhone],
            message: formattedMessage,
            sender_id: credentials.senderId
          };
          if (credentials.deviceId) {
            body.device_id = credentials.deviceId;
          }
          const response = await fetch9(this.SMS_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${credentials.apiKey}`,
              "Accept": "application/json"
            },
            body: JSON.stringify(body)
          });
          const result = await response.json();
          if (result.status === "success") {
            console.log(`[SMS] Sent to ${formattedPhone} \u2014 cost: ${result.data?.cost ?? "N/A"}`);
            return true;
          } else {
            console.error(`[SMS] Send failed: ${result.message}`);
            return false;
          }
        } catch (error) {
          console.error("[SMS] Sending error:", error);
          return false;
        }
      }
      /**
       * Send SMS to multiple recipients (admin broadcast)
       */
      async sendSMSToMultiple(phones, message) {
        const credentials = await this.getCredentials();
        if (!credentials) {
          console.warn("[SMS] No credentials configured for bulk send");
          return { sent: 0, failed: phones.length };
        }
        let sent = 0;
        let failed = 0;
        await Promise.all(
          phones.map(async (phone) => {
            const ok = await this.sendSMS(phone, message, credentials);
            if (ok) sent++;
            else failed++;
          })
        );
        return { sent, failed };
      }
      /**
       * Send WhatsApp message via Meta WhatsApp Business API
       */
      async sendWhatsApp(phone, message) {
        try {
          if (!whatsappService.isConfigured()) return false;
          const formattedMessage = this.formatMessage(message);
          return await whatsappService.sendTextMessage(phone, formattedMessage);
        } catch (error) {
          console.error("[WhatsApp] Sending error:", error);
          return false;
        }
      }
      /**
       * Send SMS notification to admins for new live chat request
       */
      async sendAdminChatNotification(userId) {
        try {
          const user = await storage.getUser(userId);
          const userName = user?.fullName || "A user";
          const adminPhones = ["+254741855218", "+254794967351"];
          const credentials = await this.getCredentials();
          if (!credentials) return;
          const notification = `${userName} has started a new live chat. Please attend to them.`;
          await Promise.all(adminPhones.map(
            (phone) => this.sendSMS(phone, notification, credentials).catch(
              (err) => console.error(`[SMS] Failed to send admin SMS to ${phone}:`, err)
            )
          ));
        } catch (error) {
          console.error("[SMS] Error sending admin chat notification:", error);
        }
      }
      /**
       * Send message via SMS + WhatsApp concurrently
       */
      async sendMessage(phone, message) {
        const credentials = await this.getCredentials();
        const [smsResult, whatsappResult] = await Promise.all([
          credentials ? this.sendSMS(phone, message, credentials) : Promise.resolve(false),
          this.sendWhatsApp(phone, message)
        ]);
        if (!credentials) console.warn("[SMS] Skipped: credentials not configured");
        return { sms: smsResult, whatsapp: whatsappResult };
      }
      /**
       * Send OTP via SMS + WhatsApp + Email (concurrent)
       */
      async sendOTP(phone, otpCode, email, userName) {
        console.log(`[OTP] Sending to phone: ${phone}`);
        const enableSetting = await storage.getSystemSetting("messaging", "enable_otp_messages");
        if (enableSetting?.value === "false") {
          console.log("[OTP] Disabled by setting");
          return { sms: false, whatsapp: false, email: false };
        }
        const { mailtrapService: mailtrapService3 } = await Promise.resolve().then(() => (init_mailtrap(), mailtrap_exports));
        const credentials = await this.getCredentials();
        const firstName = userName?.split(" ")[0] || "User";
        const lastName = userName?.split(" ").slice(1).join(" ") || "";
        const [smsResult, whatsappResult, emailResult] = await Promise.all([
          credentials ? this.sendSMS(phone, `Your GreenPay verification code is ${otpCode}. Valid for 10 minutes. Do not share with anyone.`, credentials) : Promise.resolve(false),
          whatsappService.isConfigured() ? whatsappService.sendOTP(phone, otpCode) : Promise.resolve(false),
          email ? mailtrapService3.sendOTP(email, firstName, lastName, otpCode) : Promise.resolve(false)
        ]);
        console.log(`[OTP] Results \u2014 SMS: ${smsResult}, WA: ${whatsappResult}, Email: ${emailResult}`);
        return { sms: smsResult, whatsapp: whatsappResult, email: emailResult };
      }
      /**
       * Send login alert via SMS + WhatsApp + Email
       */
      async sendLoginAlert(phone, location, ip, email, userName) {
        const enableSetting = await storage.getSystemSetting("messaging", "enable_login_alert_messages");
        if (enableSetting?.value === "false") return { sms: false, whatsapp: false, email: false };
        const timestamp2 = (/* @__PURE__ */ new Date()).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" });
        const credentials = await this.getCredentials();
        const [smsResult, whatsappResult, emailResult] = await Promise.all([
          credentials ? this.sendSMS(phone, `New login to your GreenPay account from ${location} (IP: ${ip}). Not you? Contact support immediately.`, credentials) : Promise.resolve(false),
          whatsappService.isConfigured() ? whatsappService.sendLoginAlert(phone, location, ip) : Promise.resolve(false),
          email ? emailService.sendLoginAlert(email, location, ip, timestamp2, userName) : Promise.resolve(false)
        ]);
        return { sms: smsResult, whatsapp: whatsappResult, email: emailResult };
      }
      /**
       * Send password reset via SMS + WhatsApp + Email
       */
      async sendPasswordReset(phone, resetCode, email, userName) {
        const enableSetting = await storage.getSystemSetting("messaging", "enable_password_reset_messages");
        if (enableSetting?.value === "false") return { sms: false, whatsapp: false, email: false };
        const { mailtrapService: mailtrapService3 } = await Promise.resolve().then(() => (init_mailtrap(), mailtrap_exports));
        const credentials = await this.getCredentials();
        const firstName = userName?.split(" ")[0] || "User";
        const lastName = userName?.split(" ").slice(1).join(" ") || "";
        const [smsResult, whatsappResult, emailResult] = await Promise.all([
          credentials ? this.sendSMS(phone, `Your GreenPay password reset code is ${resetCode}. Valid for 10 minutes.`, credentials) : Promise.resolve(false),
          whatsappService.isConfigured() ? whatsappService.sendPasswordReset(phone, resetCode) : Promise.resolve(false),
          email ? mailtrapService3.sendPasswordReset(email, firstName, lastName, resetCode) : Promise.resolve(false)
        ]);
        return { sms: smsResult, whatsapp: whatsappResult, email: emailResult };
      }
      /**
       * Send fund receipt via SMS + WhatsApp + Email
       */
      async sendFundReceipt(phone, amount, currency, sender, email, userName) {
        const enableSetting = await storage.getSystemSetting("messaging", "enable_fund_receipt_messages");
        if (enableSetting?.value === "false") return { sms: false, whatsapp: false, email: false };
        const credentials = await this.getCredentials();
        const [smsResult, whatsappResult, emailResult] = await Promise.all([
          credentials ? this.sendSMS(phone, `You received ${currency} ${amount} from ${sender}. Your GreenPay balance has been updated.`, credentials) : Promise.resolve(false),
          whatsappService.isConfigured() ? whatsappService.sendFundReceipt(phone, amount, currency, sender) : Promise.resolve(false),
          email ? emailService.sendFundReceipt(email, amount, currency, sender, userName) : Promise.resolve(false)
        ]);
        return { sms: smsResult, whatsapp: whatsappResult, email: emailResult };
      }
      /**
       * Send deposit confirmation via SMS
       */
      async sendDepositConfirmation(phone, amount, currency, method, email, userName) {
        const enableSetting = await storage.getSystemSetting("messaging", "enable_deposit_messages");
        if (enableSetting?.value === "false") return { sms: false, whatsapp: false, email: false };
        const credentials = await this.getCredentials();
        const [smsResult, whatsappResult] = await Promise.all([
          credentials ? this.sendSMS(phone, `Deposit of ${currency} ${amount} via ${method} was successful. Your GreenPay account has been credited.`, credentials) : Promise.resolve(false),
          whatsappService.isConfigured() ? whatsappService.sendTextMessage(phone, this.formatMessage(`Deposit of ${currency} ${amount} via ${method} successful. Account credited.`)) : Promise.resolve(false)
        ]);
        return { sms: smsResult, whatsapp: whatsappResult, email: false };
      }
      /**
       * Send withdrawal notification via SMS + WhatsApp + Email
       */
      async sendWithdrawalNotification(phone, amount, currency, destination, status, email, userName) {
        const enableSetting = await storage.getSystemSetting("messaging", "enable_withdrawal_messages");
        if (enableSetting?.value === "false") return { sms: false, whatsapp: false, email: false };
        const credentials = await this.getCredentials();
        const [smsResult, whatsappResult] = await Promise.all([
          credentials ? this.sendSMS(phone, `Withdrawal of ${currency} ${amount} to ${destination} is ${status}. Check your GreenPay account for details.`, credentials) : Promise.resolve(false),
          whatsappService.isConfigured() ? whatsappService.sendTextMessage(phone, this.formatMessage(`Withdrawal of ${currency} ${amount} is ${status}.`)) : Promise.resolve(false)
        ]);
        return { sms: smsResult, whatsapp: whatsappResult, email: false };
      }
      /**
       * Send card issued/activated notification
       */
      async sendCardActivation(phone, cardLastFour, email, userName) {
        const enableSetting = await storage.getSystemSetting("messaging", "enable_card_activation_messages");
        if (enableSetting?.value === "false") return { sms: false, whatsapp: false, email: false };
        const credentials = await this.getCredentials();
        const [smsResult, whatsappResult, emailResult] = await Promise.all([
          credentials ? this.sendSMS(phone, `Your GreenPay virtual card ending in ${cardLastFour} has been issued and is now active. Use it for online payments worldwide.`, credentials) : Promise.resolve(false),
          whatsappService.isConfigured() ? whatsappService.sendCardActivation(phone, cardLastFour) : Promise.resolve(false),
          email ? emailService.sendCardActivation(email, cardLastFour, userName) : Promise.resolve(false)
        ]);
        return { sms: smsResult, whatsapp: whatsappResult, email: emailResult };
      }
      /**
       * Send KYC verified notification
       */
      async sendKYCVerified(phone, email, userName) {
        const enableSetting = await storage.getSystemSetting("messaging", "enable_kyc_verified_messages");
        if (enableSetting?.value === "false") return { sms: false, whatsapp: false, email: false };
        const credentials = await this.getCredentials();
        const [smsResult, whatsappResult, emailResult] = await Promise.all([
          credentials ? this.sendSMS(phone, `Your GreenPay account is now verified! You have full access to all platform features.`, credentials) : Promise.resolve(false),
          whatsappService.isConfigured() ? whatsappService.sendKYCVerified(phone) : Promise.resolve(false),
          email && userName ? emailService.sendKYCVerified(email, userName) : Promise.resolve(false)
        ]);
        return { sms: smsResult, whatsapp: whatsappResult, email: emailResult };
      }
      /**
       * Send transaction notification (send/receive/general)
       */
      async sendTransactionNotification(phone, type, amount, currency, status, transactionId, email, userName) {
        const action = type === "withdraw" ? "Withdrawal" : type === "send" ? "Transfer sent" : type === "receive" ? "Transfer received" : "Transaction";
        const message = `${action} of ${currency} ${amount} \u2014 Status: ${status}. Ref: ${transactionId || "N/A"}`;
        const credentials = await this.getCredentials();
        const [smsResult, whatsappResult, emailResult] = await Promise.all([
          credentials ? this.sendSMS(phone, message, credentials) : Promise.resolve(false),
          whatsappService.isConfigured() ? whatsappService.sendTextMessage(phone, this.formatMessage(message)) : Promise.resolve(false),
          email && transactionId ? emailService.sendTransactionNotification(email, type, amount, currency, status, transactionId, userName) : Promise.resolve(false)
        ]);
        return { sms: smsResult, whatsapp: whatsappResult, email: emailResult };
      }
      /**
       * Generate 6-digit OTP
       */
      generateOTP() {
        return Math.floor(1e5 + Math.random() * 9e5).toString();
      }
    };
    messagingService2 = new MessagingService();
  }
});

// server/services/didit.ts
var didit_exports = {};
__export(didit_exports, {
  createDiditSession: () => createDiditSession,
  getSessionDecision: () => getSessionDecision,
  isDiditConfigured: () => isDiditConfigured,
  isTerminalStatus: () => isTerminalStatus,
  mapDiditStatusToKyc: () => mapDiditStatusToKyc,
  verifyWebhookSignature: () => verifyWebhookSignature
});
import fetch10 from "node-fetch";
import crypto from "crypto";
function getApiKey() {
  return process.env.DIDIT_API_KEY || null;
}
function getWorkflowId() {
  return process.env.DIDIT_WORKFLOW_ID || null;
}
function mapDiditStatusToKyc(diditStatus) {
  switch (diditStatus) {
    case "Approved":
      return "verified";
    case "Declined":
      return "rejected";
    case "Expired":
    case "Abandoned":
    case "Kyc Expired":
      return "rejected";
    case "In Review":
    case "Awaiting User":
    case "Resubmitted":
    case "In Progress":
    case "Not Started":
    default:
      return "pending";
  }
}
function isTerminalStatus(diditStatus) {
  return ["Approved", "Declined", "Expired", "Abandoned", "Kyc Expired"].includes(diditStatus);
}
async function createDiditSession(userId, callbackUrl) {
  const apiKey = getApiKey();
  const workflowId = getWorkflowId();
  if (!apiKey || !workflowId) {
    console.error("[Didit] Missing DIDIT_API_KEY or DIDIT_WORKFLOW_ID environment variables");
    return null;
  }
  try {
    const response = await fetch10(`${DIDIT_BASE_URL}/v3/session/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey
      },
      body: JSON.stringify({
        workflow_id: workflowId,
        vendor_data: userId,
        callback: callbackUrl,
        callback_method: "both"
      })
    });
    if (!response.ok) {
      const error = await response.text();
      console.error(`[Didit] Session creation failed (${response.status}):`, error);
      return null;
    }
    const session2 = await response.json();
    console.log(`[Didit] Session created: ${session2.session_id} for user ${userId}`);
    return session2;
  } catch (error) {
    console.error("[Didit] Session creation error:", error);
    return null;
  }
}
async function getSessionDecision(sessionId) {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("[Didit] Missing DIDIT_API_KEY");
    return null;
  }
  try {
    const response = await fetch10(`${DIDIT_BASE_URL}/v3/session/${sessionId}/decision/`, {
      method: "GET",
      headers: {
        "x-api-key": apiKey
      }
    });
    if (!response.ok) {
      const error = await response.text();
      console.error(`[Didit] Decision fetch failed (${response.status}):`, error);
      return null;
    }
    const decision = await response.json();
    return decision;
  } catch (error) {
    console.error("[Didit] Decision fetch error:", error);
    return null;
  }
}
function verifyWebhookSignature(payload, signature, secret) {
  try {
    const expectedSig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSig)
    );
  } catch {
    return false;
  }
}
function isDiditConfigured() {
  return !!(process.env.DIDIT_API_KEY && process.env.DIDIT_WORKFLOW_ID);
}
var DIDIT_BASE_URL;
var init_didit = __esm({
  "server/services/didit.ts"() {
    "use strict";
    DIDIT_BASE_URL = "https://verification.didit.me";
  }
});

// server/lib/pdf-export.ts
var pdf_export_exports = {};
__export(pdf_export_exports, {
  generateTransactionPDF: () => generateTransactionPDF
});
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
function formatNumber(num) {
  const parsed = typeof num === "string" ? parseFloat(num) : num;
  return parsed.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
function getCurrencySymbol(currency) {
  const upper = currency?.toUpperCase();
  switch (upper) {
    case "KES":
      return "KSh ";
    case "USD":
      return "$";
    default:
      return upper ? upper + " " : "";
  }
}
async function generateTransactionPDF(transactions2, userData) {
  const doc = new jsPDF();
  const greenColor = [34, 197, 94];
  const grayColor = [107, 114, 128];
  const darkColor = [17, 24, 39];
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFillColor(greenColor[0], greenColor[1], greenColor[2]);
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("GreenPay", 14, 20);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("International Money Transfer & Digital Wallet", 14, 28);
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Transaction Statement", 14, 55);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  const currentDate = (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  doc.text(`Generated: ${currentDate}`, 14, 65);
  if (userData.fullName) {
    doc.text(`Account Holder: ${userData.fullName}`, 14, 71);
  }
  if (userData.email) {
    doc.text(`Email: ${userData.email}`, 14, 77);
  }
  const currencies = [...new Set(transactions2.map((t) => t.currency?.toUpperCase() || "USD"))];
  const currencyStats = currencies.map((cur) => {
    const curTxns = transactions2.filter((t) => (t.currency?.toUpperCase() || "USD") === cur);
    const totalIn = curTxns.filter((t) => (t.type === "receive" || t.type === "deposit") && t.status === "completed").reduce((sum2, t) => sum2 + parseFloat(t.amount), 0);
    const totalOut = curTxns.filter((t) => (t.type === "send" || t.type === "withdraw" || t.type === "card_purchase") && t.status === "completed").reduce((sum2, t) => sum2 + parseFloat(t.amount), 0);
    return { cur, sym: getCurrencySymbol(cur), totalIn, totalOut };
  });
  const summaryBoxH = Math.max(35, 20 + currencyStats.length * 8);
  doc.setDrawColor(greenColor[0], greenColor[1], greenColor[2]);
  doc.setLineWidth(0.5);
  doc.rect(14, 85, pageWidth - 28, summaryBoxH);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text("Summary", 18, 92);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  let yPos = 100;
  for (const { cur, sym, totalIn, totalOut } of currencyStats) {
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text(`${cur}:`, 18, yPos);
    doc.setTextColor(34, 197, 94);
    doc.text(`+${sym}${formatNumber(totalIn)}`, 50, yPos);
    doc.setTextColor(239, 68, 68);
    doc.text(`-${sym}${formatNumber(totalOut)}`, 90, yPos);
    yPos += 6;
  }
  const tableStartY = 85 + summaryBoxH + 10;
  const tableData = transactions2.map((transaction) => {
    const date = new Date(transaction.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
    const recipientName = transaction.recipientDetails?.name || (transaction.type === "deposit" ? "Wallet Top-up" : transaction.type === "withdraw" ? "Bank Withdrawal" : transaction.type === "card_purchase" ? "Virtual Card" : transaction.type === "exchange" ? "Currency Exchange" : "Transaction");
    const prefix = transaction.type === "send" || transaction.type === "withdraw" || transaction.type === "card_purchase" || transaction.type === "exchange" ? "-" : "+";
    const amount = `${prefix}${getCurrencySymbol(transaction.currency)}${formatNumber(transaction.amount)}`;
    return [
      date,
      recipientName,
      amount,
      transaction.currency?.toUpperCase() || "USD",
      transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)
    ];
  });
  autoTable(doc, {
    startY: tableStartY,
    head: [["Date", "Description", "Amount", "Currency", "Status"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: greenColor,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8,
      textColor: darkColor
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 60 },
      2: { cellWidth: 35, halign: "right" },
      3: { cellWidth: 25, halign: "center" },
      4: { cellWidth: 30, halign: "center" }
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      const pageCount = doc.internal.getNumberOfPages();
      const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
      doc.setFontSize(8);
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text(
        `Page ${currentPage} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
      doc.text(
        "GreenPay - Trusted International Money Transfer Service",
        pageWidth / 2,
        pageHeight - 15,
        { align: "center" }
      );
      doc.setFontSize(7);
      doc.text(
        "support@greenpay.world | www.greenpay.world",
        pageWidth / 2,
        pageHeight - 20,
        { align: "center" }
      );
    }
  });
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  return pdfBuffer;
}
var init_pdf_export = __esm({
  "server/lib/pdf-export.ts"() {
    "use strict";
  }
});

// server/services/api-key.ts
var api_key_exports = {};
__export(api_key_exports, {
  ApiKeyService: () => ApiKeyService,
  apiKeyService: () => apiKeyService
});
var ApiKeyService, apiKeyService;
var init_api_key = __esm({
  "server/services/api-key.ts"() {
    "use strict";
    init_storage();
    ApiKeyService = class {
      async generateApiKey(name, scope = ["read", "write"], rateLimit = 1e3, userId) {
        const keyId = `gpay_${Buffer.from(`${Date.now()}-${Math.random()}`).toString("base64").substring(0, 32)}`;
        try {
          const keyData = {
            id: keyId,
            key: keyId,
            name,
            isActive: true,
            createdAt: /* @__PURE__ */ new Date(),
            scope,
            rateLimit,
            userId: userId || null
          };
          await storage.createSystemSetting({
            category: "api_keys",
            key: keyId,
            value: JSON.stringify(keyData)
          });
          console.log(`[API Key] \u2713 Generated: ${name} (${keyId}) for user: ${userId || "system"}`);
          return keyId;
        } catch (error) {
          console.error("[API Key] Error generating key:", error);
          throw error;
        }
      }
      async validateApiKey(key, requiredScope) {
        try {
          if (!key || !key.startsWith("gpay_")) {
            return false;
          }
          const settings = await storage.getSystemSetting("api_keys", key);
          if (!settings) {
            console.warn(`[API Key] \u2717 Key not found: ${key}`);
            return false;
          }
          const keyData = JSON.parse(typeof settings.value === "string" ? settings.value : JSON.stringify(settings.value));
          if (!keyData.isActive) {
            console.warn(`[API Key] \u2717 Key is inactive: ${key}`);
            return false;
          }
          if (requiredScope && !keyData.scope?.includes(requiredScope) && !keyData.scope?.includes("*")) {
            console.warn(`[API Key] \u2717 Key lacks required scope: ${requiredScope}`);
            return false;
          }
          console.log(`[API Key] \u2713 Key validated: ${keyData.name}`);
          return true;
        } catch (error) {
          console.error("[API Key] Error validating:", error);
          return false;
        }
      }
      async revokeApiKey(key) {
        try {
          const settings = await storage.getSystemSetting("api_keys", key);
          if (!settings) {
            console.warn(`[API Key] \u2717 Key not found: ${key}`);
            return false;
          }
          const keyData = JSON.parse(typeof settings.value === "string" ? settings.value : JSON.stringify(settings.value));
          const updatedKeyData = {
            ...keyData,
            isActive: false
          };
          await storage.updateSystemSetting(settings.id, {
            value: JSON.stringify(updatedKeyData)
          });
          console.log(`[API Key] \u2713 Revoked: ${key}`);
          return true;
        } catch (error) {
          console.error("[API Key] Error revoking:", error);
          return false;
        }
      }
      async getApiKey(key) {
        try {
          const settings = await storage.getSystemSetting("api_keys", key);
          if (!settings) {
            return null;
          }
          const keyData = JSON.parse(typeof settings.value === "string" ? settings.value : JSON.stringify(settings.value));
          return keyData;
        } catch (error) {
          console.error("[API Key] Error retrieving key:", error);
          return null;
        }
      }
    };
    apiKeyService = new ApiKeyService();
  }
});

// server/services/fcm.ts
import fetch11 from "node-fetch";
var FCM_API_URL, FCMService, fcmService;
var init_fcm = __esm({
  "server/services/fcm.ts"() {
    "use strict";
    FCM_API_URL = "https://fcm.googleapis.com/v1/projects";
    FCMService = class {
      accessToken = null;
      tokenExpiry = 0;
      projectId;
      constructor() {
        this.projectId = process.env.FIREBASE_PROJECT_ID || "greenpay-mobile";
      }
      async getAccessToken() {
        try {
          if (this.accessToken && Date.now() < this.tokenExpiry) {
            return this.accessToken;
          }
          const serviceAccount = JSON.parse(
            process.env.FIREBASE_SERVICE_ACCOUNT || "{}"
          );
          const response = await fetch11("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              client_id: serviceAccount.client_id,
              client_secret: serviceAccount.client_secret,
              refresh_token: serviceAccount.refresh_token,
              grant_type: "refresh_token"
            })
          });
          const data = await response.json();
          this.accessToken = data.access_token;
          this.tokenExpiry = Date.now() + data.expires_in * 1e3;
          return this.accessToken;
        } catch (error) {
          console.error("FCM token error:", error);
          throw new Error("Failed to get FCM access token");
        }
      }
      async sendToToken(token, title, body, data) {
        try {
          const accessToken = await this.getAccessToken();
          const message = {
            token,
            notification: { title, body },
            data,
            android: {
              priority: "high",
              notification: {
                sound: "default",
                click_action: "FLUTTER_NOTIFICATION_CLICK"
              }
            }
          };
          const response = await fetch11(
            `${FCM_API_URL}/${this.projectId}/messages:send`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ message })
            }
          );
          const result = await response.json();
          console.log("FCM sent successfully:", result.name);
          return true;
        } catch (error) {
          console.error("FCM send error:", error);
          return false;
        }
      }
      async sendToTopic(topic, title, body, data) {
        try {
          const accessToken = await this.getAccessToken();
          const message = {
            topic,
            notification: { title, body },
            data,
            android: {
              priority: "high",
              notification: {
                sound: "default",
                click_action: "FLUTTER_NOTIFICATION_CLICK"
              }
            }
          };
          const response = await fetch11(
            `${FCM_API_URL}/${this.projectId}/messages:send`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ message })
            }
          );
          const result = await response.json();
          console.log("FCM topic sent successfully:", result.name);
          return true;
        } catch (error) {
          console.error("FCM topic send error:", error);
          return false;
        }
      }
      async sendMulticast(tokens, title, body, data) {
        try {
          const accessToken = await this.getAccessToken();
          let successCount = 0;
          let failureCount = 0;
          for (let i = 0; i < tokens.length; i += 500) {
            const batch = tokens.slice(i, i + 500);
            for (const token of batch) {
              try {
                const message = {
                  token,
                  notification: { title, body },
                  data,
                  android: {
                    priority: "high",
                    notification: {
                      sound: "default",
                      click_action: "FLUTTER_NOTIFICATION_CLICK"
                    }
                  }
                };
                await fetch11(
                  `${FCM_API_URL}/${this.projectId}/messages:send`,
                  {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${accessToken}`,
                      "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ message })
                  }
                );
                successCount++;
              } catch {
                failureCount++;
              }
            }
          }
          console.log(`FCM multicast: ${successCount} success, ${failureCount} failures`);
          return { success: successCount, failure: failureCount };
        } catch (error) {
          console.error("FCM multicast error:", error);
          return { success: 0, failure: tokens.length };
        }
      }
    };
    fcmService = new FCMService();
  }
});

// server/services/notification-queue.ts
var notification_queue_exports = {};
__export(notification_queue_exports, {
  NotificationQueue: () => NotificationQueue,
  notificationQueue: () => notificationQueue
});
var NotificationQueue, notificationQueue;
var init_notification_queue = __esm({
  "server/services/notification-queue.ts"() {
    "use strict";
    init_storage();
    init_fcm();
    NotificationQueue = class {
      async sendKYCNotification(userId, status) {
        return this.queueNotification({
          userId,
          title: "\u{1F4CB} KYC Status Update",
          body: status === "verified" ? "Your KYC verification is complete! Welcome." : status === "pending" ? "Your KYC documents are being reviewed." : "KYC verification failed. Please resubmit.",
          type: "kyc",
          data: { kyc_status: status }
        });
      }
      async sendTransactionNotification(userId, type, amount, senderName) {
        return this.queueNotification({
          userId,
          title: type === "sent" ? "\u{1F4B8} Money Sent" : "\u{1F4B0} Money Received",
          body: type === "sent" ? `You sent $${amount}` : `${senderName || "Someone"} sent you $${amount}`,
          type: "transaction",
          data: { transaction_type: type, amount }
        });
      }
      async sendWithdrawalNotification(userId, status, amount) {
        const titles = {
          pending: "\u23F3 Withdrawal Pending",
          completed: "\u2705 Withdrawal Completed",
          failed: "\u274C Withdrawal Failed"
        };
        const bodies = {
          pending: `Withdrawal of $${amount} is being processed.`,
          completed: `You received $${amount} to your account.`,
          failed: `Withdrawal of $${amount} could not be completed.`
        };
        return this.queueNotification({
          userId,
          title: titles[status],
          body: bodies[status],
          type: "withdrawal",
          data: { withdrawal_status: status, amount }
        });
      }
      async sendBillPaymentNotification(userId, status, provider, amount) {
        const titles = {
          pending: "\u23F3 Bill Payment Pending",
          completed: "\u2705 Bill Paid Successfully",
          failed: "\u274C Bill Payment Failed"
        };
        const bodies = {
          pending: `Payment to ${provider} for $${amount} is processing.`,
          completed: `Your ${provider} bill of $${amount} has been paid.`,
          failed: `Payment to ${provider} for $${amount} failed.`
        };
        return this.queueNotification({
          userId,
          title: titles[status],
          body: bodies[status],
          type: "payment",
          data: { payment_status: status, provider, amount }
        });
      }
      async sendAirtimeNotification(userId, phoneNumber, amount) {
        return this.queueNotification({
          userId,
          title: "\u{1F4F1} Airtime Purchased",
          body: `${amount} airtime sent to ${phoneNumber}`,
          type: "transaction",
          data: { airtime_amount: amount, phone: phoneNumber }
        });
      }
      async sendAdminAlert(userId, title, message) {
        return this.queueNotification({
          userId,
          title,
          body: message,
          type: "alert"
        });
      }
      async sendBulkNotification(payload) {
        try {
          let targetUserIds = payload.targetUserIds || [];
          if (payload.sendToAll) {
            const users3 = await storage.getAllUsers();
            targetUserIds = users3.filter((u) => u.fcmToken).map((u) => u.id);
          }
          if (targetUserIds.length === 0) {
            console.warn("No target users for bulk notification");
            return { success: 0, failure: 0 };
          }
          const users2 = await Promise.all(
            targetUserIds.map((id) => storage.getUser(id))
          );
          const tokens = users2.filter((u) => u && u.fcmToken).map((u) => u.fcmToken);
          if (tokens.length === 0) {
            console.warn("No FCM tokens found for target users");
            return { success: 0, failure: targetUserIds.length };
          }
          const result = await fcmService.sendMulticast(
            tokens,
            payload.title,
            payload.body,
            payload.data
          );
          console.log(
            `Bulk notification sent: ${result.success} success, ${result.failure} failures`
          );
          return result;
        } catch (error) {
          console.error("Bulk notification error:", error);
          return { success: 0, failure: 0 };
        }
      }
      async queueNotification(payload) {
        try {
          if (!payload.userId && !payload.sendToAll && !payload.targetUserIds) {
            console.warn("No target specified for notification");
            return false;
          }
          if (payload.userId && !payload.sendToAll) {
            const user = await storage.getUser(payload.userId);
            if (!user || !user.fcmToken) {
              console.warn(`No FCM token for user ${payload.userId}`);
              return false;
            }
            return await fcmService.sendToToken(
              user.fcmToken,
              payload.title,
              payload.body,
              payload.data
            );
          }
          return await this.sendBulkNotification(payload);
        } catch (error) {
          console.error("Notification queue error:", error);
          return false;
        }
      }
    };
    notificationQueue = new NotificationQueue();
  }
});

// server/index.ts
import express2 from "express";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import { Pool as Pool2 } from "pg";

// server/routes.ts
init_storage();
init_db();
init_schema();
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

// server/services/nexuspay.ts
import fetch2 from "node-fetch";
var NEXUSPAY_BASE_URL = "https://app.makamescopay.com/api";
var NEXUSPAY_CURRENCIES = [
  { code: "USD", name: "US Dollar", flag: "\u{1F1FA}\u{1F1F8}", gateway: "paystack", channel: "card", countryCode: "US", countryName: "United States", color: "from-emerald-500 to-green-600" },
  { code: "KES", name: "Kenyan Shilling", flag: "\u{1F1F0}\u{1F1EA}", gateway: "mpesa", channel: "mobile_money", correspondents: [{ id: "MPESA_KEN", label: "M-Pesa" }], countryCode: "KE", countryName: "Kenya", color: "from-red-500 to-orange-500" },
  { code: "UGX", name: "Ugandan Shilling", flag: "\u{1F1FA}\u{1F1EC}", gateway: "pawapay", channel: "mobile_money", correspondents: [{ id: "MTN_MOMO_UGA", label: "MTN Mobile Money" }, { id: "AIRTEL_OAPI_UGA", label: "Airtel Money" }], countryCode: "UG", countryName: "Uganda", color: "from-yellow-500 to-orange-500" },
  { code: "GHS", name: "Ghanaian Cedi", flag: "\u{1F1EC}\u{1F1ED}", gateway: "paystack", channel: "mobile_money", correspondents: [{ id: "MTN_MOMO_GHA", label: "MTN MoMo" }, { id: "VODAFONE_GHA", label: "Vodafone Cash" }, { id: "AIRTEL_TIGO_GHA", label: "AirtelTigo" }], countryCode: "GH", countryName: "Ghana", color: "from-red-600 to-green-600" },
  { code: "NGN", name: "Nigerian Naira", flag: "\u{1F1F3}\u{1F1EC}", gateway: "paystack", channel: "card", countryCode: "NG", countryName: "Nigeria", color: "from-green-600 to-green-800" },
  { code: "ZAR", name: "South African Rand", flag: "\u{1F1FF}\u{1F1E6}", gateway: "paystack", channel: "card", countryCode: "ZA", countryName: "South Africa", color: "from-blue-600 to-yellow-500" },
  { code: "TZS", name: "Tanzanian Shilling", flag: "\u{1F1F9}\u{1F1FF}", gateway: "optimapay", channel: "other", countryCode: "TZ", countryName: "Tanzania", color: "from-cyan-500 to-blue-600" },
  { code: "XOF", name: "West African CFA", flag: "\u{1F30D}", gateway: "pawapay", channel: "mobile_money", countryCode: "SN", countryName: "West Africa", color: "from-purple-500 to-violet-600" },
  { code: "CDF", name: "Congolese Franc", flag: "\u{1F1E8}\u{1F1E9}", gateway: "pawapay", channel: "mobile_money", correspondents: [{ id: "MPESA_COD", label: "M-Pesa Congo" }, { id: "AIRTEL_OAPI_COD", label: "Airtel Money" }], countryCode: "CD", countryName: "DR Congo", color: "from-sky-500 to-blue-600" },
  { code: "XAF", name: "Central African CFA", flag: "\u{1F30D}", gateway: "pawapay", channel: "mobile_money", countryCode: "CM", countryName: "Central Africa", color: "from-teal-500 to-green-600" },
  { code: "RWF", name: "Rwandan Franc", flag: "\u{1F1F7}\u{1F1FC}", gateway: "pawapay", channel: "mobile_money", correspondents: [{ id: "MTN_MOMO_RWA", label: "MTN MoMo" }, { id: "AIRTEL_OAPI_RWA", label: "Airtel Money" }], countryCode: "RW", countryName: "Rwanda", color: "from-blue-600 to-cyan-500" },
  { code: "SLE", name: "Sierra Leonean Leone", flag: "\u{1F1F8}\u{1F1F1}", gateway: "pawapay", channel: "mobile_money", correspondents: [{ id: "ORANGE_SLE", label: "Orange Money" }], countryCode: "SL", countryName: "Sierra Leone", color: "from-green-500 to-teal-600" },
  { code: "ZMW", name: "Zambian Kwacha", flag: "\u{1F1FF}\u{1F1F2}", gateway: "pawapay", channel: "mobile_money", correspondents: [{ id: "MTN_MOMO_ZMB", label: "MTN MoMo" }, { id: "AIRTEL_OAPI_ZMB", label: "Airtel Money" }], countryCode: "ZM", countryName: "Zambia", color: "from-orange-400 to-red-500" },
  { code: "EUR", name: "Euro", flag: "\u{1F1EA}\u{1F1FA}", gateway: "paystack", channel: "card", countryCode: "EU", countryName: "Europe", color: "from-blue-700 to-indigo-600" },
  { code: "GBP", name: "British Pound", flag: "\u{1F1EC}\u{1F1E7}", gateway: "paystack", channel: "card", countryCode: "GB", countryName: "United Kingdom", color: "from-indigo-700 to-purple-700" }
];
var CURRENCY_MAP = Object.fromEntries(
  NEXUSPAY_CURRENCIES.map((c) => [c.code, c])
);
var NexusPayService = class {
  envApiKey;
  baseUrl;
  constructor() {
    this.envApiKey = process.env.NEXUSPAY_API_KEY || null;
    this.baseUrl = NEXUSPAY_BASE_URL;
  }
  async getApiKey() {
    if (this.envApiKey) return this.envApiKey;
    try {
      const { pool: pool2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      if (pool2) {
        const result = await pool2.query(
          `SELECT value FROM system_settings WHERE key = $1 AND category = $2 LIMIT 1`,
          ["nexuspay_api_key", "payment"]
        );
        if (result.rows.length > 0 && result.rows[0].value) return result.rows[0].value;
      }
    } catch {
    }
    return null;
  }
  headers(apiKey) {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    };
  }
  async checkout(params) {
    const apiKey = await this.getApiKey();
    if (!apiKey) throw new Error("NexusPay API key not configured. Set NEXUSPAY_API_KEY or configure it in admin settings.");
    const body = {
      amount: params.amount,
      currency: params.currency,
      channel: params.channel,
      description: params.description || "GreenPay wallet deposit"
    };
    if (params.phone) body.phone = params.phone;
    if (params.email) body.email = params.email;
    if (params.correspondent) body.correspondent = params.correspondent;
    const response = await fetch2(`${this.baseUrl}/checkout`, {
      method: "POST",
      headers: this.headers(apiKey),
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `NexusPay checkout failed: ${response.status}`);
    return data;
  }
  async getStatus(reference) {
    const apiKey = await this.getApiKey();
    if (!apiKey) throw new Error("NexusPay API key not configured");
    const response = await fetch2(`${this.baseUrl}/status/${reference}`, {
      headers: this.headers(apiKey)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Status check failed: ${response.status}`);
    return data;
  }
  async getCountries() {
    const apiKey = await this.getApiKey();
    if (apiKey) {
      try {
        const response = await fetch2(`${this.baseUrl}/countries`, {
          headers: this.headers(apiKey)
        });
        if (response.ok) {
          const data = await response.json();
          return data.countries || [];
        }
      } catch {
      }
    }
    return NEXUSPAY_CURRENCIES.map((c) => ({
      code: c.countryCode,
      name: c.countryName,
      flag: c.flag,
      currency: c.code,
      gateway: c.gateway,
      correspondents: c.correspondents || []
    }));
  }
  isConfigured() {
    return !!this.envApiKey;
  }
  getSupportedCurrencies() {
    return NEXUSPAY_CURRENCIES;
  }
};
var nexusPayService = new NexusPayService();

// server/routes.ts
init_exchange_rate();
import { and as and2, desc as desc2, eq as eq3, sql as sql3 } from "drizzle-orm";
import { z } from "zod";
import bcrypt2 from "bcrypt";
import multer from "multer";
import * as speakeasy2 from "speakeasy";
import * as QRCode2 from "qrcode";
import { fileTypeFromBuffer } from "file-type";

// server/services/payhero.ts
init_storage();
import fetch4 from "node-fetch";
var PayHeroService = class {
  username;
  password;
  channelId;
  baseUrl = "https://backend.payhero.co.ke/api/v2";
  constructor() {
    const username = process.env.PAYHERO_USERNAME;
    const password = process.env.PAYHERO_PASSWORD;
    const channelId = process.env.PAYHERO_CHANNEL_ID;
    this.username = username;
    this.password = password;
    this.channelId = channelId ? parseInt(channelId) : 3407;
    this.loadCredentialsFromDatabase();
  }
  /**
   * Load credentials from database settings
   */
  async loadCredentialsFromDatabase() {
    try {
      const settings = await storage.getSystemSettingsByCategory("payhero");
      const username = settings.find((s) => s.key === "username")?.value;
      const password = settings.find((s) => s.key === "password")?.value;
      const channelId = settings.find((s) => s.key === "channel_id")?.value;
      if (username) this.username = this.parseValue(username);
      if (password) this.password = this.parseValue(password);
      if (channelId) this.channelId = parseInt(this.parseValue(channelId));
      if (this.hasCredentials()) {
        console.log("PayHero credentials loaded from database:", {
          hasUsername: !!this.username,
          hasPassword: !!this.password,
          channelId: this.channelId
        });
      } else {
        console.warn("PayHero credentials not fully configured - payment processing may not be available");
      }
    } catch (error) {
      console.error("Error loading PayHero credentials from database:", error);
      console.warn("Using environment variable credentials as fallback");
    }
  }
  /**
   * Parse database value that might have extra quotes from JSON
   */
  parseValue(value) {
    if (!value) return "";
    let parsed = String(value).trim();
    while (parsed.startsWith('"') && parsed.endsWith('"')) {
      parsed = parsed.slice(1, -1);
    }
    return parsed;
  }
  hasCredentials() {
    return !!(this.username && this.password && this.channelId);
  }
  /**
   * Get credentials (fetches from database if needed)
   */
  async getCredentials() {
    await this.loadCredentialsFromDatabase();
    return {
      username: this.username,
      password: this.password,
      channelId: this.channelId
    };
  }
  /**
   * Update PayHero settings (for admin configuration)
   */
  updateSettings(channelId, username, password) {
    if (channelId !== void 0) this.channelId = channelId;
    if (username !== void 0) this.username = username;
    if (password !== void 0) this.password = password;
  }
  /**
   * Get current channel ID
   */
  getChannelId() {
    return this.channelId;
  }
  /**
   * Generate a unique reference for PayHero transactions
   */
  generateReference() {
    const timestamp2 = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `GPY${timestamp2.slice(-8)}${random}`;
  }
  /**
   * Initiate M-Pesa STK Push payment
   */
  async initiateMpesaPayment(amount, phoneNumber, externalReference, customerName, callbackUrl) {
    try {
      await this.getCredentials();
      if (!this.hasCredentials()) {
        console.error("PayHero credentials not available");
        return {
          success: false,
          status: "CREDENTIALS_MISSING",
          reference: "",
          CheckoutRequestID: ""
        };
      }
      const url = `${this.baseUrl}/payments`;
      let cleanPhone = phoneNumber.replace(/\+/g, "").replace(/\s/g, "").replace(/-/g, "");
      if (cleanPhone.startsWith("254")) {
        cleanPhone = "0" + cleanPhone.substring(3);
      } else if (cleanPhone.startsWith("7") || cleanPhone.startsWith("1")) {
        cleanPhone = "0" + cleanPhone;
      } else if (!cleanPhone.startsWith("0")) {
        console.error("Invalid phone number format for PayHero:", phoneNumber);
        return {
          success: false,
          status: "INVALID_PHONE_FORMAT",
          reference: "",
          CheckoutRequestID: ""
        };
      }
      if (cleanPhone.length !== 10 || !cleanPhone.match(/^0[17]\d{8}$/)) {
        console.error("PayHero phone validation failed:", {
          original: phoneNumber,
          formatted: cleanPhone,
          length: cleanPhone.length,
          expected: "10 digits starting with 07 or 01"
        });
        return {
          success: false,
          status: "INVALID_PHONE_NUMBER",
          reference: "",
          CheckoutRequestID: ""
        };
      }
      const payload = {
        amount: Math.round(amount),
        // PayHero expects integer amounts
        phone_number: cleanPhone,
        channel_id: this.channelId,
        provider: "m-pesa",
        external_reference: externalReference,
        customer_name: customerName,
        callback_url: callbackUrl
      };
      const credentials = Buffer.from(`${this.username}:${this.password}`).toString("base64");
      const authHeader = `Basic ${credentials}`;
      console.log("PayHero payment request:", {
        amount: payload.amount,
        phone: payload.phone_number,
        reference: externalReference,
        channel_id: payload.channel_id,
        url
      });
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3e4);
      let response;
      try {
        response = await fetch4(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": authHeader
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeoutId);
      }
      const rawText = await response.text();
      let data = {};
      if (rawText.trim()) {
        try {
          data = JSON.parse(rawText);
        } catch (parseErr) {
          console.error("PayHero response is not valid JSON:", rawText.slice(0, 200));
        }
      } else {
        console.warn("PayHero returned an empty response body (HTTP", response.status, ")");
      }
      console.log("PayHero HTTP response:", {
        httpStatus: response.status,
        success: data.success,
        status: data.status,
        reference: data.reference,
        error: data.error || data.message
      });
      if (!response.ok) {
        console.error("PayHero HTTP error:", response.status, data);
        return {
          success: false,
          status: `HTTP_${response.status}`,
          reference: "",
          CheckoutRequestID: ""
        };
      }
      return {
        success: data.success || false,
        status: data.status || "FAILED",
        reference: data.reference || "",
        CheckoutRequestID: data.CheckoutRequestID || ""
      };
    } catch (error) {
      const isTimeout = error?.name === "AbortError" || error?.code === "ECONNRESET" || error?.code === "ETIMEDOUT";
      console.error("PayHero payment initiation error:", isTimeout ? "Request timed out (504)" : error);
      return {
        success: false,
        status: isTimeout ? "TIMEOUT" : "ERROR",
        reference: "",
        CheckoutRequestID: ""
      };
    }
  }
  /**
   * Check transaction status using PayHero's transaction-status endpoint
   */
  async checkTransactionStatus(reference) {
    try {
      const url = `${this.baseUrl}/transaction-status?reference=${reference}`;
      const credentials = Buffer.from(`${this.username}:${this.password}`).toString("base64");
      const authHeader = `Basic ${credentials}`;
      console.log("Checking PayHero transaction status:", { reference, url });
      const statusController = new AbortController();
      const statusTimeoutId = setTimeout(() => statusController.abort(), 15e3);
      let response;
      try {
        response = await fetch4(url, {
          method: "GET",
          headers: { "Authorization": authHeader },
          signal: statusController.signal
        });
      } finally {
        clearTimeout(statusTimeoutId);
      }
      const rawText = await response.text();
      let data = {};
      if (rawText.trim()) {
        try {
          data = JSON.parse(rawText);
        } catch (parseErr) {
          console.error("PayHero status response is not valid JSON:", rawText.slice(0, 200));
        }
      } else {
        console.warn("PayHero status check returned empty body (HTTP", response.status, ")");
      }
      console.log("PayHero transaction status response:", {
        httpStatus: response.status,
        reference,
        status: data.status,
        success: data.success
      });
      if (!response.ok) {
        console.error("PayHero transaction status HTTP error:", response.status, data);
        return {
          success: false,
          status: "ERROR",
          message: data.message || "Failed to check transaction status"
        };
      }
      return {
        success: true,
        status: data.status || "UNKNOWN",
        data,
        message: data.message
      };
    } catch (error) {
      const isTimeout = error?.name === "AbortError" || error?.code === "ECONNRESET" || error?.code === "ETIMEDOUT";
      console.error("PayHero status check error:", isTimeout ? "Request timed out" : error);
      return {
        success: false,
        status: isTimeout ? "TIMEOUT" : "ERROR",
        message: isTimeout ? "PayHero request timed out \u2014 please try again" : "Failed to check transaction status"
      };
    }
  }
  /**
   * Process PayHero callback response
   */
  processCallback(callbackData) {
    const { response } = callbackData;
    return {
      success: response.ResultCode === 0 && response.Status === "Success",
      amount: response.Amount,
      reference: response.ExternalReference,
      mpesaReceiptNumber: response.MpesaReceiptNumber,
      status: response.Status
    };
  }
  /**
   * Convert USD to KES (using a fixed rate for now, could be improved with real-time rates)
   */
  async convertUSDtoKES(usdAmount) {
    const exchangeRate = 129;
    return Math.round(usdAmount * exchangeRate);
  }
};
var payHeroService = new PayHeroService();

// server/services/paystack.ts
import fetch5 from "node-fetch";
var PaystackService = class {
  secretKey;
  baseUrl = "https://api.paystack.co";
  isConfigured;
  constructor() {
    const secretKey = process.env.PAYSTACK_SECRET_KEY_KES || process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      console.warn("Paystack secret key not provided - payment features will be disabled");
      this.isConfigured = false;
      this.secretKey = "";
    } else {
      this.isConfigured = true;
      this.secretKey = secretKey;
    }
  }
  async initializePayment(email, amount, reference, currency = "KES", phoneNumber, callbackUrl, metadata) {
    if (!this.isConfigured) {
      return {
        status: false,
        message: "Paystack is not configured. Please add PAYSTACK_SECRET_KEY to environment variables."
      };
    }
    try {
      const url = `${this.baseUrl}/transaction/initialize`;
      const payload = {
        email,
        amount: Math.round(amount * 100),
        // Convert to kobo for USD or cents for KES
        reference,
        currency,
        channels: ["card", "bank", "ussd", "qr", "mobile_money", "bank_transfer"]
      };
      if (callbackUrl) {
        payload.callback_url = callbackUrl;
      }
      if (currency === "KES" && phoneNumber) {
        payload.mobile_money = {
          phone: phoneNumber,
          provider: "mpesa"
        };
      }
      if (metadata && Object.keys(metadata).length > 0) {
        payload.metadata = { custom_fields: Object.entries(metadata).map(([key, value]) => ({ display_name: key, variable_name: key, value })) };
      }
      const response = await fetch5(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.secretKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Paystack initialization error:", error);
      return {
        status: false,
        message: "Payment initialization failed"
      };
    }
  }
  async verifyPayment(reference) {
    try {
      const url = `${this.baseUrl}/transaction/verify/${reference}`;
      const response = await fetch5(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.secretKey}`
        }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Paystack verification error:", error);
      return {
        status: false,
        message: "Payment verification failed"
      };
    }
  }
  async createCustomer(email, firstName, lastName, phone) {
    try {
      const url = `${this.baseUrl}/customer`;
      const payload = {
        email,
        first_name: firstName,
        last_name: lastName,
        phone
      };
      const response = await fetch5(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.secretKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Paystack customer creation error:", error);
      return {
        status: false,
        message: "Customer creation failed"
      };
    }
  }
  async convertUSDtoKES(usdAmount) {
    try {
      const { exchangeRateService: exchangeRateService2 } = await Promise.resolve().then(() => (init_exchange_rate(), exchange_rate_exports));
      const rate = await exchangeRateService2.getExchangeRate("USD", "KES");
      return usdAmount * rate;
    } catch (error) {
      console.error("Currency conversion error:", error);
      return usdAmount * 129;
    }
  }
  generateReference() {
    return "GP_" + Date.now().toString() + "_" + Math.random().toString(36).substr(2, 9);
  }
};
var paystackService = new PaystackService();

// server/services/2fa.ts
import speakeasy from "speakeasy";
import QRCode from "qrcode";
var TwoFactorService = class {
  generateSecret(userEmail) {
    const secret = speakeasy.generateSecret({
      name: `GreenPay (${userEmail})`,
      issuer: "GreenPay"
    });
    const backupCodes = this.generateBackupCodes();
    return {
      secret: secret.base32,
      qrCodeUrl: secret.otpauth_url || "",
      backupCodes
    };
  }
  async generateQRCode(secret, userEmail) {
    const otpAuthUrl = speakeasy.otpauthURL({
      secret,
      label: userEmail,
      issuer: "GreenPay",
      encoding: "base32"
    });
    return await QRCode.toDataURL(otpAuthUrl);
  }
  verifyToken(secret, token) {
    return speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 2
      // Allow 60 second window
    });
  }
  generateBackupCodes() {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substr(2, 8).toUpperCase());
    }
    return codes;
  }
};
var twoFactorService = new TwoFactorService();

// server/services/notifications.ts
var NotificationService = class {
  subscriptions = /* @__PURE__ */ new Map();
  async sendNotification(payload) {
    try {
      console.log(`Sending notification to user ${payload.userId}:`, payload);
      const success = Math.random() > 0.1;
      if (success) {
        console.log(`Notification sent successfully to ${payload.userId}`);
        return true;
      } else {
        console.log(`Failed to send notification to ${payload.userId}`);
        return false;
      }
    } catch (error) {
      console.error("Notification sending error:", error);
      return false;
    }
  }
  async registerPushToken(userId, token) {
    try {
      this.subscriptions.set(userId, token);
      console.log(`Push token registered for user ${userId}`);
      return true;
    } catch (error) {
      console.error("Push token registration error:", error);
      return false;
    }
  }
  async sendTransactionNotification(userId, transaction) {
    const payload = {
      title: "Transaction Update",
      body: `Your ${transaction.type} of $${transaction.amount} has been ${transaction.status}`,
      userId,
      type: "transaction",
      metadata: { transactionId: transaction.id }
    };
    await this.sendNotification(payload);
  }
  async sendSecurityNotification(userId, message) {
    const payload = {
      title: "Security Alert",
      body: message,
      userId,
      type: "security"
    };
    await this.sendNotification(payload);
  }
};
var notificationService = new NotificationService();

// server/cloudinaryStorage.ts
import { v2 as cloudinary } from "cloudinary";
import { randomUUID as randomUUID2 } from "crypto";
var ObjectNotFoundError = class _ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, _ObjectNotFoundError.prototype);
  }
};
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
var CloudinaryStorageService = class {
  constructor() {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.warn("\u26A0\uFE0F  Cloudinary credentials not configured. File uploads will fail.");
      console.warn("   Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET");
    } else {
      console.log(`\u2705 Cloudinary Storage initialized for: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    }
  }
  /**
   * Upload a file to Cloudinary
   * @param key The storage key/path for the file (e.g., "kyc/uuid.pdf")
   * @param buffer The file buffer to upload
   * @param contentType The MIME type of the file
   * @returns The Cloudinary public URL
   */
  async uploadFile(key, buffer, contentType) {
    try {
      console.log(`\u{1F4E4} Uploading file to Cloudinary: ${key} (${contentType})`);
      const publicId = `greenpay/${key}`;
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            public_id: publicId,
            resource_type: this.getResourceType(contentType)
            // Don't use folder parameter - public_id already contains the path
          },
          (error, result) => {
            if (error) {
              console.error(`\u274C Cloudinary upload error:`, error);
              reject(new Error(`Failed to upload file: ${error.message}`));
            } else if (result) {
              console.log(`\u2705 File uploaded to: ${result.secure_url}`);
              console.log(`   Public ID: ${result.public_id}`);
              resolve(result.secure_url);
            } else {
              reject(new Error("Upload failed: No result returned"));
            }
          }
        );
        uploadStream.end(buffer);
      });
    } catch (error) {
      console.error(`\u274C Error uploading file to Cloudinary:`, error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  /**
   * Download a file from Cloudinary (fetch the image/file)
   * Note: Cloudinary serves files via URLs, so this fetches from the URL
   * @param keyOrUrl The storage key/path (public_id) or full Cloudinary URL
   * @returns The file buffer and metadata
   */
  async downloadFile(keyOrUrl) {
    try {
      console.log(`\u{1F4E5} Downloading file from Cloudinary: ${keyOrUrl}`);
      const url = keyOrUrl.startsWith("http://") || keyOrUrl.startsWith("https://") ? keyOrUrl : this.constructCloudinaryUrl(keyOrUrl);
      console.log(`\u{1F517} Fetching from URL: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) {
          throw new ObjectNotFoundError();
        }
        throw new Error(`Failed to download file: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = response.headers.get("content-type") || "application/octet-stream";
      console.log(`\u2705 File downloaded successfully: ${keyOrUrl} (${contentType})`);
      return {
        buffer,
        contentType
      };
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        throw error;
      }
      console.error(`\u274C Error downloading file from Cloudinary:`, error);
      throw new Error(`Failed to download file: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  /**
   * Delete a file from Cloudinary
   * @param keyOrUrl The storage key (e.g., "kyc/uuid.pdf") or full Cloudinary URL
   */
  async deleteFile(keyOrUrl) {
    try {
      console.log(`\u{1F5D1}\uFE0F Deleting file from Cloudinary: ${keyOrUrl}`);
      const publicId = keyOrUrl.startsWith("http://") || keyOrUrl.startsWith("https://") ? this.extractPublicIdFromUrl(keyOrUrl) : `greenpay/${keyOrUrl}`;
      const resourceType = this.guessResourceTypeFromKey(keyOrUrl);
      console.log(`\u{1F5D1}\uFE0F Deleting public_id: ${publicId} (type: ${resourceType})`);
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      console.log(`\u2705 File deleted successfully: ${keyOrUrl}`);
    } catch (error) {
      console.error(`\u274C Error deleting file from Cloudinary:`, error);
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
  /**
   * Check if a file exists in Cloudinary
   * @param keyOrUrl The storage key (e.g., "kyc/uuid.pdf") or full Cloudinary URL
   * @returns True if the file exists, false otherwise
   */
  async fileExists(keyOrUrl) {
    try {
      const publicId = keyOrUrl.startsWith("http://") || keyOrUrl.startsWith("https://") ? this.extractPublicIdFromUrl(keyOrUrl) : `greenpay/${keyOrUrl}`;
      const resourceType = this.guessResourceTypeFromKey(keyOrUrl);
      const result = await cloudinary.api.resource(publicId, { resource_type: resourceType });
      return !!result;
    } catch (error) {
      if (error.error?.http_code === 404) {
        return false;
      }
      console.error(`\u274C Error checking file existence:`, error);
      return false;
    }
  }
  /**
   * Generate a unique upload key for a file
   * @param folder The folder to upload to (e.g., 'kyc', 'chat', 'profile')
   * @param filename The original filename
   * @returns A unique storage key
   */
  generateUploadKey(folder, filename) {
    const uuid = randomUUID2();
    const extension = filename.split(".").pop() || "bin";
    return `${folder}/${uuid}.${extension}`;
  }
  /**
   * Upload a KYC document
   * @returns Cloudinary URL
   */
  async uploadKycDocument(buffer, filename, contentType) {
    const key = this.generateUploadKey("kyc", filename);
    console.log(`\u{1F4CB} Uploading KYC document: ${filename} -> ${key}`);
    return await this.uploadFile(key, buffer, contentType);
  }
  /**
   * Upload a chat file
   * @returns Cloudinary URL
   */
  async uploadChatFile(buffer, filename, contentType) {
    const key = this.generateUploadKey("chat", filename);
    console.log(`\u{1F4AC} Uploading chat file: ${filename} -> ${key}`);
    return await this.uploadFile(key, buffer, contentType);
  }
  /**
   * Upload a profile picture
   * @returns Cloudinary URL
   */
  async uploadProfilePicture(buffer, filename, contentType) {
    const key = this.generateUploadKey("profile", filename);
    console.log(`\u{1F464} Uploading profile picture: ${filename} -> ${key}`);
    return await this.uploadFile(key, buffer, contentType);
  }
  /**
   * Download a file and stream it to Express response
   * For Cloudinary, we redirect to the Cloudinary URL for direct download
   */
  async downloadToResponse(keyOrUrl, res) {
    try {
      if (keyOrUrl.startsWith("http://") || keyOrUrl.startsWith("https://")) {
        console.log(`\u{1F517} Redirecting to Cloudinary URL: ${keyOrUrl}`);
        res.redirect(keyOrUrl);
      } else {
        const cloudinaryUrl = this.constructCloudinaryUrl(keyOrUrl);
        console.log(`\u{1F517} Redirecting to constructed URL: ${cloudinaryUrl}`);
        res.redirect(cloudinaryUrl);
      }
    } catch (error) {
      console.error(`\u274C Error streaming file to response:`, error);
      if (!res.headersSent) {
        if (error instanceof ObjectNotFoundError) {
          res.status(404).json({ error: "File not found" });
        } else {
          res.status(500).json({ error: "Error downloading file" });
        }
      }
    }
  }
  /**
   * List all files in a folder (Cloudinary folder)
   */
  async listFiles(prefix) {
    try {
      console.log(`\u{1F4CB} Listing files with prefix: ${prefix}`);
      const result = await cloudinary.api.resources({
        type: "upload",
        prefix,
        max_results: 500
      });
      const files = result.resources.map((resource) => resource.secure_url);
      console.log(`\u2705 Found ${files.length} files`);
      return files;
    } catch (error) {
      console.error(`\u274C Error listing files:`, error);
      return [];
    }
  }
  // Helper methods
  getResourceType(contentType) {
    if (contentType.startsWith("image/")) return "image";
    if (contentType.startsWith("video/")) return "video";
    return "raw";
  }
  getFolderFromKey(key) {
    const parts = key.split("/");
    return parts.length > 1 ? parts[0] : "greenpay";
  }
  getFormatFromContentType(contentType) {
    const match = contentType.match(/\/(\w+)/);
    return match ? match[1] : void 0;
  }
  extractPublicIdFromUrl(url) {
    if (!url.includes("cloudinary.com")) {
      return url;
    }
    try {
      const greenpayIndex = url.indexOf("/greenpay/");
      if (greenpayIndex !== -1) {
        const publicIdWithSlash = url.substring(greenpayIndex + 1);
        const publicId2 = publicIdWithSlash.split("?")[0];
        console.log(`\u{1F4DD} Extracted public_id from URL: ${publicId2}`);
        return publicId2;
      }
      const parts = url.split("/");
      const uploadIndex = parts.indexOf("upload");
      if (uploadIndex === -1) return url;
      let startIndex = uploadIndex + 1;
      while (startIndex < parts.length) {
        const part = parts[startIndex];
        if (part.includes(",") || part.includes("_") || /^v\d+$/.test(part)) {
          startIndex++;
        } else {
          break;
        }
      }
      const publicId = parts.slice(startIndex).join("/").split("?")[0];
      console.log(`\u{1F4DD} Extracted public_id from URL: ${publicId}`);
      return publicId;
    } catch (error) {
      console.error(`\u274C Error extracting public_id from URL:`, error);
      return url;
    }
  }
  guessResourceTypeFromUrl(url) {
    if (url.includes("/image/upload/")) return "image";
    if (url.includes("/video/upload/")) return "video";
    if (url.includes("/raw/upload/")) return "raw";
    return this.guessResourceTypeFromKey(url);
  }
  guessResourceTypeFromKey(keyOrUrl) {
    const extension = keyOrUrl.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension || "")) return "image";
    if (["mp4", "mov", "avi", "webm"].includes(extension || "")) return "video";
    return "raw";
  }
  /**
   * Construct a Cloudinary URL from a storage key (public_id)
   * @param key Storage key like "kyc/uuid.pdf" or "profile/uuid.jpg"
   * @returns Full Cloudinary URL
   */
  constructCloudinaryUrl(key) {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      throw new Error("CLOUDINARY_CLOUD_NAME not configured");
    }
    const publicId = `greenpay/${key}`;
    const extension = key.split(".").pop()?.toLowerCase();
    let resourceType = "raw";
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension || "")) {
      resourceType = "image";
    } else if (["mp4", "mov", "avi", "webm"].includes(extension || "")) {
      resourceType = "video";
    }
    const url = cloudinary.url(publicId, {
      resource_type: resourceType,
      secure: true
    });
    console.log(`\u{1F517} Constructed Cloudinary URL: ${url} (from key: ${key})`);
    return url;
  }
};
var cloudinaryStorage = new CloudinaryStorageService();

// server/statumService.ts
import fetch6 from "node-fetch";
var StatumService = class {
  consumerKey;
  consumerSecret;
  apiUrl;
  constructor() {
    this.consumerKey = process.env.STATUM_CONSUMER_KEY || "";
    this.consumerSecret = process.env.STATUM_CONSUMER_SECRET || "";
    this.apiUrl = "https://api.statum.co.ke/api/v2/airtime";
    if (this.isConfigured()) {
      console.log("\u2705 Statum Service initialized and configured");
    } else {
      console.warn("\u26A0\uFE0F Statum Service initialized but NOT configured - credentials missing");
    }
  }
  /**
   * Generate Basic Auth header
   */
  getAuthHeader() {
    const credentials = `${this.consumerKey}:${this.consumerSecret}`;
    const base64Credentials = Buffer.from(credentials).toString("base64");
    return `Basic ${base64Credentials}`;
  }
  /**
   * Format phone number to 254 format (remove leading 0, add 254)
   */
  formatPhoneNumber(phone) {
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = cleaned.substring(1);
    }
    if (!cleaned.startsWith("254")) {
      cleaned = "254" + cleaned;
    }
    console.log(`\u{1F4DE} Formatted phone number: ${phone} -> ${cleaned}`);
    return cleaned;
  }
  /**
   * Purchase airtime via Statum API
   */
  async purchaseAirtime(phoneNumber, amount) {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      console.log(`\u{1F4F1} Statum API Request: Purchasing KES ${amount} airtime for ${formattedPhone}`);
      console.log(`\u{1F517} Endpoint: ${this.apiUrl}`);
      const requestBody = {
        phone_number: formattedPhone,
        amount
      };
      console.log(`\u{1F4E4} Request body:`, JSON.stringify(requestBody, null, 2));
      const response = await fetch6(this.apiUrl, {
        method: "POST",
        headers: {
          "Authorization": this.getAuthHeader(),
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(requestBody)
      });
      console.log(`\u{1F4E5} Statum API Response Status: ${response.status} ${response.statusText}`);
      const responseData = await response.json();
      console.log(`\u{1F4E5} Response data:`, JSON.stringify(responseData, null, 2));
      if (!response.ok) {
        console.error(`\u274C Statum API Error: ${response.status}`, responseData);
        throw new Error(responseData.message || `Statum API request failed with status ${response.status}`);
      }
      console.log(`\u2705 Airtime purchase successful for ${formattedPhone}`);
      return responseData;
    } catch (error) {
      console.error("\u274C Statum API Error:", error);
      if (error instanceof Error) {
        throw new Error(`Airtime purchase failed: ${error.message}`);
      }
      throw new Error("Airtime purchase failed: Unknown error");
    }
  }
  /**
   * Check if Statum credentials are configured
   */
  isConfigured() {
    const configured = !!(this.consumerKey && this.consumerSecret);
    if (!configured) {
      console.warn("\u26A0\uFE0F Statum credentials not configured - airtime purchases will fail");
    }
    return configured;
  }
};
var statumService = new StatumService();

// server/middleware/api-key.ts
init_storage();
var DEMO_KEYS = {
  "gpay_demo_test": { isActive: true, scope: ["read", "write", "*"] },
  "gpay_demo_read": { isActive: true, scope: ["read"] },
  "gpay_demo_write": { isActive: true, scope: ["write"] },
  "gpay_demo_all": { isActive: true, scope: ["*"] }
};
async function optionalApiKey(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const key = authHeader.substring(7);
      if (key && key.startsWith("gpay_")) {
        try {
          if (key.startsWith("gpay_demo_")) {
            const demoKey = DEMO_KEYS[key];
            if (demoKey && demoKey.isActive) {
              req.apiKey = key;
              console.log(`\u2713 [Demo API Key] Optional: ${key}`);
              return next();
            }
          }
          const settings = await storage.getSystemSetting("api_keys", key);
          if (settings) {
            const keyData = settings.value;
            if (keyData.isActive) {
              req.apiKey = key;
            }
          }
        } catch (error) {
        }
      }
    }
    next();
  } catch (error) {
    console.error("[Optional API Key Middleware] Error:", error);
    next();
  }
}

// server/services/ai.ts
import OpenAI from "openai";
var OpenAIService = class {
  openai;
  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn("\u26A0\uFE0F Groq API key not configured");
    }
    this.openai = new OpenAI({
      apiKey: apiKey || "",
      baseURL: "https://api.groq.com/openai/v1"
    });
  }
  async generateResponse(messages2) {
    try {
      const systemPrompt = `
You are a helpful AI assistant for GreenPay, a comprehensive fintech payment application for KES users.

You MUST only answer questions related to GreenPay's features and services:
- Bill payments and money transfers
- Virtual cards and airtime purchases
- Currency exchange services
- Document uploads and KYC verification
- Support and account management
- Performance-based loans
- WhatsApp Business integration
- Two-factor authentication and biometric login
- Admin panel and support ticket system
- Public API services

If asked about unrelated topics, politely redirect the user.
`;
      const response = await this.openai.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages2.map((msg) => ({
            role: msg.role === "assistant" ? "assistant" : "user",
            content: msg.content
          }))
        ]
      });
      return response.choices[0]?.message?.content || "Unable to generate response";
    } catch (error) {
      console.error("Groq AI API error:", error);
      throw error;
    }
  }
  async getAIFeatureSuggestions(context) {
    return this.generateResponse([
      { role: "user", content: context }
    ]);
  }
};
var openaiService = new OpenAIService();

// server/services/ai-rate-limiter.ts
init_db();
init_schema();
import { eq as eq2 } from "drizzle-orm";
var DAILY_LIMIT = 5;
var ONE_DAY_MS = 864e5;
var AIRateLimiter = class {
  async checkAndUpdateLimit(userId, ipAddress) {
    try {
      const trackingId = userId || ipAddress || "anonymous";
      if (!trackingId || trackingId === "anonymous") {
        return { allowed: true, remainingRequests: 5 };
      }
      const now = /* @__PURE__ */ new Date();
      const oneDayAgo = new Date(Date.now() - ONE_DAY_MS);
      const finalUserId = userId || `guest-${ipAddress}`;
      let usage = await db.query.aiUsage.findFirst({
        where: eq2(aiUsage.trackingId, finalUserId)
      });
      if (!usage) {
        const newUsage = await db.insert(aiUsage).values({
          userId: userId || null,
          trackingId: finalUserId,
          dailyCount: 0,
          lastResetDate: now
        }).returning();
        usage = newUsage[0];
      }
      if (usage.lastResetDate && new Date(usage.lastResetDate) < oneDayAgo) {
        await db.update(aiUsage).set({ dailyCount: 0, lastResetDate: now }).where(eq2(aiUsage.trackingId, finalUserId));
        usage.dailyCount = 0;
      }
      if (usage.dailyCount >= DAILY_LIMIT) {
        return {
          allowed: false,
          error: `You've used all 5 daily requests. Please try again tomorrow.`,
          remainingRequests: 0
        };
      }
      const newCount = (usage.dailyCount || 0) + 1;
      await db.update(aiUsage).set({ dailyCount: newCount, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(aiUsage.trackingId, finalUserId));
      const remainingRequests = DAILY_LIMIT - newCount;
      return { allowed: true, remainingRequests };
    } catch (error) {
      console.error("AI Rate Limiter Error:", error);
      return { allowed: true, remainingRequests: 5 };
    }
  }
  async getRemainingRequests(userId, ipAddress) {
    try {
      const trackingId = userId || ipAddress;
      if (!trackingId) {
        return DAILY_LIMIT;
      }
      const oneDayAgo = new Date(Date.now() - ONE_DAY_MS);
      const finalUserId = userId || `guest-${ipAddress}`;
      let usage = await db.query.aiUsage.findFirst({
        where: eq2(aiUsage.trackingId, finalUserId)
      });
      if (!usage) {
        return DAILY_LIMIT;
      }
      if (usage.lastResetDate && new Date(usage.lastResetDate) < oneDayAgo) {
        await db.update(aiUsage).set({ dailyCount: 0, lastResetDate: /* @__PURE__ */ new Date() }).where(eq2(aiUsage.trackingId, finalUserId));
        return DAILY_LIMIT;
      }
      return Math.max(0, DAILY_LIMIT - (usage.dailyCount || 0));
    } catch (error) {
      console.error("Get Remaining Requests Error:", error);
      return DAILY_LIMIT;
    }
  }
};
var aiRateLimiter = new AIRateLimiter();

// server/routes.ts
var cloudinaryStorage2 = new CloudinaryStorageService();
var normalizeCurrency = (currency) => String(currency || "").trim().toUpperCase();
function getSupportedCurrencyCodes() {
  return NEXUSPAY_CURRENCIES.map((currency) => currency.code);
}
async function getEnabledCurrencyCodes() {
  const fallback = getSupportedCurrencyCodes();
  try {
    const result = await pool.query(`SELECT value FROM system_settings WHERE key = 'enabled_currencies' LIMIT 1`);
    const configured = String(result.rows[0]?.value || "").replace(/['"]/g, "");
    const enabled = configured.split(",").map(normalizeCurrency).filter((currency) => fallback.includes(currency));
    return enabled.length ? enabled : fallback;
  } catch {
    return fallback;
  }
}
async function getUserWallet(userId, currency) {
  const code = normalizeCurrency(currency);
  const [wallet] = await db.select().from(wallets).where(and2(eq3(wallets.userId, userId), eq3(wallets.currency, code))).limit(1);
  return wallet;
}
async function ensureUserWallet(userId, currency) {
  const code = normalizeCurrency(currency);
  let wallet = await getUserWallet(userId, code);
  if (!wallet) {
    const enabled = await getEnabledCurrencyCodes();
    if (!enabled.includes(code)) return void 0;
    const existing = await db.select().from(wallets).where(eq3(wallets.userId, userId));
    const [created] = await db.insert(wallets).values({
      userId,
      currency: code,
      isDefault: existing.length === 0,
      isActive: true
    }).returning();
    wallet = created;
  }
  return wallet;
}
function walletAvailableBalance(wallet) {
  return Math.max(
    0,
    parseFloat(wallet.balance || "0") - parseFloat(wallet.holdAmount || "0") - parseFloat(wallet.withdrawalHoldAmount || "0")
  );
}
var upload = multer({
  storage: multer.memoryStorage(),
  // Store files in memory buffer for cloud upload
  limits: {
    fileSize: 50 * 1024 * 1024
    // 50MB limit (supports video announcements)
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "video/mp4",
      "video/quicktime",
      "video/x-msvideo",
      "video/webm"
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Images, PDFs, documents, and videos are allowed."));
    }
  }
});
var backupUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024
    // 100MB limit for backups
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "application/json",
      "application/sql",
      "application/gzip",
      "application/x-gzip",
      "text/plain"
      // Some systems send .json as text/plain
    ];
    const allowedExtensions = [".json", ".sql", ".gz", ".gzip"];
    const hasValidExtension = allowedExtensions.some((ext) => file.originalname.toLowerCase().endsWith(ext));
    if (allowedMimeTypes.includes(file.mimetype) || hasValidExtension) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JSON, SQL, and GZ backup files are allowed."));
    }
  }
});
var loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});
var otpSchema = z.object({
  code: z.string().length(6)
});
var transferSchema = z.object({
  fromUserId: z.string(),
  toUserId: z.string(),
  amount: z.string(),
  currency: z.string(),
  description: z.string().optional()
});
async function registerRoutes(app2) {
  const checkMaintenanceMode = async (req, res, next) => {
    try {
      const maintenanceSetting = await storage.getSystemSetting("general", "maintenance_mode") || await storage.getSystemSetting("platform", "maintenance_mode");
      const maintenanceEnabled = String(maintenanceSetting?.value) === "true";
      const allowedPaths = [
        "/api/auth/me",
        "/api/auth/login",
        "/api/auth/logout",
        "/api/auth/verify-otp",
        "/api/admin/login",
        "/api/admin/auth/login",
        "/api/system-settings",
        "/health"
      ];
      const isAllowedPath = allowedPaths.some((path3) => req.path.startsWith(path3));
      if (maintenanceEnabled && !isAllowedPath && !req.session?.admin) {
        const messageSetting = await storage.getSystemSetting("general", "maintenance_message") || await storage.getSystemSetting("platform", "maintenance_message");
        return res.status(503).json({
          message: messageSetting?.value || "System is under maintenance. Please try again later.",
          maintenanceMode: true
        });
      }
    } catch (error) {
      console.error("Maintenance check error:", error);
    }
    next();
  };
  const requireAuth = (req, res, next) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({
        message: "Authentication required. Please log in."
      });
    }
    next();
  };
  app2.get("/api/auth/me", async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        req.session.destroy(() => {
        });
        return res.status(401).json({ message: "Session expired \u2014 user not found" });
      }
      const { password, ...userResponse } = user;
      res.json({ user: userResponse });
    } catch (error) {
      console.error("Auth me error:", error);
      res.status(500).json({ message: "Failed to retrieve session user" });
    }
  });
  app2.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) console.error("Logout session destroy error:", err);
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });
  app2.post("/api/deposit/manual-proof", requireAuth, upload.single("proof"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No proof file uploaded" });
      }
      const userId = req.session.userId;
      const { amount, currency, reference } = req.body;
      const uploadResult = await cloudinaryStorage2.uploadFile(
        req.file.buffer,
        `deposits/${userId}/${Date.now()}_${req.file.originalname}`,
        req.file.mimetype
      );
      const transaction = await storage.createTransaction({
        userId,
        amount: amount || "0",
        currency: currency || "USD",
        type: "deposit",
        status: "pending",
        description: `Manual deposit proof uploaded. Ref: ${reference || "N/A"}`,
        reference: reference || `MAN-${Date.now()}`,
        metadata: {
          proofUrl: uploadResult.url,
          originalName: req.file.originalname,
          uploadDate: (/* @__PURE__ */ new Date()).toISOString()
        }
      });
      await storage.createAdminLog({
        adminId: 1,
        // System admin
        action: "MANUAL_DEPOSIT_PROOF",
        details: `User ${userId} uploaded proof for ${amount} ${currency}. Ref: ${reference}`,
        ipAddress: req.ip || "0.0.0.0",
        userAgent: req.headers["user-agent"] || "Unknown"
      });
      res.json({
        success: true,
        message: "Proof uploaded successfully. Our team will verify and credit your account shortly.",
        transactionId: transaction.id
      });
    } catch (error) {
      console.error("Manual proof upload error:", error);
      res.status(500).json({ message: "Failed to upload proof. Please try again." });
    }
  });
  const requireAdminAuth = (req, res, next) => {
    if (!req.session?.admin?.id) {
      return res.status(401).json({ message: "Admin authentication required" });
    }
    next();
  };
  app2.use(checkMaintenanceMode);
  app2.get("/health", (_req, res) => {
    res.status(200).json({
      status: "healthy",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      env: process.env.NODE_ENV,
      uptime: process.uptime()
    });
  });
  const supportedVirtualAccountCurrencies = ["USD", "GBP", "EUR"];
  app2.get("/api/virtual-accounts", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const applications = await db.select().from(virtualAccountApplications).where(eq3(virtualAccountApplications.userId, userId));
      const settings = await db.select().from(virtualAccountSettings).where(eq3(virtualAccountSettings.isActive, true));
      res.json({
        supportedCurrencies: supportedVirtualAccountCurrencies,
        applications: applications.map((app3) => ({
          ...app3,
          accountDetails: app3.status === "approved" ? settings.find((s) => s.currency === app3.currency) || null : null
        }))
      });
    } catch (error) {
      console.error("Virtual accounts fetch error:", error);
      res.status(500).json({ message: "Failed to load virtual accounts" });
    }
  });
  app2.post("/api/virtual-accounts/apply", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const schema = z.object({
        currency: z.enum(["USD", "GBP", "EUR"]),
        sourceOfIncome: z.string().min(2),
        monthlyVolume: z.string().min(1),
        purpose: z.string().min(5),
        expectedSenders: z.string().optional(),
        declarations: z.object({
          notUsCitizen: z.boolean(),
          notPoliticallyExposed: z.boolean(),
          beneficialOwner: z.boolean(),
          truthfulInformation: z.boolean(),
          acceptsTerms: z.boolean()
        })
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        const firstIssue = parsed.error.issues[0];
        return res.status(400).json({
          message: firstIssue?.message || "Please complete all required application fields.",
          field: firstIssue?.path?.join("."),
          errors: parsed.error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message }))
        });
      }
      const data = parsed.data;
      if (!Object.values(data.declarations).every(Boolean)) {
        return res.status(400).json({ message: "All compliance declarations must be accepted before submitting." });
      }
      const existing = await db.select().from(virtualAccountApplications).where(and2(eq3(virtualAccountApplications.userId, userId), eq3(virtualAccountApplications.currency, data.currency)));
      if (existing[0] && existing[0].status !== "rejected") return res.status(409).json({ message: "You already have an application for this currency." });
      const [application] = await db.insert(virtualAccountApplications).values({ ...data, userId }).returning();
      await storage.createNotification({ userId, title: `${data.currency} virtual account application received`, message: "Your application is pending admin review.", type: "info", isGlobal: false });
      res.status(201).json(application);
    } catch (error) {
      console.error("Virtual account apply error:", error);
      res.status(400).json({ message: error?.message || "Failed to submit application" });
    }
  });
  app2.get("/api/admin/virtual-accounts", requireAdminAuth, async (_req, res) => {
    try {
      const applications = await db.select({ application: virtualAccountApplications, user: users }).from(virtualAccountApplications).leftJoin(users, eq3(virtualAccountApplications.userId, users.id)).orderBy(desc2(virtualAccountApplications.createdAt));
      const settings = await db.select().from(virtualAccountSettings).orderBy(virtualAccountSettings.currency);
      res.json({ applications, settings, supportedCurrencies: supportedVirtualAccountCurrencies });
    } catch (error) {
      res.status(500).json({ message: "Failed to load virtual account admin data" });
    }
  });
  app2.put("/api/admin/virtual-accounts/settings/:currency", requireAdminAuth, async (req, res) => {
    try {
      const currency = String(req.params.currency).toUpperCase();
      if (!supportedVirtualAccountCurrencies.includes(currency)) return res.status(400).json({ message: "Unsupported currency" });
      const bodySchema = z.object({
        accountName: z.string().min(2, "Account name must be at least 2 characters."),
        bankName: z.string().min(2, "Bank name must be at least 2 characters."),
        accountNumber: z.string().min(3, "Account number must be at least 3 characters."),
        routingNumber: z.string().optional().nullable(),
        sortCode: z.string().optional().nullable(),
        iban: z.string().optional().nullable(),
        swiftCode: z.string().optional().nullable(),
        bankAddress: z.string().optional().nullable(),
        beneficiaryAddress: z.string().optional().nullable(),
        paymentInstructions: z.string().optional().nullable(),
        isActive: z.boolean().optional()
      });
      const parsed = bodySchema.safeParse(req.body);
      if (!parsed.success) {
        const firstIssue = parsed.error.issues[0];
        return res.status(400).json({ message: firstIssue?.message || "Please complete the required account details.", errors: parsed.error.issues });
      }
      const values = { ...parsed.data, currency, updatedBy: req.session.admin.id, updatedAt: /* @__PURE__ */ new Date() };
      const existing = await db.select().from(virtualAccountSettings).where(eq3(virtualAccountSettings.currency, currency));
      const [setting] = existing[0] ? await db.update(virtualAccountSettings).set(values).where(eq3(virtualAccountSettings.currency, currency)).returning() : await db.insert(virtualAccountSettings).values(values).returning();
      res.json(setting);
    } catch (error) {
      res.status(400).json({ message: error?.message || "Failed to save account details" });
    }
  });
  app2.patch("/api/admin/virtual-accounts/applications/:id", requireAdminAuth, async (req, res) => {
    try {
      const status = req.body.status;
      if (!["approved", "rejected"].includes(status)) return res.status(400).json({ message: "Invalid status" });
      const [application] = await db.update(virtualAccountApplications).set({ status, adminNotes: req.body.adminNotes || null, reviewedBy: req.session.admin.id, reviewedAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }).where(eq3(virtualAccountApplications.id, req.params.id)).returning();
      if (!application) return res.status(404).json({ message: "Application not found" });
      const [user] = await db.select().from(users).where(eq3(users.id, application.userId));
      const [account] = await db.select().from(virtualAccountSettings).where(eq3(virtualAccountSettings.currency, application.currency));
      const [firstName, ...rest] = (user?.fullName || "User").split(" ");
      if (user && status === "approved") {
        await storage.createNotification({ userId: user.id, title: `${application.currency} Virtual Account Approved`, message: "Your virtual account details are now available. Check Virtual Accounts to view your bank details.", type: "success", isGlobal: false, actionUrl: "/virtual-accounts" });
        const { mailtrapService: mailtrapService3 } = await Promise.resolve().then(() => (init_mailtrap(), mailtrap_exports));
        mailtrapService3.sendVirtualAccountApproved(user.email, firstName, rest.join(" "), {
          currency: application.currency,
          application_id: application.id,
          account_name: account?.accountName || "GreenPay",
          bank_name: account?.bankName || "",
          account_number: account?.accountNumber || "",
          routing_number: account?.routingNumber || "",
          sort_code: account?.sortCode || "",
          iban: account?.iban || "",
          swift_code: account?.swiftCode || "",
          bank_address: account?.bankAddress || "",
          beneficiary_address: account?.beneficiaryAddress || "",
          payment_instructions: account?.paymentInstructions || ""
        }).catch(console.error);
      }
      if (user && status === "rejected") {
        await storage.createNotification({ userId: user.id, title: `${application.currency} Virtual Account Application`, message: req.body.adminNotes || "Your virtual account application was not approved at this time. You may re-apply.", type: "error", isGlobal: false, actionUrl: "/virtual-accounts" });
        const { mailtrapService: mailtrapService3 } = await Promise.resolve().then(() => (init_mailtrap(), mailtrap_exports));
        mailtrapService3.sendVirtualAccountApproved(user.email, firstName, rest.join(" "), {
          currency: application.currency,
          application_id: application.id,
          account_name: "N/A",
          bank_name: "",
          account_number: "",
          routing_number: "",
          sort_code: "",
          iban: "",
          swift_code: "",
          bank_address: "",
          beneficiary_address: "",
          payment_instructions: `Your ${application.currency} virtual account application was not approved. Reason: ${req.body.adminNotes || "Please contact support for details."}`
        }).catch(console.error);
      }
      res.json(application);
    } catch (error) {
      res.status(400).json({ message: error?.message || "Failed to review application" });
    }
  });
  app2.get("/api/demo-keys", (_req, res) => {
    res.status(200).json({
      message: "Available demo API keys for testing (development only)",
      keys: [
        {
          key: "gpay_demo_test",
          name: "Full Test Key",
          scope: ["read", "write", "*"],
          description: "Full access for testing all API operations"
        },
        {
          key: "gpay_demo_read",
          name: "Read-Only Key",
          scope: ["read"],
          description: "Read-only access for testing GET endpoints"
        },
        {
          key: "gpay_demo_write",
          name: "Write-Only Key",
          scope: ["write"],
          description: "Write-only access for testing POST/PUT endpoints"
        },
        {
          key: "gpay_demo_all",
          name: "Admin Key",
          scope: ["*"],
          description: "Full admin access (all scopes)"
        }
      ],
      usage: {
        example: "curl -H 'Authorization: Bearer gpay_demo_test' https://api.greenpay.app/api/endpoint",
        header: "Authorization: Bearer YOUR_API_KEY"
      },
      note: "These demo keys are for development and testing only"
    });
  });
  app2.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      console.log(`\u{1F4E5} File request received: /objects/${req.params.objectPath}`);
      const userId = req.session?.userId;
      const adminId = req.session?.admin?.id;
      console.log(`\u{1F510} Auth check - userId: ${userId}, adminId: ${adminId}`);
      if (!userId && !adminId) {
        console.warn("\u26A0\uFE0F Unauthorized file access attempt:", req.params.objectPath);
        console.log("Session data:", JSON.stringify(req.session, null, 2));
        return res.status(401).json({ message: "Authentication required" });
      }
      let objectKey = req.params.objectPath;
      if (objectKey.startsWith("/")) {
        objectKey = objectKey.substring(1);
      }
      console.log(`\u2705 Authenticated - downloading: ${objectKey} for ${adminId ? "admin" : "user"} ${adminId || userId}`);
      await cloudinaryStorage2.downloadToResponse(objectKey, res);
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        console.warn(`\u26A0\uFE0F File not found: ${req.params.objectPath}`);
        return res.status(404).json({ message: "File not found" });
      }
      console.error("\u274C File download error:", error);
      return res.status(500).json({ message: "Failed to serve file" });
    }
  });
  try {
    const existingAdmin = await storage.getAdminByEmail("admin@greenpay.com");
    if (!existingAdmin) {
      await storage.createAdmin({
        email: "admin@greenpay.com",
        password: "Admin123!@#",
        fullName: "GreenPay Administrator",
        role: "admin",
        twoFactorEnabled: false
      });
      console.log("\u2705 Default admin account created");
    }
  } catch (error) {
    console.error("Failed to create default admin:", error);
  }
  app2.post("/api/auth/signup", optionalApiKey, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const { messagingService: messagingService3 } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
      userData.phone = messagingService3.formatPhoneNumber(userData.phone);
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      const user = await storage.createUser(userData);
      await storage.updateUser(user.id, {
        isPhoneVerified: true,
        isEmailVerified: true
      });
      if (user.phone || user.email) {
        const { messagingService: messagingService4 } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
        const { whatsappService: whatsappService2 } = await Promise.resolve().then(() => (init_whatsapp(), whatsapp_exports));
        const domain = process.env.REPLIT_DOMAINS || "greenpay.app";
        const loginUrl = `https://${domain.split(",")[0]}/login`;
        if (user.phone) {
          whatsappService2.sendAccountCreation(user.phone, user.fullName || "User").catch((err) => console.error("[Signup] WhatsApp account creation error:", err));
          messagingService4.sendMessage(
            user.phone,
            `Welcome to GreenPay! To send and receive money, you need to: 1) Purchase a virtual card 2) Verify your KYC. Login here: ${loginUrl}`
          ).catch((err) => console.error("Welcome message error:", err));
        }
        if (user.email) {
          const { mailtrapService: mailtrapService3 } = await Promise.resolve().then(() => (init_mailtrap(), mailtrap_exports));
          mailtrapService3.sendWelcome(user.email, user.fullName?.split(" ")[0] || "User", user.fullName?.split(" ")[1] || "").catch((err) => console.error("[Signup] Email welcome error:", err));
        }
      }
      try {
        const defCurrencySetting = await pool.query(`SELECT value FROM system_settings WHERE key = 'default_currency' LIMIT 1`);
        const defCurrency = defCurrencySetting.rows[0]?.value?.replace(/['"]/g, "") || "USD";
        await db.insert(wallets).values({ userId: user.id, currency: defCurrency, isDefault: true, isActive: true });
      } catch (walletErr) {
        console.error("[Signup] Wallet auto-create error:", walletErr);
      }
      const { password, ...userResponse } = user;
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error("Session save error after signup:", saveErr);
          return res.status(500).json({ message: "Failed to create session" });
        }
        console.log(`[Signup] Account created successfully for user ${user.id}`);
        res.json({
          user: { ...userResponse, isPhoneVerified: true, isEmailVerified: true },
          success: true,
          redirectToLogin: true
        });
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(400).json({ message: "Invalid user data" });
    }
  });
  const googleOAuthStates = /* @__PURE__ */ new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of googleOAuthStates) {
      if (now > v) googleOAuthStates.delete(k);
    }
  }, 6e4);
  function getGoogleRedirectUri(req) {
    if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI;
    const domains = process.env.REPLIT_DOMAINS || process.env.REPLIT_DEV_DOMAIN;
    if (domains) return `https://${domains.split(",")[0]}/auth/google/callback`;
    return `${req.protocol}://${req.get("host")}/auth/google/callback`;
  }
  function googlePopupHtml(result, message) {
    const redirectMap = {
      login: "/dashboard",
      new_user: "/auth/google/complete",
      cancelled: "/login",
      suspended: "/login",
      error: "/login"
    };
    const fallback = redirectMap[result] || "/login";
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>GreenPay</title>
<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f0fdf4;}
.card{background:#fff;border-radius:16px;padding:32px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.08);}
.dot{width:40px;height:40px;border-radius:50%;background:#22c55e;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;}
p{color:#6b7280;font-size:14px;}</style>
</head><body>
<div class="card">
  <div class="dot"><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10l4 4 8-8" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
  <p>${message}</p>
</div>
<script>
(function(){
  var result='${result}';
  function done(){
    if(window.opener&&!window.opener.closed){
      try{window.opener.postMessage({googleAuth:result},'*');}catch(e){}
      setTimeout(function(){window.close();},300);
    } else {
      window.location.href='${fallback}';
    }
  }
  done();
})();
</script></body></html>`;
  }
  app2.get("/auth/google", (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) return res.send(googlePopupHtml("error", "Google sign-in is not configured."));
    const state = Math.random().toString(36).substring(2, 18);
    googleOAuthStates.set(state, Date.now() + 10 * 60 * 1e3);
    const redirectUri = getGoogleRedirectUri(req);
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "select_account",
      state
    });
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  });
  app2.get("/auth/google/callback", async (req, res) => {
    const { code, state, error } = req.query;
    if (error || !code) return res.send(googlePopupHtml("cancelled", "Sign-in was cancelled."));
    const expiry = googleOAuthStates.get(state);
    if (!expiry || Date.now() > expiry) return res.send(googlePopupHtml("error", "Session expired, please try again."));
    googleOAuthStates.delete(state);
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const redirectUri = getGoogleRedirectUri(req);
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" })
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) {
        console.error("[Google OAuth] Token exchange failed:", tokenData);
        return res.send(googlePopupHtml("error", "Could not authenticate with Google."));
      }
      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      const profile = await userInfoRes.json();
      const existingUser = await storage.getUserByEmail(profile.email);
      if (existingUser) {
        if (existingUser.isSuspended) return res.send(googlePopupHtml("suspended", "This account has been suspended."));
        if (!existingUser.googleId) {
          await storage.updateUser(existingUser.id, { googleId: profile.id });
        }
        await storage.updateUser(existingUser.id, { lastLoginAt: /* @__PURE__ */ new Date() });
        req.session.userId = existingUser.id;
        req.session.user = { id: existingUser.id, email: existingUser.email };
        try {
          const ua = req.headers["user-agent"] || "Unknown";
          await db.insert(loginHistory).values({
            userId: existingUser.id,
            ipAddress: req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.ip || "Unknown",
            userAgent: ua,
            deviceType: ua.toLowerCase().includes("mobile") ? "mobile" : "desktop",
            browser: "Google OAuth",
            status: "success"
          });
        } catch (_) {
        }
        await new Promise((r) => req.session.save(() => r()));
        return res.send(googlePopupHtml("login", "Signed in! Redirecting..."));
      } else {
        req.session.googlePending = {
          googleId: profile.id,
          email: profile.email,
          fullName: profile.name,
          profilePhotoUrl: profile.picture
        };
        await new Promise((r) => req.session.save(() => r()));
        return res.send(googlePopupHtml("new_user", "Almost there! Setting up your account..."));
      }
    } catch (err) {
      console.error("[Google OAuth] Callback error:", err);
      return res.send(googlePopupHtml("error", "Something went wrong. Please try again."));
    }
  });
  app2.get("/api/auth/google/pending", (req, res) => {
    const pending = req.session.googlePending;
    if (!pending) return res.json({ pending: false });
    res.json({ pending: true, fullName: pending.fullName, email: pending.email, profilePhotoUrl: pending.profilePhotoUrl });
  });
  app2.post("/api/auth/google/complete", async (req, res) => {
    const pending = req.session.googlePending;
    if (!pending) return res.status(400).json({ message: "Session expired. Please sign in with Google again." });
    const { fullName, phone, country } = req.body;
    if (!fullName || !phone || !country) return res.status(400).json({ message: "Full name, phone and country are required" });
    try {
      const { messagingService: messagingService3 } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
      const formattedPhone = messagingService3.formatPhoneNumber(phone);
      const existing = await storage.getUserByEmail(pending.email);
      if (existing) return res.status(400).json({ message: "An account with this email already exists. Please log in." });
      const { db: database } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { eq: eq4 } = await import("drizzle-orm");
      const phoneCheck = await database.select().from(users).where(eq4(users.phone, formattedPhone));
      if (phoneCheck.length > 0) return res.status(400).json({ message: "This phone number is already registered." });
      const bcrypt3 = await import("bcrypt");
      const randomPassword = await bcrypt3.hash(Math.random().toString(36) + Date.now().toString(), 10);
      const user = await storage.createUser({
        fullName: fullName.trim(),
        email: pending.email,
        phone: formattedPhone,
        country,
        password: randomPassword
      });
      await storage.updateUser(user.id, {
        isEmailVerified: true,
        isPhoneVerified: true,
        googleId: pending.googleId,
        profilePhotoUrl: pending.profilePhotoUrl
      });
      delete req.session.googlePending;
      req.session.userId = user.id;
      req.session.user = { id: user.id, email: user.email };
      try {
        const ua = req.headers["user-agent"] || "Unknown";
        await db.insert(loginHistory).values({
          userId: user.id,
          ipAddress: req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.ip || "Unknown",
          userAgent: ua,
          deviceType: ua.toLowerCase().includes("mobile") ? "mobile" : "desktop",
          browser: "Google OAuth",
          status: "success"
        });
      } catch (_2) {
      }
      try {
        const defCurrencySetting = await pool.query(`SELECT value FROM system_settings WHERE key = 'default_currency' LIMIT 1`);
        const defCurrency = (defCurrencySetting.rows[0]?.value || "USD").replace(/['"]/g, "").trim();
        await db.insert(wallets).values({ userId: user.id, currency: defCurrency, isDefault: true, isActive: true });
      } catch (_2) {
      }
      const { whatsappService: whatsappService2 } = await Promise.resolve().then(() => (init_whatsapp(), whatsapp_exports));
      const { mailtrapService: mailtrapService3 } = await Promise.resolve().then(() => (init_mailtrap(), mailtrap_exports));
      whatsappService2.sendAccountCreation(formattedPhone, fullName).catch(() => {
      });
      mailtrapService3.sendWelcome(pending.email, fullName.split(" ")[0] || "User", fullName.split(" ")[1] || "").catch(() => {
      });
      const { password: _, ...userResponse } = user;
      await new Promise((r) => req.session.save(() => r()));
      res.json({ success: true, user: { ...userResponse, isEmailVerified: true, isPhoneVerified: true } });
    } catch (err) {
      console.error("[Google OAuth] Complete error:", err);
      res.status(500).json({ message: "Failed to create account. Please try again." });
    }
  });
  app2.post("/api/auth/login", optionalApiKey, async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const isValidPassword = await bcrypt2.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      if (user.isSuspended === true) {
        return res.status(403).json({
          message: "Your account has been suspended. Please contact support for assistance.",
          accountSuspended: true,
          suspensionReason: user.suspensionReason || null
        });
      }
      await storage.updateUser(user.id, { lastLoginAt: /* @__PURE__ */ new Date() });
      const twoFactorRequiredSetting = await storage.getSystemSetting("security", "two_factor_required");
      const twoFactorRequired = twoFactorRequiredSetting?.value === "true";
      const kycRequiredSetting = await storage.getSystemSetting("security", "kyc_auto_approval");
      const kycRequired = kycRequiredSetting?.value === "false";
      const enableOtpSetting = await storage.getSystemSetting("messaging", "enable_otp_messages");
      const otpRequired = enableOtpSetting?.value !== "false";
      const otpEmailSetting = await storage.getSystemSetting("messaging", "otp_email_enabled");
      const otpSmsSetting = await storage.getSystemSetting("messaging", "otp_sms_enabled");
      const otpWhatsappSetting = await storage.getSystemSetting("messaging", "otp_whatsapp_enabled");
      const emailEnabled = otpEmailSetting?.value !== "false";
      const smsEnabled = otpSmsSetting?.value !== "false";
      const whatsappEnabled = otpWhatsappSetting?.value !== "false";
      const pinRequiredSetting = await storage.getSystemSetting("security", "pin_required");
      const pinRequired = pinRequiredSetting?.value === "true";
      const apiKeySetting = await storage.getSystemSetting("messaging", "sms_api_key");
      const appIdSetting = await storage.getSystemSetting("messaging", "sms_app_id");
      const senderIdSetting = await storage.getSystemSetting("messaging", "sms_sender_id");
      const whatsappTokenSetting = await storage.getSystemSetting("messaging", "whatsapp_access_token");
      const whatsappPhoneSetting = await storage.getSystemSetting("messaging", "whatsapp_phone_number_id");
      const smsConfigured = !!((apiKeySetting?.value || process.env.SMS_API_KEY) && (appIdSetting?.value || process.env.SMS_APP_ID) && (senderIdSetting?.value || process.env.SMS_SENDER_ID));
      const whatsappConfigured = !!((whatsappTokenSetting?.value || process.env.WHATSAPP_ACCESS_TOKEN) && (whatsappPhoneSetting?.value || process.env.WHATSAPP_PHONE_NUMBER_ID));
      const messagesConfigured = smsConfigured || whatsappConfigured;
      if (kycRequired && user.kycStatus !== "verified") {
        return res.status(403).json({
          message: "KYC verification required",
          requiresKYC: true,
          userId: user.id
        });
      }
      if (twoFactorRequired && !user.twoFactorEnabled) {
        return res.status(403).json({
          message: "2FA must be enabled",
          requires2FA: true,
          userId: user.id
        });
      }
      if (pinRequired && !user.pinEnabled) {
        return res.status(403).json({
          message: "PIN setup required",
          requiresPINSetup: true,
          userId: user.id
        });
      }
      if (!otpRequired) {
        console.log("OTP disabled by admin");
        if ((pinRequired || user.pinEnabled) && user.pinCode) {
          return res.status(200).json({
            message: "PIN verification required",
            requiresPin: true,
            userId: user.id
          });
        }
        req.session.regenerate((err) => {
          if (err) {
            console.error("Session regeneration error:", err);
            return res.status(500).json({ message: "Session error" });
          }
          req.session.userId = user.id;
          req.session.user = { id: user.id, email: user.email };
          storage.createLoginHistory({
            userId: user.id,
            ipAddress: req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "Unknown",
            userAgent: req.headers["user-agent"] || "Unknown",
            deviceType: req.headers["user-agent"]?.includes("Mobile") ? "mobile" : "desktop",
            browser: req.headers["user-agent"]?.split("/")[0] || "Unknown",
            location: req.headers["cf-ipcountry"] || "Unknown",
            status: "success"
          }).catch((err2) => console.error("Login history error:", err2));
          notificationService.sendSecurityNotification(
            user.id,
            "New login detected from your account"
          ).catch((err2) => console.error("Notification error:", err2));
          const { password: _, ...userResponse } = user;
          req.session.save((saveErr) => {
            if (saveErr) {
              console.error("Session save error:", saveErr);
              return res.status(500).json({ message: "Session save error" });
            }
            res.json({ user: userResponse });
          });
        });
        return;
      }
      if (messagesConfigured) {
        const { messagingService: messagingService3 } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
        const { mailtrapService: mailtrapService3 } = await Promise.resolve().then(() => (init_mailtrap(), mailtrap_exports));
        const otpCode = messagingService3.generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1e3);
        await storage.updateUserOtp(user.id, otpCode, otpExpiry);
        const [smsWhatsappResult, emailResult] = await Promise.all([
          messagingService3.sendOTP(user.phone, otpCode),
          user.email ? mailtrapService3.sendOTP(user.email, user.firstName || "User", user.lastName || "", otpCode) : Promise.resolve(false)
        ]);
        const result = { ...smsWhatsappResult, email: emailResult };
        if (!result.sms && !result.whatsapp && !result.email) {
          console.error("OTP delivery failed - messaging configured but delivery failed");
          return res.status(500).json({
            message: "Failed to send verification code. Please try again or contact support."
          });
        }
        req.session.regenerate((err) => {
          if (err) {
            console.error("Session regeneration error:", err);
            return res.status(500).json({ message: "Session error" });
          }
          req.session.pendingLoginUserId = user.id;
          req.session.loginIp = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
          req.session.loginLocation = req.headers["cf-ipcountry"] || "Unknown Location";
          req.session.save((saveErr) => {
            if (saveErr) {
              console.error("Session save error:", saveErr);
              return res.status(500).json({ message: "Session save error" });
            }
            const sentMethods = [];
            if (result.sms) sentMethods.push("SMS");
            if (result.whatsapp) sentMethods.push("WhatsApp");
            if (result.email) sentMethods.push("Email");
            res.json({
              requiresOtp: true,
              userId: user.id,
              phone: user.phone,
              sentVia: sentMethods.length > 0 ? sentMethods.join(" and ") : "SMS, WhatsApp or Email",
              message: `Verification code sent to ${sentMethods.length > 0 ? sentMethods.join(", ") : "SMS, WhatsApp or Email"}`
            });
          });
        });
      } else {
        req.session.regenerate((err) => {
          if (err) {
            console.error("Session regeneration error:", err);
            return res.status(500).json({ message: "Session error" });
          }
          const userResponse = {
            id: user.id,
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            email: user.email || "",
            phone: user.phone || "",
            avatar: user.avatar || "",
            kycStatus: user.kycStatus || "pending",
            balance: user.balance || 0
          };
          req.session.userId = user.id;
          req.session.userRole = user.role || "user";
          req.session.save((err2) => {
            if (err2) {
              console.error("Session save error:", err2);
              return res.status(500).json({ message: "Session error" });
            }
            res.json({ user: userResponse });
          });
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Invalid login data" });
    }
  });
  app2.post("/api/auth/verify-otp", optionalApiKey, async (req, res) => {
    try {
      const { code } = otpSchema.parse(req.body);
      const { userId } = req.body;
      const pendingUserId = req.session.pendingLoginUserId || userId;
      const loginIp = req.session.loginIp || req.ip;
      const loginLocation = req.session.loginLocation || "Unknown Location";
      if (!pendingUserId) {
        return res.status(401).json({ message: "Session expired. Please login again." });
      }
      const isValid = await storage.verifyUserOtp(pendingUserId, code);
      if (isValid) {
        const user = await storage.getUser(pendingUserId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        req.session.userId = user.id;
        req.session.user = { id: user.id, email: user.email };
        storage.createLoginHistory({
          userId: user.id,
          ipAddress: loginIp || "Unknown",
          userAgent: req.headers["user-agent"] || "Unknown",
          deviceType: req.headers["user-agent"]?.includes("Mobile") ? "mobile" : "desktop",
          browser: req.headers["user-agent"]?.split("/")[0] || "Unknown",
          location: loginLocation,
          status: "success"
        }).catch((err) => console.error("Login history error:", err));
        delete req.session.pendingLoginUserId;
        delete req.session.loginIp;
        delete req.session.loginLocation;
        const { messagingService: messagingService3 } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
        const { mailtrapService: mailtrapService3 } = await Promise.resolve().then(() => (init_mailtrap(), mailtrap_exports));
        Promise.all([
          messagingService3.sendLoginAlert(user.phone, loginLocation, loginIp || "Unknown IP"),
          user.email ? mailtrapService3.sendLoginAlert(
            user.email,
            user.firstName || "User",
            user.lastName || "",
            loginLocation,
            loginIp || "Unknown IP",
            req.headers["user-agent"] || "Unknown Device"
          ) : Promise.resolve(false)
        ]).catch((err) => console.error("Login alert error:", err));
        notificationService.sendSecurityNotification(
          user.id,
          "New login detected from your account"
        ).catch((err) => console.error("Notification error:", err));
        const { password, ...userResponse } = user;
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ message: "Session save error" });
          }
          res.json({ success: true, user: userResponse });
        });
      } else {
        res.status(400).json({ message: "Invalid or expired OTP code" });
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      res.status(400).json({ message: "Invalid OTP data" });
    }
  });
  app2.post("/api/auth/resend-otp", optionalApiKey, async (req, res) => {
    try {
      const { userId } = req.body;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { messagingService: messagingService3 } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
      const { mailtrapService: mailtrapService3 } = await Promise.resolve().then(() => (init_mailtrap(), mailtrap_exports));
      const otpCode = messagingService3.generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1e3);
      await storage.updateUserOtp(user.id, otpCode, otpExpiry);
      const [smsWhatsappResult, emailResult] = await Promise.all([
        messagingService3.sendOTP(user.phone, otpCode),
        user.email ? mailtrapService3.sendOTP(user.email, user.firstName || "User", user.lastName || "", otpCode) : Promise.resolve(false)
      ]);
      const result = { ...smsWhatsappResult, email: emailResult };
      if (!result.sms && !result.whatsapp && !result.email) {
        return res.status(500).json({ message: "Failed to resend verification code" });
      }
      const sentMethods = [];
      if (result.sms) sentMethods.push("SMS");
      if (result.whatsapp) sentMethods.push("WhatsApp");
      if (result.email) sentMethods.push("Email");
      res.json({
        message: `New OTP sent via ${sentMethods.join(", ")}`
      });
    } catch (error) {
      console.error("Resend OTP error:", error);
      res.status(500).json({ message: "Failed to resend OTP" });
    }
  });
  app2.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { contact } = req.body;
      if (!contact) {
        return res.status(400).json({ message: "Phone number or email address is required" });
      }
      const { messagingService: messagingService3 } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
      const { mailtrapService: mailtrapService3 } = await Promise.resolve().then(() => (init_mailtrap(), mailtrap_exports));
      const isEmail = contact.includes("@");
      let user;
      if (isEmail) {
        user = await storage.getUserByEmail(contact.toLowerCase().trim());
        if (!user) {
          return res.status(404).json({ message: "No account found with this email address" });
        }
      } else {
        const formattedPhone = messagingService3.formatPhoneNumber(contact);
        user = await storage.getUserByPhone(formattedPhone);
        if (!user) {
          return res.status(404).json({ message: "No account found with this phone number" });
        }
      }
      const resetCode = messagingService3.generateOTP();
      const resetExpiry = new Date(Date.now() + 10 * 60 * 1e3);
      await storage.updateUserOtp(user.id, resetCode, resetExpiry);
      const [smsWhatsappResult, emailResult] = await Promise.all([
        messagingService3.sendPasswordReset(user.phone, resetCode),
        user.email ? mailtrapService3.sendPasswordReset(user.email, user.firstName || "User", user.lastName || "", resetCode) : Promise.resolve(false)
      ]);
      const result = { ...smsWhatsappResult, email: emailResult };
      if (!result.sms && !result.whatsapp && !result.email) {
        return res.status(500).json({ message: "Failed to send reset code" });
      }
      const sentMethods = [];
      if (result.sms) sentMethods.push("SMS");
      if (result.whatsapp) sentMethods.push("WhatsApp");
      if (result.email) sentMethods.push("Email");
      res.json({
        phone: user.phone,
        sentVia: sentMethods.join(", ")
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to send reset code" });
    }
  });
  app2.post("/api/auth/forgot-password-email", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email address is required" });
      }
      const user = await storage.getUserByEmail(email.toLowerCase().trim());
      if (!user) {
        return res.status(404).json({ message: "No account found with this email address" });
      }
      const { messagingService: messagingService3 } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
      const resetCode = messagingService3.generateOTP();
      const resetExpiry = new Date(Date.now() + 10 * 60 * 1e3);
      await storage.updateUserOtp(user.id, resetCode, resetExpiry);
      const [smsWhatsappResult, emailResult] = await Promise.all([
        messagingService3.sendPasswordReset(user.phone, resetCode),
        user.email ? mailtrapService.sendPasswordReset(user.email, user.firstName || "User", user.lastName || "", resetCode) : Promise.resolve(false)
      ]);
      const result = { ...smsWhatsappResult, email: emailResult };
      if (!result.sms && !result.whatsapp && !result.email) {
        return res.status(500).json({ message: "Failed to send reset code" });
      }
      const sentMethods = [];
      if (result.sms) sentMethods.push("SMS");
      if (result.whatsapp) sentMethods.push("WhatsApp");
      if (result.email) sentMethods.push("Email");
      res.json({
        email: user.email,
        sentVia: sentMethods.join(", ")
      });
    } catch (error) {
      console.error("Forgot password by email error:", error);
      res.status(500).json({ message: "Failed to send reset code" });
    }
  });
  app2.post("/api/auth/reset-password-email", async (req, res) => {
    try {
      const { email, code, newPassword } = req.body;
      if (!email || !code || !newPassword) {
        return res.status(400).json({ message: "Email, code, and new password are required" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      const user = await storage.getUserByEmail(email.toLowerCase().trim());
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const isValid = await storage.verifyUserOtp(user.id, code);
      if (!isValid) {
        return res.status(400).json({ message: "Invalid or expired reset code" });
      }
      const hashedPassword = await bcrypt2.hash(newPassword, 10);
      await storage.updateUserPassword(user.id, hashedPassword);
      await storage.updateUserOtp(user.id, null, null);
      const { mailtrapService: mailtrapService3 } = await Promise.resolve().then(() => (init_mailtrap(), mailtrap_exports));
      Promise.all([
        messagingService.sendMessage(
          user.phone,
          "Your password has been reset successfully. You can now log in with your new password."
        ),
        user.email ? mailtrapService3.sendTemplate(user.email, "7711c72e-431b-4fb9-bea9-9738d4d8bfe7", {
          first_name: user.firstName || "User",
          last_name: user.lastName || "",
          message: "Your password has been reset successfully. You can now log in."
        }) : Promise.resolve(false)
      ]).catch((err) => console.error("Password reset notification error:", err));
      res.json({
        success: true,
        message: "Password reset successful"
      });
    } catch (error) {
      console.error("Reset password by email error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });
  app2.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { contact } = req.body;
      if (!contact) {
        return res.status(400).json({ message: "Phone number or email is required" });
      }
      const { messagingService: messagingService3 } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
      let user;
      if (contact.includes("@")) {
        user = await storage.getUserByEmail(contact);
      } else {
        const formattedPhone = messagingService3.formatPhoneNumber(contact);
        user = await storage.getUserByPhone(formattedPhone);
      }
      if (!user) {
        return res.json({
          success: true,
          message: "If an account exists, a reset code has been sent."
        });
      }
      const otpCode = messagingService3.generateOTP();
      const otpExpiry = new Date(Date.now() + 15 * 60 * 1e3);
      await storage.updateUserOtp(user.id, otpCode, otpExpiry);
      const { mailtrapService: mailtrapService3 } = await Promise.resolve().then(() => (init_mailtrap(), mailtrap_exports));
      const { whatsappService: whatsappService2 } = await Promise.resolve().then(() => (init_whatsapp(), whatsapp_exports));
      const results = await Promise.allSettled([
        user.phone ? messagingService3.sendMessage(user.phone, `Your GreenPay password reset code is: ${otpCode}`) : Promise.resolve(false),
        user.phone ? whatsappService2.sendOTP(user.phone, otpCode) : Promise.resolve(false),
        user.email ? mailtrapService3.sendTemplate(user.email, "b54e3d3c-9a2c-4b6e-8e8e-8a9e9a9e9a9e", {
          first_name: user.firstName || "User",
          otp_code: otpCode
        }) : Promise.resolve(false)
      ]);
      console.log(`[ForgotPassword] Reset code sent to user ${user.id}`);
      res.json({
        success: true,
        message: "Reset code sent successfully",
        sentVia: user.email && contact.includes("@") ? "email" : "phone"
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to process request" });
    }
  });
  app2.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { phone, code, newPassword } = req.body;
      if (!phone || !code || !newPassword) {
        return res.status(400).json({ message: "Contact, code, and new password are required" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      const { messagingService: messagingService3 } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
      let user;
      if (phone.includes("@")) {
        user = await storage.getUserByEmail(phone);
      } else {
        const formattedPhone = messagingService3.formatPhoneNumber(phone);
        user = await storage.getUserByPhone(formattedPhone);
      }
      if (!user) {
        console.error(`[ResetPassword] User not found for contact: ${phone}`);
        return res.status(404).json({ message: "User not found" });
      }
      const isValid = await storage.verifyUserOtp(user.id, code);
      if (!isValid) {
        console.error(`[ResetPassword] Invalid or expired code for user ${user.id}`);
        return res.status(400).json({ message: "Invalid or expired reset code" });
      }
      const hashedPassword = await bcrypt2.hash(newPassword, 10);
      await storage.updateUserPassword(user.id, hashedPassword);
      await storage.updateUserOtp(user.id, null, null);
      const { mailtrapService: mailtrapService3 } = await Promise.resolve().then(() => (init_mailtrap(), mailtrap_exports));
      Promise.all([
        messagingService3.sendMessage(
          user.phone,
          "Your password has been reset successfully. You can now log in with your new password."
        ),
        user.email ? mailtrapService3.sendTemplate(user.email, "7711c72e-431b-4fb9-bea9-9738d4d8bfe7", {
          first_name: user.firstName || "User",
          last_name: user.lastName || "",
          message: "Your password has been reset successfully. You can now log in."
        }) : Promise.resolve(false)
      ]).catch((err) => console.error("Password reset notification error:", err));
      console.log(`[ResetPassword] Success for user ${user.id}`);
      res.json({
        success: true,
        message: "Password reset successful"
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });
  app2.get("/api/conversations/user-conversation", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        console.log(`[CONVERSATION AUTH] FAILED - No userId in session for conversation request`);
        return res.status(401).json({ message: "Authentication required" });
      }
      console.log(`[CONVERSATION PRIVACY] User ${userId.substring(0, 8)}... requesting conversation`);
      const existingConversations = await storage.getConversationsByUserId(userId);
      console.log(`[CONVERSATION PRIVACY] User ${userId.substring(0, 8)}... has ${existingConversations.length} existing conversations`);
      const activeConversation = existingConversations.find((c) => c.status === "active");
      if (activeConversation) {
        console.log(`[CONVERSATION PRIVACY] Returning conversation ${activeConversation.id.substring(0, 8)}... for user ${userId.substring(0, 8)}...`);
        return res.json(activeConversation);
      }
      const newConversation = await storage.createConversation({
        userId,
        title: "Support Chat",
        adminId: null
      });
      try {
        const { messagingService: messagingService3 } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
        await messagingService3.sendAdminChatNotification(userId);
      } catch (smsError) {
        console.error("Failed to send admin chat notification:", smsError);
      }
      console.log(`[CONVERSATION PRIVACY] Created new conversation ${newConversation.id.substring(0, 8)}... for user ${userId.substring(0, 8)}...`);
      res.json(newConversation);
    } catch (error) {
      console.error("Get/Create conversation error:", error);
      res.status(500).json({ message: "Failed to get or create conversation" });
    }
  });
  app2.get("/api/messages/:conversationId", async (req, res) => {
    try {
      const { conversationId } = req.params;
      const userId = req.session?.userId;
      const adminId = req.session?.admin?.id;
      console.log(`[MESSAGES PRIVACY] User ${userId?.substring(0, 8) || "none"}... requesting messages for conversation ${conversationId.substring(0, 8)}...`);
      if (!userId && !adminId) {
        console.log(`[MESSAGES AUTH] FAILED - No userId or adminId in session`);
        return res.status(401).json({ message: "Authentication required" });
      }
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        console.log(`[MESSAGES PRIVACY] Conversation ${conversationId.substring(0, 8)}... not found`);
        return res.status(404).json({ message: "Conversation not found" });
      }
      console.log(`[MESSAGES PRIVACY] Conversation ${conversationId.substring(0, 8)}... belongs to user ${conversation.userId.substring(0, 8)}...`);
      if (conversation.userId !== userId && !adminId) {
        console.log(`[MESSAGES PRIVACY] ACCESS DENIED - User ${userId?.substring(0, 8)}... tried to access conversation owned by ${conversation.userId.substring(0, 8)}...`);
        return res.status(403).json({ message: "Access denied" });
      }
      const messages2 = await storage.getMessagesByConversationId(conversationId);
      console.log(`[MESSAGES PRIVACY] Returning ${messages2.length} messages for conversation ${conversationId.substring(0, 8)}...`);
      res.json(messages2);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });
  app2.post("/api/messages", async (req, res) => {
    try {
      const userId = req.session?.userId;
      const adminId = req.session?.admin?.id;
      console.log(`[MESSAGES PRIVACY] User ${userId?.substring(0, 8) || "none"}... sending message`);
      if (!userId && !adminId) {
        console.log(`[MESSAGES AUTH] FAILED - No userId or adminId in session`);
        return res.status(401).json({ message: "Authentication required" });
      }
      const messageData = insertMessageSchema.parse(req.body);
      console.log(`[MESSAGES PRIVACY] Message for conversation ${messageData.conversationId.substring(0, 8)}...`);
      const conversation = await storage.getConversation(messageData.conversationId);
      if (!conversation) {
        console.log(`[MESSAGES PRIVACY] Conversation ${messageData.conversationId.substring(0, 8)}... not found for message`);
        return res.status(404).json({ message: "Conversation not found" });
      }
      console.log(`[MESSAGES PRIVACY] Conversation ${messageData.conversationId.substring(0, 8)}... belongs to user ${conversation.userId.substring(0, 8)}...`);
      if (conversation.userId !== userId && !adminId) {
        console.log(`[MESSAGES PRIVACY] ACCESS DENIED - User ${userId?.substring(0, 8)}... tried to send message to conversation owned by ${conversation.userId.substring(0, 8)}...`);
        return res.status(403).json({ message: "Access denied" });
      }
      const senderId = adminId || userId;
      const senderType = adminId ? "admin" : "user";
      console.log(`[MESSAGES PRIVACY] Creating message from ${senderType} ${senderId?.substring(0, 8)}... in conversation ${messageData.conversationId.substring(0, 8)}...`);
      const message = await storage.createMessage({
        ...messageData,
        senderId,
        senderType
      });
      if (senderType === "admin") {
        try {
          const { messagingService: messagingService3 } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
          const user = await storage.getUser(conversation.userId);
          if (user && user.phone) {
            const domain = process.env.REPLIT_DOMAINS || "greenpay.app";
            const loginUrl = `https://${domain.split(",")[0]}/login`;
            const notification = `You have a new message from GreenPay support. Login to reply: ${loginUrl}`;
            await messagingService3.sendMessage(user.phone, notification);
          }
        } catch (smsError) {
          console.error("Failed to send user chat notification:", smsError);
        }
      }
      res.json({ message });
    } catch (error) {
      console.error("Create message error:", error);
      res.status(400).json({ message: "Invalid message data" });
    }
  });
  app2.put("/api/messages/:id/read", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.session?.userId;
      const adminId = req.session?.admin?.id;
      if (!userId && !adminId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const message = await storage.markMessageAsRead(id);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      res.json({ message });
    } catch (error) {
      console.error("Mark message read error:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });
  app2.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      const userId = req.session?.userId;
      const adminId = req.session?.admin?.id;
      if (!userId && !adminId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const cloudinaryReady = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
      if (cloudinaryReady) {
        try {
          const url = await cloudinaryStorage2.uploadChatFile(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype
          );
          return res.json({
            url,
            fileUrl: url,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            message: "File uploaded successfully"
          });
        } catch (uploadError) {
          console.error("[Upload] Cloudinary upload error:", uploadError);
        }
      }
      const base64 = req.file.buffer.toString("base64");
      const dataUrl = `data:${req.file.mimetype};base64,${base64}`;
      console.log("[Upload] Returning base64 data URL (Cloudinary not configured or failed)");
      return res.json({
        url: dataUrl,
        fileUrl: dataUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        message: "File stored as base64 (no cloud storage)"
      });
    } catch (error) {
      console.error("[Upload] Request error:", error);
      res.status(500).json({ message: "Failed to upload file", error: String(error) });
    }
  });
  app2.get("/api/kyc/extracted-data", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      const kyc = await storage.getKycByUserId(userId);
      const u = user;
      const decision = kyc?.diditDecision;
      const docFeatures = decision?.features?.document || {};
      const extractedData = {
        fullName: u.kycFullName || [docFeatures.first_name, docFeatures.last_name].filter(Boolean).join(" ") || null,
        firstName: docFeatures.first_name || null,
        lastName: docFeatures.last_name || null,
        dateOfBirth: u.kycDateOfBirth || docFeatures.date_of_birth || null,
        idNumber: u.kycIdNumber || docFeatures.document_number || null,
        documentType: u.kycDocumentType || docFeatures.document_type || kyc?.documentType || null,
        nationality: u.kycNationality || docFeatures.nationality || null,
        gender: u.kycGender || docFeatures.gender || null,
        expiryDate: u.kycIdExpiryDate || docFeatures.expiry_date || null,
        address: u.kycAddress || docFeatures.address || kyc?.address || null,
        issuingCountry: u.kycIssuingCountry || docFeatures.issuing_country || null,
        diditStatus: kyc?.diditStatus || null,
        kycStatus: kyc?.status || user.kycStatus
      };
      const hasData = Object.values(extractedData).some((v) => v && typeof v === "string" && v.trim());
      if (!hasData) return res.json({ extractedData: null });
      res.json({ extractedData });
    } catch (error) {
      console.error("[KYC] Extracted data error:", error);
      res.status(500).json({ message: "Failed to fetch KYC data" });
    }
  });
  app2.post("/api/kyc/didit/start", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const { createDiditSession: createDiditSession2, isDiditConfigured: isDiditConfigured2 } = await Promise.resolve().then(() => (init_didit(), didit_exports));
      if (!isDiditConfigured2()) {
        return res.status(503).json({
          message: "KYC verification service is not configured. Please contact support.",
          configured: false
        });
      }
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      if (user.kycStatus === "verified") {
        return res.status(409).json({ message: "Your KYC is already verified." });
      }
      const appUrl = process.env.APP_URL || `https://${req.get("host")}`;
      const callbackUrl = `${appUrl}/kyc-callback`;
      const session2 = await createDiditSession2(userId, callbackUrl);
      if (!session2) {
        return res.status(502).json({ message: "Failed to create verification session. Please try again." });
      }
      let existingKyc = await storage.getKycByUserId(userId);
      if (existingKyc && existingKyc.status !== "rejected") {
        await storage.updateKycDocument(existingKyc.id, {
          diditSessionId: session2.session_id,
          diditStatus: session2.status,
          status: "pending"
        });
      } else {
        await storage.createKycDocument({
          userId,
          documentType: "didit_verification",
          status: "pending",
          diditSessionId: session2.session_id,
          diditStatus: session2.status
        });
      }
      await storage.updateUser(userId, { kycStatus: "pending" });
      res.json({
        sessionId: session2.session_id,
        url: session2.url,
        status: session2.status
      });
    } catch (error) {
      console.error("[Didit] Start session error:", error);
      res.status(500).json({ message: "Failed to start verification" });
    }
  });
  app2.get("/api/kyc/didit/status", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const kyc = await storage.getKycByUserId(userId);
      if (!kyc || !kyc.diditSessionId) {
        return res.json({ status: null, kycStatus: "not_submitted", docStatus: kyc?.status || null });
      }
      const { getSessionDecision: getSessionDecision2, mapDiditStatusToKyc: mapDiditStatusToKyc2, isTerminalStatus: isTerminalStatus2 } = await Promise.resolve().then(() => (init_didit(), didit_exports));
      const decision = await getSessionDecision2(kyc.diditSessionId);
      if (!decision) {
        return res.json({
          status: kyc.diditStatus,
          kycStatus: kyc.status,
          sessionId: kyc.diditSessionId
        });
      }
      const diditStatus = decision.status;
      const kycStatus = mapDiditStatusToKyc2(diditStatus);
      if (diditStatus !== kyc.diditStatus || kycStatus !== kyc.status) {
        await storage.updateKycDocument(kyc.id, {
          diditStatus,
          status: kycStatus,
          diditDecision: decision,
          verifiedAt: kycStatus === "verified" ? /* @__PURE__ */ new Date() : void 0
        });
        await storage.updateUser(userId, { kycStatus });
        if (isTerminalStatus2(diditStatus)) {
          const user = await storage.getUser(userId);
          if (user) {
            const { messagingService: messagingService3 } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
            const { mailtrapService: mailtrapService3 } = await Promise.resolve().then(() => (init_mailtrap(), mailtrap_exports));
            if (kycStatus === "verified") {
              Promise.all([
                messagingService3.sendKYCVerified(user.phone),
                user.email ? mailtrapService3.sendKYCVerified(user.email, user.fullName?.split(" ")[0] || "User", "") : Promise.resolve()
              ]).catch((err) => console.error("[Didit] Notification error:", err));
            }
          }
        }
      }
      res.json({
        status: diditStatus,
        kycStatus,
        sessionId: kyc.diditSessionId,
        decision: isTerminalStatus2(diditStatus) ? decision : void 0
      });
    } catch (error) {
      console.error("[Didit] Status poll error:", error);
      res.status(500).json({ message: "Failed to check verification status" });
    }
  });
  app2.post("/api/kyc/didit/webhook", async (req, res) => {
    try {
      const { verifyWebhookSignature: verifyWebhookSignature2, mapDiditStatusToKyc: mapDiditStatusToKyc2, isTerminalStatus: isTerminalStatus2 } = await Promise.resolve().then(() => (init_didit(), didit_exports));
      const webhookSecret = process.env.DIDIT_WEBHOOK_SECRET;
      if (webhookSecret) {
        const signature = req.headers["x-didit-signature"];
        if (!signature) {
          return res.status(401).json({ message: "Missing webhook signature" });
        }
        const rawBody = JSON.stringify(req.body);
        const valid = verifyWebhookSignature2(rawBody, signature, webhookSecret);
        if (!valid) {
          return res.status(401).json({ message: "Invalid webhook signature" });
        }
      }
      const payload = req.body;
      const { session_id: sessionId, vendor_data: userId, status: diditStatus } = payload;
      if (!sessionId || !userId || !diditStatus) {
        return res.status(400).json({ message: "Invalid webhook payload" });
      }
      console.log(`[Didit] Webhook: session ${sessionId} \u2192 ${diditStatus} (user: ${userId})`);
      const kycStatus = mapDiditStatusToKyc2(diditStatus);
      const kyc = await storage.getKycByUserId(userId);
      if (kyc) {
        await storage.updateKycDocument(kyc.id, {
          diditStatus,
          status: kycStatus,
          diditDecision: payload,
          verifiedAt: kycStatus === "verified" ? /* @__PURE__ */ new Date() : void 0
        });
      }
      await storage.updateUser(userId, { kycStatus });
      if (kycStatus === "verified") {
        const doc = payload?.features?.document || {};
        const idNumber = doc.document_number || null;
        if (idNumber) {
          const existing = await db.select({ id: users.id }).from(users).where(eq3(users.kycIdNumber, idNumber));
          if (existing.some((u) => u.id !== userId)) {
            console.warn(`[Didit] Webhook: duplicate ID ${idNumber} \u2014 user ${userId} blocked`);
            await storage.updateUser(userId, { kycStatus: "rejected" });
            await storage.updateKycDocument(kyc.id, { status: "rejected", verificationNotes: "Duplicate ID \u2014 this document is already linked to another account." });
            return res.json({ received: true });
          }
        }
        const kycFields = {
          kycFullName: [doc.first_name, doc.last_name].filter(Boolean).join(" ") || null,
          kycDateOfBirth: doc.date_of_birth || null,
          kycIdNumber: idNumber,
          kycNationality: doc.nationality || null,
          kycGender: doc.gender || null,
          kycAddress: doc.address || null,
          kycDocumentType: doc.document_type || null,
          kycIdExpiryDate: doc.expiry_date || null,
          kycIssuingCountry: doc.issuing_country || null
        };
        const filtered = Object.fromEntries(Object.entries(kycFields).filter(([, v]) => v != null));
        if (Object.keys(filtered).length > 0) await storage.updateUser(userId, filtered);
      }
      if (isTerminalStatus2(diditStatus)) {
        const user = await storage.getUser(userId);
        if (user) {
          const { messagingService: messagingService3 } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
          const { mailtrapService: mailtrapService3 } = await Promise.resolve().then(() => (init_mailtrap(), mailtrap_exports));
          if (kycStatus === "verified") {
            Promise.all([
              messagingService3.sendKYCVerified(user.phone),
              user.email ? mailtrapService3.sendKYCVerified(user.email, user.fullName?.split(" ")[0] || "User", "") : Promise.resolve()
            ]).catch((err) => console.error("[Didit] Notification error:", err));
          }
          await storage.createNotification({
            userId,
            title: kycStatus === "verified" ? "KYC Verified \u2705" : "KYC Update",
            message: kycStatus === "verified" ? "Your identity has been verified. You now have full access to all features." : kycStatus === "rejected" ? "Your KYC verification was not successful. Please try again." : "Your KYC is under review. We'll notify you once complete.",
            type: kycStatus === "verified" ? "success" : kycStatus === "rejected" ? "error" : "info",
            isGlobal: false
          });
        }
      }
      res.json({ received: true });
    } catch (error) {
      console.error("[Didit] Webhook error:", error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });
  app2.post("/api/kyc/submit", upload.fields([
    { name: "frontImage", maxCount: 1 },
    { name: "backImage", maxCount: 1 },
    { name: "selfie", maxCount: 1 }
  ]), async (req, res) => {
    try {
      const files = req.files;
      const { userId, documentType, dateOfBirth, address } = req.body;
      if (!userId || !documentType || !dateOfBirth || !address) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      if (!files?.frontImage || !files?.backImage || !files?.selfie) {
        return res.status(400).json({ message: "All document images are required" });
      }
      const existingKyc = await storage.getKycByUserId(userId);
      if (existingKyc) {
        if (existingKyc.status === "pending") {
          return res.status(409).json({
            message: "Your KYC documents are currently under review. Please wait for admin verification.",
            status: existingKyc.status
          });
        }
        if (existingKyc.status === "verified") {
          return res.status(409).json({
            message: "Your KYC documents have already been verified.",
            status: existingKyc.status
          });
        }
        if (existingKyc.status === "rejected") {
          let frontImageUrl2 = null;
          let backImageUrl2 = null;
          let selfieUrl2 = null;
          try {
            [frontImageUrl2, backImageUrl2, selfieUrl2] = await Promise.all([
              cloudinaryStorage2.uploadKycDocument(
                files.frontImage[0].buffer,
                files.frontImage[0].originalname,
                files.frontImage[0].mimetype
              ),
              cloudinaryStorage2.uploadKycDocument(
                files.backImage[0].buffer,
                files.backImage[0].originalname,
                files.backImage[0].mimetype
              ),
              cloudinaryStorage2.uploadKycDocument(
                files.selfie[0].buffer,
                files.selfie[0].originalname,
                files.selfie[0].mimetype
              )
            ]);
          } catch (uploadError) {
            console.error("\u274C KYC document upload error:", uploadError);
            return res.status(500).json({ message: "Failed to upload documents to storage" });
          }
          const updatedKyc = await storage.updateKycDocument(existingKyc.id, {
            documentType,
            dateOfBirth,
            address,
            frontImageUrl: frontImageUrl2,
            backImageUrl: backImageUrl2,
            selfieUrl: selfieUrl2,
            status: "pending",
            verificationNotes: null,
            updatedAt: /* @__PURE__ */ new Date()
          });
          await storage.updateUser(userId, { kycStatus: "pending" });
          await notificationService.sendNotification({
            title: "KYC Documents Resubmitted",
            body: "Your updated documents have been submitted for review. You will be notified once verified.",
            userId,
            type: "general"
          });
          const user2 = await storage.getUser(userId);
          if (user2?.phone) {
            const { messagingService: messagingService3 } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
            messagingService3.sendMessage(
              user2.phone,
              "Your KYC documents have been resubmitted. Our team will review them within 48 hours. You'll be notified once verified."
            ).catch((err) => console.error("KYC resubmission message error:", err));
          }
          return res.json({ kyc: updatedKyc, message: "KYC documents resubmitted successfully" });
        }
      }
      let frontImageUrl = null;
      let backImageUrl = null;
      let selfieUrl = null;
      try {
        [frontImageUrl, backImageUrl, selfieUrl] = await Promise.all([
          cloudinaryStorage2.uploadKycDocument(
            files.frontImage[0].buffer,
            files.frontImage[0].originalname,
            files.frontImage[0].mimetype
          ),
          cloudinaryStorage2.uploadKycDocument(
            files.backImage[0].buffer,
            files.backImage[0].originalname,
            files.backImage[0].mimetype
          ),
          cloudinaryStorage2.uploadKycDocument(
            files.selfie[0].buffer,
            files.selfie[0].originalname,
            files.selfie[0].mimetype
          )
        ]);
      } catch (uploadError) {
        console.error("\u274C KYC document upload error:", uploadError);
        return res.status(500).json({ message: "Failed to upload documents to storage" });
      }
      const kycData = {
        userId,
        documentType,
        dateOfBirth,
        address,
        frontImageUrl,
        backImageUrl,
        selfieUrl
      };
      const kyc = await storage.createKycDocument(kycData);
      await storage.updateUser(userId, { kycStatus: "pending" });
      await notificationService.sendNotification({
        title: "KYC Documents Submitted",
        body: "Your documents have been submitted for review. You will be notified once verified.",
        userId,
        type: "general"
      });
      const user = await storage.getUser(userId);
      if (user?.phone) {
        const { messagingService: messagingService3 } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
        messagingService3.sendMessage(
          user.phone,
          "Your KYC documents have been submitted successfully. Our team will review them within 48 hours. You'll be notified once verified."
        ).catch((err) => console.error("KYC submission message error:", err));
      }
      res.json({ kyc, message: "KYC documents submitted successfully" });
    } catch (error) {
      console.error("KYC submission error:", error);
      res.status(500).json({ message: "Failed to submit KYC documents" });
    }
  });
  app2.get("/api/kyc/:userId", async (req, res) => {
    try {
      const kyc = await storage.getKycByUserId(req.params.userId);
      res.json({ kyc });
    } catch (error) {
      res.status(500).json({ message: "Error fetching KYC data" });
    }
  });
  app2.post("/api/virtual-card/initialize-payment", async (req, res) => {
    try {
      const { userId } = req.body;
      console.log("Card payment request - userId:", userId, "type:", typeof userId);
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      const user = await storage.getUser(userId);
      console.log("Card payment - Found user:", !!user, user?.email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const existingCard = await storage.getVirtualCardByUserId(userId);
      if (existingCard && existingCard.status === "active") {
        return res.status(400).json({ message: "User already has an active virtual card" });
      }
      if (existingCard && (existingCard.status === "blocked" || existingCard.status === "inactive")) {
        console.log(`\u{1F504} User ${user.email} repurchasing card (current status: ${existingCard.status})`);
      }
      const reference = payHeroService.generateReference();
      if (!user.email || !user.email.includes("@") || !user.email.includes(".")) {
        return res.status(400).json({ message: "Invalid user email. Please update your profile with a valid email address." });
      }
      if (!user.phone) {
        return res.status(400).json({ message: "Phone number is required for M-Pesa payments. Please update your profile." });
      }
      const cardPriceSetting = await storage.getSystemSetting("virtual_card", "price");
      const usdAmount = parseFloat(cardPriceSetting?.value || "60.00");
      const kesAmount = await payHeroService.convertUSDtoKES(usdAmount);
      console.log(`Converting $${usdAmount} USD to ${kesAmount} KES for card purchase`);
      const callbackUrl = `${req.protocol}://${req.get("host")}/payment-processing?reference=${reference}&type=virtual-card`;
      const paymentData = await payHeroService.initiateMpesaPayment(
        kesAmount,
        // Amount in KES
        user.phone,
        // Phone number for M-Pesa STK Push
        reference,
        // External reference
        user.fullName,
        // Customer name
        callbackUrl
        // Callback URL for tracking
      );
      if (!paymentData.success) {
        if (paymentData.status === "INVALID_PHONE_NUMBER" || paymentData.status === "INVALID_PHONE_FORMAT") {
          return res.status(400).json({
            message: "Invalid phone number format. Please enter a valid international phone number with country code (e.g., +254712345678, +2348012345678).",
            status: paymentData.status
          });
        }
        if (paymentData.status === "TIMEOUT") {
          return res.status(504).json({
            message: "M-Pesa service is taking too long to respond. Please wait a moment and try again.",
            status: "TIMEOUT"
          });
        }
        return res.status(400).json({
          message: "Payment initiation failed. Please try again or contact support.",
          status: paymentData.status
        });
      }
      res.json({
        success: true,
        reference: paymentData.reference,
        checkoutRequestId: paymentData.CheckoutRequestID,
        status: paymentData.status,
        message: "STK Push sent to your phone. Please enter your M-Pesa PIN to complete payment."
      });
      await storage.createTransaction({
        userId,
        type: "card_purchase",
        amount: usdAmount.toString(),
        currency: "USD",
        status: "pending",
        paystackReference: paymentData.reference || paymentData.CheckoutRequestID,
        description: "Virtual Card Purchase",
        metadata: {
          phoneNumber: user.phone,
          status_reason: "Awaiting M-Pesa payment confirmation"
        }
      });
    } catch (error) {
      console.error("Card payment initialization error:", error);
      res.status(500).json({ message: "Error initializing card payment" });
    }
  });
  app2.post("/api/payments/payhero/callback", async (req, res) => {
    try {
      const { CheckoutRequestID, ResultCode, ResultDesc, ExternalReference } = req.body;
      const transaction = await db.query.transactions.findFirst({
        where: eq3(transactions.paystackReference, ExternalReference || CheckoutRequestID)
      });
      if (!transaction) {
        console.error(`[PayHero] Transaction not found for ref: ${ExternalReference || CheckoutRequestID}`);
        return res.sendStatus(200);
      }
      if (ResultCode === 0) {
        await storage.updateTransactionStatus(transaction.id, "completed");
        await storage.updateTransactionMetadata(transaction.id, {
          ...transaction.metadata || {},
          status_reason: "M-Pesa payment successful",
          checkoutRequestId: CheckoutRequestID
        });
        if (transaction.type === "card_purchase") {
          const { virtualCardService } = await import("./services/virtual-card");
          await virtualCardService.generateCard(transaction.userId);
          await storage.updateUser(transaction.userId, { hasVirtualCard: true });
          notificationService.sendNotification({
            userId: transaction.userId,
            title: "Virtual Card Activated",
            message: "Your virtual card has been successfully generated and is ready for use.",
            type: "success"
          }).catch((err) => console.error("Notification error:", err));
        }
        if (transaction.type === "deposit") {
          const user = await storage.getUser(transaction.userId);
          if (user) {
            const depositAmount = parseFloat(transaction.amount);
            const depositCurrency = normalizeCurrency(transaction.currency || "USD");
            const depositWallet = await ensureUserWallet(transaction.userId, depositCurrency);
            if (!depositWallet) {
              throw new Error(`${depositCurrency} wallet is not enabled`);
            }
            await pool.query(
              `UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE id = $2`,
              [depositAmount, depositWallet.id]
            );
            notificationService.sendNotification({
              userId: transaction.userId,
              title: "Deposit Successful",
              message: `Your M-Pesa deposit of $${depositAmount.toFixed(2)} has been credited to your wallet.`,
              type: "success"
            }).catch((err) => console.error("Notification error:", err));
            try {
              const { messagingService: depositSms } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
              const { mailtrapService: depositMailtrap } = await Promise.resolve().then(() => (init_mailtrap(), mailtrap_exports));
              if (user.phone) {
                depositSms.sendDepositConfirmation(user.phone, depositAmount.toFixed(2), "USD", "M-Pesa", user.email, user.fullName).catch(() => {
                });
              }
              if (user.email) {
                depositMailtrap.sendTransactionCompleted(
                  user.email,
                  user.firstName || user.fullName?.split(" ")[0] || "User",
                  user.lastName || user.fullName?.split(" ")[1] || "",
                  depositAmount.toFixed(2),
                  "USD",
                  "deposit",
                  transaction.id
                ).catch(() => {
                });
              }
            } catch (_) {
            }
            try {
              const activeBonuses = await db.select().from(depositBonuses).where(eq3(depositBonuses.isActive, true));
              const eligible = activeBonuses.filter((b) => (b.method === "mpesa" || b.method === "any") && depositAmount >= parseFloat(b.minAmount)).map((b) => ({
                bonus: b,
                value: b.bonusType === "percentage" ? depositAmount * parseFloat(b.bonusAmount) / 100 : parseFloat(b.bonusAmount)
              })).filter((e) => e.value > 0).sort((a, b) => b.value - a.value);
              if (eligible.length > 0) {
                const { bonus, value: bonusValue } = eligible[0];
                await pool.query(
                  `UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE id = $2`,
                  [bonusValue, depositWallet.id]
                );
                await storage.createTransaction({
                  userId: transaction.userId,
                  type: "deposit",
                  amount: bonusValue.toFixed(2),
                  currency: depositCurrency,
                  status: "completed",
                  description: `Deposit bonus: ${bonus.description || `+${depositCurrency} ${bonusValue.toFixed(2)} for depositing via M-Pesa`}`,
                  fee: "0.00",
                  metadata: { bonusId: bonus.id, bonusType: "deposit_bonus", triggerMethod: "mpesa" }
                });
                notificationService.sendNotification({
                  userId: transaction.userId,
                  title: "Deposit Bonus Credited!",
                  message: `You received a $${bonusValue.toFixed(2)} bonus for your M-Pesa deposit!`,
                  type: "success"
                }).catch((err) => console.error("Bonus notification error:", err));
              }
            } catch (bonusErr) {
              console.error("[PayHero Bonus Error]:", bonusErr);
            }
          }
        }
      } else {
        await storage.updateTransactionStatus(transaction.id, "failed");
        await storage.updateTransactionMetadata(transaction.id, {
          ...transaction.metadata || {},
          status_reason: ResultDesc || "M-Pesa payment failed or cancelled",
          resultCode: ResultCode
        });
        notificationService.sendNotification({
          userId: transaction.userId,
          title: "Payment Failed",
          message: `Your ${transaction.type === "deposit" ? "deposit" : "card purchase"} payment failed: ${ResultDesc}`,
          type: "error"
        }).catch((err) => console.error("Notification error:", err));
      }
      res.sendStatus(200);
    } catch (error) {
      console.error("[PayHero Callback Error]:", error);
      res.sendStatus(500);
    }
  });
  app2.post("/api/deposit/mpesa", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { amount, phone } = req.body;
      if (!amount || parseFloat(amount) <= 0) return res.status(400).json({ message: "Valid amount required" });
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      const phoneToUse = phone || user.phone;
      if (!phoneToUse) return res.status(400).json({ message: "Phone number required for M-Pesa payment" });
      let exchangeRate = 129;
      try {
        const rateService = await createExchangeRateService();
        exchangeRate = await rateService.getRate("USD", "KES");
      } catch (e) {
        console.warn("[Deposit/Mpesa] Using fallback rate");
      }
      const kesAmount = parseFloat(amount) * exchangeRate;
      const reference = `DEP-${Date.now()}-${userId.slice(-6)}`;
      const callbackUrl = `${req.protocol}://${req.get("host")}/api/payments/payhero/callback`;
      const paymentData = await payHeroService.initiateMpesaPayment(
        Math.round(kesAmount),
        phoneToUse,
        reference,
        user.fullName,
        callbackUrl
      );
      if (!paymentData.success) {
        if (paymentData.status === "INVALID_PHONE_NUMBER" || paymentData.status === "INVALID_PHONE_FORMAT") {
          return res.status(400).json({ message: "Invalid phone number. Use format: 07XXXXXXXX or +2547XXXXXXXX", status: paymentData.status });
        }
        if (paymentData.status === "TIMEOUT") {
          return res.status(504).json({ message: "M-Pesa service is taking too long to respond. Please wait a moment and try again.", status: "TIMEOUT" });
        }
        return res.status(400).json({ message: "Could not initiate M-Pesa payment. Please try again.", status: paymentData.status });
      }
      await storage.createTransaction({
        userId,
        type: "deposit",
        amount: parseFloat(amount).toFixed(2),
        currency: "USD",
        status: "pending",
        description: `M-Pesa deposit via PayHero`,
        fee: "0.00",
        exchangeRate: exchangeRate.toString(),
        paystackReference: paymentData.reference || reference,
        metadata: { paymentMethod: "mpesa", phoneNumber: phoneToUse, kesAmount: kesAmount.toFixed(2), exchangeRate }
      });
      res.json({
        success: true,
        reference: paymentData.reference || reference,
        checkoutRequestId: paymentData.CheckoutRequestID,
        message: "STK Push sent to your phone. Enter your M-Pesa PIN to complete payment."
      });
    } catch (error) {
      console.error("[Deposit/Mpesa Error]:", error);
      res.status(500).json({ message: "Error initiating M-Pesa deposit" });
    }
  });
  app2.get("/api/deposit/mpesa/status/:reference", requireAuth, async (req, res) => {
    try {
      const { reference } = req.params;
      const transaction = await db.query.transactions.findFirst({
        where: eq3(transactions.paystackReference, reference)
      });
      if (!transaction) return res.status(404).json({ message: "Transaction not found" });
      res.json({ status: transaction.status, amount: transaction.amount, description: transaction.description });
    } catch (error) {
      res.status(500).json({ message: "Error checking status" });
    }
  });
  app2.get("/api/deposit/config", requireAuth, async (req, res) => {
    try {
      const keys = [
        "mpesa_enabled",
        "crypto_enabled",
        "bank_transfer_enabled",
        "card_enabled",
        "bank_name",
        "bank_account_name",
        "bank_account_number",
        "bank_swift_code",
        "bank_branch",
        "bank_currency",
        "bank_routing_number",
        "bank_additional_info"
      ];
      const settingsMap = {};
      for (const key of keys) {
        const s = await storage.getSystemSetting("deposit_methods", key);
        if (s) settingsMap[key] = String(s.value);
      }
      const activeBonuses = await db.select().from(depositBonuses).where(eq3(depositBonuses.isActive, true));
      res.json({ methods: settingsMap, bonuses: activeBonuses });
    } catch (error) {
      console.error("[Deposit Config Error]:", error);
      res.status(500).json({ message: "Error loading deposit config" });
    }
  });
  app2.put("/api/users/:id/profile", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.session?.userId;
      console.log("Profile update request:", {
        urlId: id,
        sessionUserId: userId,
        hasSession: !!req.session,
        sessionKeys: Object.keys(req.session || {})
      });
      if (!userId) {
        return res.status(401).json({ message: "Please log in to update your profile" });
      }
      if (userId !== id) {
        return res.status(403).json({ message: "You can only update your own profile" });
      }
      const { fullName, email, phone, country, profilePhotoUrl } = req.body;
      const currentUser = await storage.getUser(id);
      if (currentUser?.kycStatus === "verified") {
        if (profilePhotoUrl === void 0) {
          return res.status(403).json({ message: "Your profile details are locked after KYC verification. Only your profile photo can be updated." });
        }
        const updatedUser2 = await storage.updateUser(id, { profilePhotoUrl });
        if (!updatedUser2) return res.status(404).json({ message: "User not found" });
        req.session.userId = updatedUser2.id;
        const { password: password2, ...userResponse2 } = updatedUser2;
        return res.json({ user: userResponse2, message: "Profile photo updated successfully" });
      }
      if (email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== id) {
          return res.status(400).json({ message: "Email already in use" });
        }
      }
      if (phone) {
        const existingUser = await storage.getUserByPhone(phone);
        if (existingUser && existingUser.id !== id) {
          return res.status(400).json({ message: "Phone number already in use" });
        }
      }
      const updateData = {
        fullName,
        email,
        phone,
        country
      };
      if (profilePhotoUrl !== void 0) {
        updateData.profilePhotoUrl = profilePhotoUrl;
      }
      const updatedUser = await storage.updateUser(id, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      req.session.userId = updatedUser.id;
      const { password, ...userResponse } = updatedUser;
      res.json({ user: userResponse, message: "Profile updated successfully" });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(400).json({ message: "Failed to update profile" });
    }
  });
  app2.put("/api/users/:id/settings", async (req, res) => {
    try {
      const { id } = req.params;
      const settings = req.body;
      const updatedUser = await storage.updateUser(id, settings);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userResponse } = updatedUser;
      res.json({ user: userResponse });
    } catch (error) {
      console.error("Settings update error:", error);
      res.status(400).json({ message: "Failed to update settings" });
    }
  });
  app2.post("/api/users/:id/profile-photo", requireAuth, upload.single("photo"), async (req, res) => {
    try {
      const { id } = req.params;
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No photo file provided" });
      }
      if (!file.mimetype.startsWith("image/")) {
        return res.status(400).json({ message: "File must be an image" });
      }
      const photoUrl = await cloudinaryStorage2.uploadProfilePicture(
        file.buffer,
        file.originalname,
        file.mimetype
      );
      const updatedUser = await storage.updateUser(id, {
        profilePhotoUrl: photoUrl
      });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userResponse } = updatedUser;
      res.json({
        user: userResponse,
        message: "Profile photo uploaded successfully"
      });
    } catch (error) {
      console.error("Profile photo upload error:", error);
      res.status(500).json({ message: "Failed to upload profile photo" });
    }
  });
  app2.post("/api/users/:id/change-password", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new password are required" });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters long" });
      }
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const isPasswordValid = await bcrypt2.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
      const hashedPassword = await bcrypt2.hash(newPassword, 10);
      await storage.updateUser(id, { password: hashedPassword });
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Password change error:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });
  app2.get("/api/kyc/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const kyc = await storage.getKycByUserId(userId);
      res.json({ kyc });
    } catch (error) {
      console.error("KYC fetch error:", error);
      res.status(500).json({ message: "Failed to fetch KYC data" });
    }
  });
  app2.post("/api/auth/setup-2fa", async (req, res) => {
    try {
      const { userId } = req.body;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const secret = speakeasy2.generateSecret({
        name: `GreenPay (${user.email})`,
        issuer: "GreenPay"
      });
      const qrCodeUrl = await QRCode2.toDataURL(secret.otpauth_url);
      await storage.updateUser(userId, { twoFactorSecret: secret.base32 });
      res.json({
        qrCodeUrl,
        secret: secret.base32,
        // Don't send in production
        message: "Scan QR code with your authenticator app"
      });
    } catch (error) {
      console.error("2FA setup error:", error);
      res.status(500).json({ message: "Failed to setup 2FA" });
    }
  });
  app2.post("/api/auth/setup-biometric", async (req, res) => {
    try {
      const { userId } = req.body;
      await storage.updateUser(userId, { biometricEnabled: true });
      res.json({ message: "Biometric authentication enabled" });
    } catch (error) {
      console.error("Biometric setup error:", error);
      res.status(500).json({ message: "Failed to setup biometric authentication" });
    }
  });
  app2.post("/api/notifications/register", async (req, res) => {
    try {
      const { userId, endpoint } = req.body;
      await storage.updateUser(userId, { pushNotificationsEnabled: true });
      res.json({ message: "Push notifications registered" });
    } catch (error) {
      console.error("Notification registration error:", error);
      res.status(500).json({ message: "Failed to register for notifications" });
    }
  });
  app2.post("/api/virtual-card/verify-payment", async (req, res) => {
    try {
      const { reference, userId } = req.body;
      if (!reference || !userId) {
        return res.status(400).json({ message: "Reference and user ID are required" });
      }
      console.log("PayHero payment verification not supported - using callback method");
      return res.status(400).json({
        message: "Payment verification not supported with PayHero. Payments are processed via callbacks.",
        success: false
      });
    } catch (error) {
      console.error("Card payment verification error:", error);
      res.status(500).json({
        message: "Error verifying card payment",
        success: false
      });
    }
  });
  app2.get("/api/payment-callback", async (req, res) => {
    try {
      const { reference, trxref, type } = req.query;
      const actualReference = reference || trxref;
      console.log("Payment callback received:", { reference: actualReference, type });
      if (!actualReference) {
        return res.status(400).json({ message: "Payment reference is required" });
      }
      const verificationResult = await paystackService.verifyPayment(actualReference);
      if (!verificationResult.status) {
        console.error("Callback payment verification failed:", verificationResult.message);
        return res.redirect(`/payment-failed?reference=${actualReference}&error=${encodeURIComponent(verificationResult.message)}`);
      }
      const paymentData = verificationResult.data;
      if (paymentData.status === "success") {
        if (type === "virtual-card") {
          return res.redirect(`/payment-success?reference=${actualReference}&type=virtual-card`);
        } else {
          return res.redirect(`/payment-success?reference=${actualReference}&type=deposit`);
        }
      } else {
        return res.redirect(`/payment-failed?reference=${actualReference}&status=${paymentData.status}`);
      }
    } catch (error) {
      console.error("Payment callback error:", error);
      return res.redirect(`/payment-failed?error=${encodeURIComponent("Payment verification failed")}`);
    }
  });
  app2.post("/api/webhook/paystack", async (req, res) => {
    try {
      const event = req.body;
      console.log("Paystack webhook received:", event.event, event.data?.reference);
      if (event.event === "charge.success") {
        const { reference, status, amount, currency } = event.data;
        console.log("Webhook payment success:", { reference, status, amount, currency });
      } else if (event.event === "charge.failed") {
        const { reference, status } = event.data;
        console.log("Webhook payment failed:", { reference, status });
      }
      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });
  app2.get("/api/payment-callback", async (req, res) => {
    try {
      const { reference, type } = req.query;
      console.log(`Payment callback received: ref=${reference}, type=${type}`);
      if (!reference) {
        return res.status(400).send("Reference missing");
      }
      const verification = await paystackService.verifyPayment(reference);
      if (verification.status && verification.data.status === "success") {
        const transaction = await db.query.transactions.findFirst({
          where: eq3(transactions.paystackReference, reference)
        });
        if (transaction && transaction.status === "pending") {
          await storage.updateTransactionStatus(transaction.id, "completed");
          const user = await storage.getUser(transaction.userId);
          if (user) {
            const depositAmount = parseFloat(transaction.amount);
            const depositCurrency = normalizeCurrency(transaction.currency || "USD");
            const depositWallet = await ensureUserWallet(user.id, depositCurrency);
            if (!depositWallet) throw new Error(`${depositCurrency} wallet is not enabled`);
            const newBalance = (walletAvailableBalance(depositWallet) + depositAmount).toFixed(2);
            await pool.query(
              `UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE id = $2`,
              [depositAmount, depositWallet.id]
            );
            await notificationService.sendNotification({
              userId: user.id,
              title: "Deposit Successful",
              message: `Your deposit of $${depositAmount} has been credited to your wallet.`,
              type: "transaction"
            });
            try {
              const { messagingService: psTxSms } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
              const { mailtrapService: psTxMailtrap } = await Promise.resolve().then(() => (init_mailtrap(), mailtrap_exports));
              if (user.phone) {
                psTxSms.sendTransactionNotification(user.phone, "deposit", depositAmount.toFixed(2), "USD", "completed", transaction.id).catch(() => {
                });
              }
              if (user.email) {
                psTxMailtrap.sendTransactionCompleted(
                  user.email,
                  user.firstName || user.fullName?.split(" ")[0] || "User",
                  user.lastName || user.fullName?.split(" ")[1] || "",
                  depositAmount.toFixed(2),
                  "USD",
                  "deposit",
                  transaction.id
                ).catch(() => {
                });
              }
            } catch (_) {
            }
            console.log(`User ${user.id} credited with $${depositAmount}. New balance: ${newBalance}`);
          }
        }
        return res.redirect("/dashboard?deposit=success");
      } else {
        console.warn(`Payment verification failed for ref=${reference}:`, verification.message);
        return res.redirect("/deposit?error=payment_failed");
      }
    } catch (error) {
      console.error("Payment callback error:", error);
      res.redirect("/deposit?error=server_error");
    }
  });
  app2.post("/api/deposit/initialize-payment", requireAuth, async (req, res) => {
    try {
      const { amount, currency, paymentMethod, billingAddress, billingCity, billingCountry } = req.body;
      const userId = req.session.userId;
      console.log("Deposit payment request - userId:", userId, "amount:", amount, "currency:", currency, "method:", paymentMethod);
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      let finalAmountKes = parseFloat(amount);
      let exchangeRate = 129;
      try {
        const rateService = await createExchangeRateService();
        exchangeRate = await rateService.getRate("USD", "KES");
      } catch (e) {
        console.warn("Using fallback exchange rate for deposit initialization");
      }
      finalAmountKes = parseFloat(amount) * exchangeRate;
      if (!user.email || !user.email.includes("@")) {
        return res.status(400).json({ message: "Valid email required for payment" });
      }
      const reference = paystackService.generateReference();
      const callbackUrl = `${req.protocol}://${req.get("host")}/api/payment-callback?reference=${reference}&type=deposit`;
      const paystackAmount = Math.round(finalAmountKes * 100);
      let channels = ["card", "mobile_money"];
      if (paymentMethod === "card") channels = ["card"];
      if (paymentMethod === "mpesa" || paymentMethod === "airtel") channels = ["mobile_money"];
      const paymentMetadata = { paymentMethod };
      if (billingAddress) paymentMetadata.billing_address = billingAddress;
      if (billingCity) paymentMetadata.billing_city = billingCity;
      if (billingCountry) paymentMetadata.billing_country = billingCountry;
      const paymentData = await paystackService.initializePayment(
        user.email,
        parseFloat(finalAmountKes.toFixed(2)),
        reference,
        "KES",
        user.phone || void 0,
        callbackUrl,
        paymentMetadata
      );
      if (!paymentData.status) {
        return res.status(400).json({ message: paymentData.message });
      }
      await storage.createTransaction({
        userId,
        type: "deposit",
        amount: amount.toString(),
        currency: "USD",
        status: "pending",
        description: `Deposit via ${paymentMethod}`,
        fee: "0.00",
        exchangeRate: exchangeRate.toString(),
        paystackReference: reference,
        metadata: {
          paymentMethod,
          kesAmount: finalAmountKes.toFixed(2),
          exchangeRate
        }
      });
      res.json({
        authorizationUrl: paymentData.data.authorization_url,
        reference
      });
    } catch (error) {
      console.error("Deposit payment initialization error:", error);
      res.status(500).json({ message: "Error initializing deposit payment" });
    }
  });
  app2.post("/api/deposit/verify-payment", async (req, res) => {
    try {
      const { reference } = req.body;
      if (!reference) return res.status(400).json({ message: "Reference required" });
      const verification = await paystackService.verifyPayment(reference);
      if (verification.status && verification.data.status === "success") {
        const transaction = await db.query.transactions.findFirst({
          where: eq3(transactions.paystackReference, reference)
        });
        if (transaction && transaction.status === "pending") {
          await storage.updateTransactionStatus(transaction.id, "completed");
          const user = await storage.getUser(transaction.userId);
          if (user) {
            const depositAmount = parseFloat(transaction.amount);
            const depositCurrency = normalizeCurrency(transaction.currency || "USD");
            const depositWallet = await ensureUserWallet(user.id, depositCurrency);
            if (!depositWallet) throw new Error(`${depositCurrency} wallet is not enabled`);
            const newBalance = (walletAvailableBalance(depositWallet) + depositAmount).toFixed(2);
            await pool.query(
              `UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE id = $2`,
              [depositAmount, depositWallet.id]
            );
            await notificationService.sendNotification({
              userId: user.id,
              title: "Deposit Successful",
              message: `Your deposit of $${depositAmount} has been credited to your wallet.`,
              type: "transaction"
            });
            try {
              const { messagingService: ps2TxSms } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
              const { mailtrapService: ps2TxMailtrap } = await Promise.resolve().then(() => (init_mailtrap(), mailtrap_exports));
              if (user.phone) {
                ps2TxSms.sendTransactionNotification(user.phone, "deposit", depositAmount.toFixed(2), "USD", "completed", transaction.id).catch(() => {
                });
              }
              if (user.email) {
                ps2TxMailtrap.sendTransactionCompleted(
                  user.email,
                  user.firstName || user.fullName?.split(" ")[0] || "User",
                  user.lastName || user.fullName?.split(" ")[1] || "",
                  depositAmount.toFixed(2),
                  "USD",
                  "deposit",
                  transaction.id
                ).catch(() => {
                });
              }
            } catch (_) {
            }
          }
        }
        return res.json({ status: "success", message: "Payment verified and credited" });
      }
      res.status(400).json({ status: "failed", message: verification.data?.gateway_response || "Payment not successful" });
    } catch (error) {
      console.error("Verify payment error:", error);
      res.status(500).json({ message: "Error verifying payment" });
    }
  });
  app2.post("/api/airtime/purchase", requireAuth, async (req, res) => {
    try {
      const sessionUserId = req.session?.userId;
      const { phoneNumber, amount, currency, provider, pin } = req.body;
      if (!sessionUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const userId = sessionUserId;
      console.log(`\u{1F4F1} Airtime purchase request - User: ${userId}, Phone: ${phoneNumber}, Amount: ${amount} ${currency}, Provider: ${provider}`);
      if (!phoneNumber || !amount || !currency || !provider) {
        console.warn(`\u26A0\uFE0F Missing required fields in airtime purchase request`);
        return res.status(400).json({ message: "Missing required fields" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        console.error(`\u274C User not found: ${userId}`);
        return res.status(404).json({ message: "User not found" });
      }
      const airtimeCurrency = normalizeCurrency(currency);
      if (airtimeCurrency !== "KES") {
        return res.status(400).json({ message: "Airtime is currently payable from the KES wallet only." });
      }
      const wallet = await getUserWallet(userId, airtimeCurrency);
      if (!wallet || !wallet.isActive || wallet.isSuspended) {
        return res.status(400).json({ message: "Your KES wallet is not available for airtime purchases." });
      }
      console.log(`\u{1F464} User ${user.fullName} (${user.email}) - KES wallet balance: ${wallet.balance}`);
      const settings = await storage.getSystemSettings();
      const pinRequired = settings.some((s) => s.key === "pin_required" && s.value === "true");
      if (pinRequired && user.pinEnabled) {
        if (!pin) {
          return res.status(400).json({ message: "PIN required", requiresPin: true });
        }
        const isPinValid = await bcrypt2.compare(pin, user.pinCode || "");
        if (!isPinValid) {
          return res.status(401).json({ message: "Invalid PIN", success: false });
        }
      }
      const purchaseAmount = parseFloat(amount);
      const kesBalance = walletAvailableBalance(wallet);
      if (kesBalance < purchaseAmount) {
        console.warn(`\u26A0\uFE0F Insufficient balance - Required: ${purchaseAmount}, Available: ${kesBalance}`);
        return res.status(400).json({
          message: "Insufficient KES balance. Please convert USD to KES using the Exchange feature."
        });
      }
      const debitResult = await pool.query(
        `UPDATE wallets
         SET balance = balance - $1, updated_at = NOW()
         WHERE id = $2 AND user_id = $3
           AND is_active = true AND is_suspended = false
           AND balance - hold_amount - withdrawal_hold_amount >= $1`,
        [purchaseAmount, wallet.id, userId]
      );
      if (debitResult.rowCount !== 1) {
        return res.status(400).json({ message: "Insufficient KES balance" });
      }
      console.log(`\u{1F4DE} Calling Statum API for airtime purchase...`);
      let statumResponse;
      try {
        statumResponse = await statumService.purchaseAirtime(phoneNumber, purchaseAmount);
      } catch (providerError) {
        await pool.query(`UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE id = $2`, [purchaseAmount, wallet.id]);
        throw providerError;
      }
      console.log(`\u2705 Statum API response:`, statumResponse);
      const transaction = await storage.createTransaction({
        userId,
        type: "airtime",
        amount: amount.toString(),
        currency: "KES",
        status: "completed",
        fee: "0.00",
        description: `Airtime purchase for ${phoneNumber} (${provider})`,
        reference: statumResponse.transaction_id || void 0,
        recipientDetails: {
          phoneNumber,
          provider
        },
        metadata: {
          statumResponse
        }
      });
      console.log(`\u{1F4BE} Transaction created: ${transaction.id}`);
      const newKesBalance = kesBalance - purchaseAmount;
      console.log(`\u2705 Updated user balance: ${kesBalance} -> ${newKesBalance}`);
      console.log(`\u{1F389} Airtime purchase completed successfully`);
      res.json({
        success: true,
        message: "Airtime purchased successfully",
        transaction,
        statumResponse
      });
    } catch (error) {
      console.error("\u274C Airtime purchase error:", error);
      const errorMessage = error instanceof Error ? error.message : "Error purchasing airtime";
      res.status(500).json({ message: errorMessage });
    }
  });
  app2.post("/api/airtime/claim-bonus", requireAuth, async (req, res) => {
    try {
      const sessionUserId = req.session?.userId;
      if (!sessionUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const userId = sessionUserId;
      console.log(`\u{1F381} Airtime bonus claim request - User: ${userId}`);
      const user = await storage.getUser(userId);
      if (!user) {
        console.error(`\u274C User not found: ${userId}`);
        return res.status(404).json({ message: "User not found" });
      }
      console.log(`\u{1F464} User ${user.fullName} - Already claimed: ${user.hasClaimedAirtimeBonus}`);
      if (user.hasClaimedAirtimeBonus) {
        console.warn(`\u26A0\uFE0F User ${userId} has already claimed airtime bonus`);
        return res.status(400).json({ message: "You have already claimed your airtime bonus" });
      }
      const bonusAmountSetting = await storage.getSystemSetting("general", "airtime_bonus_amount");
      const bonusEnabledSetting = await storage.getSystemSetting("general", "enable_airtime_bonus");
      const requireKycSetting = await storage.getSystemSetting("general", "airtime_bonus_require_kyc");
      const requireEmailSetting = await storage.getSystemSetting("general", "airtime_bonus_require_email");
      const bonusAmount = parseFloat(String(bonusAmountSetting?.value || "10"));
      const isEnabled = String(bonusEnabledSetting?.value) === "true";
      const requireKyc = String(requireKycSetting?.value || "none");
      const requireEmail = String(requireEmailSetting?.value) === "true";
      if (!isEnabled) {
        return res.status(400).json({ message: "Bonus claiming is currently disabled" });
      }
      if (requireKyc === "basic" && user.kycStatus !== "verified") {
        return res.status(400).json({ message: "Basic KYC verification is required to claim this bonus" });
      }
      if (requireKyc === "advanced" && user.advancedKycStatus !== "verified") {
        return res.status(400).json({ message: "Advanced KYC verification is required to claim this bonus" });
      }
      if (requireEmail && !user.isEmailVerified) {
        return res.status(400).json({ message: "Email verification is required to claim this bonus" });
      }
      const wallet = await ensureUserWallet(userId, "KES");
      if (!wallet) {
        return res.status(400).json({ message: "KES wallet is not enabled. Please contact support." });
      }
      const claimResult = await pool.query(
        `UPDATE users
         SET has_claimed_airtime_bonus = true, updated_at = NOW()
         WHERE id = $1 AND has_claimed_airtime_bonus IS NOT TRUE
         RETURNING id`,
        [userId]
      );
      if (claimResult.rowCount !== 1) {
        return res.status(400).json({ message: "You have already claimed your airtime bonus" });
      }
      const currentKesBalance = walletAvailableBalance(wallet);
      const newKesBalance = currentKesBalance + bonusAmount;
      await pool.query(
        `UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE id = $2`,
        [bonusAmount, wallet.id]
      );
      console.log(`\u{1F4B0} Bonus credited: ${currentKesBalance} -> ${newKesBalance} KES`);
      const transaction = await storage.createTransaction({
        userId,
        type: "deposit",
        amount: bonusAmount.toString(),
        currency: "KES",
        status: "completed",
        fee: "0.00",
        description: `Welcome Airtime Bonus - KES ${bonusAmount}`
      });
      console.log(`\u{1F4BE} Bonus transaction created: ${transaction.id}`);
      console.log(`\u2705 Airtime bonus claimed successfully`);
      res.json({
        success: true,
        message: `Airtime bonus claimed successfully! KES ${bonusAmount} has been added to your balance.`,
        newBalance: newKesBalance.toFixed(2),
        bonusAmount,
        transaction
      });
    } catch (error) {
      console.error("\u274C Claim bonus error:", error);
      res.status(500).json({ message: "Error claiming airtime bonus" });
    }
  });
  app2.post("/api/bills/pay", requireAuth, async (req, res) => {
    try {
      const sessionUserId = req.session?.userId;
      const { provider, meterNumber, accountNumber, amount } = req.body;
      if (!sessionUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const userId = sessionUserId;
      console.log(`\u{1F4B3} Bill payment request - User: ${userId}, Provider: ${provider}, Amount: ${amount} KES`);
      if (!provider || !amount || !meterNumber && !accountNumber) {
        console.warn(`\u26A0\uFE0F Missing required fields in bill payment request`);
        return res.status(400).json({ message: "Missing required fields" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        console.error(`\u274C User not found: ${userId}`);
        return res.status(404).json({ message: "User not found" });
      }
      const kesWallet = await getUserWallet(userId, "KES");
      if (!kesWallet) {
        return res.status(400).json({ message: "KES wallet not found" });
      }
      const kesBalance = walletAvailableBalance(kesWallet);
      const paymentAmount = parseFloat(amount);
      if (kesBalance < paymentAmount) {
        console.warn(`\u26A0\uFE0F Insufficient balance - Required: ${paymentAmount}, Available: ${kesBalance}`);
        return res.status(400).json({
          message: "Insufficient KES balance. Please convert USD to KES using the Exchange feature."
        });
      }
      const billPayment = await storage.createBillPayment({
        userId,
        provider,
        meterNumber: meterNumber || null,
        accountNumber: accountNumber || null,
        amount: amount.toString(),
        currency: "KES",
        status: "pending",
        fee: "0.00",
        description: `Bill payment for ${provider}${meterNumber ? ` (${meterNumber})` : accountNumber ? ` (${accountNumber})` : ""}`,
        reference: `BP-${Date.now()}`,
        metadata: { meterNumber, accountNumber, provider }
      });
      console.log(`\u{1F4BE} Bill payment created (PENDING): ${billPayment.id}`);
      await storage.createTransaction({
        userId,
        type: "bill_payment",
        amount: amount.toString(),
        currency: "KES",
        status: "pending",
        fee: "0.00",
        description: `Bill payment - ${provider}`,
        reference: billPayment.reference,
        metadata: { billPaymentId: billPayment.id, provider }
      });
      const billDebit = await pool.query(
        `UPDATE wallets
         SET balance = balance - $1, updated_at = NOW()
         WHERE id = $2 AND user_id = $3
           AND balance - hold_amount - withdrawal_hold_amount >= $1`,
        [paymentAmount, kesWallet.id, userId]
      );
      if (billDebit.rowCount !== 1) {
        return res.status(400).json({ message: "Insufficient KES balance" });
      }
      console.log(`\u23F3 Bill payment pending verification with provider`);
      res.json({
        success: true,
        message: "Bill payment submitted for verification. You will receive confirmation shortly.",
        billPayment,
        status: "pending"
      });
    } catch (error) {
      console.error("\u274C Bill payment error:", error);
      const errorMessage = error instanceof Error ? error.message : "Error processing bill payment";
      res.status(500).json({ message: errorMessage });
    }
  });
  app2.get("/api/bills/history/:userId", requireAuth, async (req, res) => {
    try {
      const sessionUserId = req.session?.userId;
      const requestedUserId = req.params.userId;
      if (sessionUserId !== requestedUserId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const payments = await storage.getBillPaymentsByUserId(requestedUserId);
      res.json({ payments });
    } catch (error) {
      console.error("Error fetching bill payments:", error);
      res.status(500).json({ message: "Error fetching bill payments" });
    }
  });
  app2.get("/api/virtual-card/:userId", requireAuth, async (req, res) => {
    try {
      const sessionUserId = req.session?.userId;
      const requestedUserId = req.params.userId;
      if (sessionUserId !== requestedUserId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const cards = await storage.getVirtualCardsByUserId(requestedUserId);
      const card = cards.find((c) => c.status === "active") || cards[0] || null;
      res.json({ card, cards });
    } catch (error) {
      res.status(500).json({ message: "Error fetching virtual card" });
    }
  });
  app2.post("/api/virtual-card/:cardId/freeze", requireAuth, async (req, res) => {
    try {
      const sessionUserId = req.session?.userId;
      const { cardId } = req.params;
      const card = await storage.getVirtualCardById(cardId);
      if (!card) return res.status(404).json({ message: "Card not found" });
      if (card.userId !== sessionUserId) return res.status(403).json({ message: "Access denied" });
      if (card.status !== "active") return res.status(400).json({ message: "Only active cards can be frozen" });
      const updated = await storage.updateVirtualCard(cardId, { status: "frozen", freezeReason: "Frozen by cardholder" });
      res.json({ card: updated, message: "Card frozen successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error freezing card" });
    }
  });
  app2.post("/api/virtual-card/:cardId/unfreeze", requireAuth, async (req, res) => {
    try {
      const sessionUserId = req.session?.userId;
      const { cardId } = req.params;
      const card = await storage.getVirtualCardById(cardId);
      if (!card) return res.status(404).json({ message: "Card not found" });
      if (card.userId !== sessionUserId) return res.status(403).json({ message: "Access denied" });
      if (card.status !== "frozen") return res.status(400).json({ message: "Card is not frozen" });
      if (card.freezeReason && card.freezeReason !== "Frozen by cardholder") {
        return res.status(403).json({ message: "This card was frozen by an admin and cannot be unfrozen by you" });
      }
      const updated = await storage.updateVirtualCard(cardId, { status: "active", freezeReason: null });
      res.json({ card: updated, message: "Card unfrozen successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error unfreezing card" });
    }
  });
  app2.post("/api/virtual-card/transfer", requireAuth, async (req, res) => {
    try {
      const sessionUserId = req.session?.userId;
      const { cardId, direction, amount } = req.body;
      if (!cardId || !direction || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "Invalid transfer parameters" });
      }
      const transferAmount = parseFloat(amount);
      const card = await storage.getVirtualCardById(cardId);
      if (!card) return res.status(404).json({ message: "Card not found" });
      if (card.userId !== sessionUserId) return res.status(403).json({ message: "Access denied" });
      if (card.status !== "active") return res.status(400).json({ message: "Card must be active to transfer funds" });
      const user = await storage.getUser(sessionUserId);
      if (!user) return res.status(404).json({ message: "User not found" });
      const wallet = await getUserWallet(sessionUserId, "USD");
      if (!wallet) return res.status(400).json({ message: "USD wallet not found" });
      const walletBalance = walletAvailableBalance(wallet);
      const cardBalance = parseFloat(card.balance || "0");
      if (direction === "wallet_to_card") {
        const debitResult = await pool.query(
          `UPDATE wallets
           SET balance = balance - $1, updated_at = NOW()
           WHERE id = $2 AND user_id = $3
             AND balance - hold_amount - withdrawal_hold_amount >= $1`,
          [transferAmount, wallet.id, sessionUserId]
        );
        if (debitResult.rowCount !== 1) {
          return res.status(400).json({ message: "Insufficient wallet balance" });
        }
        const newWalletBalance = (walletBalance - transferAmount).toFixed(2);
        const newCardBalance = (cardBalance + transferAmount).toFixed(2);
        await storage.updateVirtualCard(cardId, { balance: newCardBalance });
        await storage.createTransaction({
          userId: sessionUserId,
          type: "card_transfer",
          amount: amount.toString(),
          currency: "USD",
          status: "completed",
          description: `Wallet to card transfer`,
          completedAt: /* @__PURE__ */ new Date(),
          metadata: { direction: "wallet_to_card", cardId }
        });
        res.json({ message: "Funds transferred to card", walletBalance: newWalletBalance, cardBalance: newCardBalance });
      } else if (direction === "card_to_wallet") {
        if (cardBalance < transferAmount) {
          return res.status(400).json({ message: "Insufficient card balance" });
        }
        const newCardBalance = (cardBalance - transferAmount).toFixed(2);
        const newWalletBalance = (walletBalance + transferAmount).toFixed(2);
        await pool.query(
          `UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE id = $2`,
          [transferAmount, wallet.id]
        );
        await storage.updateVirtualCard(cardId, { balance: newCardBalance });
        await storage.createTransaction({
          userId: sessionUserId,
          type: "card_transfer",
          amount: amount.toString(),
          currency: "USD",
          status: "completed",
          description: `Card to wallet transfer`,
          completedAt: /* @__PURE__ */ new Date(),
          metadata: { direction: "card_to_wallet", cardId }
        });
        res.json({ message: "Funds transferred to wallet", walletBalance: newWalletBalance, cardBalance: newCardBalance });
      } else {
        res.status(400).json({ message: "Invalid direction. Use 'wallet_to_card' or 'card_to_wallet'" });
      }
    } catch (error) {
      console.error("Card transfer error:", error);
      res.status(500).json({ message: "Error processing transfer" });
    }
  });
  const exchangeRateService2 = createExchangeRateService(storage);
  app2.get("/api/exchange-rates/:from/:to", optionalApiKey, async (req, res) => {
    try {
      const { from, to } = req.params;
      const rate = await exchangeRateService2.getExchangeRate(from.toUpperCase(), to.toUpperCase());
      res.json({
        from: from.toUpperCase(),
        to: to.toUpperCase(),
        rate,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      console.error("Exchange rate error:", error);
      res.status(500).json({ message: "Error fetching exchange rate" });
    }
  });
  app2.get("/api/exchange-rates/:base", optionalApiKey, async (req, res) => {
    try {
      const { base } = req.params;
      const ALL_CURRENCIES = ["KES", "EUR", "GBP", "NGN", "GHS", "TZS", "UGX", "ZAR", "CAD", "AUD", "JPY", "CNY", "INR", "AED", "SAR", "USD"];
      const targets = ALL_CURRENCIES.filter((c) => c !== base.toUpperCase());
      const rates = await exchangeRateService2.getMultipleRates(base.toUpperCase(), targets);
      res.json({
        base: base.toUpperCase(),
        rates,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      console.error("Multiple exchange rates error:", error);
      res.status(500).json({ message: "Error fetching exchange rates" });
    }
  });
  app2.post("/api/transactions/send", requireAuth, async (req, res) => {
    try {
      const sessionUserId = req.session?.userId;
      const { amount, currency, recipientDetails, targetCurrency } = req.body;
      if (!sessionUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const userId = sessionUserId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (!user?.hasVirtualCard) {
        return res.status(400).json({ message: "Virtual card required for transactions" });
      }
      const exchangeRate = await exchangeRateService2.getExchangeRate(currency, targetCurrency);
      const convertedAmount = (parseFloat(amount) * exchangeRate).toFixed(2);
      const fee = (parseFloat(amount) * 0.02).toFixed(2);
      const transaction = await storage.createTransaction({
        userId,
        type: "send",
        amount,
        currency,
        recipientDetails,
        status: "processing",
        fee,
        exchangeRate: exchangeRate.toString(),
        description: `Sent to ${recipientDetails.name}`,
        metadata: {
          convertedAmount,
          targetCurrency,
          processingStarted: (/* @__PURE__ */ new Date()).toISOString()
        }
      });
      setTimeout(async () => {
        try {
          await storage.updateTransaction(transaction.id, {
            status: "completed",
            completedAt: /* @__PURE__ */ new Date()
          });
          await notificationService.sendTransactionNotification(userId, {
            ...transaction,
            status: "completed"
          });
          const { messagingService: messagingService3 } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
          const { mailtrapService: sendMailtrap } = await Promise.resolve().then(() => (init_mailtrap(), mailtrap_exports));
          messagingService3.sendTransactionNotification(user.phone, "send", amount, currency, "completed", transaction.id).catch((err) => console.error("Transaction notification error:", err));
          if (user.email) {
            sendMailtrap.sendTransactionCompleted(
              user.email,
              user.firstName || user.fullName?.split(" ")[0] || "User",
              user.lastName || user.fullName?.split(" ")[1] || "",
              amount,
              currency,
              "send",
              transaction.id
            ).catch((err) => console.error("Transaction completed email error:", err));
          }
        } catch (error) {
          console.error("Transaction completion error:", error);
        }
      }, 5e3);
      res.json({
        transaction,
        convertedAmount,
        exchangeRate,
        message: "Transaction initiated successfully"
      });
    } catch (error) {
      console.error("Send transaction error:", error);
      res.status(400).json({ message: "Transaction failed" });
    }
  });
  app2.post("/api/transactions/receive", requireAuth, async (req, res) => {
    try {
      const sessionUserId = req.session?.userId;
      if (!sessionUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const { amount, currency, senderDetails } = req.body;
      const userId = sessionUserId;
      const transaction = await storage.createTransaction({
        userId,
        type: "receive",
        amount,
        currency,
        recipientDetails: senderDetails,
        status: "completed",
        fee: "0.00",
        description: `Received from ${senderDetails.name}`
      });
      const user = await storage.getUser(userId);
      const receiveCurrency = normalizeCurrency(currency);
      const receiveWallet = await ensureUserWallet(userId, receiveCurrency);
      if (!receiveWallet) return res.status(400).json({ message: `${receiveCurrency} wallet is not enabled` });
      const newBalance = (walletAvailableBalance(receiveWallet) + parseFloat(amount)).toFixed(2);
      await pool.query(
        `UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE id = $2`,
        [parseFloat(amount), receiveWallet.id]
      );
      await notificationService.sendTransactionNotification(userId, transaction);
      if (user) {
        const { messagingService: messagingService3 } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
        const { mailtrapService: mailtrapService3 } = await Promise.resolve().then(() => (init_mailtrap(), mailtrap_exports));
        messagingService3.sendFundReceipt(user.phone, amount, currency, senderDetails.name).catch((err) => console.error("Fund receipt notification error:", err));
        if (user.email) {
          mailtrapService3.sendFundReceipt(user.email, user.fullName?.split(" ")[0] || "User", user.fullName?.split(" ")[1] || "", amount, currency, senderDetails.name).catch((err) => console.error("Fund receipt email error:", err));
        }
      }
      res.json({ transaction, message: "Payment received successfully" });
    } catch (error) {
      console.error("Receive transaction error:", error);
      res.status(400).json({ message: "Transaction failed" });
    }
  });
  app2.get("/api/transactions/:userId", requireAuth, async (req, res) => {
    try {
      const sessionUserId = req.session?.userId;
      const requestedUserId = req.params.userId;
      if (sessionUserId !== requestedUserId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const transactions2 = await storage.getTransactionsByUserId(requestedUserId);
      res.json({ transactions: transactions2 });
    } catch (error) {
      res.status(500).json({ message: "Error fetching transactions" });
    }
  });
  app2.get("/api/transactions/status/:transactionId", requireAuth, async (req, res) => {
    try {
      const sessionUserId = req.session?.userId;
      if (!sessionUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const transaction = await storage.getTransaction(req.params.transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      if (transaction.userId !== sessionUserId) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json({ transaction });
    } catch (error) {
      res.status(500).json({ message: "Error fetching transaction status" });
    }
  });
  app2.post("/api/transactions/export-email", requireAuth, async (req, res) => {
    try {
      const { transactions: transactions2 } = req.body;
      const userId = req.session.userId;
      if (!transactions2 || !Array.isArray(transactions2)) {
        return res.status(400).json({ message: "Transactions array required" });
      }
      if (transactions2.length === 0) {
        return res.status(400).json({ message: "No transactions to export" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      let totalSent = 0;
      let totalReceived = 0;
      let transactionCount = transactions2.length;
      transactions2.forEach((txn) => {
        const amount = parseFloat(txn.amount);
        if (txn.type === "send" || txn.type === "withdraw") {
          totalSent += amount;
        } else if (txn.type === "receive" || txn.type === "deposit") {
          totalReceived += amount;
        }
      });
      const { generateTransactionPDF: generateTransactionPDF2 } = await Promise.resolve().then(() => (init_pdf_export(), pdf_export_exports));
      const pdfBuffer = await generateTransactionPDF2(transactions2, {
        fullName: user.fullName,
        email: user.email,
        phone: user.phone
      });
      const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");
      const generatedOn = (/* @__PURE__ */ new Date()).toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
      const templateVariables = {
        user_name: user.fullName || user.email,
        total_transactions: transactionCount.toString(),
        total_sent: totalSent.toFixed(2),
        total_received: totalReceived.toFixed(2),
        generated_on: generatedOn,
        account_email: user.email
      };
      const attachments = [
        {
          filename: `transactions-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.pdf`,
          content: pdfBase64,
          disposition: "attachment"
        }
      ];
      const { MailtrapService: MailtrapService2 } = await Promise.resolve().then(() => (init_mailtrap(), mailtrap_exports));
      const mailtrapService3 = new MailtrapService2();
      const success = await mailtrapService3.sendTemplate(
        user.email,
        "307e5609-66bb-4235-8653-27f0d5d74a39",
        templateVariables,
        attachments
      );
      if (success) {
        console.log(`\u2705 Transaction export email sent to ${user.email} - ${transactionCount} transactions with PDF`);
        res.json({
          success: true,
          message: "Transaction report sent successfully to your email",
          summary: {
            transactionCount,
            totalSent,
            totalReceived
          }
        });
      } else {
        res.status(500).json({ message: "Failed to send export email" });
      }
    } catch (error) {
      console.error("Transaction export error:", error);
      res.status(500).json({ message: "Error exporting transactions to email" });
    }
  });
  app2.post("/api/auth/2fa/setup", async (req, res) => {
    try {
      const { userId } = req.body;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { secret, qrCodeUrl, backupCodes } = twoFactorService.generateSecret(user.email);
      await storage.updateUser(userId, {
        twoFactorSecret: secret,
        twoFactorBackupCodes: JSON.stringify(backupCodes)
      });
      res.json({ qrCodeUrl, backupCodes, secret });
    } catch (error) {
      console.error("2FA setup error:", error);
      res.status(500).json({ message: "Error setting up 2FA" });
    }
  });
  app2.post("/api/auth/2fa/verify", async (req, res) => {
    try {
      const { userId, token } = req.body;
      const user = await storage.getUser(userId);
      if (!user?.twoFactorSecret) {
        return res.status(400).json({ message: "2FA not set up" });
      }
      const isValid = twoFactorService.verifyToken(user.twoFactorSecret, token);
      if (isValid) {
        await storage.updateUser(userId, {
          twoFactorEnabled: true,
          twoFactorBackupCodes: user.twoFactorBackupCodes || JSON.stringify([])
        });
        res.json({ success: true, message: "2FA enabled successfully" });
      } else {
        res.status(400).json({ message: "Invalid 2FA token" });
      }
    } catch (error) {
      console.error("2FA verification error:", error);
      res.status(500).json({ message: "Error verifying 2FA" });
    }
  });
  app2.post("/api/users/:userId/disable-2fa", requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const { password } = req.body;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (password) {
        const isPasswordValid = await bcrypt2.compare(password, user.passwordHash || "");
        if (!isPasswordValid) {
          return res.status(401).json({ message: "Invalid password" });
        }
      }
      await storage.updateUser(userId, {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null
      });
      const updatedUser = await storage.getUser(userId);
      res.json({ success: true, message: "2FA disabled", user: updatedUser });
    } catch (error) {
      console.error("Disable 2FA error:", error);
      res.status(500).json({ message: "Error disabling 2FA" });
    }
  });
  app2.post("/api/auth/biometric/setup", async (req, res) => {
    try {
      const { userId, credentialId } = req.body;
      if (!credentialId) {
        return res.status(400).json({ message: "Invalid credential" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      await storage.updateUser(userId, {
        biometricEnabled: true,
        biometricCredentialId: JSON.stringify({ credentialId })
      });
      const updatedUser = await storage.getUser(userId);
      const { password: _, ...userResponse } = updatedUser || {};
      res.json({ success: true, message: "Biometric authentication enabled", user: userResponse });
    } catch (error) {
      console.error("Biometric setup error:", error);
      res.status(500).json({ message: "Error setting up biometric authentication" });
    }
  });
  app2.post("/api/auth/biometric/verify", async (req, res) => {
    try {
      const { userId, credentialId } = req.body;
      const user = await storage.getUser(userId);
      if (!user || !user.biometricEnabled) {
        return res.status(400).json({ message: "Biometric not enabled" });
      }
      const storedCred = user.biometricCredentialId ? JSON.parse(user.biometricCredentialId) : null;
      if (storedCred && storedCred.credentialId === credentialId) {
        res.json({ success: true, verified: true });
      } else {
        res.status(401).json({ success: false, verified: false });
      }
    } catch (error) {
      console.error("Biometric verification error:", error);
      res.status(500).json({ message: "Error verifying biometric" });
    }
  });
  app2.post("/api/users/:userId/disable-biometric", async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      await storage.updateUser(userId, {
        biometricEnabled: false,
        biometricCredentialId: null
      });
      const updatedUser = await storage.getUser(userId);
      const { password, ...userResponse } = updatedUser || {};
      res.json({ success: true, message: "Biometric disabled", user: userResponse });
    } catch (error) {
      console.error("Disable biometric error:", error);
      res.status(500).json({ message: "Error disabling biometric" });
    }
  });
  app2.post("/api/auth/biometric/login", async (req, res) => {
    try {
      const { credentialId } = req.body;
      if (!credentialId) {
        return res.status(400).json({ message: "Invalid credential" });
      }
      console.log(`[Biometric Login] Attempting login with credentialId: ${credentialId}`);
      const allUsers = await storage.getAllUsers();
      const users2 = Array.isArray(allUsers) ? allUsers : [];
      const user = users2.find((u) => {
        if (!u.biometricEnabled || !u.biometricCredentialId) return false;
        try {
          const stored = typeof u.biometricCredentialId === "string" ? JSON.parse(u.biometricCredentialId) : u.biometricCredentialId;
          return stored && (stored.credentialId === credentialId || u.biometricCredentialId.includes(credentialId));
        } catch (e) {
          console.error(`[Biometric Login] Error parsing credential for user ${u.id}:`, e);
          return typeof u.biometricCredentialId === "string" && u.biometricCredentialId.includes(credentialId);
        }
      });
      if (!user) {
        console.warn(`[Biometric Login] No user found for credentialId: ${credentialId}`);
        return res.status(401).json({
          message: "No passkey found for this device in our records. Please ensure you have enabled biometric login in Settings while logged in."
        });
      }
      console.log(`[Biometric Login] Success for user: ${user.email}`);
      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regeneration error:", err);
          return res.status(500).json({ message: "Session error" });
        }
        req.session.userId = user.id;
        req.session.user = { id: user.id, email: user.email };
        storage.createLoginHistory({
          userId: user.id,
          ipAddress: req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "Unknown",
          userAgent: req.headers["user-agent"] || "Unknown",
          deviceType: req.headers["user-agent"]?.includes("Mobile") ? "mobile" : "desktop",
          browser: req.headers["user-agent"]?.split("/")[0] || "Unknown",
          location: req.headers["cf-ipcountry"] || "Unknown",
          status: "success"
        }).catch((err2) => console.error("Login history error:", err2));
        const { password: _, ...userResponse } = user;
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ message: "Session save error" });
          }
          res.json({ success: true, user: userResponse });
        });
      });
    } catch (error) {
      console.error("Biometric login error:", error);
      res.status(500).json({ message: "Error during biometric login" });
    }
  });
  async function verifyBiometricForActivity(req, res, next) {
    try {
      const userId = req.user?.id || req.body?.userId;
      if (!userId) return next();
      const user = await storage.getUser(userId);
      if (!user || !user.biometricEnabled) return next();
      if (req.headers["x-require-biometric"] === "true") {
        const { biometricVerified } = req.body;
        if (!biometricVerified) {
          return res.status(401).json({ message: "Biometric verification required" });
        }
      }
      next();
    } catch (error) {
      next();
    }
  }
  app2.use(verifyBiometricForActivity);
  app2.post("/api/notifications/register", async (req, res) => {
    try {
      const { userId, token } = req.body;
      const success = await notificationService.registerPushToken(userId, token);
      if (success) {
        res.json({ success: true, message: "Push notifications registered" });
      } else {
        res.status(400).json({ message: "Failed to register push notifications" });
      }
    } catch (error) {
      console.error("Push notification registration error:", error);
      res.status(500).json({ message: "Error registering push notifications" });
    }
  });
  app2.post("/api/recipients", requireAuth, async (req, res) => {
    try {
      const sessionUserId = req.session?.userId;
      if (!sessionUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const recipientData = insertRecipientSchema.parse({
        ...req.body,
        userId: sessionUserId
      });
      const recipient = await storage.createRecipient(recipientData);
      res.json({ recipient, message: "Recipient added successfully" });
    } catch (error) {
      console.error("Create recipient error:", error);
      res.status(400).json({ message: "Invalid recipient data" });
    }
  });
  app2.get("/api/recipients/:userId", requireAuth, async (req, res) => {
    try {
      const sessionUserId = req.session?.userId;
      const requestedUserId = req.params.userId;
      if (sessionUserId !== requestedUserId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const recipients2 = await storage.getRecipientsByUserId(requestedUserId);
      res.json({ recipients: recipients2 });
    } catch (error) {
      res.status(500).json({ message: "Error fetching recipients" });
    }
  });
  app2.put("/api/recipients/:id", requireAuth, async (req, res) => {
    try {
      const sessionUserId = req.session?.userId;
      if (!sessionUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const recipientData = await storage.getRecipient(req.params.id);
      if (!recipientData || recipientData.userId !== sessionUserId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const recipient = await storage.updateRecipient(req.params.id, req.body);
      if (recipient) {
        res.json({ recipient, message: "Recipient updated successfully" });
      } else {
        res.status(404).json({ message: "Recipient not found" });
      }
    } catch (error) {
      console.error("Update recipient error:", error);
      res.status(500).json({ message: "Error updating recipient" });
    }
  });
  app2.delete("/api/recipients/:id", requireAuth, async (req, res) => {
    try {
      const sessionUserId = req.session?.userId;
      if (!sessionUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const recipientData = await storage.getRecipient(req.params.id);
      if (!recipientData || recipientData.userId !== sessionUserId) {
        return res.status(403).json({ message: "Access denied" });
      }
      await storage.deleteRecipient(req.params.id);
      res.json({ message: "Recipient deleted successfully" });
    } catch (error) {
      console.error("Delete recipient error:", error);
      res.status(500).json({ message: "Error deleting recipient" });
    }
  });
  app2.put("/api/users/:userId/settings", async (req, res) => {
    try {
      const { userId } = req.params;
      const { defaultCurrency, pushNotificationsEnabled, twoFactorEnabled, biometricEnabled, darkMode, ...settings } = req.body;
      const updateData = { ...settings };
      if (defaultCurrency) updateData.defaultCurrency = defaultCurrency;
      if (pushNotificationsEnabled !== void 0) updateData.pushNotificationsEnabled = pushNotificationsEnabled;
      if (twoFactorEnabled !== void 0) updateData.twoFactorEnabled = twoFactorEnabled;
      if (biometricEnabled !== void 0) updateData.biometricEnabled = biometricEnabled;
      if (darkMode !== void 0) updateData.darkMode = darkMode;
      const user = await storage.updateUser(userId, updateData);
      if (defaultCurrency && user) {
        try {
          const userWallets = await db.select().from(wallets).where(eq3(wallets.userId, userId));
          const matchingWallet = userWallets.find((w) => w.currency === defaultCurrency);
          if (matchingWallet) {
            await db.update(wallets).set({ isDefault: false }).where(eq3(wallets.userId, userId));
            await db.update(wallets).set({ isDefault: true, updatedAt: /* @__PURE__ */ new Date() }).where(eq3(wallets.id, matchingWallet.id));
          } else {
            const enabledSetting = await pool.query(`SELECT value FROM system_settings WHERE key = 'enabled_currencies' LIMIT 1`);
            const enabled = (enabledSetting.rows[0]?.value?.replace(/['"]/g, "") || "USD,KES").split(",");
            if (enabled.includes(defaultCurrency)) {
              await db.update(wallets).set({ isDefault: false }).where(eq3(wallets.userId, userId));
              await db.insert(wallets).values({ userId, currency: defaultCurrency, isDefault: true, isActive: true });
            }
          }
        } catch (walletSyncErr) {
          console.error("Wallet sync error:", walletSyncErr);
        }
      }
      if (user) {
        const { password, ...userResponse } = user;
        res.json({ user: userResponse, message: "Settings updated successfully" });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Settings update error:", error);
      res.status(500).json({ message: "Error updating settings" });
    }
  });
  app2.post("/api/exchange/convert", optionalApiKey, async (req, res) => {
    try {
      const { amount, fromCurrency, toCurrency, userId } = req.body;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (!user.hasVirtualCard) {
        return res.status(400).json({ message: "Virtual card required for currency exchanges" });
      }
      const exchangeAmount = parseFloat(amount);
      const fee = (exchangeAmount * 0.015).toFixed(2);
      const totalDeducted = exchangeAmount + parseFloat(fee);
      const exchangeRate = await exchangeRateService2.getExchangeRate(fromCurrency, toCurrency);
      const convertedAmount = (exchangeAmount * exchangeRate).toFixed(2);
      const sourceCurrency = normalizeCurrency(fromCurrency);
      const targetCurrency = normalizeCurrency(toCurrency);
      const enabledCurrencies = await getEnabledCurrencyCodes();
      if (!enabledCurrencies.includes(sourceCurrency) || !enabledCurrencies.includes(targetCurrency)) {
        return res.status(400).json({ message: "Both currencies must be enabled" });
      }
      if (sourceCurrency === targetCurrency) {
        return res.status(400).json({ message: "Choose two different currencies" });
      }
      const sourceWallet = await getUserWallet(userId, sourceCurrency);
      const targetWallet = await ensureUserWallet(userId, targetCurrency);
      if (!sourceWallet || !targetWallet) {
        return res.status(400).json({ message: "Create wallets for both currencies before exchanging" });
      }
      const available = walletAvailableBalance(sourceWallet);
      if (available < totalDeducted) {
        return res.status(400).json({ message: `Insufficient ${sourceCurrency} balance` });
      }
      const debit = await pool.query(
        `UPDATE wallets
         SET balance = balance - $1, updated_at = NOW()
         WHERE id = $2 AND balance - hold_amount - withdrawal_hold_amount >= $1`,
        [totalDeducted, sourceWallet.id]
      );
      if (debit.rowCount !== 1) {
        return res.status(400).json({ message: `Insufficient ${sourceCurrency} balance` });
      }
      await pool.query(
        `UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE id = $2`,
        [parseFloat(convertedAmount), targetWallet.id]
      );
      const transaction = await storage.createTransaction({
        userId,
        type: "exchange",
        amount: amount.toString(),
        currency: sourceCurrency,
        status: "completed",
        fee,
        exchangeRate: exchangeRate.toString(),
        description: `Exchanged ${amount} ${sourceCurrency} to ${convertedAmount} ${targetCurrency}`,
        metadata: {
          targetCurrency,
          convertedAmount,
          exchangeType: "instant"
        }
      });
      res.json({
        transaction,
        convertedAmount,
        exchangeRate,
        fee,
        message: "Currency exchanged successfully"
      });
    } catch (error) {
      console.error("Exchange error:", error);
      res.status(400).json({ message: "Exchange failed" });
    }
  });
  app2.post("/api/payment-requests", async (req, res) => {
    try {
      const requestData = insertPaymentRequestSchema.parse(req.body);
      const paymentId = Math.random().toString(36).substring(2, 15);
      const paymentLink = `${req.protocol}://${req.get("host")}/pay/${paymentId}`;
      const request = await storage.createPaymentRequest({
        ...requestData,
        paymentLink
      });
      if (requestData.toEmail || requestData.toPhone) {
        await notificationService.sendNotification({
          title: "Payment Request",
          body: `You have received a payment request for ${requestData.currency} ${requestData.amount}`,
          userId: requestData.fromUserId,
          type: "general",
          metadata: { paymentRequestId: request.id }
        });
      }
      res.json({ request, message: "Payment request created successfully" });
    } catch (error) {
      console.error("Payment request error:", error);
      res.status(400).json({ message: "Invalid payment request data" });
    }
  });
  app2.get("/api/payment-requests/:userId", requireAuth, async (req, res) => {
    try {
      const sessionUserId = req.session?.userId;
      const requestedUserId = req.params.userId;
      if (sessionUserId !== requestedUserId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const requests = await storage.getPaymentRequestsByUserId(requestedUserId);
      res.json({ requests });
    } catch (error) {
      res.status(500).json({ message: "Error fetching payment requests" });
    }
  });
  app2.post("/api/payment-requests/:id/pay", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const sessionUserId = req.session?.userId;
      if (!sessionUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const paymentRequest = await storage.getPaymentRequest(id);
      if (!paymentRequest) {
        return res.status(404).json({ message: "Payment request not found" });
      }
      if (paymentRequest.status !== "pending") {
        return res.status(400).json({ message: "Payment request already processed" });
      }
      const payerUserId = sessionUserId;
      const transaction = await storage.createTransaction({
        userId: payerUserId,
        type: "send",
        amount: paymentRequest.amount.toString(),
        currency: paymentRequest.currency,
        recipientDetails: { paymentRequestId: id },
        status: "completed",
        fee: "0.00",
        description: `Payment for request: ${paymentRequest.message || "Payment request"}`
      });
      await storage.updatePaymentRequest(id, { status: "paid" });
      await notificationService.sendNotification({
        title: "Payment Received",
        body: `Your payment request for ${paymentRequest.currency} ${paymentRequest.amount} has been paid`,
        userId: paymentRequest.fromUserId,
        type: "transaction"
      });
      res.json({ transaction, message: "Payment completed successfully" });
    } catch (error) {
      console.error("Payment processing error:", error);
      res.status(500).json({ message: "Error processing payment" });
    }
  });
  app2.get("/api/payment-requests-received", requireAuth, async (req, res) => {
    try {
      const sessionUserId = req.session?.userId;
      if (!sessionUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = await storage.getUser(sessionUserId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const allRequests = await storage.getAllPaymentRequests();
      const receivedRequests = allRequests.filter(
        (req2) => req2.toEmail === user.email || req2.toPhone === user.phone
      );
      res.json({ requests: receivedRequests });
    } catch (error) {
      console.error("Error fetching received payment requests:", error);
      res.status(500).json({ message: "Error fetching payment requests" });
    }
  });
  app2.get("/api/receive-payment-link", requireAuth, async (req, res) => {
    try {
      const sessionUserId = req.session?.userId;
      if (!sessionUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const user = await storage.getUser(sessionUserId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const receiveLink = `${req.protocol}://${req.get("host")}/pay-to/${sessionUserId}`;
      const qrValue = `greenpay://pay/${sessionUserId}`;
      res.json({
        receiveLink,
        qrValue,
        accountNumber: `GP-${sessionUserId.slice(-9)}`,
        accountName: user.fullName,
        bankName: "GreenPay Digital Bank"
      });
    } catch (error) {
      console.error("Error generating receive link:", error);
      res.status(500).json({ message: "Error generating receive link" });
    }
  });
  app2.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password, twoFactorCode } = req.body;
      const admin = await storage.getAdminByEmail(email);
      if (!admin || !admin.isActive) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const validPassword = await bcrypt2.compare(password, admin.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      if (admin.twoFactorEnabled && admin.twoFactorSecret) {
        if (!twoFactorCode) {
          return res.status(401).json({
            message: "2FA code required",
            requiresTwoFactor: true
          });
        }
        const verified = speakeasy2.totp.verify({
          secret: admin.twoFactorSecret,
          encoding: "ascii",
          token: twoFactorCode,
          window: 2
        });
        if (!verified) {
          return res.status(401).json({ message: "Invalid 2FA code" });
        }
      }
      req.session.regenerate((err) => {
        if (err) {
          console.error("Admin session regeneration error:", err);
          return res.status(500).json({ message: "Session error" });
        }
        storage.updateAdmin(admin.id, { lastLoginAt: /* @__PURE__ */ new Date() }).catch((updateErr) => {
          console.error("Admin update error:", updateErr);
        });
        req.session.admin = {
          id: admin.id,
          email: admin.email,
          fullName: admin.fullName,
          role: admin.role,
          isActive: admin.isActive
        };
        storage.createAdminLog({
          adminId: admin.id,
          action: "LOGIN",
          ipAddress: req.ip,
          userAgent: req.get("User-Agent") || null
        }).catch((logErr) => {
          console.error("Admin log error:", logErr);
        });
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Admin session save error:", saveErr);
            return res.status(500).json({ message: "Session save error" });
          }
          const { password: _, ...adminData } = admin;
          res.json({
            admin: adminData,
            message: "Login successful"
          });
        });
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });
  app2.get("/api/admin/session", (req, res) => {
    if (req.session?.admin?.id) {
      return res.json({ admin: req.session.admin });
    }
    res.status(401).json({ message: "Not authenticated" });
  });
  app2.post("/api/admin/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
  app2.get("/api/admin/profile", requireAdminAuth, async (req, res) => {
    try {
      const admin = req.session?.admin;
      if (!admin) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      res.json({
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role
      });
    } catch (error) {
      console.error("Error fetching admin profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });
  app2.put("/api/admin/profile", requireAdminAuth, async (req, res) => {
    try {
      const { email, currentPassword, newPassword } = req.body;
      const admin = req.session?.admin;
      if (!admin) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const dbAdmin = await storage.getAdminById(admin.id);
      if (!dbAdmin) {
        return res.status(404).json({ message: "Admin not found" });
      }
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ message: "Current password required to set new password" });
        }
        const isPasswordValid = await bcrypt2.compare(currentPassword, dbAdmin.password);
        if (!isPasswordValid) {
          return res.status(401).json({ message: "Current password is incorrect" });
        }
        if (newPassword.length < 8) {
          return res.status(400).json({ message: "New password must be at least 8 characters" });
        }
      }
      const updates = {};
      if (email && email !== dbAdmin.email) {
        const existingAdmin = await storage.getAdminByEmail(email);
        if (existingAdmin && existingAdmin.id !== admin.id) {
          return res.status(409).json({ message: "Email already in use" });
        }
        updates.email = email;
      }
      if (newPassword) {
        updates.password = await bcrypt2.hash(newPassword, 10);
      }
      if (Object.keys(updates).length === 0) {
        return res.json({ message: "No changes made" });
      }
      const updatedAdmin = await storage.updateAdmin(admin.id, updates);
      req.session.admin = {
        id: updatedAdmin.id,
        email: updatedAdmin.email,
        fullName: updatedAdmin.fullName,
        role: updatedAdmin.role
      };
      res.json({
        message: "Profile updated successfully",
        admin: {
          id: updatedAdmin.id,
          email: updatedAdmin.email,
          fullName: updatedAdmin.fullName,
          role: updatedAdmin.role
        }
      });
    } catch (error) {
      console.error("Error updating admin profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
  app2.post("/api/admin/create-admin", requireAdminAuth, async (req, res) => {
    try {
      const { email, password, fullName, role } = req.body;
      if (!email || !password || !fullName) {
        return res.status(400).json({ message: "Email, password, and fullName are required" });
      }
      const existingAdmin = await storage.getAdminByEmail(email);
      if (existingAdmin) {
        return res.status(409).json({ message: "Admin with this email already exists" });
      }
      const hashedPassword = await bcrypt2.hash(password, 10);
      const newAdmin = await storage.createAdmin({
        email,
        password: hashedPassword,
        fullName,
        role: role || "admin"
      });
      storage.createAdminLog({
        adminId: req.session.admin.id,
        action: "CREATE_ADMIN",
        details: `Created admin: ${email}`,
        ipAddress: req.ip
      }).catch((err) => console.error("Admin log error:", err));
      res.json({ admin: newAdmin, message: "Admin created successfully" });
    } catch (error) {
      console.error("Create admin error:", error);
      res.status(500).json({ message: "Failed to create admin" });
    }
  });
  app2.get("/api/admin/dashboard", async (req, res) => {
    try {
      const [
        usersCount,
        transactionsCount,
        { volume, revenue },
        allUsers,
        allTransactions,
        kycDocuments2
      ] = await Promise.all([
        storage.getUsersCount(),
        storage.getTransactionsCount(),
        storage.getTotalVolume(),
        storage.getAllUsers(),
        storage.getAllTransactions(),
        storage.getAllKycDocuments()
      ]);
      const activeUsers = allUsers.filter((u) => u.isEmailVerified || u.isPhoneVerified).length;
      const pendingKyc = kycDocuments2.filter((d) => d.status === "pending").length;
      const completedTransactions = allTransactions.filter((t) => t.status === "completed").length;
      const pendingTransactions = allTransactions.filter((t) => t.status === "pending").length;
      const today = /* @__PURE__ */ new Date();
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        return date.toISOString().split("T")[0];
      }).reverse();
      const transactionTrends = last7Days.map((date) => {
        const dayTransactions = allTransactions.filter(
          (t) => t.createdAt && t.createdAt.toISOString().split("T")[0] === date
        );
        return {
          date,
          count: dayTransactions.length,
          volume: dayTransactions.reduce((sum2, t) => sum2 + parseFloat(t.amount), 0)
        };
      });
      res.json({
        metrics: {
          totalUsers: usersCount,
          activeUsers,
          blockedUsers: allUsers.filter((u) => !u.isEmailVerified && !u.isPhoneVerified).length,
          totalTransactions: transactionsCount,
          completedTransactions,
          pendingTransactions,
          totalVolume: volume,
          totalRevenue: revenue,
          pendingKyc
        },
        transactionTrends,
        recentTransactions: allTransactions.slice(0, 10)
      });
    } catch (error) {
      console.error("Dashboard data error:", error);
      res.status(500).json({ message: "Failed to load dashboard data" });
    }
  });
  app2.get("/api/admin/users", async (req, res) => {
    try {
      const { page = 1, limit = 20, status, search } = req.query;
      let users2 = await storage.getAllUsers();
      if (status) {
        users2 = users2.filter((user) => {
          switch (status) {
            case "active":
              return user.isEmailVerified || user.isPhoneVerified;
            case "pending":
              return user.kycStatus === "pending";
            case "verified":
              return user.kycStatus === "verified";
            case "blocked":
              return !user.isEmailVerified && !user.isPhoneVerified;
            default:
              return true;
          }
        });
      }
      if (search) {
        const searchTerm = search.toString().toLowerCase();
        users2 = users2.filter(
          (user) => user.fullName.toLowerCase().includes(searchTerm) || user.email.toLowerCase().includes(searchTerm) || user.phone.includes(searchTerm)
        );
      }
      const startIndex = (Number(page) - 1) * Number(limit);
      const paginatedUsers = users2.slice(startIndex, startIndex + Number(limit));
      res.json({
        users: paginatedUsers,
        total: users2.length,
        page: Number(page),
        totalPages: Math.ceil(users2.length / Number(limit))
      });
    } catch (error) {
      console.error("Users fetch error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.get("/api/admin/kyc", async (req, res) => {
    try {
      const kycDocuments2 = await storage.getAllKycDocuments();
      res.json({ kycDocuments: kycDocuments2 });
    } catch (error) {
      console.error("KYC fetch error:", error);
      res.status(500).json({ message: "Failed to fetch KYC documents" });
    }
  });
  app2.put("/api/admin/kyc/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, verificationNotes } = req.body;
      const isReVerify = status === "re_verification_requested";
      const docStatus = isReVerify ? "re_verification_requested" : status;
      const userKycStatus = isReVerify ? "not_submitted" : status;
      if (status === "verified") {
        const kycDoc = await storage.getKycByUserId(
          (await db.select({ userId: kycDocuments.userId }).from(kycDocuments).where(eq3(kycDocuments.id, id)))[0]?.userId
        );
        const decision = kycDoc?.diditDecision;
        const idNumber = decision?.features?.document?.document_number || null;
        if (idNumber) {
          const existing = await db.select({ id: users.id }).from(users).where(eq3(users.kycIdNumber, idNumber));
          const conflict = existing.find((u) => u.id !== kycDoc?.userId);
          if (conflict) {
            return res.status(409).json({ message: `This ID document (${idNumber}) is already linked to another account. Verification blocked to prevent duplicate accounts.` });
          }
        }
      }
      const updatedKyc = await storage.updateKycDocument(id, {
        status: docStatus,
        verificationNotes,
        verifiedAt: status === "verified" ? /* @__PURE__ */ new Date() : null,
        // Clear didit session so a fresh one is created on retry
        ...isReVerify ? { diditSessionId: null, diditStatus: null } : {}
      });
      if (updatedKyc) {
        if (status === "verified") {
          const decision = updatedKyc.diditDecision;
          const doc = decision?.features?.document || {};
          const kycFields = {
            kycFullName: [doc.first_name, doc.last_name].filter(Boolean).join(" ") || null,
            kycDateOfBirth: doc.date_of_birth || null,
            kycIdNumber: doc.document_number || null,
            kycNationality: doc.nationality || null,
            kycGender: doc.gender || null,
            kycAddress: doc.address || null,
            kycDocumentType: doc.document_type || null,
            kycIdExpiryDate: doc.expiry_date || null,
            kycIssuingCountry: doc.issuing_country || null
          };
          const filteredKycFields = Object.fromEntries(Object.entries(kycFields).filter(([, v]) => v != null));
          if (Object.keys(filteredKycFields).length > 0) {
            await storage.updateUser(updatedKyc.userId, filteredKycFields);
          }
        }
        await storage.updateUser(updatedKyc.userId, { kycStatus: userKycStatus });
        const user = await storage.getUser(updatedKyc.userId);
        if (user) {
          if (status === "verified") {
            const { messagingService: messagingService3 } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
            const { mailtrapService: mailtrapService3 } = await Promise.resolve().then(() => (init_mailtrap(), mailtrap_exports));
            Promise.all([
              messagingService3.sendKYCVerified(user.phone),
              user.email ? mailtrapService3.sendKYCVerified(
                user.email,
                user.fullName?.split(" ")[0] || "User",
                user.fullName?.split(" ").slice(1).join(" ") || ""
              ) : Promise.resolve(false)
            ]).catch((err) => console.error("KYC notification error:", err));
          }
          const notifMsg = isReVerify ? "Admin has requested you to re-verify your identity. Please complete a new verification." : status === "verified" ? "Your identity has been verified. You now have full access to all features." : status === "rejected" ? `Your KYC verification was rejected. ${verificationNotes ? "Reason: " + verificationNotes : "Please try again."}` : "Your KYC status has been updated.";
          await storage.createNotification({
            userId: updatedKyc.userId,
            title: isReVerify ? "Re-verification Required" : status === "verified" ? "KYC Verified \u2705" : status === "rejected" ? "KYC Rejected \u274C" : "KYC Update",
            message: notifMsg,
            type: isReVerify ? "warning" : status === "verified" ? "success" : status === "rejected" ? "error" : "info",
            isGlobal: false
          });
        }
      }
      res.json({ kyc: updatedKyc });
    } catch (error) {
      console.error("KYC update error:", error);
      res.status(500).json({ message: "Failed to update KYC" });
    }
  });
  app2.post("/api/admin/kyc/:id/poll-didit", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const [kyc] = await db.select().from(kycDocuments).where(eq3(kycDocuments.id, id));
      if (!kyc) return res.status(404).json({ message: "KYC document not found" });
      const sessionId = kyc.diditSessionId;
      if (!sessionId) {
        return res.status(400).json({ message: "No Didit session attached to this document" });
      }
      const { getSessionDecision: getSessionDecision2, mapDiditStatusToKyc: mapDiditStatusToKyc2, isTerminalStatus: isTerminalStatus2 } = await Promise.resolve().then(() => (init_didit(), didit_exports));
      const decision = await getSessionDecision2(sessionId);
      if (!decision) {
        return res.status(502).json({ message: "Failed to fetch decision from Didit" });
      }
      const diditStatus = decision.status;
      const kycStatus = mapDiditStatusToKyc2(diditStatus);
      const docFeatures = decision.features?.document || {};
      const extractedData = {
        firstName: docFeatures.first_name || null,
        lastName: docFeatures.last_name || null,
        fullName: [docFeatures.first_name, docFeatures.last_name].filter(Boolean).join(" ") || null,
        dateOfBirth: docFeatures.date_of_birth || null,
        idNumber: docFeatures.document_number || null,
        documentType: docFeatures.document_type || null,
        nationality: docFeatures.nationality || null,
        gender: docFeatures.gender || null,
        expiryDate: docFeatures.expiry_date || null,
        address: docFeatures.address || null,
        issuingCountry: docFeatures.issuing_country || null
      };
      if (kycStatus === "verified" && extractedData.idNumber) {
        const existing = await db.select({ id: users.id }).from(users).where(eq3(users.kycIdNumber, extractedData.idNumber));
        if (existing.some((u) => u.id !== kyc.userId)) {
          return res.status(409).json({ message: `This ID document (${extractedData.idNumber}) is already linked to another account. Verification blocked.` });
        }
      }
      await storage.updateKycDocument(id, {
        diditStatus,
        status: kycStatus,
        diditDecision: decision,
        verifiedAt: kycStatus === "verified" ? /* @__PURE__ */ new Date() : void 0
      });
      await storage.updateUser(kyc.userId, { kycStatus });
      if (kycStatus === "verified") {
        const kycFields = {
          kycFullName: extractedData.fullName || null,
          kycDateOfBirth: extractedData.dateOfBirth || null,
          kycIdNumber: extractedData.idNumber || null,
          kycNationality: extractedData.nationality || null,
          kycGender: extractedData.gender || null,
          kycAddress: extractedData.address || null,
          kycDocumentType: extractedData.documentType || null,
          kycIdExpiryDate: extractedData.expiryDate || null,
          kycIssuingCountry: extractedData.issuingCountry || null
        };
        const filtered = Object.fromEntries(Object.entries(kycFields).filter(([, v]) => v != null));
        if (Object.keys(filtered).length > 0) await storage.updateUser(kyc.userId, filtered);
      }
      if (isTerminalStatus2(diditStatus)) {
        const user = await storage.getUser(kyc.userId);
        if (user) {
          const { messagingService: messagingService3 } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
          const { mailtrapService: mailtrapService3 } = await Promise.resolve().then(() => (init_mailtrap(), mailtrap_exports));
          if (kycStatus === "verified") {
            Promise.all([
              messagingService3.sendKYCVerified(user.phone),
              user.email ? mailtrapService3.sendKYCVerified(user.email, user.fullName?.split(" ")[0] || "User", "") : Promise.resolve()
            ]).catch((err) => console.error("[Didit] Notification error:", err));
          }
          await storage.createNotification({
            userId: kyc.userId,
            title: kycStatus === "verified" ? "KYC Verified \u2705" : "KYC Update",
            message: kycStatus === "verified" ? "Your identity has been verified. You now have full access to all features." : kycStatus === "rejected" ? "Your KYC verification was not successful. Please try again." : "Your KYC is under review.",
            type: kycStatus === "verified" ? "success" : kycStatus === "rejected" ? "error" : "info",
            isGlobal: false
          });
        }
      }
      res.json({
        diditStatus,
        kycStatus,
        decision,
        extractedData,
        sessionId
      });
    } catch (error) {
      console.error("[Admin] Poll Didit error:", error);
      res.status(500).json({ message: "Failed to poll Didit" });
    }
  });
  app2.post("/api/kyc/advanced/submit", requireAuth, upload.fields([
    { name: "facialPhoto", maxCount: 1 },
    { name: "addressProof", maxCount: 1 }
  ]), async (req, res) => {
    try {
      const sessionUserId = req.session?.userId;
      if (!sessionUserId) return res.status(401).json({ message: "Unauthorized" });
      const files = req.files;
      const { addressProofType, fullAddress, city, postalCode, country } = req.body;
      if (!files?.facialPhoto || !files?.addressProof) {
        return res.status(400).json({ message: "Facial photo and address proof are required" });
      }
      if (!addressProofType || !fullAddress) {
        return res.status(400).json({ message: "Address proof type and full address are required" });
      }
      const { advancedKycDocuments: advKycTable } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const existing = await db.select().from(advKycTable).where(eq3(advKycTable.userId, sessionUserId));
      if (existing.length > 0 && existing[0].status === "pending") {
        return res.status(409).json({ message: "Your advanced KYC is currently under review" });
      }
      if (existing.length > 0 && existing[0].status === "verified") {
        return res.status(409).json({ message: "Your advanced KYC is already verified" });
      }
      let facialPhotoUrl = null;
      let addressProofUrl = null;
      try {
        [facialPhotoUrl, addressProofUrl] = await Promise.all([
          cloudinaryStorage2.uploadKycDocument(files.facialPhoto[0].buffer, files.facialPhoto[0].originalname, files.facialPhoto[0].mimetype),
          cloudinaryStorage2.uploadKycDocument(files.addressProof[0].buffer, files.addressProof[0].originalname, files.addressProof[0].mimetype)
        ]);
      } catch (uploadErr) {
        const buf1 = files.facialPhoto[0].buffer;
        facialPhotoUrl = `data:${files.facialPhoto[0].mimetype};base64,${buf1.toString("base64")}`;
        const buf2 = files.addressProof[0].buffer;
        addressProofUrl = `data:${files.addressProof[0].mimetype};base64,${buf2.toString("base64")}`;
      }
      if (existing.length > 0) {
        await db.update(advKycTable).set({
          facialPhotoUrl,
          addressProofUrl,
          addressProofType,
          fullAddress,
          city,
          postalCode,
          country,
          status: "pending",
          verificationNotes: null,
          verifiedAt: null,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq3(advKycTable.userId, sessionUserId));
      } else {
        await db.insert(advKycTable).values({
          userId: sessionUserId,
          facialPhotoUrl,
          addressProofUrl,
          addressProofType,
          fullAddress,
          city,
          postalCode,
          country
        });
      }
      await storage.updateUser(sessionUserId, { advancedKycStatus: "pending" });
      res.json({ success: true, message: "Advanced KYC submitted successfully" });
    } catch (e) {
      console.error("Advanced KYC submit error:", e);
      res.status(500).json({ message: "Failed to submit advanced KYC" });
    }
  });
  app2.get("/api/kyc/advanced", requireAuth, async (req, res) => {
    try {
      const sessionUserId = req.session?.userId;
      if (!sessionUserId) return res.status(401).json({ message: "Unauthorized" });
      const { advancedKycDocuments: advKycTable } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const docs = await db.select().from(advKycTable).where(eq3(advKycTable.userId, sessionUserId));
      res.json({ advancedKyc: docs[0] || null });
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch advanced KYC" });
    }
  });
  app2.get("/api/admin/kyc/advanced", requireAdminAuth, async (req, res) => {
    try {
      const { advancedKycDocuments: advKycTable } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const docs = await db.select().from(advKycTable).orderBy(advKycTable.createdAt);
      res.json({ advancedKycDocuments: docs });
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch advanced KYC documents" });
    }
  });
  app2.put("/api/admin/kyc/advanced/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, verificationNotes } = req.body;
      const { advancedKycDocuments: advKycTable } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const [updated] = await db.update(advKycTable).set({
        status,
        verificationNotes,
        verifiedAt: status === "verified" ? /* @__PURE__ */ new Date() : null,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq3(advKycTable.id, id)).returning();
      if (updated) {
        await storage.updateUser(updated.userId, { advancedKycStatus: status });
      }
      res.json({ advancedKyc: updated });
    } catch (e) {
      res.status(500).json({ message: "Failed to update advanced KYC" });
    }
  });
  app2.get("/api/admin/transactions", async (req, res) => {
    try {
      const { page = 1, limit = 20, status, type } = req.query;
      let transactions2 = await storage.getAllTransactions();
      if (status) {
        transactions2 = transactions2.filter((t) => t.status === status);
      }
      if (type) {
        transactions2 = transactions2.filter((t) => t.type === type);
      }
      const startIndex = (Number(page) - 1) * Number(limit);
      const paginatedTransactions = transactions2.slice(startIndex, startIndex + Number(limit));
      res.json({
        transactions: paginatedTransactions,
        total: transactions2.length,
        page: Number(page),
        totalPages: Math.ceil(transactions2.length / Number(limit))
      });
    } catch (error) {
      console.error("Transactions fetch error:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });
  app2.get("/api/admin/virtual-cards", async (req, res) => {
    try {
      const search = (req.query.search || "").toLowerCase().trim();
      const allCards = await storage.getAllVirtualCards();
      const enriched = await Promise.all(
        allCards.map(async (card) => {
          const user = await storage.getUser(card.userId);
          return {
            ...card,
            userName: user?.fullName || "Unknown",
            userEmail: user?.email || "",
            userPhone: user?.phone || ""
          };
        })
      );
      const cards = search ? enriched.filter(
        (c) => c.cardHolderName.toLowerCase().includes(search) || c.cardNumber.toLowerCase().includes(search) || c.userName.toLowerCase().includes(search) || c.userEmail.toLowerCase().includes(search) || c.userPhone.toLowerCase().includes(search) || c.userId.toLowerCase().includes(search)
      ) : enriched;
      res.json({ cards });
    } catch (error) {
      console.error("Virtual cards fetch error:", error);
      res.status(500).json({ message: "Failed to fetch virtual cards" });
    }
  });
  app2.get("/api/admin/logs", async (req, res) => {
    try {
      const logs = await storage.getAdminLogs();
      res.json({ logs });
    } catch (error) {
      console.error("Admin logs fetch error:", error);
      res.status(500).json({ message: "Failed to fetch admin logs" });
    }
  });
  app2.put("/api/admin/users/:id/profile", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      if (!user) return res.status(404).json({ message: "User not found" });
      const {
        fullName,
        email,
        phone,
        country,
        kycFullName,
        kycDateOfBirth,
        kycIdNumber,
        kycNationality,
        kycGender,
        kycAddress,
        kycDocumentType,
        kycIdExpiryDate,
        kycIssuingCountry
      } = req.body;
      const updates = {};
      if (fullName !== void 0) updates.fullName = fullName.trim();
      if (email !== void 0) updates.email = email.trim().toLowerCase();
      if (phone !== void 0) updates.phone = phone.trim();
      if (country !== void 0) updates.country = country.trim();
      if (kycFullName !== void 0) updates.kycFullName = kycFullName?.trim() || null;
      if (kycDateOfBirth !== void 0) updates.kycDateOfBirth = kycDateOfBirth?.trim() || null;
      if (kycIdNumber !== void 0) updates.kycIdNumber = kycIdNumber?.trim() || null;
      if (kycNationality !== void 0) updates.kycNationality = kycNationality?.trim() || null;
      if (kycGender !== void 0) updates.kycGender = kycGender?.trim() || null;
      if (kycAddress !== void 0) updates.kycAddress = kycAddress?.trim() || null;
      if (kycDocumentType !== void 0) updates.kycDocumentType = kycDocumentType?.trim() || null;
      if (kycIdExpiryDate !== void 0) updates.kycIdExpiryDate = kycIdExpiryDate?.trim() || null;
      if (kycIssuingCountry !== void 0) updates.kycIssuingCountry = kycIssuingCountry?.trim() || null;
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "No fields to update" });
      }
      const updatedUser = await storage.updateUser(id, updates);
      await storage.createAdminLog({
        adminId: req.session?.admin?.id || null,
        action: "user_profile_updated",
        details: `Admin updated profile for user ${user.email}: ${Object.keys(updates).join(", ")}`,
        targetId: id
      });
      res.json({ user: updatedUser, message: "Profile updated successfully" });
    } catch (error) {
      console.error("Update user profile error:", error);
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });
  app2.put("/api/admin/users/:id/block", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.updateUser(id, {
        isEmailVerified: false,
        isPhoneVerified: false
      });
      res.json({ message: "User blocked successfully" });
    } catch (error) {
      console.error("Block user error:", error);
      res.status(500).json({ message: "Failed to block user" });
    }
  });
  app2.put("/api/admin/users/:id/unblock", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.updateUser(id, {
        isEmailVerified: true,
        isPhoneVerified: true
      });
      res.json({ message: "User unblocked successfully" });
    } catch (error) {
      console.error("Unblock user error:", error);
      res.status(500).json({ message: "Failed to unblock user" });
    }
  });
  app2.post("/api/admin/users/:id/request-advanced-kyc", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      if (!user) return res.status(404).json({ message: "User not found" });
      await storage.updateUser(id, { advancedKycRequested: true });
      res.json({ message: "Advanced KYC requested successfully" });
    } catch (error) {
      console.error("Request advanced KYC error:", error);
      res.status(500).json({ message: "Failed to request advanced KYC" });
    }
  });
  app2.post("/api/admin/users/:id/cancel-advanced-kyc-request", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      if (!user) return res.status(404).json({ message: "User not found" });
      await storage.updateUser(id, { advancedKycRequested: false });
      res.json({ message: "Advanced KYC request cancelled" });
    } catch (error) {
      console.error("Cancel advanced KYC request error:", error);
      res.status(500).json({ message: "Failed to cancel request" });
    }
  });
  app2.put("/api/admin/users/:id/account", async (req, res) => {
    try {
      const { id } = req.params;
      const { action } = req.body;
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      let updateData = {};
      let logMessage = "";
      switch (action) {
        case "block":
          updateData = { isEmailVerified: false, isPhoneVerified: false };
          logMessage = `Admin blocked user account: ${user.email}`;
          break;
        case "unblock":
          updateData = { isEmailVerified: true, isPhoneVerified: true };
          logMessage = `Admin unblocked user account: ${user.email}`;
          break;
        case "suspend": {
          const { reason } = req.body;
          updateData = { isSuspended: true, suspendedAt: /* @__PURE__ */ new Date(), suspensionReason: reason || "Account suspended by administrator" };
          logMessage = `Admin suspended user account: ${user.email}. Reason: ${reason || "No reason provided"}`;
          break;
        }
        case "unsuspend":
          if (pool) {
            await pool.query(
              `UPDATE users SET is_suspended = false, suspended_at = NULL, suspension_reason = NULL, updated_at = NOW() WHERE id = $1`,
              [id]
            );
          } else {
            updateData = { isSuspended: false, suspendedAt: null, suspensionReason: null };
          }
          logMessage = `Admin unsuspended user account: ${user.email}`;
          break;
        case "force_logout":
          logMessage = `Admin forced logout for user: ${user.email}`;
          break;
        case "reset_password": {
          const defaultPassword = "12345678";
          const hashedDefault = await bcrypt2.hash(defaultPassword, 10);
          updateData = { password: hashedDefault };
          logMessage = `Admin reset password to default for user: ${user.email}`;
          break;
        }
        case "change_password": {
          const { newPassword } = req.body;
          if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
          }
          const hashedNew = await bcrypt2.hash(newPassword, 10);
          updateData = { password: hashedNew };
          logMessage = `Admin changed password for user: ${user.email}`;
          break;
        }
        default:
          return res.status(400).json({ message: "Invalid action" });
      }
      if (Object.keys(updateData).length > 0) {
        await storage.updateUser(id, updateData);
      }
      await storage.createAdminLog({
        adminId: req.session.admin?.id || null,
        action: `user_account_${action}`,
        details: logMessage,
        targetId: id
      });
      const updatedUser = await storage.getUser(id);
      const { password, ...userWithoutPassword } = updatedUser;
      res.json({
        message: "Account action completed successfully",
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Admin account action error:", error);
      res.status(500).json({ message: "Failed to perform account action" });
    }
  });
  app2.put("/api/admin/users/:id/security", async (req, res) => {
    try {
      const { id } = req.params;
      const { action } = req.body;
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      let updateData = {};
      let logMessage = "";
      switch (action) {
        case "reset_2fa":
          updateData = { twoFactorSecret: null, twoFactorEnabled: false };
          logMessage = `Admin reset 2FA for user: ${user.email}`;
          break;
        case "verify_email":
          updateData = { isEmailVerified: true };
          logMessage = `Admin manually verified email for user: ${user.email}`;
          break;
        case "verify_phone":
          updateData = { isPhoneVerified: true };
          logMessage = `Admin manually verified phone for user: ${user.email}`;
          break;
        default:
          return res.status(400).json({ message: "Invalid security action" });
      }
      await storage.updateUser(id, updateData);
      await storage.createAdminLog({
        adminId: req.session.admin?.id || null,
        action: `user_security_${action}`,
        details: logMessage,
        targetId: id
      });
      res.json({ message: "Security action completed successfully" });
    } catch (error) {
      console.error("Admin security action error:", error);
      res.status(500).json({ message: "Failed to perform security action" });
    }
  });
  app2.put("/api/admin/users/:id/notifications", async (req, res) => {
    try {
      const { id } = req.params;
      const { action } = req.body;
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      let updateData = {};
      let logMessage = "";
      switch (action) {
        case "enable_notifications":
          updateData = { pushNotificationsEnabled: true };
          logMessage = `Admin enabled notifications for user: ${user.email}`;
          break;
        case "disable_notifications":
          updateData = { pushNotificationsEnabled: false };
          logMessage = `Admin disabled notifications for user: ${user.email}`;
          break;
        default:
          return res.status(400).json({ message: "Invalid notification action" });
      }
      await storage.updateUser(id, updateData);
      await storage.createAdminLog({
        adminId: req.session.admin?.id || null,
        action: `user_notifications_${action}`,
        details: logMessage,
        targetId: id
      });
      res.json({ message: "Notification settings updated successfully" });
    } catch (error) {
      console.error("Admin notification action error:", error);
      res.status(500).json({ message: "Failed to update notification settings" });
    }
  });
  app2.get("/api/admin/users/:id/transactions", async (req, res) => {
    try {
      const { id } = req.params;
      const transactions2 = await storage.getTransactionsByUserId(id);
      res.json({ transactions: transactions2 });
    } catch (error) {
      console.error("Admin user transactions error:", error);
      res.status(500).json({ message: "Failed to fetch user transactions" });
    }
  });
  app2.get("/api/admin/users/:id/crypto-transactions", async (req, res) => {
    try {
      const { id } = req.params;
      const txns = await db.select().from(cryptoTransactions).where(eq3(cryptoTransactions.userId, id)).orderBy(desc2(cryptoTransactions.createdAt));
      res.json({ transactions: txns });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch crypto transactions" });
    }
  });
  app2.put("/api/admin/transactions/:id/edit", async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, currency, type, description, status, createdAt, fee } = req.body;
      const existing = await storage.getTransaction(id);
      if (!existing) return res.status(404).json({ message: "Transaction not found" });
      const updates = {};
      if (amount !== void 0) updates.amount = String(amount);
      if (currency !== void 0) updates.currency = currency;
      if (type !== void 0) updates.type = type;
      if (description !== void 0) updates.description = description;
      if (fee !== void 0) updates.fee = String(fee);
      if (status !== void 0) updates.status = status;
      if (createdAt !== void 0) updates.createdAt = new Date(createdAt);
      updates.updatedAt = /* @__PURE__ */ new Date();
      const updated = await storage.updateTransaction(id, updates);
      res.json({ transaction: updated, message: "Transaction updated" });
    } catch (error) {
      console.error("Admin edit transaction error:", error);
      res.status(500).json({ message: "Failed to update transaction" });
    }
  });
  app2.delete("/api/admin/transactions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const existing = await storage.getTransaction(id);
      if (!existing) return res.status(404).json({ message: "Transaction not found" });
      await db.delete(transactions).where(eq3(transactions.id, id));
      res.json({ message: "Transaction deleted" });
    } catch (error) {
      console.error("Admin delete transaction error:", error);
      res.status(500).json({ message: "Failed to delete transaction" });
    }
  });
  app2.put("/api/admin/crypto/transactions/:id/edit", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, txHash, adminNotes, amount, usdValue, coin, network, createdAt } = req.body;
      const updateData = { updatedAt: /* @__PURE__ */ new Date() };
      if (status !== void 0) updateData.status = status;
      if (txHash !== void 0) updateData.txHash = txHash;
      if (adminNotes !== void 0) updateData.adminNotes = adminNotes;
      if (amount !== void 0) updateData.amount = String(amount);
      if (usdValue !== void 0) updateData.usdValue = String(usdValue);
      if (coin !== void 0) updateData.coin = coin;
      if (network !== void 0) updateData.network = network;
      if (createdAt !== void 0) updateData.createdAt = new Date(createdAt);
      if (status === "completed") updateData.completedAt = /* @__PURE__ */ new Date();
      await db.update(cryptoTransactions).set(updateData).where(eq3(cryptoTransactions.id, id));
      const [updated] = await db.select().from(cryptoTransactions).where(eq3(cryptoTransactions.id, id));
      res.json({ transaction: updated, message: "Crypto transaction updated" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update crypto transaction" });
    }
  });
  app2.delete("/api/admin/crypto/transactions/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(cryptoTransactions).where(eq3(cryptoTransactions.id, id));
      res.json({ message: "Crypto transaction deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete crypto transaction" });
    }
  });
  app2.put("/api/admin/transactions/:txId/status", async (req, res) => {
    try {
      const { txId } = req.params;
      const { status } = req.body;
      const validStatuses = ["pending", "processing", "completed", "failed", "cancelled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const before = await storage.getTransaction(txId);
      if (!before) return res.status(404).json({ message: "Transaction not found" });
      const updated = await storage.updateTransaction(txId, { status });
      if (!updated) return res.status(404).json({ message: "Transaction not found" });
      const deductionTypes = ["send", "withdraw", "transfer", "exchange", "bills", "airtime", "card_purchase"];
      const wasDeducted = ["pending", "processing", "completed"].includes(before.status || "");
      const nowFailed = status === "failed" || status === "cancelled";
      const wasFailed = before.status === "failed" || before.status === "cancelled";
      if (deductionTypes.includes(before.type) && wasDeducted && nowFailed && !wasFailed) {
        const user = await storage.getUser(before.userId);
        if (user) {
          const refundAmount = parseFloat(before.amount || "0") + parseFloat(before.fee || "0");
          const refundCurrency = normalizeCurrency(before.currency || "USD");
          const refundWallet = await ensureUserWallet(before.userId, refundCurrency);
          if (refundWallet) {
            await pool.query(
              `UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE id = $2`,
              [refundAmount, refundWallet.id]
            );
          }
          console.log(`\u2705 Refunded ${before.currency} ${refundAmount} to user ${user.email} (admin marked ${status})`);
          try {
            await notificationService.sendNotification({
              title: status === "cancelled" ? "Transaction Cancelled & Refunded" : "Transaction Failed & Refunded",
              body: `Your ${before.type} of ${before.currency} ${refundAmount} was marked as ${status}. The amount has been refunded to your wallet.`,
              userId: before.userId,
              type: "transaction"
            });
          } catch {
          }
        }
      }
      res.json({ transaction: updated });
    } catch (error) {
      console.error("Admin update transaction status error:", error);
      res.status(500).json({ message: "Failed to update transaction status" });
    }
  });
  app2.get("/api/admin/users/:id/card", async (req, res) => {
    try {
      const { id } = req.params;
      const card = await storage.getVirtualCardByUserId(id);
      res.json({ card: card || null });
    } catch (error) {
      console.error("Admin user card error:", error);
      res.status(500).json({ message: "Failed to fetch user card" });
    }
  });
  app2.get("/api/admin/users/:id/export", async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const kyc = await storage.getKycByUserId(id);
      const virtualCard = await storage.getVirtualCardByUserId(id);
      const transactions2 = await storage.getTransactionsByUserId(id);
      const recipients2 = await storage.getRecipientsByUserId(id);
      const paymentRequests2 = await storage.getPaymentRequestsByUserId(id);
      const exportData = {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          country: user.country,
          kycStatus: user.kycStatus,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          hasVirtualCard: user.hasVirtualCard,
          balance: user.balance,
          twoFactorEnabled: user.twoFactorEnabled,
          createdAt: user.createdAt
        },
        kyc: kyc ? {
          status: kyc.status,
          documentType: kyc.documentType,
          verifiedAt: kyc.verifiedAt,
          createdAt: kyc.createdAt
        } : null,
        virtualCard: virtualCard ? {
          status: virtualCard.status,
          balance: virtualCard.balance,
          purchaseAmount: virtualCard.purchaseAmount,
          purchaseDate: virtualCard.purchaseDate
        } : null,
        transactions: transactions2.map((tx) => ({
          id: tx.id,
          type: tx.type,
          amount: tx.amount,
          currency: tx.currency,
          status: tx.status,
          description: tx.description,
          createdAt: tx.createdAt
        })),
        recipients: recipients2.map((recipient) => ({
          id: recipient.id,
          name: recipient.name,
          country: recipient.country,
          currency: recipient.currency,
          recipientType: recipient.recipientType,
          createdAt: recipient.createdAt
        })),
        paymentRequests: paymentRequests2.map((req2) => ({
          id: req2.id,
          amount: req2.amount,
          currency: req2.currency,
          status: req2.status,
          createdAt: req2.createdAt
        })),
        exportedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await storage.createAdminLog({
        adminId: req.session.admin?.id || null,
        action: "user_data_export",
        details: `Admin exported data for user: ${user.email}`,
        targetId: id
      });
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="user-data-${id}.json"`);
      res.send(JSON.stringify(exportData, null, 2));
    } catch (error) {
      console.error("User data export error:", error);
      res.status(500).json({ message: "Failed to export user data" });
    }
  });
  app2.post("/api/admin/users/:id/notification", async (req, res) => {
    try {
      const { id } = req.params;
      const { title, message, type = "info" } = req.body;
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (!title || !message) {
        return res.status(400).json({ message: "Title and message are required" });
      }
      const notification = await storage.createNotification({
        title,
        message,
        type,
        userId: id,
        isGlobal: false
      });
      await storage.createAdminLog({
        adminId: req.session.admin?.id || null,
        action: "send_custom_notification",
        details: `Admin sent custom notification to user: ${user.email} - Title: ${title}`,
        targetId: id
      });
      res.json({
        message: "Notification sent successfully",
        notification: {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type
        }
      });
    } catch (error) {
      console.error("Send custom notification error:", error);
      res.status(500).json({ message: "Failed to send notification" });
    }
  });
  app2.post("/api/support/tickets", upload.single("file"), async (req, res) => {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const { issueType, description } = req.body;
      if (!issueType || !description) {
        return res.status(400).json({ message: "Issue type and description required" });
      }
      let fileUrl = void 0;
      let fileName = void 0;
      if (req.file) {
        try {
          fileUrl = await cloudinaryStorage2.uploadFile(
            `support-tickets/${userId}/${Date.now()}-${req.file.originalname}`,
            req.file.buffer,
            req.file.mimetype
          );
          fileName = req.file.originalname;
        } catch (error) {
          console.error("Error uploading support ticket file:", error);
          return res.status(400).json({ message: "File upload failed" });
        }
      }
      const ticket = await storage.createSupportTicket({
        issueType,
        description,
        userId,
        status: "open",
        priority: "normal",
        fileUrl,
        fileName
      });
      res.json({
        message: "Support ticket submitted successfully",
        ticket: {
          id: ticket.id,
          issueType: ticket.issueType,
          status: ticket.status,
          createdAt: ticket.createdAt
        }
      });
    } catch (error) {
      console.error("Submit support ticket error:", error);
      res.status(500).json({ message: "Failed to submit support ticket" });
    }
  });
  app2.get("/api/user/support-tickets", async (req, res) => {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const tickets = await storage.getSupportTicketsByUserId(userId);
      const ticketsWithReplies = await Promise.all(
        tickets.map(async (ticket) => {
          try {
            const replies = await storage.getTicketReplies(ticket.id);
            return { ...ticket, replies };
          } catch (e) {
            return { ...ticket, replies: [] };
          }
        })
      );
      res.json({ tickets: ticketsWithReplies });
    } catch (error) {
      console.error("Get user tickets error:", error);
      res.status(500).json({ message: "Failed to fetch support tickets" });
    }
  });
  app2.post("/api/user/support-tickets", upload.single("file"), async (req, res) => {
    try {
      const userId = req.session?.user?.id;
      if (!userId) return res.status(401).json({ message: "Authentication required" });
      const { issueType, description } = req.body;
      if (!issueType || !description) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const ticket = await storage.createSupportTicket({ userId, issueType, description, status: "open", priority: "medium" });
      res.json({ message: "Ticket created", ticket });
    } catch (error) {
      console.error("Create user ticket error:", error);
      res.status(500).json({ message: "Failed to create ticket" });
    }
  });
  app2.post("/api/user/support-tickets/:id/reply", upload.single("file"), async (req, res) => {
    try {
      const userId = req.session?.user?.id;
      if (!userId) return res.status(401).json({ message: "Authentication required" });
      const { content } = req.body;
      if (!content) return res.status(400).json({ message: "Reply content required" });
      let fileUrl = void 0;
      let fileName = void 0;
      if (req.file) {
        try {
          fileUrl = await cloudinaryStorage2.uploadFile(
            `support-tickets/${req.params.id}/${Date.now()}-${req.file.originalname}`,
            req.file.buffer,
            req.file.mimetype
          );
          fileName = req.file.originalname;
        } catch (error) {
          console.error("Error uploading reply file:", error);
          return res.status(400).json({ message: "File upload failed" });
        }
      }
      const reply = await storage.createTicketReply({
        ticketId: req.params.id,
        userId,
        senderType: "user",
        content,
        fileUrl,
        fileName
      });
      res.json({ message: "Reply sent", reply });
    } catch (error) {
      console.error("Send reply error:", error);
      res.status(500).json({ message: "Failed to send reply" });
    }
  });
  app2.get("/api/support/tickets", async (req, res) => {
    try {
      const userId = req.session?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const tickets = await storage.getSupportTicketsByUserId(userId);
      res.json({ tickets });
    } catch (error) {
      console.error("Get user tickets error:", error);
      res.status(500).json({ message: "Failed to fetch support tickets" });
    }
  });
  app2.get("/api/admin/support/tickets", requireAdminAuth, async (req, res) => {
    try {
      const { status, priority, page, limit } = req.query;
      const result = await storage.getAllSupportTickets({
        status,
        priority,
        page: page ? parseInt(page) : void 0,
        limit: limit ? parseInt(limit) : void 0
      });
      const ticketsWithDetails = await Promise.all(
        result.tickets.map(async (ticket) => {
          try {
            const user = await storage.getUser(ticket.userId);
            let replies = [];
            try {
              replies = await storage.getTicketReplies(ticket.id);
            } catch (e) {
              replies = [];
            }
            return {
              ...ticket,
              user: user ? { fullName: user.fullName, email: user.email, phone: user.phone } : void 0,
              replies
            };
          } catch (e) {
            return {
              ...ticket,
              user: void 0,
              replies: []
            };
          }
        })
      );
      res.json({ ...result, tickets: ticketsWithDetails });
    } catch (error) {
      console.error("Get admin tickets error:", error);
      res.status(500).json({ message: "Failed to fetch support tickets" });
    }
  });
  app2.get("/api/admin/support/tickets/:id", requireAdminAuth, async (req, res) => {
    try {
      const ticket = await storage.getSupportTicket(req.params.id);
      if (!ticket) {
        return res.status(404).json({ message: "Support ticket not found" });
      }
      res.json({ ticket });
    } catch (error) {
      console.error("Get ticket error:", error);
      res.status(500).json({ message: "Failed to fetch support ticket" });
    }
  });
  app2.put("/api/admin/support/tickets/:id", requireAdminAuth, async (req, res) => {
    try {
      const { status, priority, adminNotes } = req.body;
      const updates = {};
      if (status) updates.status = status;
      if (priority) updates.priority = priority;
      if (adminNotes) updates.adminNotes = adminNotes;
      if (status === "resolved") updates.resolvedAt = /* @__PURE__ */ new Date();
      const ticket = await storage.updateSupportTicket(req.params.id, updates);
      if (!ticket) {
        return res.status(404).json({ message: "Support ticket not found" });
      }
      await storage.createAdminLog({
        adminId: req.session?.admin?.id || null,
        action: "update_support_ticket",
        details: `Admin updated support ticket ${req.params.id} - Status: ${status}`,
        targetId: req.params.id
      });
      res.json({
        message: "Support ticket updated successfully",
        ticket
      });
    } catch (error) {
      console.error("Update ticket error:", error);
      res.status(500).json({ message: "Failed to update support ticket" });
    }
  });
  app2.delete("/api/admin/support/tickets/:id", requireAdminAuth, async (req, res) => {
    try {
      const ticket = await storage.getSupportTicket(req.params.id);
      if (!ticket) {
        return res.status(404).json({ message: "Support ticket not found" });
      }
      await storage.deleteSupportTicket(req.params.id);
      await storage.createAdminLog({
        adminId: req.session?.admin?.id || null,
        action: "delete_support_ticket",
        details: `Admin deleted support ticket ${req.params.id}`,
        targetId: req.params.id
      });
      res.json({
        message: "Support ticket deleted successfully"
      });
    } catch (error) {
      console.error("Delete ticket error:", error);
      res.status(500).json({ message: "Failed to delete support ticket" });
    }
  });
  app2.post("/api/admin/cleanup-ticket-notifications", requireAdminAuth, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      let deletedCount = 0;
      for (const user of allUsers) {
        const notifications2 = await storage.getNotificationsByUserId(user.id);
        for (const notification of notifications2) {
          const isTicketNotification = notification.title.toLowerCase().includes("ticket") || notification.title.toLowerCase().includes("support") || notification.message.toLowerCase().includes("ticket") || notification.message.toLowerCase().includes("support") || notification.metadata && typeof notification.metadata === "object" && notification.metadata?.type === "ticket" || notification.actionUrl && notification.actionUrl.includes("ticket");
          if (isTicketNotification) {
            await storage.deleteNotification(notification.id);
            deletedCount++;
          }
        }
      }
      const globalNotifications = await storage.getGlobalNotifications();
      for (const notification of globalNotifications) {
        const isTicketNotification = notification.title.toLowerCase().includes("ticket") || notification.title.toLowerCase().includes("support") || notification.message.toLowerCase().includes("ticket") || notification.message.toLowerCase().includes("support") || notification.metadata && typeof notification.metadata === "object" && notification.metadata?.type === "ticket" || notification.actionUrl && notification.actionUrl.includes("ticket");
        if (isTicketNotification) {
          await storage.deleteNotification(notification.id);
          deletedCount++;
        }
      }
      await storage.createAdminLog({
        adminId: req.session?.admin?.id || null,
        action: "cleanup_ticket_notifications",
        details: `Admin cleaned up ${deletedCount} ticket-related notifications`,
        targetId: null
      });
      res.json({
        message: `Successfully deleted ${deletedCount} ticket-related notifications`,
        deletedCount
      });
    } catch (error) {
      console.error("Cleanup ticket notifications error:", error);
      res.status(500).json({ message: "Failed to cleanup ticket notifications" });
    }
  });
  app2.post("/api/admin/support-tickets/:id/reply", requireAdminAuth, upload.single("file"), async (req, res) => {
    try {
      const { content } = req.body;
      if (!content) return res.status(400).json({ message: "Reply content required" });
      let fileUrl = void 0;
      let fileName = void 0;
      if (req.file) {
        try {
          fileUrl = await cloudinaryStorage2.uploadFile(
            `support-tickets/${req.params.id}/${Date.now()}-${req.file.originalname}`,
            req.file.buffer,
            req.file.mimetype
          );
          fileName = req.file.originalname;
        } catch (error) {
          console.error("Error uploading reply file:", error);
          return res.status(400).json({ message: "File upload failed" });
        }
      }
      const reply = await storage.createTicketReply({
        ticketId: req.params.id,
        userId: req.session?.admin?.id || "",
        senderType: "admin",
        content,
        fileUrl,
        fileName
      });
      await storage.createAdminLog({
        adminId: req.session?.admin?.id || null,
        action: "reply_support_ticket",
        details: `Admin replied to ticket ${req.params.id}`,
        targetId: req.params.id
      });
      res.json({ message: "Reply sent", reply });
    } catch (error) {
      console.error("Send admin reply error:", error);
      res.status(500).json({ message: "Failed to send reply" });
    }
  });
  app2.put("/api/admin/support/tickets/:id/assign", requireAdminAuth, async (req, res) => {
    try {
      const { adminId } = req.body;
      const ticket = await storage.assignSupportTicket(req.params.id, adminId);
      if (!ticket) {
        return res.status(404).json({ message: "Support ticket not found" });
      }
      await storage.createAdminLog({
        adminId: req.session?.admin?.id || null,
        action: "assign_support_ticket",
        details: `Admin assigned support ticket ${req.params.id} to admin ${adminId}`,
        targetId: req.params.id
      });
      res.json({
        message: "Support ticket assigned successfully",
        ticket
      });
    } catch (error) {
      console.error("Assign ticket error:", error);
      res.status(500).json({ message: "Failed to assign support ticket" });
    }
  });
  app2.delete("/api/admin/users/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = req.session?.admin?.id;
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const userConversations = await storage.getConversationsByUserId(id);
      for (const conversation of userConversations) {
        const messages2 = await storage.getMessagesByConversationId(conversation.id);
        for (const message of messages2) {
          await storage.deleteMessage(message.id);
        }
        await storage.deleteConversation(conversation.id);
      }
      await storage.deleteUser(id);
      await storage.createAdminLog({
        adminId,
        action: "delete_user",
        details: `Admin deleted user ${user.email} (${user.fullName}) and all associated data`,
        targetId: id
      });
      res.json({ message: "User and all associated data deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });
  app2.delete("/api/admin/messages/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = req.session?.admin?.id;
      const message = await storage.getMessage(id);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      await storage.deleteMessage(id);
      await storage.createAdminLog({
        adminId,
        action: "delete_message",
        details: `Admin deleted message in conversation ${message.conversationId}`,
        targetId: id
      });
      res.json({ message: "Message deleted successfully" });
    } catch (error) {
      console.error("Delete message error:", error);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });
  app2.delete("/api/admin/conversations/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = req.session?.admin?.id;
      const conversation = await storage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      const messages2 = await storage.getMessagesByConversationId(id);
      for (const message of messages2) {
        await storage.deleteMessage(message.id);
      }
      await storage.deleteConversation(id);
      await storage.createAdminLog({
        adminId,
        action: "delete_conversation",
        details: `Admin deleted conversation and ${messages2.length} messages for user ${conversation.userId}`,
        targetId: id
      });
      res.json({ message: "Conversation and all messages deleted successfully" });
    } catch (error) {
      console.error("Delete conversation error:", error);
      res.status(500).json({ message: "Failed to delete conversation" });
    }
  });
  app2.get("/api/admin/conversations", requireAdminAuth, async (req, res) => {
    try {
      const conversations2 = await storage.getAllActiveConversations();
      const conversationsWithDetails = await Promise.all(
        conversations2.map(async (conversation) => {
          const user = await storage.getUser(conversation.userId);
          const messageCount = await storage.getUnreadMessagesCount(conversation.id, conversation.userId);
          return {
            ...conversation,
            user: user ? { id: user.id, fullName: user.fullName, email: user.email } : null,
            unreadCount: messageCount
          };
        })
      );
      res.json(conversationsWithDetails);
    } catch (error) {
      console.error("Get admin conversations error:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });
  app2.put("/api/admin/conversations/:id/assign", requireAdminAuth, async (req, res) => {
    try {
      const { adminId } = req.body;
      const conversationId = req.params.id;
      const conversation = await storage.updateConversation(conversationId, {
        adminId,
        status: "active"
      });
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      await storage.createAdminLog({
        adminId: req.session?.admin?.id || null,
        action: "assign_conversation",
        details: `Admin assigned conversation ${conversationId} to admin ${adminId}`,
        targetId: conversationId
      });
      res.json({
        message: "Conversation assigned successfully",
        conversation
      });
    } catch (error) {
      console.error("Assign conversation error:", error);
      res.status(500).json({ message: "Failed to assign conversation" });
    }
  });
  app2.put("/api/admin/users/:id/balance", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { amount, type, details, currency } = req.body;
      const targetCurrency = currency?.toUpperCase() || "USD";
      const adjustmentWallet = await ensureUserWallet(req.params.id, targetCurrency);
      if (!adjustmentWallet) {
        return res.status(400).json({ error: `${targetCurrency} wallet is not enabled` });
      }
      const currentBalance = walletAvailableBalance(adjustmentWallet);
      const updateAmount = parseFloat(amount);
      let newBalance;
      let transactionType;
      switch (type) {
        case "add":
          newBalance = currentBalance + updateAmount;
          transactionType = "deposit";
          break;
        case "subtract":
          newBalance = Math.max(0, currentBalance - updateAmount);
          transactionType = "send";
          break;
        case "set":
          newBalance = updateAmount;
          transactionType = updateAmount > currentBalance ? "deposit" : "send";
          break;
        default:
          return res.status(400).json({ error: "Invalid update type" });
      }
      const adjustmentResult = await pool.query(
        `UPDATE wallets SET balance = $1, updated_at = NOW() WHERE id = $2`,
        [newBalance.toFixed(2), adjustmentWallet.id]
      );
      if (adjustmentResult.rowCount !== 1) {
        return res.status(404).json({ error: "Wallet not found" });
      }
      const updatedUser = await storage.getUser(req.params.id);
      const transactionAmount = type === "set" ? Math.abs(newBalance - currentBalance) : updateAmount;
      const transactionData = {
        userId: req.params.id,
        type: transactionType,
        amount: transactionAmount.toFixed(2),
        currency: targetCurrency,
        status: "completed",
        description: details || `Admin ${type} ${targetCurrency} balance adjustment`,
        recipientId: null,
        recipientName: "System Admin",
        fee: "0.00",
        exchangeRate: 1,
        sourceAmount: transactionAmount.toFixed(2),
        sourceCurrency: targetCurrency
      };
      await storage.createTransaction(transactionData);
      res.json({ user: updatedUser, newBalance, currency: targetCurrency });
    } catch (error) {
      console.error("Admin balance update error:", error);
      res.status(500).json({ error: "Failed to update user balance" });
    }
  });
  app2.put("/api/admin/users/:id/card/:action", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { action } = req.params;
      let updateData = {};
      switch (action) {
        case "issue":
          updateData = { hasVirtualCard: true, cardStatus: "active" };
          const cardData = {
            userId: req.params.id,
            cardNumber: `4567${Math.random().toString().slice(2, 14)}`,
            expiryMonth: String((/* @__PURE__ */ new Date()).getMonth() + 1).padStart(2, "0"),
            expiryYear: String((/* @__PURE__ */ new Date()).getFullYear() + 5).slice(-2),
            cvv: Math.floor(Math.random() * 900 + 100).toString(),
            cardholderName: user.fullName || user.username,
            status: "active",
            balance: "0.00",
            cardType: "virtual",
            provider: "Mastercard",
            currency: user.defaultCurrency || "USD",
            pin: Math.floor(Math.random() * 9e3 + 1e3).toString()
          };
          try {
            await storage.createVirtualCard(cardData);
          } catch (error) {
            console.error("Error creating virtual card:", error);
            return res.status(500).json({ error: "Failed to create virtual card" });
          }
          break;
        case "activate":
          if (!user.hasVirtualCard) {
            return res.status(400).json({ error: "User has no virtual card" });
          }
          updateData = { cardStatus: "active" };
          break;
        case "deactivate":
          if (!user.hasVirtualCard) {
            return res.status(400).json({ error: "User has no virtual card" });
          }
          updateData = { cardStatus: "blocked" };
          break;
        default:
          return res.status(400).json({ error: "Invalid action" });
      }
      const updatedUser = await storage.updateUser(req.params.id, updateData);
      res.json({ user: updatedUser });
    } catch (error) {
      console.error("Admin card management error:", error);
      res.status(500).json({ error: "Failed to update card status" });
    }
  });
  app2.put("/api/admin/users/:id/virtual-card", async (req, res) => {
    try {
      const { id } = req.params;
      const { action } = req.body;
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      let result;
      switch (action) {
        case "issue":
          result = await storage.createVirtualCard({
            userId: id,
            purchaseAmount: "60.00"
          });
          await storage.updateUser(id, { hasVirtualCard: true });
          const { messagingService: issueMessaging } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
          const { mailtrapService: issueMailtrap } = await Promise.resolve().then(() => (init_mailtrap(), mailtrap_exports));
          const cardLastFour = result.cardNumber.slice(-4);
          issueMessaging.sendCardActivation(user.phone, cardLastFour).catch((err) => console.error("Card activation notification error:", err));
          if (user.email) {
            issueMailtrap.sendCardActivation(user.email, user.fullName?.split(" ")[0] || "User", user.fullName?.split(" ")[1] || "", cardLastFour).catch((err) => console.error("Card activation email error:", err));
          }
          break;
        case "activate":
        case "freeze":
          const card = await storage.getVirtualCardByUserId(id);
          if (!card) {
            return res.status(404).json({ error: "Virtual card not found" });
          }
          if (card.status === "inactive" && action === "activate") {
            return res.status(400).json({
              error: "Cannot reactivate an inactive card. User must purchase a new card.",
              requiresPurchase: true
            });
          }
          const newStatus = action === "activate" ? "active" : "frozen";
          result = await storage.updateVirtualCard(card.id, { status: newStatus });
          if (action === "activate") {
            const { messagingService: activateMessaging } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
            const { mailtrapService: activateMailtrap } = await Promise.resolve().then(() => (init_mailtrap(), mailtrap_exports));
            const activateCardLastFour = card.cardNumber.slice(-4);
            activateMessaging.sendCardActivation(user.phone, activateCardLastFour).catch((err) => console.error("Card activation notification error:", err));
            if (user.email) {
              activateMailtrap.sendCardActivation(user.email, user.fullName?.split(" ")[0] || "User", user.fullName?.split(" ")[1] || "", activateCardLastFour).catch((err) => console.error("Card activation email error:", err));
            }
          }
          await storage.createAdminLog({
            adminId: req.session.admin?.id || null,
            action: `virtual_card_${action}`,
            details: `Admin ${action}d virtual card for user: ${user.email}`,
            targetId: id
          });
          break;
        case "inactive":
          const inactiveCard = await storage.getVirtualCardByUserId(id);
          if (!inactiveCard) {
            return res.status(404).json({ error: "Virtual card not found" });
          }
          result = await storage.updateVirtualCard(inactiveCard.id, { status: "inactive" });
          await storage.updateUser(id, { hasVirtualCard: false });
          await storage.createAdminLog({
            adminId: req.session.admin?.id || null,
            action: "virtual_card_deactivate",
            details: `Admin permanently deactivated virtual card for user: ${user.email}. User must purchase new card to reactivate.`,
            targetId: id
          });
          break;
        default:
          return res.status(400).json({ error: "Invalid action" });
      }
      res.json({ success: true, result });
    } catch (error) {
      console.error("Virtual card update error:", error);
      res.status(500).json({ error: "Failed to update virtual card" });
    }
  });
  app2.get("/api/admin/kyc", async (req, res) => {
    try {
      const kycDocuments2 = await storage.getAllKycDocuments();
      res.json({ kycDocuments: kycDocuments2 });
    } catch (error) {
      console.error("KYC fetch error:", error);
      res.status(500).json({ message: "Failed to fetch KYC documents" });
    }
  });
  app2.put("/api/admin/kyc/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, verificationNotes } = req.body;
      const updatedKyc = await storage.updateKycDocument(id, {
        status,
        verificationNotes,
        verifiedAt: status === "verified" ? /* @__PURE__ */ new Date() : null
      });
      if (!updatedKyc) {
        return res.status(404).json({ message: "KYC document not found" });
      }
      res.json({ kycDocument: updatedKyc });
    } catch (error) {
      console.error("KYC update error:", error);
      res.status(500).json({ message: "Failed to update KYC document" });
    }
  });
  app2.put("/api/admin/transactions/:id/date", async (req, res) => {
    try {
      const { id } = req.params;
      const { createdAt } = req.body;
      if (!createdAt) {
        return res.status(400).json({ message: "createdAt is required" });
      }
      const updatedTransaction = await storage.updateTransaction(id, {
        createdAt: new Date(createdAt),
        updatedAt: /* @__PURE__ */ new Date()
      });
      if (!updatedTransaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json({ transaction: updatedTransaction });
    } catch (error) {
      console.error("Transaction date update error:", error);
      res.status(500).json({ message: "Failed to update transaction date" });
    }
  });
  app2.post("/api/admin/virtual-cards/:id/reissue", async (req, res) => {
    try {
      const { id } = req.params;
      const oldCard = await storage.getVirtualCardById(id);
      if (!oldCard) {
        return res.status(404).json({ message: "Virtual card not found" });
      }
      const userId = oldCard.userId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      await storage.updateVirtualCard(id, { status: "blocked", blockReason: "Replaced by reissued card" });
      const newCardNumber = `4567${Math.random().toString().slice(2, 14)}`;
      const newCvv = Math.floor(100 + Math.random() * 900).toString();
      const expiryDate = /* @__PURE__ */ new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 3);
      const newExpiryDate = (expiryDate.getMonth() + 1).toString().padStart(2, "0") + "/" + expiryDate.getFullYear().toString().slice(-2);
      const newCard = await storage.createVirtualCard({
        userId,
        cardNumber: newCardNumber,
        expiryDate: newExpiryDate,
        cvv: newCvv,
        cardHolderName: user.fullName || "Card User",
        status: "active",
        balance: "0.00",
        currency: "USD",
        purchaseDate: /* @__PURE__ */ new Date()
      });
      await storage.updateUser(userId, { hasVirtualCard: true, cardStatus: "active" });
      await storage.createAdminLog({
        adminId: req.session?.admin?.id || null,
        action: "card_reissued",
        details: `Admin reissued virtual card for user: ${user.email}. Old card: ${id}, New card: ${newCard.id}`,
        targetId: userId
      });
      await notificationService.sendNotification({
        title: "New Virtual Card Issued",
        body: "Your virtual card has been reissued. Please check the app for your new card details.",
        userId,
        type: "general"
      });
      res.json({
        message: "Card reissued successfully",
        newCard,
        oldCardId: id
      });
    } catch (error) {
      console.error("Card reissue error:", error);
      res.status(500).json({ message: "Failed to reissue card" });
    }
  });
  app2.get("/api/app-downloads", async (req, res) => {
    try {
      const keys = ["play_store_url", "app_store_url", "apk_url", "apk_version", "huawei_app_gallery_url"];
      const out = {};
      for (const key of keys) {
        const setting = await storage.getSystemSetting("app_downloads", key);
        if (setting) {
          const v = setting.value;
          out[key] = typeof v === "string" ? v : v?.value ?? String(v ?? "");
        }
      }
      res.json({
        playStoreUrl: out.play_store_url || "",
        appStoreUrl: out.app_store_url || "",
        apkUrl: out.apk_url || "",
        apkVersion: out.apk_version || "",
        huaweiUrl: out.huawei_app_gallery_url || ""
      });
    } catch (error) {
      console.error("App downloads fetch error:", error);
      res.status(500).json({ message: "Failed to fetch app download links" });
    }
  });
  app2.get("/api/admin/settings", async (req, res) => {
    try {
      const settings = await storage.getSystemSettings();
      res.json({ settings });
    } catch (error) {
      console.error("Settings fetch error:", error);
      res.status(500).json({ message: "Failed to fetch system settings" });
    }
  });
  app2.put("/api/admin/settings/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      const stringValue = typeof value === "string" ? value : String(value);
      let category = req.body.category || "messaging";
      if (!req.body.category) {
        if (key.startsWith("maintenance_") || key === "maintenance_mode" || key === "maintenance_message" || key.startsWith("airtime_") || key === "enable_airtime_bonus" || key === "airtime_bonus_require_kyc" || key === "airtime_bonus_require_email") {
          category = "general";
        } else if (key.includes("fee") || key.includes("limit") || key.includes("amount")) {
          category = "fees";
        }
      }
      let updatedSetting = await storage.updateSystemSetting(key, stringValue);
      if (!updatedSetting) {
        updatedSetting = await storage.createSystemSetting({
          category,
          key,
          value: stringValue
        });
      }
      res.json({ setting: updatedSetting });
    } catch (error) {
      console.error("Setting update error:", error);
      res.status(500).json({ message: "Failed to update setting" });
    }
  });
  app2.post("/api/admin/settings", async (req, res) => {
    try {
      const settingData = req.body;
      const newSetting = await storage.createSystemSetting(settingData);
      res.json({ setting: newSetting });
    } catch (error) {
      console.error("Setting creation error:", error);
      res.status(500).json({ message: "Failed to create setting" });
    }
  });
  app2.get("/api/admin/api-configurations", requireAdminAuth, async (req, res) => {
    try {
      const configurations = await storage.getAllApiConfigurations();
      res.json({ configurations });
    } catch (error) {
      console.error("API configurations fetch error:", error);
      res.status(500).json({ message: "Failed to fetch API configurations" });
    }
  });
  app2.get("/api/admin/api-configurations/:provider", requireAdminAuth, async (req, res) => {
    try {
      const { provider } = req.params;
      const configuration = await storage.getApiConfiguration(provider);
      if (!configuration) {
        return res.status(404).json({ message: "Configuration not found" });
      }
      res.json({ configuration });
    } catch (error) {
      console.error("API configuration fetch error:", error);
      res.status(500).json({ message: "Failed to fetch API configuration" });
    }
  });
  app2.post("/api/admin/api-configurations", requireAdminAuth, async (req, res) => {
    try {
      const configData = req.body;
      const configuration = await storage.createApiConfiguration(configData);
      res.json({ configuration, message: "API configuration created successfully" });
    } catch (error) {
      console.error("API configuration creation error:", error);
      res.status(500).json({ message: "Failed to create API configuration" });
    }
  });
  app2.put("/api/admin/api-configurations/:provider", requireAdminAuth, async (req, res) => {
    try {
      const { provider } = req.params;
      const updates = req.body;
      const configuration = await storage.updateApiConfiguration(provider, updates);
      if (!configuration) {
        return res.status(404).json({ message: "Configuration not found" });
      }
      res.json({ configuration, message: "API configuration updated successfully" });
    } catch (error) {
      console.error("API configuration update error:", error);
      res.status(500).json({ message: "Failed to update API configuration" });
    }
  });
  app2.delete("/api/admin/api-configurations/:provider", requireAdminAuth, async (req, res) => {
    try {
      const { provider } = req.params;
      await storage.deleteApiConfiguration(provider);
      res.json({ message: "API configuration deleted successfully" });
    } catch (error) {
      console.error("API configuration deletion error:", error);
      res.status(500).json({ message: "Failed to delete API configuration" });
    }
  });
  app2.get("/api/users/search", requireAuth, async (req, res) => {
    try {
      const { q: searchQuery } = req.query;
      const currentUserId = req.session?.userId;
      console.log("=== USER SEARCH DEBUG ===");
      console.log("Search Query:", { q: searchQuery, type: typeof searchQuery });
      console.log("Current User ID:", currentUserId);
      console.log("Query Parameter received:", req.query);
      if (!searchQuery || typeof searchQuery !== "string" || searchQuery.length < 2) {
        console.log("Query too short or invalid, returning empty array");
        return res.json({ users: [] });
      }
      const allUsers = await storage.getAllUsers();
      console.log(`[Search] Total users in database: ${allUsers.length}`);
      if (allUsers.length === 0) {
        console.warn("[Search] \u26A0\uFE0F No users found in database!");
      } else {
        console.log("[Search] Sample users:", allUsers.slice(0, 3).map((u) => ({
          id: u.id,
          fullName: u.fullName,
          email: u.email
        })));
      }
      const query = searchQuery.toLowerCase().trim();
      console.log(`[Search] Searching for: "${query}"`);
      const filteredUsers = allUsers.filter((user, idx) => {
        if (user.id === currentUserId) {
          console.log(`[Search] Skipping current user: ${user.email}`);
          return false;
        }
        if (user.isAdmin) {
          console.log(`[Search] Skipping admin user: ${user.email}`);
          return false;
        }
        const fullName = (user.fullName || "").toLowerCase().trim();
        const email = (user.email || "").toLowerCase().trim();
        const phone = (user.phone || "").trim();
        const normalizeToStandardPhone = (p) => {
          if (!p) return "";
          const cleaned = p.replace(/[\+\-\s()]/g, "");
          if (cleaned.startsWith("254")) {
            return cleaned.substring(3);
          } else if (cleaned.startsWith("0")) {
            return cleaned.substring(1);
          }
          return cleaned;
        };
        const normalizedUserPhone = normalizeToStandardPhone(phone);
        const normalizedSearchPhone = normalizeToStandardPhone(searchQuery.trim());
        const emailMatch = email.includes(query);
        const nameMatch = fullName.includes(query) || fullName.split(" ").some((part) => part.toLowerCase().startsWith(query));
        const phoneMatch = normalizedUserPhone && normalizedSearchPhone && (normalizedUserPhone === normalizedSearchPhone || normalizedUserPhone.includes(normalizedSearchPhone) || normalizedSearchPhone.includes(normalizedUserPhone));
        const isMatch = emailMatch || nameMatch || phoneMatch;
        if (isMatch) {
          console.log(`[Search] \u2713 Match found: ${email} | fullName: ${fullName} | emailMatch: ${emailMatch} | nameMatch: ${nameMatch} | phoneMatch: ${phoneMatch}`);
        }
        return isMatch;
      }).slice(0, 10).map((user) => ({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone
      }));
      console.log(`[Search] Final results: found ${filteredUsers.length} matching users`);
      console.log("[Search] Filtered users:", filteredUsers);
      res.json({ users: filteredUsers });
    } catch (error) {
      console.error("[Search] Error searching users:", error);
      res.status(500).json({ message: "Error searching users" });
    }
  });
  app2.get("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const requestedId = req.params.id;
      const sessionUserId = req.session?.userId;
      if (sessionUserId && requestedId !== sessionUserId) {
        return res.status(403).json({ error: "Access denied" });
      }
      const user = await storage.getUser(requestedId);
      if (!user) {
        console.warn(`[GET /api/users/:id] User ${requestedId} not found in database. Destroying stale session.`);
        if (req.session) {
          req.session.destroy(() => {
          });
        }
        return res.status(401).json({ error: "Session expired \u2014 user not found. Please log in again." });
      }
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Error retrieving user:", error);
      res.status(500).json({ error: "Failed to retrieve user data" });
    }
  });
  app2.get("/api/users/:id/login-history", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      const history = await storage.getLoginHistoryByUserId(id, limit);
      res.json({ loginHistory: history });
    } catch (error) {
      console.error("Error retrieving login history:", error);
      res.status(500).json({ error: "Failed to retrieve login history" });
    }
  });
  app2.get("/api/users/me/devices", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const history = await storage.getLoginHistoryByUserId(userId, 20);
      res.json({ devices: history });
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve devices" });
    }
  });
  app2.post("/api/users/me/revoke-all-sessions", requireAuth, async (req, res) => {
    try {
      const userId = req.session?.userId;
      const currentSid = req.session?.id;
      await db.execute(
        sql3`DELETE FROM user_sessions WHERE sess->>'userId' = ${userId} AND sid != ${currentSid}`
      );
      res.json({ message: "All other sessions revoked successfully" });
    } catch (error) {
      console.error("Revoke sessions error:", error);
      res.status(500).json({ error: "Failed to revoke sessions" });
    }
  });
  app2.get("/api/admin/users/:id/devices", async (req, res) => {
    try {
      const { id } = req.params;
      const history = await storage.getLoginHistoryByUserId(id, 30);
      res.json({ devices: history });
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve user devices" });
    }
  });
  app2.post("/api/admin/users/:id/revoke-all-sessions", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await db.execute(
        sql3`DELETE FROM user_sessions WHERE sess->>'userId' = ${id}`
      );
      await storage.createAdminLog({
        adminId: req.session?.admin?.id || null,
        action: "revoke_user_sessions",
        details: `Admin revoked all sessions for user ${id}`,
        targetId: id
      });
      res.json({ message: "All sessions for user revoked" });
    } catch (error) {
      console.error("Admin revoke sessions error:", error);
      res.status(500).json({ error: "Failed to revoke user sessions" });
    }
  });
  app2.get("/api/analytics/:userId/spending", requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const { period = "month" } = req.query;
      const transactions2 = await storage.getTransactionsByUserId(userId);
      const now = /* @__PURE__ */ new Date();
      let startDate;
      switch (period) {
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
      }
      const filteredTransactions = transactions2.filter(
        (tx) => new Date(tx.createdAt) >= startDate && tx.status === "completed"
      );
      const spending = filteredTransactions.filter((tx) => tx.type === "send").reduce((sum2, tx) => sum2 + parseFloat(tx.amount), 0);
      const income = filteredTransactions.filter((tx) => tx.type === "receive").reduce((sum2, tx) => sum2 + parseFloat(tx.amount), 0);
      const categorySpending = filteredTransactions.filter((tx) => tx.type === "send").reduce((acc, tx) => {
        const category = tx.description?.includes("Virtual Card") ? "Virtual Card" : tx.description?.includes("Transfer") ? "Transfer" : tx.description?.includes("Payment") ? "Payment" : "Other";
        acc[category] = (acc[category] || 0) + parseFloat(tx.amount);
        return acc;
      }, {});
      const dailySpending = filteredTransactions.filter((tx) => tx.type === "send").reduce((acc, tx) => {
        const day = new Date(tx.createdAt).toISOString().split("T")[0];
        acc[day] = (acc[day] || 0) + parseFloat(tx.amount);
        return acc;
      }, {});
      res.json({
        period,
        totalSpending: spending,
        totalIncome: income,
        netFlow: income - spending,
        transactionCount: filteredTransactions.length,
        categoryBreakdown: categorySpending,
        dailySpending,
        averageTransaction: filteredTransactions.length > 0 ? (spending + income) / filteredTransactions.length : 0
      });
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });
  app2.post("/api/payment-requests", async (req, res) => {
    try {
      const { fromUserId, toUserId, amount, currency, description, dueDate } = req.body;
      const paymentRequest = await storage.createPaymentRequest({
        fromUserId,
        toUserId,
        amount: parseFloat(amount).toFixed(2),
        currency: currency || "USD",
        description: description || "Payment request",
        dueDate: dueDate ? new Date(dueDate) : null,
        status: "pending"
      });
      await notificationService.sendPaymentRequestNotification(toUserId, fromUserId, amount, currency);
      res.json({ paymentRequest });
    } catch (error) {
      console.error("Payment request creation error:", error);
      res.status(500).json({ message: "Failed to create payment request" });
    }
  });
  app2.get("/api/payment-requests/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { type = "all" } = req.query;
      const allRequests = await storage.getPaymentRequestsByUserId(userId);
      let filteredRequests = allRequests;
      if (type === "sent") {
        filteredRequests = allRequests.filter((req2) => req2.fromUserId === userId);
      } else if (type === "received") {
        filteredRequests = allRequests.filter((req2) => req2.toUserId === userId);
      }
      res.json({ paymentRequests: filteredRequests });
    } catch (error) {
      console.error("Payment requests fetch error:", error);
      res.status(500).json({ message: "Failed to fetch payment requests" });
    }
  });
  app2.put("/api/payment-requests/:id/:action", async (req, res) => {
    try {
      const { id, action } = req.params;
      const { userId } = req.body;
      const paymentRequest = await storage.getPaymentRequest(id);
      if (!paymentRequest) {
        return res.status(404).json({ message: "Payment request not found" });
      }
      if (action === "accept" && paymentRequest.toUserId === userId) {
        const recipient = await storage.getUser(paymentRequest.toUserId);
        const sender = await storage.getUser(paymentRequest.fromUserId);
        if (!recipient || !sender) {
          return res.status(404).json({ message: "User not found" });
        }
        const recipientBalance = parseFloat(recipient.balance || "0");
        const amount = parseFloat(paymentRequest.amount);
        if (recipientBalance < amount) {
          return res.status(400).json({ message: "Insufficient balance" });
        }
        await storage.updateUser(recipient.id, {
          balance: (recipientBalance - amount).toFixed(2)
        });
        await storage.updateUser(sender.id, {
          balance: (parseFloat(sender.balance || "0") + amount).toFixed(2)
        });
        await storage.createTransaction({
          userId: recipient.id,
          type: "send",
          amount: amount.toFixed(2),
          currency: paymentRequest.currency,
          status: "completed",
          description: `Payment to ${sender.fullName}`,
          recipientId: sender.id,
          recipientName: sender.fullName,
          fee: "0.00",
          exchangeRate: "1",
          sourceAmount: amount.toFixed(2),
          sourceCurrency: paymentRequest.currency
        });
        await storage.createTransaction({
          userId: sender.id,
          type: "receive",
          amount: amount.toFixed(2),
          currency: paymentRequest.currency,
          status: "completed",
          description: `Payment from ${recipient.fullName}`,
          recipientId: recipient.id,
          recipientName: recipient.fullName,
          fee: "0.00",
          exchangeRate: "1",
          sourceAmount: amount.toFixed(2),
          sourceCurrency: paymentRequest.currency
        });
        await storage.updatePaymentRequest(id, { status: "completed" });
        await notificationService.sendPaymentNotification(sender.id, "received", amount, paymentRequest.currency);
        await notificationService.sendPaymentNotification(recipient.id, "sent", amount, paymentRequest.currency);
        res.json({ message: "Payment completed successfully" });
      } else if (action === "decline" && paymentRequest.toUserId === userId) {
        await storage.updatePaymentRequest(id, { status: "declined" });
        res.json({ message: "Payment request declined" });
      } else if (action === "cancel" && paymentRequest.fromUserId === userId) {
        await storage.updatePaymentRequest(id, { status: "cancelled" });
        res.json({ message: "Payment request cancelled" });
      } else {
        res.status(403).json({ message: "Not authorized to perform this action" });
      }
    } catch (error) {
      console.error("Payment request action error:", error);
      res.status(500).json({ message: "Failed to process payment request" });
    }
  });
  app2.post("/api/savings-goals", async (req, res) => {
    try {
      const { userId, title, targetAmount, targetDate, description } = req.body;
      const savingsGoal = await storage.createSavingsGoal({
        userId,
        title,
        targetAmount: parseFloat(targetAmount).toFixed(2),
        currentAmount: "0.00",
        targetDate: targetDate ? new Date(targetDate) : null,
        description: description || "",
        isActive: true
      });
      res.json({ savingsGoal });
    } catch (error) {
      console.error("Savings goal creation error:", error);
      res.status(500).json({ message: "Failed to create savings goal" });
    }
  });
  app2.get("/api/savings-goals/:userId", async (req, res) => {
    try {
      const savingsGoals2 = await storage.getSavingsGoalsByUserId(req.params.userId);
      res.json({ savingsGoals: savingsGoals2 });
    } catch (error) {
      console.error("Savings goals fetch error:", error);
      res.status(500).json({ message: "Failed to fetch savings goals" });
    }
  });
  app2.put("/api/savings-goals/:id/contribute", async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, userId } = req.body;
      const savingsGoal = await storage.getSavingsGoal(id);
      if (!savingsGoal) {
        return res.status(404).json({ message: "Savings goal not found" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const contributionAmount = parseFloat(amount);
      const savingsWallet = await getUserWallet(userId, "USD");
      if (!savingsWallet) return res.status(400).json({ message: "USD wallet not found" });
      const userBalance = walletAvailableBalance(savingsWallet);
      if (userBalance < contributionAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      const savingsDebit = await pool.query(
        `UPDATE wallets
         SET balance = balance - $1, updated_at = NOW()
         WHERE id = $2 AND balance - hold_amount - withdrawal_hold_amount >= $1`,
        [contributionAmount, savingsWallet.id]
      );
      if (savingsDebit.rowCount !== 1) return res.status(400).json({ message: "Insufficient balance" });
      const newAmount = parseFloat(savingsGoal.currentAmount || "0") + contributionAmount;
      await storage.updateSavingsGoal(id, {
        currentAmount: newAmount.toFixed(2)
      });
      await storage.createTransaction({
        userId,
        type: "send",
        amount: contributionAmount.toFixed(2),
        currency: "USD",
        status: "completed",
        description: `Savings contribution: ${savingsGoal.title}`,
        recipientId: null,
        recipientName: "Savings Goal",
        fee: "0.00",
        exchangeRate: "1",
        sourceAmount: contributionAmount.toFixed(2),
        sourceCurrency: "USD"
      });
      res.json({ message: "Contribution added successfully", newAmount: newAmount.toFixed(2) });
    } catch (error) {
      console.error("Savings contribution error:", error);
      res.status(500).json({ message: "Failed to add contribution" });
    }
  });
  app2.post("/api/qr-payments/generate", async (req, res) => {
    try {
      const { userId, amount, currency, description } = req.body;
      const paymentCode = `GP${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const qrPayment = await storage.createQRPayment({
        userId,
        paymentCode,
        amount: parseFloat(amount).toFixed(2),
        currency: currency || "USD",
        description: description || "QR Payment",
        isActive: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1e3)
        // 24 hours
      });
      res.json({ qrPayment, paymentCode });
    } catch (error) {
      console.error("QR payment generation error:", error);
      res.status(500).json({ message: "Failed to generate QR payment" });
    }
  });
  app2.post("/api/qr-payments/process", async (req, res) => {
    try {
      const { paymentCode, payerUserId } = req.body;
      const qrPayment = await storage.getQRPaymentByCode(paymentCode);
      if (!qrPayment || !qrPayment.isActive || /* @__PURE__ */ new Date() > new Date(qrPayment.expiresAt)) {
        return res.status(400).json({ message: "Invalid or expired payment code" });
      }
      const payer = await storage.getUser(payerUserId);
      const recipient = await storage.getUser(qrPayment.userId);
      if (!payer || !recipient) {
        return res.status(404).json({ message: "User not found" });
      }
      const amount = parseFloat(qrPayment.amount);
      const payerBalance = parseFloat(payer.balance || "0");
      if (payerBalance < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      await storage.updateUser(payerUserId, {
        balance: (payerBalance - amount).toFixed(2)
      });
      await storage.updateUser(recipient.id, {
        balance: (parseFloat(recipient.balance || "0") + amount).toFixed(2)
      });
      await storage.createTransaction({
        userId: payerUserId,
        type: "send",
        amount: amount.toFixed(2),
        currency: qrPayment.currency,
        status: "completed",
        description: `QR Payment to ${recipient.fullName}`,
        recipientId: recipient.id,
        recipientName: recipient.fullName,
        fee: "0.00",
        exchangeRate: "1",
        sourceAmount: amount.toFixed(2),
        sourceCurrency: qrPayment.currency
      });
      await storage.createTransaction({
        userId: recipient.id,
        type: "receive",
        amount: amount.toFixed(2),
        currency: qrPayment.currency,
        status: "completed",
        description: `QR Payment from ${payer.fullName}`,
        recipientId: payerUserId,
        recipientName: payer.fullName,
        fee: "0.00",
        exchangeRate: "1",
        sourceAmount: amount.toFixed(2),
        sourceCurrency: qrPayment.currency
      });
      await storage.updateQRPayment(qrPayment.id, { isActive: false });
      res.json({ message: "Payment processed successfully" });
    } catch (error) {
      console.error("QR payment processing error:", error);
      res.status(500).json({ message: "Failed to process QR payment" });
    }
  });
  app2.get("/api/admin/payhero-settings", async (req, res) => {
    try {
      const channelIdSetting = await storage.getSystemSetting("payhero", "channel_id");
      const providerSetting = await storage.getSystemSetting("payhero", "provider");
      const cardPriceSetting = await storage.getSystemSetting("virtual_card", "price");
      const channelId = channelIdSetting?.value ? (typeof channelIdSetting.value === "string" ? channelIdSetting.value : JSON.stringify(channelIdSetting.value)).replace(/"/g, "") : "3407";
      const settings = {
        channelId,
        provider: providerSetting?.value || "m-pesa",
        cardPrice: cardPriceSetting?.value || "60.00",
        username: process.env.PAYHERO_USERNAME ? "****" : "",
        password: process.env.PAYHERO_PASSWORD ? "****" : ""
      };
      res.json(settings);
    } catch (error) {
      console.error("Error fetching PayHero settings:", error);
      res.status(500).json({ message: "Error fetching PayHero settings" });
    }
  });
  app2.put("/api/admin/payhero-settings", async (req, res) => {
    try {
      const { channelId, provider, cardPrice } = req.body;
      console.log("Admin updated PayHero settings:", { channelId, provider, cardPrice });
      await storage.setSystemSetting({
        category: "payhero",
        key: "channel_id",
        value: channelId,
        description: "PayHero payment channel ID"
      });
      await storage.setSystemSetting({
        category: "payhero",
        key: "provider",
        value: provider,
        description: "PayHero payment provider"
      });
      if (cardPrice) {
        await storage.setSystemSetting({
          category: "virtual_card",
          key: "price",
          value: cardPrice,
          description: "Virtual card purchase price in USD"
        });
      }
      payHeroService.updateSettings(parseInt(channelId));
      res.json({
        success: true,
        message: "PayHero settings updated successfully",
        channelId,
        provider,
        cardPrice
      });
    } catch (error) {
      console.error("Error updating PayHero settings:", error);
      res.status(500).json({ message: "Error updating PayHero settings" });
    }
  });
  app2.post("/api/admin/test-payhero", async (req, res) => {
    try {
      const { amount, phone, reference } = req.body;
      console.log("Admin testing PayHero connection:", { amount, phone, reference });
      const testResult = await payHeroService.initiateMpesaPayment(
        amount || 1,
        phone || "0700000000",
        reference || `TEST-${Date.now()}`,
        "Test User",
        null
        // No callback for test
      );
      res.json({
        success: testResult.success,
        status: testResult.status,
        reference: testResult.reference,
        message: testResult.success ? "PayHero connection test successful" : `Connection test failed: ${testResult.status}`
      });
    } catch (error) {
      console.error("PayHero connection test error:", error);
      res.status(500).json({
        success: false,
        message: "Connection test failed: " + error.message
      });
    }
  });
  app2.get("/api/admin/manual-payment-settings", async (req, res) => {
    try {
      const paybillSetting = await storage.getSystemSetting("manual_mpesa", "paybill");
      const accountSetting = await storage.getSystemSetting("manual_mpesa", "account");
      const settings = {
        paybill: paybillSetting?.value || "247",
        account: accountSetting?.value || "4664"
      };
      res.json(settings);
    } catch (error) {
      console.error("Error fetching manual payment settings:", error);
      res.status(500).json({ message: "Error fetching manual payment settings" });
    }
  });
  app2.put("/api/admin/manual-payment-settings", async (req, res) => {
    try {
      const { paybill, account } = req.body;
      console.log("Admin updated manual M-Pesa payment settings:", { paybill, account });
      await storage.setSystemSetting({
        category: "manual_mpesa",
        key: "paybill",
        value: paybill,
        description: "Manual M-Pesa paybill number for card purchases"
      });
      await storage.setSystemSetting({
        category: "manual_mpesa",
        key: "account",
        value: account,
        description: "Manual M-Pesa account number for card purchases"
      });
      res.json({
        success: true,
        message: "Manual payment settings updated successfully",
        paybill,
        account
      });
    } catch (error) {
      console.error("Error updating manual payment settings:", error);
      res.status(500).json({ message: "Error updating manual payment settings" });
    }
  });
  app2.get("/api/manual-payment-settings", async (req, res) => {
    try {
      const paybillSetting = await storage.getSystemSetting("manual_mpesa", "paybill");
      res.json({
        paybill: paybillSetting?.value || "247",
        account: "440200259037"
      });
    } catch (error) {
      console.error("Error fetching manual payment settings:", error);
      res.status(500).json({ message: "Error fetching manual payment settings" });
    }
  });
  app2.get("/api/admin/deposit-settings", requireAdminAuth, async (req, res) => {
    try {
      const keys = [
        "mpesa_enabled",
        "crypto_enabled",
        "bank_transfer_enabled",
        "card_enabled",
        "bank_name",
        "bank_account_name",
        "bank_account_number",
        "bank_swift_code",
        "bank_branch",
        "bank_currency",
        "bank_routing_number",
        "bank_additional_info"
      ];
      const result = {};
      for (const key of keys) {
        const s = await storage.getSystemSetting("deposit_methods", key);
        result[key] = s ? String(s.value) : "";
      }
      let bonuses = [];
      try {
        bonuses = await db.select().from(depositBonuses);
      } catch (_) {
      }
      res.json({ methods: result, bonuses });
    } catch (e) {
      res.status(500).json({ message: "Failed to load deposit settings" });
    }
  });
  app2.put("/api/admin/deposit-settings", requireAdminAuth, async (req, res) => {
    try {
      const { methods } = req.body;
      if (!methods || typeof methods !== "object") {
        return res.status(400).json({ message: "Invalid methods object" });
      }
      const allowedKeys = [
        "mpesa_enabled",
        "crypto_enabled",
        "bank_transfer_enabled",
        "card_enabled",
        "bank_name",
        "bank_account_name",
        "bank_account_number",
        "bank_swift_code",
        "bank_branch",
        "bank_currency",
        "bank_routing_number",
        "bank_additional_info"
      ];
      for (const key of allowedKeys) {
        if (key in methods) {
          await storage.setSystemSetting({ category: "deposit_methods", key, value: String(methods[key]), description: `Deposit method setting: ${key}` });
        }
      }
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ message: "Failed to save deposit settings" });
    }
  });
  app2.get("/api/admin/deposit-bonuses", requireAdminAuth, async (req, res) => {
    try {
      const bonuses = await db.select().from(depositBonuses);
      res.json(bonuses);
    } catch (e) {
      res.status(500).json({ message: "Failed to load bonuses" });
    }
  });
  app2.post("/api/admin/deposit-bonuses", requireAdminAuth, async (req, res) => {
    try {
      const { method, minAmount, bonusAmount, bonusType, description, isActive } = req.body;
      const [bonus] = await db.insert(depositBonuses).values({
        method,
        minAmount: String(minAmount),
        bonusAmount: String(bonusAmount),
        bonusType: bonusType || "fixed",
        description,
        isActive: isActive !== false
      }).returning();
      res.json(bonus);
    } catch (e) {
      res.status(500).json({ message: "Failed to create bonus" });
    }
  });
  app2.put("/api/admin/deposit-bonuses/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { method, minAmount, bonusAmount, bonusType, description, isActive } = req.body;
      const [bonus] = await db.update(depositBonuses).set({
        method,
        minAmount: String(minAmount),
        bonusAmount: String(bonusAmount),
        bonusType: bonusType || "fixed",
        description,
        isActive,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq3(depositBonuses.id, id)).returning();
      res.json(bonus);
    } catch (e) {
      res.status(500).json({ message: "Failed to update bonus" });
    }
  });
  app2.delete("/api/admin/deposit-bonuses/:id", requireAdminAuth, async (req, res) => {
    try {
      await db.delete(depositBonuses).where(eq3(depositBonuses.id, req.params.id));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ message: "Failed to delete bonus" });
    }
  });
  app2.get("/api/admin/messaging-settings", async (req, res) => {
    try {
      const apiKeySetting = await storage.getSystemSetting("messaging", "commsGrid_api_key");
      const senderIdSetting = await storage.getSystemSetting("messaging", "commsGrid_sender_id");
      const deviceIdSetting = await storage.getSystemSetting("messaging", "commsGrid_device_id");
      const whatsappAccessTokenSetting = await storage.getSystemSetting("messaging", "whatsapp_access_token");
      const whatsappPhoneNumberIdSetting = await storage.getSystemSetting("messaging", "whatsapp_phone_number_id");
      const whatsappWabaIdSetting = await storage.getSystemSetting("messaging", "whatsapp_business_account_id");
      const settings = {
        commsGridApiKey: apiKeySetting?.value || "",
        commsGridSenderId: senderIdSetting?.value || "",
        commsGridDeviceId: deviceIdSetting?.value || "",
        whatsappAccessToken: whatsappAccessTokenSetting?.value || "",
        whatsappPhoneNumberId: String(whatsappPhoneNumberIdSetting?.value || ""),
        whatsappBusinessAccountId: String(whatsappWabaIdSetting?.value || "")
      };
      console.log("[Messaging Settings] Retrieved CommsGrid + WA settings");
      res.json(settings);
    } catch (error) {
      console.error("Error fetching messaging settings:", error);
      res.status(500).json({ message: "Error fetching messaging settings" });
    }
  });
  app2.put("/api/admin/messaging-settings", async (req, res) => {
    try {
      const { commsGridApiKey, commsGridSenderId, commsGridDeviceId, whatsapp_access_token, whatsapp_phone_number_id, whatsapp_business_account_id } = req.body;
      console.log("Admin updated messaging settings (SMS via CommsGrid, WhatsApp via Meta)");
      await storage.setSystemSetting({
        category: "messaging",
        key: "commsGrid_api_key",
        value: (commsGridApiKey || "").trim(),
        description: "CommsGrid API key (Bearer token)"
      });
      await storage.setSystemSetting({
        category: "messaging",
        key: "commsGrid_sender_id",
        value: (commsGridSenderId || "").trim(),
        description: "CommsGrid sender ID"
      });
      await storage.setSystemSetting({
        category: "messaging",
        key: "commsGrid_device_id",
        value: (commsGridDeviceId || "").trim(),
        description: "CommsGrid device ID (optional)"
      });
      await storage.setSystemSetting({
        category: "messaging",
        key: "whatsapp_access_token",
        value: (whatsapp_access_token || "").trim(),
        description: "Meta WhatsApp Business API access token"
      });
      await storage.setSystemSetting({
        category: "messaging",
        key: "whatsapp_phone_number_id",
        value: String(whatsapp_phone_number_id || "").trim(),
        description: "Meta WhatsApp Business phone number ID"
      });
      await storage.setSystemSetting({
        category: "messaging",
        key: "whatsapp_business_account_id",
        value: String(whatsapp_business_account_id || "").trim(),
        description: "Meta WhatsApp Business Account ID (WABA ID)"
      });
      if (commsGridApiKey) process.env.COMMSGRID_API_KEY = (commsGridApiKey || "").trim();
      if (commsGridSenderId) process.env.COMMSGRID_SENDER_ID = (commsGridSenderId || "").trim();
      if (commsGridDeviceId) process.env.COMMSGRID_DEVICE_ID = (commsGridDeviceId || "").trim();
      process.env.WHATSAPP_ACCESS_TOKEN = (whatsapp_access_token || "").trim();
      process.env.WHATSAPP_PHONE_NUMBER_ID = String(whatsapp_phone_number_id || "").trim();
      process.env.WHATSAPP_BUSINESS_ACCOUNT_ID = String(whatsapp_business_account_id || "").trim();
      console.log("[Messaging Settings] Updated CommsGrid SMS + WhatsApp");
      if (whatsapp_access_token && whatsapp_phone_number_id) {
        const { whatsappService: whatsappService2 } = await Promise.resolve().then(() => (init_whatsapp(), whatsapp_exports));
        await whatsappService2.refreshCredentials();
        console.log("[WhatsApp] Credentials refreshed after admin update");
      }
      res.json({
        success: true,
        message: "Messaging settings updated successfully"
      });
    } catch (error) {
      console.error("Error updating messaging settings:", error);
      res.status(500).json({ message: "Error updating messaging settings" });
    }
  });
  app2.get("/api/admin/message-toggles", async (req, res) => {
    try {
      const enableOtpSetting = await storage.getSystemSetting("messaging", "enable_otp_messages");
      const enablePasswordSetting = await storage.getSystemSetting("messaging", "enable_password_reset_messages");
      const enableFundSetting = await storage.getSystemSetting("messaging", "enable_fund_receipt_messages");
      const enableKycSetting = await storage.getSystemSetting("messaging", "enable_kyc_verified_messages");
      const enableCardSetting = await storage.getSystemSetting("messaging", "enable_card_activation_messages");
      const enableLoginAlertSetting = await storage.getSystemSetting("messaging", "enable_login_alert_messages");
      res.json({
        enableOtpMessages: enableOtpSetting?.value !== "false",
        enablePasswordResetMessages: enablePasswordSetting?.value !== "false",
        enableFundReceiptMessages: enableFundSetting?.value !== "false",
        enableKycVerifiedMessages: enableKycSetting?.value !== "false",
        enableCardActivationMessages: enableCardSetting?.value !== "false",
        enableLoginAlertMessages: enableLoginAlertSetting?.value !== "false"
      });
    } catch (error) {
      console.error("Error fetching message toggles:", error);
      res.status(500).json({ message: "Error fetching message toggles" });
    }
  });
  app2.put("/api/admin/message-toggles", async (req, res) => {
    try {
      const { enableOtpMessages, enablePasswordResetMessages, enableFundReceiptMessages, enableKycVerifiedMessages, enableCardActivationMessages, enableLoginAlertMessages } = req.body;
      await storage.setSystemSetting({
        category: "messaging",
        key: "enable_otp_messages",
        value: enableOtpMessages ? "true" : "false",
        description: "Send OTP verification messages"
      });
      await storage.setSystemSetting({
        category: "messaging",
        key: "enable_password_reset_messages",
        value: enablePasswordResetMessages ? "true" : "false",
        description: "Send password reset messages"
      });
      await storage.setSystemSetting({
        category: "messaging",
        key: "enable_fund_receipt_messages",
        value: enableFundReceiptMessages ? "true" : "false",
        description: "Send fund receipt notifications"
      });
      await storage.setSystemSetting({
        category: "messaging",
        key: "enable_kyc_verified_messages",
        value: enableKycVerifiedMessages ? "true" : "false",
        description: "Send KYC verified notifications"
      });
      await storage.setSystemSetting({
        category: "messaging",
        key: "enable_card_activation_messages",
        value: enableCardActivationMessages ? "true" : "false",
        description: "Send card activation messages"
      });
      await storage.setSystemSetting({
        category: "messaging",
        key: "enable_login_alert_messages",
        value: enableLoginAlertMessages ? "true" : "false",
        description: "Send login alert notifications"
      });
      console.log("Message toggles updated:", { enableOtpMessages, enablePasswordResetMessages, enableFundReceiptMessages, enableKycVerifiedMessages, enableCardActivationMessages, enableLoginAlertMessages });
      res.json({
        success: true,
        message: "Message toggles updated successfully"
      });
    } catch (error) {
      console.error("Error updating message toggles:", error);
      res.status(500).json({ message: "Error updating message toggles" });
    }
  });
  app2.post("/api/admin/whatsapp/create-templates", requireAdminAuth, async (req, res) => {
    try {
      const { whatsappService: whatsappService2 } = await Promise.resolve().then(() => (init_whatsapp(), whatsapp_exports));
      console.log("[Admin] Creating WhatsApp templates...");
      const results = await whatsappService2.createAllTemplates();
      const response = {
        message: "WhatsApp template creation completed",
        success: results.success,
        failed: results.failed,
        successCount: results.success.length,
        failedCount: results.failed.length,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      console.log("[Admin] Template creation results:", response);
      res.json(response);
    } catch (error) {
      console.error("[Admin] Create templates error:", error);
      res.status(500).json({
        message: "Failed to create templates",
        error: String(error),
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  });
  app2.get("/api/admin/whatsapp/templates", requireAdminAuth, async (req, res) => {
    try {
      const { whatsappService: whatsappService2 } = await Promise.resolve().then(() => (init_whatsapp(), whatsapp_exports));
      const templates = await whatsappService2.fetchTemplatesFromMeta();
      res.json({
        templates,
        count: templates.length,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      console.error("[Admin] Fetch templates error:", error);
      res.status(500).json({
        message: "Failed to fetch templates from Meta",
        error: String(error),
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  });
  app2.get("/api/admin/verification-settings", requireAdminAuth, async (req, res) => {
    try {
      const enableOtpSetting = await storage.getSystemSetting("verification", "enable_phone_otp_login");
      const enableEmailVerifySetting = await storage.getSystemSetting("verification", "enable_email_verification");
      const enableLoginAlertSetting = await storage.getSystemSetting("verification", "enable_login_alert");
      res.json({
        enablePhoneOtpLogin: enableOtpSetting?.value !== "false",
        enableEmailVerification: enableEmailVerifySetting?.value !== "false",
        enableLoginAlert: enableLoginAlertSetting?.value !== "false"
      });
    } catch (error) {
      console.error("Error fetching verification settings:", error);
      res.status(500).json({ message: "Error fetching verification settings" });
    }
  });
  app2.put("/api/admin/verification-settings", requireAdminAuth, async (req, res) => {
    try {
      const { enablePhoneOtpLogin, enableEmailVerification, enableLoginAlert } = req.body;
      await storage.setSystemSetting({
        category: "verification",
        key: "enable_phone_otp_login",
        value: enablePhoneOtpLogin ? "true" : "false",
        description: "Require phone OTP for login"
      });
      await storage.setSystemSetting({
        category: "verification",
        key: "enable_email_verification",
        value: enableEmailVerification ? "true" : "false",
        description: "Require email verification during signup"
      });
      await storage.setSystemSetting({
        category: "verification",
        key: "enable_login_alert",
        value: enableLoginAlert ? "true" : "false",
        description: "Send login alerts to user"
      });
      console.log("Verification settings updated:", { enablePhoneOtpLogin, enableEmailVerification, enableLoginAlert });
      res.json({
        success: true,
        message: "Verification settings updated successfully"
      });
    } catch (error) {
      console.error("Error updating verification settings:", error);
      res.status(500).json({ message: "Error updating verification settings" });
    }
  });
  app2.post("/api/admin/send-message", async (req, res) => {
    try {
      const { userId, message } = req.body;
      if (!userId || !message) {
        return res.status(400).json({ message: "User ID and message are required" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { messagingService: messagingService3 } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
      const result = await messagingService3.sendMessage(user.phone, message);
      console.log(`Admin sent message to ${user.fullName} (${user.phone}):`, { sms: result.sms, whatsapp: result.whatsapp });
      res.json({
        success: true,
        message: "Message sent successfully",
        sms: result.sms,
        whatsapp: result.whatsapp
      });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Error sending message" });
    }
  });
  app2.get("/api/admin/email-settings", requireAdminAuth, async (req, res) => {
    try {
      const smtpHostSetting = await storage.getSystemSetting("email", "smtp_host");
      const smtpPortSetting = await storage.getSystemSetting("email", "smtp_port");
      const smtpSecureSetting = await storage.getSystemSetting("email", "smtp_secure");
      const smtpUsernameSetting = await storage.getSystemSetting("email", "smtp_username");
      const smtpPasswordSetting = await storage.getSystemSetting("email", "smtp_password");
      const fromEmailSetting = await storage.getSystemSetting("email", "from_email");
      const fromNameSetting = await storage.getSystemSetting("email", "from_name");
      const settings = {
        smtpHost: smtpHostSetting?.value || "",
        smtpPort: smtpPortSetting?.value || "465",
        smtpSecure: smtpSecureSetting?.value || "true",
        smtpUsername: smtpUsernameSetting?.value || "",
        smtpPassword: smtpPasswordSetting?.value || "",
        fromEmail: fromEmailSetting?.value || "",
        fromName: fromNameSetting?.value || "GreenPay"
      };
      res.json(settings);
    } catch (error) {
      console.error("Error fetching email settings:", error);
      res.status(500).json({ message: "Error fetching email settings" });
    }
  });
  app2.put("/api/admin/email-settings", requireAdminAuth, async (req, res) => {
    try {
      const { smtpHost, smtpPort, smtpSecure, smtpUsername, smtpPassword, fromEmail, fromName } = req.body;
      console.log("Admin updated email settings");
      await storage.setSystemSetting({
        category: "email",
        key: "smtp_host",
        value: (smtpHost || "").trim(),
        description: "SMTP server hostname"
      });
      await storage.setSystemSetting({
        category: "email",
        key: "smtp_port",
        value: (smtpPort || "465").toString(),
        description: "SMTP server port"
      });
      await storage.setSystemSetting({
        category: "email",
        key: "smtp_secure",
        value: smtpSecure ? "true" : "false",
        description: "Use SSL/TLS for SMTP"
      });
      await storage.setSystemSetting({
        category: "email",
        key: "smtp_username",
        value: (smtpUsername || "").trim(),
        description: "SMTP username"
      });
      await storage.setSystemSetting({
        category: "email",
        key: "smtp_password",
        value: (smtpPassword || "").trim(),
        description: "SMTP password"
      });
      await storage.setSystemSetting({
        category: "email",
        key: "from_email",
        value: (fromEmail || "").trim(),
        description: "From email address"
      });
      await storage.setSystemSetting({
        category: "email",
        key: "from_name",
        value: (fromName || "GreenPay").trim(),
        description: "From name"
      });
      res.json({
        success: true,
        message: "Email settings updated successfully"
      });
    } catch (error) {
      console.error("Error updating email settings:", error);
      res.status(500).json({ message: "Error updating email settings" });
    }
  });
  app2.post("/api/admin/send-test-email", requireAdminAuth, async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email address is required" });
      }
      const { emailService: emailService2 } = await Promise.resolve().then(() => (init_email(), email_exports));
      const result = await emailService2.sendTestEmail(email);
      if (result) {
        console.log(`Admin sent test email to ${email}`);
        res.json({
          success: true,
          message: "Test email sent successfully"
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to send test email. Please check your email configuration."
        });
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      res.status(500).json({ message: "Error sending test email" });
    }
  });
  app2.post("/api/admin/send-custom-email", requireAdminAuth, async (req, res) => {
    try {
      const { email, subject, message, imageUrl, linkText, linkUrl } = req.body;
      if (!email || !subject || !message) {
        return res.status(400).json({ message: "Email, subject, and message are required" });
      }
      const { emailService: emailService2 } = await Promise.resolve().then(() => (init_email(), email_exports));
      const { emailTemplates: emailTemplates2 } = await Promise.resolve().then(() => (init_email_templates(), email_templates_exports));
      const html = emailTemplates2.custom({
        message,
        imageUrl: imageUrl || void 0,
        linkText: linkText || void 0,
        linkUrl: linkUrl || void 0
      });
      const result = await emailService2.sendEmail(email, subject, html);
      if (result) {
        console.log(`Admin sent custom email to ${email} with subject: ${subject}`);
        res.json({
          success: true,
          message: "Custom email sent successfully"
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Failed to send custom email. Please check your email configuration."
        });
      }
    } catch (error) {
      console.error("Error sending custom email:", error);
      res.status(500).json({ message: "Error sending custom email" });
    }
  });
  app2.post("/api/transfer", requireAuth, async (req, res) => {
    try {
      const { fromUserId, toUserId, amount, currency, description, pin } = req.body;
      console.log("=== TRANSFER DEBUG ===");
      console.log("Request Body:", { fromUserId, toUserId, amount, currency });
      if (!fromUserId || !toUserId || !amount || !currency) {
        console.error("[Transfer] Missing required fields:", { fromUserId: !!fromUserId, toUserId: !!toUserId, amount: !!amount, currency: !!currency });
        return res.status(400).json({ message: "Missing required fields" });
      }
      const transferAmount = parseFloat(amount);
      if (transferAmount <= 0) {
        console.error("[Transfer] Invalid amount:", transferAmount);
        return res.status(400).json({ message: "Invalid transfer amount" });
      }
      console.log("[Transfer] Fetching users...");
      const fromUser = await storage.getUser(fromUserId);
      const toUser = await storage.getUser(toUserId);
      console.log("[Transfer] From User:", { found: !!fromUser, balance: fromUser?.balance, email: fromUser?.email });
      console.log("[Transfer] To User:", { found: !!toUser, balance: toUser?.balance, email: toUser?.email });
      if (!fromUser || !toUser) {
        console.error("[Transfer] User not found - fromUser:", !!fromUser, "toUser:", !!toUser);
        return res.status(404).json({ message: "User not found" });
      }
      const settings = await storage.getSystemSettings();
      const pinRequiredByAdmin = settings.some((s) => s.key === "pin_required" && s.value === "true");
      if ((pinRequiredByAdmin || fromUser.pinEnabled) && fromUser.pinCode) {
        if (!pin) {
          return res.status(400).json({ message: "PIN required", requiresPin: true });
        }
        const isPinValid = await bcrypt2.compare(pin, fromUser.pinCode);
        if (!isPinValid) {
          return res.status(401).json({ message: "Invalid PIN", success: false });
        }
      }
      const transferCurrency = normalizeCurrency(currency);
      const senderWallet = await getUserWallet(fromUserId, transferCurrency);
      const recipientWallet = await ensureUserWallet(toUserId, transferCurrency);
      if (!senderWallet || !recipientWallet) {
        return res.status(400).json({ message: `${transferCurrency} wallet is not available` });
      }
      const senderBalance = walletAvailableBalance(senderWallet);
      const recipientBalance = walletAvailableBalance(recipientWallet);
      if (senderBalance < transferAmount) {
        console.error("[Transfer] Insufficient balance:", { senderBalance, transferAmount });
        return res.status(400).json({ message: "Insufficient balance" });
      }
      const senderNewBalance = senderBalance - transferAmount;
      const recipientNewBalance = recipientBalance + transferAmount;
      console.log("[Transfer] Balance calculation:", {
        senderOld: senderBalance,
        senderNew: senderNewBalance,
        recipientOld: recipientBalance,
        recipientNew: recipientNewBalance,
        transferAmount
      });
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const transferId = storage.generateTransactionReference();
      const senderTransaction = await storage.createTransaction({
        userId: fromUserId,
        type: "send",
        amount,
        currency: transferCurrency,
        status: "completed",
        description: description || `Transfer to ${toUser.fullName}`,
        recipient: toUser.fullName,
        recipientEmail: toUser.email,
        transferId,
        fee: "0"
      });
      const recipientTransaction = await storage.createTransaction({
        userId: toUserId,
        type: "receive",
        amount,
        currency: transferCurrency,
        status: "completed",
        description: description || `Transfer from ${fromUser.fullName}`,
        sender: fromUser.fullName,
        senderEmail: fromUser.email,
        transferId,
        fee: "0"
      });
      const senderDebit = await pool.query(
        `UPDATE wallets
         SET balance = balance - $1, updated_at = NOW()
         WHERE id = $2 AND balance - hold_amount - withdrawal_hold_amount >= $1`,
        [transferAmount, senderWallet.id]
      );
      if (senderDebit.rowCount !== 1) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      await pool.query(
        `UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE id = $2`,
        [transferAmount, recipientWallet.id]
      );
      const { MailtrapService: MailtrapService2 } = await Promise.resolve().then(() => (init_mailtrap(), mailtrap_exports));
      const mailtrapService3 = new MailtrapService2();
      const transactionDate = (/* @__PURE__ */ new Date()).toISOString();
      mailtrapService3.sendTemplate(
        toUser.email,
        "5e2a2ec4-37fb-4178-96c4-598977065f9c",
        {
          sender: fromUser.fullName,
          amount,
          currency,
          date: transactionDate,
          transaction_id: recipientTransaction.id
        }
      ).then((success) => {
        if (success) {
          console.log(`\u2705 Fund receipt email sent to ${toUser.email} - Transaction ID: ${recipientTransaction.id}, Sender: ${fromUser.fullName}, Amount: ${amount} ${currency}, Date: ${transactionDate}`);
        } else {
          console.warn(`\u26A0\uFE0F Failed to send fund receipt email to ${toUser.email}`);
        }
      }).catch((err) => {
        console.error("Email sending error:", err);
      });
      const { messagingService: messagingService3 } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
      messagingService3.sendMessage(
        fromUser.phone,
        `You sent $${transferAmount} to ${toUser.fullName}. Your new balance: $${senderNewBalance.toFixed(2)}`
      ).catch((err) => console.error("Notification error:", err));
      messagingService3.sendMessage(
        toUser.phone,
        `You received $${transferAmount} from ${fromUser.fullName}. Your new balance: $${recipientNewBalance.toFixed(2)}`
      ).catch((err) => console.error("Notification error:", err));
      console.log(`[Transfer] Completed: $${transferAmount} from ${fromUser.fullName} (${fromUserId}) to ${toUser.fullName} (${toUserId})`);
      res.json({
        success: true,
        transferId,
        message: "Transfer completed successfully",
        senderNewBalance: senderNewBalance.toFixed(2),
        recipientNewBalance: recipientNewBalance.toFixed(2)
      });
    } catch (error) {
      console.error("Transfer error:", error);
      res.status(500).json({ message: "Error processing transfer" });
    }
  });
  app2.post("/api/auth/reset-pin", async (req, res) => {
    try {
      const { phone, code, newPin } = req.body;
      if (!phone || !code || !newPin) {
        return res.status(400).json({ message: "Phone, code, and new PIN are required" });
      }
      if (!/^\d{4}$/.test(newPin)) {
        return res.status(400).json({ message: "PIN must be 4 digits" });
      }
      const { messagingService: messagingService3 } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
      let user;
      if (phone.includes("@")) {
        user = await storage.getUserByEmail(phone);
      } else {
        const formattedPhone = messagingService3.formatPhoneNumber(phone);
        user = await storage.getUserByPhone(formattedPhone);
      }
      if (!user) {
        console.error(`[ResetPIN] User not found for contact: ${phone}`);
        return res.status(404).json({ message: "User not found" });
      }
      const isValid = await storage.verifyUserOtp(user.id, code);
      if (!isValid) {
        return res.status(400).json({ message: "Invalid or expired reset code" });
      }
      const hashedPin = await bcrypt2.hash(newPin, 10);
      await storage.updateUser(user.id, {
        pinCode: hashedPin,
        pinEnabled: true
      });
      await storage.updateUserOtp(user.id, null, null);
      console.log(`[ResetPIN] Success for user ${user.id}`);
      res.json({ success: true, message: "PIN reset successful" });
    } catch (error) {
      console.error("Reset PIN error:", error);
      res.status(500).json({ message: "Failed to reset PIN" });
    }
  });
  app2.post("/api/users/:id/pin/setup", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { pin } = req.body;
      if (!pin || pin.length !== 4) {
        return res.status(400).json({ message: "PIN must be 4 digits" });
      }
      if (!/^\d{4}$/.test(pin)) {
        return res.status(400).json({ message: "PIN must contain only numbers" });
      }
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const hashedPin = await bcrypt2.hash(pin, 10);
      await storage.updateUser(id, {
        pinCode: hashedPin,
        pinEnabled: true
      });
      const updatedUser = await storage.getUser(id);
      const { password: _, ...userResponse } = updatedUser;
      res.json({ message: "PIN set successfully", user: userResponse });
    } catch (error) {
      console.error("PIN setup error:", error);
      res.status(500).json({ message: "Failed to set PIN" });
    }
  });
  app2.post("/api/users/:id/pin/verify", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { pin } = req.body;
      if (!pin || pin.length !== 4) {
        return res.status(400).json({ message: "Invalid PIN", success: false });
      }
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found", success: false });
      }
      if (!user.pinEnabled || !user.pinCode) {
        return res.status(400).json({ message: "PIN not set up", success: false });
      }
      const isPinValid = await bcrypt2.compare(pin, user.pinCode);
      if (!isPinValid) {
        return res.status(401).json({ message: "Invalid PIN", success: false });
      }
      res.json({ success: true, message: "PIN verified" });
    } catch (error) {
      console.error("PIN verification error:", error);
      res.status(500).json({ message: "PIN verification failed", success: false });
    }
  });
  app2.post("/api/auth/verify-pin", async (req, res) => {
    try {
      const { userId, pin } = req.body;
      if (!userId || !pin) {
        return res.status(400).json({ message: "User ID and PIN are required" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (!user.pinEnabled || !user.pinCode) {
        return res.status(400).json({ message: "PIN not set up" });
      }
      const isPinValid = await bcrypt2.compare(pin, user.pinCode);
      if (!isPinValid) {
        return res.status(401).json({ message: "Invalid PIN" });
      }
      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regeneration error:", err);
          return res.status(500).json({ message: "Session error" });
        }
        req.session.userId = user.id;
        req.session.user = { id: user.id, email: user.email };
        storage.createLoginHistory({
          userId: user.id,
          ipAddress: req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "Unknown",
          userAgent: req.headers["user-agent"] || "Unknown",
          deviceType: req.headers["user-agent"]?.includes("Mobile") ? "mobile" : "desktop",
          browser: req.headers["user-agent"]?.split("/")[0] || "Unknown",
          location: req.headers["cf-ipcountry"] || "Unknown",
          status: "success"
        }).catch((err2) => console.error("Login history error:", err2));
        const { password: _, ...userResponse } = user;
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ message: "Session save error" });
          }
          res.json({ user: userResponse });
        });
      });
    } catch (error) {
      console.error("PIN login verification error:", error);
      res.status(500).json({ message: "PIN verification failed" });
    }
  });
  app2.post("/api/users/:id/pin/disable", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { password } = req.body;
      if (!password) {
        return res.status(400).json({ message: "Password is required to disable PIN" });
      }
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const isPasswordValid = await bcrypt2.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid password" });
      }
      const { db: db2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { users: users2 } = await Promise.resolve().then(() => (init_schema(), schema_exports));
      const { eq: eq4 } = await import("drizzle-orm");
      await db2.update(users2).set({
        pinEnabled: false,
        pinCode: null
      }).where(eq4(users2.id, id));
      const updatedUser = await storage.getUser(id);
      if (req.session.user) {
        req.session.user.pinEnabled = false;
      }
      const { password: _, ...userResponse } = updatedUser;
      res.json({ success: true, message: "PIN disabled successfully", user: userResponse });
    } catch (error) {
      console.error("PIN disable error:", error);
      res.status(500).json({ message: "Failed to disable PIN" });
    }
  });
  app2.get("/api/system-settings", async (req, res) => {
    try {
      const settings = await storage.getSystemSettings();
      const settingsMap = {};
      settings.forEach((setting) => {
        if (!settingsMap[setting.category]) {
          settingsMap[setting.category] = {};
        }
        settingsMap[setting.category][setting.key] = {
          value: setting.value,
          description: setting.description
        };
      });
      res.json(settingsMap);
    } catch (error) {
      console.error("System settings error:", error);
      res.status(500).json({ message: "Failed to load system settings" });
    }
  });
  app2.get("/api/notifications/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const userNotifications = await storage.getNotificationsByUserId(userId);
      const globalNotifications = await storage.getGlobalNotifications();
      const allNotifications = [...userNotifications, ...globalNotifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json({ notifications: allNotifications });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Error fetching notifications" });
    }
  });
  app2.post("/api/notifications/:id/read", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.markNotificationAsRead(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Error updating notification" });
    }
  });
  app2.delete("/api/notifications/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteNotification(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Error deleting notification" });
    }
  });
  app2.get("/api/admin/withdrawals", async (req, res) => {
    try {
      const transactions2 = await storage.getAllTransactions();
      const withdrawals = transactions2.filter((t) => t.type === "withdraw");
      const withdrawalsWithUserInfo = await Promise.all(
        withdrawals.map(async (withdrawal) => {
          const user = await storage.getUser(withdrawal.userId);
          return {
            ...withdrawal,
            userInfo: {
              fullName: user?.fullName || "Unknown",
              email: user?.email || "Unknown",
              phone: user?.phone || "Unknown"
            }
          };
        })
      );
      res.json({ withdrawals: withdrawalsWithUserInfo });
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
      res.status(500).json({ message: "Error fetching withdrawal requests" });
    }
  });
  app2.post("/api/admin/withdrawals/:id/approve", async (req, res) => {
    try {
      const { id } = req.params;
      const { adminNotes } = req.body;
      const transaction = await storage.updateTransaction(id, {
        status: "completed",
        adminNotes: adminNotes || "Approved by admin",
        processedAt: /* @__PURE__ */ new Date()
      });
      if (transaction) {
        const user = await storage.getUser(transaction.userId);
        if (user) {
          const withdrawalAmount = parseFloat(transaction.amount);
          const withdrawalFee = parseFloat(transaction.fee || "0");
          const totalDeduction = withdrawalAmount + withdrawalFee;
          const wallet = await getUserWallet(user.id, transaction.currency);
          if (!wallet) {
            return res.status(400).json({ message: `${transaction.currency} wallet not found` });
          }
          await pool.query(
            `UPDATE wallets
             SET withdrawal_hold_amount = GREATEST(0, withdrawal_hold_amount - $1),
                 balance = GREATEST(0, balance - $1),
                 updated_at = NOW()
             WHERE id = $2`,
            [totalDeduction, wallet.id]
          );
          await notificationService.sendNotification({
            title: "Withdrawal Approved",
            body: `Your withdrawal of ${transaction.currency} ${transaction.amount} has been approved and processed.`,
            userId: user.id,
            type: "transaction"
          });
        }
      }
      res.json({ transaction, message: "Withdrawal approved successfully" });
    } catch (error) {
      console.error("Error approving withdrawal:", error);
      res.status(500).json({ message: "Error approving withdrawal" });
    }
  });
  app2.post("/api/admin/withdrawals/:id/reject", async (req, res) => {
    try {
      const { id } = req.params;
      const { adminNotes } = req.body;
      const transaction = await storage.updateTransaction(id, {
        status: "failed",
        adminNotes: adminNotes || "Rejected by admin",
        processedAt: /* @__PURE__ */ new Date()
      });
      if (transaction) {
        const user = await storage.getUser(transaction.userId);
        if (user) {
          const refundAmount = parseFloat(transaction.amount) + parseFloat(transaction.fee || "0");
          const wallet = await getUserWallet(transaction.userId, transaction.currency);
          if (wallet) {
            await pool.query(
              `UPDATE wallets
               SET withdrawal_hold_amount = GREATEST(0, withdrawal_hold_amount - $1),
                   updated_at = NOW()
               WHERE id = $2`,
              [refundAmount, wallet.id]
            );
          }
          console.log(`\u2705 Released ${transaction.currency} ${refundAmount} withdrawal hold for ${user.email}`);
          await notificationService.sendNotification({
            title: "Withdrawal Rejected & Refunded",
            body: `Your withdrawal request has been rejected. ${transaction.currency} ${refundAmount} has been refunded to your account. ${adminNotes || "Please contact support for details."}`,
            userId: user.id,
            type: "transaction"
          });
        }
      }
      res.json({ transaction, message: "Withdrawal rejected and balance refunded" });
    } catch (error) {
      console.error("Error rejecting withdrawal:", error);
      res.status(500).json({ message: "Error rejecting withdrawal" });
    }
  });
  app2.post("/api/admin/broadcast-notification", async (req, res) => {
    try {
      const { title, message, type, actionUrl, expiresIn } = req.body;
      if (!title || !message) {
        return res.status(400).json({ message: "Title and message are required" });
      }
      const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 60 * 1e3) : null;
      const notification = await storage.createNotification({
        title,
        message,
        type: type || "info",
        isGlobal: true,
        actionUrl,
        expiresAt
      });
      res.json({
        success: true,
        notification,
        message: "Notification broadcast successfully"
      });
    } catch (error) {
      console.error("Error broadcasting notification:", error);
      res.status(500).json({ message: "Error broadcasting notification" });
    }
  });
  app2.get("/api/admin/notifications", async (req, res) => {
    try {
      const globalNotifications = await storage.getGlobalNotifications();
      res.json({ notifications: globalNotifications });
    } catch (error) {
      console.error("Error fetching admin notifications:", error);
      res.status(500).json({ message: "Error fetching notifications" });
    }
  });
  app2.delete("/api/admin/notifications/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteNotification(id);
      res.json({
        success: true,
        message: "Notification deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Error deleting notification" });
    }
  });
  app2.get("/api/admin/system-logs", async (req, res) => {
    try {
      const minutes = req.query.minutes ? parseInt(req.query.minutes) : 30;
      const logs = await storage.getSystemLogs(minutes);
      res.json({ logs });
    } catch (error) {
      console.error("Error fetching system logs:", error);
      res.status(500).json({ message: "Error fetching system logs" });
    }
  });
  app2.put("/api/admin/withdrawals/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;
      if (!status || !["pending", "completed", "failed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be pending, completed, or failed." });
      }
      const updatedWithdrawal = await storage.updateWithdrawalRequest(id, {
        status,
        adminNotes,
        processedAt: status !== "pending" ? /* @__PURE__ */ new Date() : null
      });
      if (!updatedWithdrawal) {
        return res.status(404).json({ message: "Withdrawal request not found" });
      }
      res.json({
        withdrawal: updatedWithdrawal,
        message: `Withdrawal status updated to ${status}`
      });
    } catch (error) {
      console.error("Error updating withdrawal status:", error);
      res.status(500).json({ message: "Error updating withdrawal status" });
    }
  });
  app2.get("/api/system-settings/card-price", async (req, res) => {
    try {
      const cardPriceSetting = await storage.getSystemSetting("virtual_card", "price");
      const cardPrice = cardPriceSetting?.value || "60.00";
      res.json({ price: cardPrice });
    } catch (error) {
      console.error("Error fetching card price:", error);
      res.status(500).json({ message: "Error fetching card price" });
    }
  });
  app2.put("/api/system-settings/card-price", async (req, res) => {
    try {
      const { price } = req.body;
      if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        return res.status(400).json({ message: "Valid price is required" });
      }
      const formattedPrice = parseFloat(price).toFixed(2);
      const existingSetting = await storage.getSystemSetting("virtual_card", "price");
      if (existingSetting) {
        await storage.updateSystemSetting(existingSetting.id, { value: formattedPrice });
      } else {
        await storage.setSystemSetting({
          category: "virtual_card",
          key: "price",
          value: formattedPrice
        });
      }
      res.json({
        success: true,
        price: formattedPrice,
        message: "Card price updated successfully"
      });
    } catch (error) {
      console.error("Error updating card price:", error);
      res.status(500).json({ message: "Error updating card price" });
    }
  });
  app2.get("/api/system-settings/discount-enabled", async (req, res) => {
    try {
      const setting = await storage.getSystemSetting("virtual_card", "discount_enabled");
      const enabled = setting?.value !== "false";
      res.json({ enabled });
    } catch (error) {
      res.status(500).json({ message: "Error fetching discount setting" });
    }
  });
  app2.put("/api/system-settings/discount-enabled", async (req, res) => {
    try {
      const { enabled } = req.body;
      await storage.setSystemSetting({
        category: "virtual_card",
        key: "discount_enabled",
        value: String(!!enabled),
        description: "Whether to show the discount badge on the virtual card purchase page"
      });
      res.json({ success: true, enabled: !!enabled });
    } catch (error) {
      res.status(500).json({ message: "Error updating discount setting" });
    }
  });
  app2.post("/api/convert-to-kes", async (req, res) => {
    try {
      const { usdAmount } = req.body;
      if (!usdAmount || isNaN(parseFloat(usdAmount)) || parseFloat(usdAmount) <= 0) {
        return res.status(400).json({ message: "Valid USD amount is required" });
      }
      const kesAmount = await payHeroService.convertUSDtoKES(parseFloat(usdAmount));
      res.json({
        usdAmount: parseFloat(usdAmount),
        kesAmount,
        exchangeRate: 129
      });
    } catch (error) {
      console.error("Error converting USD to KES:", error);
      res.status(500).json({ message: "Error converting currency" });
    }
  });
  app2.post("/api/log-activity", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { activityType, page, action, description, status, metadata } = req.body;
      if (!userId || !activityType) {
        return res.status(400).json({ message: "userId and activityType required" });
      }
      const activity = await storage.createUserActivity({
        userId,
        activityType,
        page: page || null,
        action: action || null,
        description: description || null,
        status: status || "success",
        metadata: metadata || null,
        ipAddress: req.ip || null,
        userAgent: req.headers["user-agent"] || null
      });
      res.json({ success: true, activity });
    } catch (error) {
      console.error("Error logging activity:", error);
      res.status(500).json({ message: "Error logging activity" });
    }
  });
  app2.get("/api/admin/users/:userId/activity", async (req, res) => {
    try {
      const { userId } = req.params;
      const hours = req.query.hours ? parseInt(req.query.hours) : 48;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const now = /* @__PURE__ */ new Date();
      const timeWindowMs = hours * 60 * 60 * 1e3;
      const cutoffTime = new Date(now.getTime() - timeWindowMs);
      const transactions2 = await storage.getTransactionsByUserId(userId);
      const loginHistory2 = await storage.getLoginHistoryByUserId(userId, 100);
      const kyc = await storage.getKycByUserId(userId);
      const virtualCard = await storage.getVirtualCardByUserId(userId);
      const userActivities = await storage.getUserActivitiesByUserId(userId, 200);
      const activities = [];
      userActivities.forEach((act) => {
        const actDate = new Date(act.createdAt);
        if (actDate >= cutoffTime) {
          const typeIcons = {
            page_visit: "\u{1F4C4}",
            action: "\u26A1",
            attempt: "\u{1F504}",
            form_submission: "\u{1F4DD}"
          };
          activities.push({
            id: act.id,
            type: act.activityType,
            action: act.description || `${act.action} on ${act.page}`,
            details: {
              page: act.page,
              action: act.action,
              status: act.status,
              metadata: act.metadata,
              ipAddress: act.ipAddress,
              userAgent: act.userAgent
            },
            timestamp: actDate,
            icon: typeIcons[act.activityType] || "\u2713"
          });
        }
      });
      transactions2.forEach((txn) => {
        const txnDate = new Date(txn.createdAt);
        if (txnDate >= cutoffTime) {
          activities.push({
            id: txn.id,
            type: txn.type === "send" ? "transfer_sent" : txn.type === "receive" ? "transfer_received" : txn.type,
            action: txn.type === "send" ? `Sent $${txn.amount} ${txn.currency}` : txn.type === "receive" ? `Received $${txn.amount} ${txn.currency}` : `${txn.type}: $${txn.amount}`,
            details: {
              amount: txn.amount,
              currency: txn.currency,
              recipient: txn.recipient || txn.sender,
              status: txn.status,
              description: txn.description
            },
            timestamp: txnDate,
            icon: txn.type === "send" ? "\u{1F4E4}" : txn.type === "receive" ? "\u{1F4E5}" : "\u{1F4B3}"
          });
        }
      });
      loginHistory2.forEach((login) => {
        const loginDate = new Date(login.createdAt);
        if (loginDate >= cutoffTime) {
          activities.push({
            id: login.id,
            type: "login",
            action: `Login from ${login.location || "Unknown Location"}`,
            details: {
              device: login.deviceType,
              browser: login.browser,
              ipAddress: login.ipAddress,
              location: login.location,
              status: login.status
            },
            timestamp: loginDate,
            icon: "\u{1F510}"
          });
        }
      });
      if (kyc) {
        const kycDate = new Date(kyc.updatedAt || kyc.createdAt);
        if (kycDate >= cutoffTime) {
          activities.push({
            id: kyc.id,
            type: "kyc",
            action: `KYC Status: ${kyc.status}`,
            details: {
              documentType: kyc.documentType,
              status: kyc.status,
              verificationNotes: kyc.verificationNotes
            },
            timestamp: kycDate,
            icon: "\u{1F4CB}"
          });
        }
      }
      if (virtualCard) {
        const cardDate = new Date(virtualCard.purchaseDate || virtualCard.updatedAt);
        if (cardDate >= cutoffTime) {
          activities.push({
            id: virtualCard.id,
            type: "card_purchase",
            action: `Virtual Card Purchase - $${virtualCard.purchaseAmount}`,
            details: {
              cardNumber: virtualCard.cardNumber,
              status: virtualCard.status,
              balance: virtualCard.balance
            },
            timestamp: cardDate,
            icon: "\u{1F4B3}"
          });
        }
      }
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      res.json({
        userId,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone
        },
        timeWindow: `${hours} hours`,
        totalActivities: activities.length,
        activities
      });
    } catch (error) {
      console.error("Error fetching user activity:", error);
      res.status(500).json({ message: "Error fetching user activity" });
    }
  });
  app2.post("/api/admin/login-as-user", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      console.log("Admin logging in as user:", user.email);
      res.json({
        success: true,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          country: user.country,
          balance: user.balance || "0.00",
          hasVirtualCard: user.hasVirtualCard || false,
          kycStatus: user.kycStatus || "pending",
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified
        },
        message: "Admin logged in as user successfully"
      });
    } catch (error) {
      console.error("Admin login as user error:", error);
      res.status(500).json({ message: "Error logging in as user" });
    }
  });
  app2.get("/api/transaction-status/:reference", async (req, res) => {
    try {
      const { reference } = req.params;
      if (!reference) {
        return res.status(400).json({ message: "Transaction reference is required" });
      }
      console.log("Checking transaction status for reference:", reference);
      const statusResult = await payHeroService.checkTransactionStatus(reference);
      res.json({
        success: statusResult.success,
        status: statusResult.status,
        data: statusResult.data,
        message: statusResult.message
      });
    } catch (error) {
      console.error("Transaction status check error:", error);
      res.status(500).json({ message: "Error checking transaction status" });
    }
  });
  app2.post("/api/transactions", requireAuth, async (req, res) => {
    try {
      const sessionUserId = req.session?.userId;
      const { type, amount, currency, description, fee, recipientDetails } = req.body;
      if (!sessionUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      if (type !== "withdraw") {
        return res.status(400).json({ message: "This endpoint only handles withdrawal requests" });
      }
      const withdrawAmount = parseFloat(amount);
      const withdrawFee = parseFloat(fee || "0");
      if (withdrawAmount <= 0) {
        return res.status(400).json({ message: "Invalid withdrawal amount" });
      }
      const userId = sessionUserId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.isSuspended) {
        return res.status(403).json({ message: user.suspensionReason || "Your account is suspended. Withdrawals are disabled. Please contact support." });
      }
      const normalizedWithdrawalCurrency = normalizeCurrency(currency);
      if (!(await getEnabledCurrencyCodes()).includes(normalizedWithdrawalCurrency)) {
        return res.status(400).json({ message: `${normalizedWithdrawalCurrency} is not an enabled currency` });
      }
      const matchingWallet = await getUserWallet(userId, normalizedWithdrawalCurrency);
      if (!matchingWallet) {
        return res.status(400).json({ message: `Create a ${normalizedWithdrawalCurrency} wallet before withdrawing` });
      }
      if (matchingWallet?.isSuspended) {
        return res.status(403).json({ message: matchingWallet.suspendReason || `${currency} wallet is suspended. Withdrawals are disabled.` });
      }
      const walletHoldAmount = parseFloat(matchingWallet.holdAmount || "0");
      const withdrawableBalance = walletAvailableBalance(matchingWallet);
      if (withdrawableBalance < withdrawAmount + withdrawFee) {
        return res.status(400).json({
          message: "Insufficient balance",
          currency,
          available: withdrawableBalance.toFixed(2),
          held: walletHoldAmount.toFixed(2),
          required: (withdrawAmount + withdrawFee).toFixed(2)
        });
      }
      const totalHold = withdrawAmount + withdrawFee;
      const holdResult = await pool.query(
        `UPDATE wallets
         SET withdrawal_hold_amount = withdrawal_hold_amount + $1, updated_at = NOW()
         WHERE id = $2 AND is_active = true AND is_suspended = false
           AND balance - hold_amount - withdrawal_hold_amount >= $1`,
        [totalHold, matchingWallet.id]
      );
      if (holdResult.rowCount !== 1) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      const transaction = await storage.createTransaction({
        userId,
        type: "withdraw",
        amount,
        currency: normalizedWithdrawalCurrency,
        status: "pending",
        // Withdrawals start as pending for admin approval
        description,
        fee: fee || "0.00",
        recipientDetails,
        reference: storage.generateTransactionReference()
      });
      await notificationService.sendNotification({
        title: "Withdrawal Request",
        body: `New withdrawal request: ${currency} ${amount} from ${user.fullName}`,
        userId,
        // This will be extended to notify admins too
        type: "transaction"
      });
      res.json({
        transaction,
        message: "Withdrawal request submitted successfully. It will be processed within 1-3 business days."
      });
    } catch (error) {
      console.error("Withdrawal error:", error);
      res.status(500).json({ message: "Error processing withdrawal request" });
    }
  });
  app2.post("/api/payhero-callback", async (req, res) => {
    try {
      console.log("PayHero callback received:", JSON.stringify(req.body, null, 2));
      const callbackData = req.body;
      const { reference, type } = req.query;
      if (!callbackData.response) {
        console.error("Invalid PayHero callback data - missing response");
        return res.status(400).json({ message: "Invalid callback data" });
      }
      const paymentResult = payHeroService.processCallback(callbackData);
      console.log("Processed payment result:", paymentResult);
      if (paymentResult.success) {
        if (type === "virtual-card") {
          let userId = null;
          let userPhone = null;
          if (callbackData.response && callbackData.response.phoneNumber) {
            userPhone = callbackData.response.phoneNumber;
          } else if (callbackData.phone) {
            userPhone = callbackData.phone;
          }
          if (userPhone) {
            const users2 = await storage.getAllUsers();
            const user = users2.find((u) => u.phone === userPhone);
            if (user) {
              userId = user.id;
            }
          }
          if (!userId) {
            const transactions2 = await storage.getAllTransactions();
            for (const transaction of transactions2) {
              if (transaction.reference === paymentResult.reference) {
                userId = transaction.userId;
                break;
              }
            }
          }
          if (!userId) {
            console.error("Could not find user for payment reference:", paymentResult.reference, "phone:", userPhone);
            return res.status(200).json({ message: "Payment processed but user not found" });
          }
          const cardData = {
            userId,
            cardNumber: `5399 ${Math.floor(1e3 + Math.random() * 9e3)} ${Math.floor(1e3 + Math.random() * 9e3)} ${Math.floor(1e3 + Math.random() * 9e3)}`,
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1e3 * 3),
            // 3 years from now
            cvv: Math.floor(100 + Math.random() * 900).toString(),
            balance: 0,
            status: "active",
            type: "virtual"
          };
          const newCard = await storage.createVirtualCard(cardData);
          console.log("Virtual card created successfully:", newCard.id);
          const transactionData = {
            userId,
            amount: paymentResult.amount.toString(),
            currency: "KES",
            status: "completed",
            type: "card_purchase",
            description: `Virtual card purchase - Payment via M-Pesa (${paymentResult.mpesaReceiptNumber})`,
            fee: "0.00",
            reference: paymentResult.reference,
            recipientDetails: null
          };
          await storage.createTransaction(transactionData);
          console.log("Card purchase transaction recorded for user:", userId);
        }
        console.log("PayHero payment completed successfully");
        res.status(200).json({ message: "Payment processed successfully" });
      } else {
        console.log("PayHero payment failed:", paymentResult.status);
        res.status(200).json({ message: "Payment failed", status: paymentResult.status });
      }
    } catch (error) {
      console.error("PayHero callback processing error:", error);
      res.status(500).json({ message: "Error processing payment callback" });
    }
  });
  app2.get("/api/system/status", async (req, res) => {
    try {
      console.log("\u{1F50D} System status check initiated");
      const statusChecks = {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        features: {},
        overall: "healthy"
      };
      try {
        await storage.getAllUsers();
        statusChecks.features.accountAccess = {
          status: "healthy",
          message: "You can log in and access your account",
          icon: "\u{1F464}"
        };
        console.log("\u2705 Account Access: Healthy");
      } catch (error) {
        statusChecks.features.accountAccess = {
          status: "unhealthy",
          message: "Account access is currently unavailable",
          icon: "\u{1F464}"
        };
        statusChecks.overall = "degraded";
        console.error("\u274C Account Access: Unhealthy", error);
      }
      try {
        if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
          statusChecks.features.fileUploads = {
            status: "healthy",
            message: "Document uploads and profile photos working",
            icon: "\u{1F4C1}"
          };
          console.log("\u2705 File Uploads: Healthy");
        } else {
          statusChecks.features.fileUploads = {
            status: "degraded",
            message: "File storage not configured - uploads won't work",
            icon: "\u{1F4C1}"
          };
          console.warn("\u26A0\uFE0F File Uploads: Not configured");
        }
      } catch (error) {
        statusChecks.features.fileUploads = {
          status: "degraded",
          message: "Document uploads may have issues",
          icon: "\u{1F4C1}"
        };
        console.warn("\u26A0\uFE0F File Uploads: Degraded", error);
      }
      try {
        const rate = await exchangeRateService2.getExchangeRate("USD", "KES");
        statusChecks.features.currencyExchange = {
          status: "healthy",
          message: `You can exchange USD to KES (rate: ${rate})`,
          icon: "\u{1F4B1}"
        };
        console.log("\u2705 Currency Exchange: Healthy");
      } catch (error) {
        statusChecks.features.currencyExchange = {
          status: "degraded",
          message: "Using backup exchange rates",
          icon: "\u{1F4B1}"
        };
        console.warn("\u26A0\uFE0F Currency Exchange: Degraded", error);
      }
      const statumConfigured = statumService.isConfigured();
      if (statumConfigured) {
        statusChecks.features.airtimePurchase = {
          status: "healthy",
          message: "You can buy airtime for all networks",
          icon: "\u{1F4F1}"
        };
        console.log("\u2705 Airtime Purchase: Healthy");
      } else {
        statusChecks.features.airtimePurchase = {
          status: "unhealthy",
          message: "Airtime purchases are temporarily unavailable",
          icon: "\u{1F4F1}"
        };
        statusChecks.overall = "degraded";
        console.warn("\u26A0\uFE0F Airtime Purchase: Unhealthy");
      }
      try {
        const transactions2 = await storage.getAllTransactions();
        statusChecks.features.moneyTransfers = {
          status: "healthy",
          message: "You can send and receive money",
          icon: "\u{1F4B8}"
        };
        console.log("\u2705 Money Transfers: Healthy");
      } catch (error) {
        statusChecks.features.moneyTransfers = {
          status: "unhealthy",
          message: "Money transfers are currently unavailable",
          icon: "\u{1F4B8}"
        };
        statusChecks.overall = "degraded";
        console.warn("\u26A0\uFE0F Money Transfers: Unhealthy", error);
      }
      try {
        const cards = await storage.getAllVirtualCards();
        statusChecks.features.virtualCards = {
          status: "healthy",
          message: "You can purchase and manage virtual cards",
          icon: "\u{1F4B3}"
        };
        console.log("\u2705 Virtual Cards: Healthy");
      } catch (error) {
        statusChecks.features.virtualCards = {
          status: "unhealthy",
          message: "Virtual card services are unavailable",
          icon: "\u{1F4B3}"
        };
        console.warn("\u26A0\uFE0F Virtual Cards: Unhealthy", error);
      }
      try {
        statusChecks.features.notifications = {
          status: "healthy",
          message: "You will receive notifications for transactions",
          icon: "\u{1F514}"
        };
        console.log("\u2705 Notifications: Healthy");
      } catch (error) {
        statusChecks.features.notifications = {
          status: "degraded",
          message: "Notifications may be delayed",
          icon: "\u{1F514}"
        };
        console.warn("\u26A0\uFE0F Notifications: Degraded", error);
      }
      console.log(`\u{1F3C1} System status check completed - Overall: ${statusChecks.overall}`);
      res.json(statusChecks);
    } catch (error) {
      console.error("\u274C Status check error:", error);
      res.status(500).json({
        overall: "unhealthy",
        error: "Failed to perform status check",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  });
  app2.get("/api/admin/database/check", requireAdminAuth, async (req, res) => {
    try {
      const result = await db.select().from(users).limit(1);
      res.json({ connected: true, message: "Database connection successful" });
    } catch (error) {
      console.error("Database connection check failed:", error);
      res.status(500).json({
        connected: false,
        error: "Failed to connect to database",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.get("/api/admin/user-activities", requireAdminAuth, async (req, res) => {
    try {
      const { userId } = req.query;
      let query = db.select().from(systemLogs);
      if (userId && typeof userId === "string") {
        query = query.where((logs) => logs.source.like(`%:${userId}%`));
      }
      const activities = await query.orderBy(desc2(systemLogs.timestamp)).limit(500);
      const formattedActivities = activities.map((log2) => {
        const data = log2.data;
        const source = log2.source || "";
        const userId2 = source.split(":")[1] || "system";
        return {
          id: log2.id,
          userId: userId2,
          level: log2.level,
          message: log2.message,
          source: log2.source,
          timestamp: log2.timestamp,
          data
        };
      });
      res.json(formattedActivities);
    } catch (error) {
      console.error("Failed to fetch user activities:", error);
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });
  const backups = /* @__PURE__ */ new Map();
  app2.post("/api/admin/database/backup", requireAdminAuth, async (req, res) => {
    try {
      const timestamp2 = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
      const backupId = `backup_${timestamp2}_${Math.random().toString(36).substr(2, 9)}`;
      const tables = {
        users: await db.select().from(users),
        admins: await db.select().from(admins),
        kycDocuments: await db.select().from(kycDocuments),
        virtualCards: await db.select().from(virtualCards),
        recipients: await db.select().from(recipients),
        transactions: await db.select().from(transactions),
        paymentRequests: await db.select().from(paymentRequests),
        chatMessages: await db.select().from(chatMessages),
        notifications: await db.select().from(notifications),
        supportTickets: await db.select().from(supportTickets),
        conversations: await db.select().from(conversations),
        messages: await db.select().from(messages),
        adminLogs: await db.select().from(adminLogs),
        systemLogs: await db.select().from(systemLogs),
        systemSettings: await db.select().from(systemSettings),
        apiConfigurations: await db.select().from(apiConfigurations)
      };
      const backup = {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        version: "1.0",
        tables: Object.keys(tables).reduce((acc, table) => {
          acc[table] = {
            recordCount: tables[table].length,
            columns: Object.keys(tables[table][0] || {})
          };
          return acc;
        }, {}),
        data: tables
      };
      const jsonData = JSON.stringify(backup, null, 2);
      const buffer = Buffer.from(jsonData);
      const filename = `greenpay_backup_${timestamp2}.json`;
      backups.set(backupId, {
        id: backupId,
        filename,
        data: buffer,
        createdAt: /* @__PURE__ */ new Date()
      });
      const totalRecords = Object.values(tables).reduce((sum2, arr) => sum2 + arr.length, 0);
      res.json({
        success: true,
        backup: {
          id: backupId,
          filename,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          size: buffer.length,
          tablesCount: Object.keys(tables).length,
          recordsCount: totalRecords
        }
      });
    } catch (error) {
      console.error("Database backup error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to create backup"
      });
    }
  });
  app2.get("/api/admin/database/backup/:id/download", requireAdminAuth, async (req, res) => {
    try {
      const backup = backups.get(req.params.id);
      if (!backup) {
        return res.status(404).json({ error: "Backup not found" });
      }
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="${backup.filename}"`);
      res.send(backup.data);
    } catch (error) {
      console.error("Download backup error:", error);
      res.status(500).json({ error: "Failed to download backup" });
    }
  });
  const performDatabaseRestore = async (fileBuffer) => {
    const backup = JSON.parse(fileBuffer.toString());
    if (!backup.data || !backup.version) {
      throw new Error("Invalid backup file format");
    }
    const recordsRestored = {};
    if (backup.data.users?.length > 0) {
      for (const user of backup.data.users) {
        try {
          await db.insert(users).values(user).onConflictDoUpdate({
            target: users.id,
            set: user
          });
        } catch (err) {
          console.log("User insert/update skipped (may already exist)");
        }
      }
      recordsRestored.users = backup.data.users.length;
    }
    const tableMap = {
      admins,
      kycDocuments,
      virtualCards,
      recipients,
      transactions,
      paymentRequests,
      chatMessages,
      notifications,
      supportTickets,
      conversations,
      messages,
      adminLogs,
      systemLogs,
      systemSettings,
      apiConfigurations
    };
    for (const [tableName, tableData] of Object.entries(backup.data)) {
      if (tableName === "users" || !Array.isArray(tableData)) continue;
      const table = tableMap[tableName];
      if (!table || tableData.length === 0) continue;
      try {
        for (const record of tableData) {
          try {
            await db.insert(table).values(record).onConflictDoUpdate({
              target: table.id,
              set: record
            });
          } catch (err) {
            console.log(`Record insert/update skipped for ${tableName}`);
          }
        }
        recordsRestored[tableName] = tableData.length;
      } catch (err) {
        console.warn(`Failed to restore ${tableName}:`, err);
      }
    }
    return recordsRestored;
  };
  app2.post("/api/admin/database/restore", requireAdminAuth, backupUpload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }
      const recordsRestored = await performDatabaseRestore(req.file.buffer);
      res.json({
        success: true,
        message: "Database restored successfully",
        recordsRestored
      });
    } catch (error) {
      console.error("Database restore error:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to restore database"
      });
    }
  });
  app2.post("/api/admin/database/restore-public", backupUpload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }
      const recordsRestored = await performDatabaseRestore(req.file.buffer);
      res.json({
        success: true,
        message: "Database restored successfully",
        recordsRestored
      });
    } catch (error) {
      console.error("Database restore error (public):", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to restore database"
      });
    }
  });
  app2.get("/sitemap.xml", async (req, res) => {
    try {
      const baseUrl = "https://greenpay.world";
      const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const publicPages = [
        // Core marketing pages
        { url: "/", priority: "1.0", changefreq: "daily", desc: "Homepage - International Money Transfer to Kenya" },
        { url: "/login", priority: "0.9", changefreq: "monthly", desc: "Login to GreenPay Account" },
        { url: "/signup", priority: "0.9", changefreq: "monthly", desc: "Sign Up for GreenPay" },
        { url: "/status", priority: "0.8", changefreq: "daily", desc: "System Status & Service Health" },
        // Auth flow pages (public but lower priority)
        { url: "/auth/forgot-password", priority: "0.5", changefreq: "monthly", desc: "Reset Password" },
        { url: "/auth/reset-password", priority: "0.5", changefreq: "monthly", desc: "Create New Password" },
        { url: "/auth/otp-verification", priority: "0.4", changefreq: "monthly", desc: "OTP Verification" },
        // Feature landing pages (for SEO targeting)
        { url: "/features/send-money", priority: "0.9", changefreq: "weekly", desc: "Send Money to Kenya - Fast & Secure" },
        { url: "/features/virtual-cards", priority: "0.9", changefreq: "weekly", desc: "Virtual Cards for Online Payments" },
        { url: "/features/exchange", priority: "0.8", changefreq: "weekly", desc: "USD to KES Exchange - Best Rates" },
        { url: "/features/airtime", priority: "0.7", changefreq: "weekly", desc: "Buy Airtime for Kenya" },
        // Information pages
        { url: "/about", priority: "0.7", changefreq: "monthly", desc: "About GreenPay" },
        { url: "/pricing", priority: "0.8", changefreq: "weekly", desc: "Pricing & Fees" },
        { url: "/security", priority: "0.7", changefreq: "monthly", desc: "Security & Compliance" },
        { url: "/help", priority: "0.6", changefreq: "weekly", desc: "Help Center & FAQ" },
        { url: "/contact", priority: "0.6", changefreq: "monthly", desc: "Contact Support" }
      ];
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <!-- GreenPay - International Money Transfer & Digital Wallet -->
  <!-- Target Keywords: send money to Kenya, USD to KES, international remittance, virtual cards -->
${publicPages.map((page) => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join("\n")}
</urlset>`;
      res.header("Content-Type", "application/xml");
      res.header("Cache-Control", "public, max-age=3600");
      res.send(sitemap);
    } catch (error) {
      console.error("Error generating sitemap:", error);
      res.status(500).send("Error generating sitemap");
    }
  });
  app2.get("/robots.txt", (req, res) => {
    const robotsTxt = `User-agent: *
Disallow: /admin/
Disallow: /api/

Sitemap: https://greenpay.world/sitemap.xml`;
    res.header("Content-Type", "text/plain");
    res.send(robotsTxt);
  });
  const httpServer = createServer(app2);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws/logs" });
  const logClients = /* @__PURE__ */ new Set();
  class LogStreamService {
    static broadcast(logEntry) {
      const message = JSON.stringify(logEntry);
      logClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          try {
            client.send(message);
          } catch (error) {
            console.error("Error sending log to client:", error);
            logClients.delete(client);
          }
        } else {
          logClients.delete(client);
        }
      });
    }
    static createLogEntry(level, message, source, data) {
      return {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        level,
        message,
        source,
        data
      };
    }
  }
  wss.on("connection", (ws2) => {
    console.log("Log client connected");
    logClients.add(ws2);
    ws2.send(JSON.stringify(
      LogStreamService.createLogEntry("info", "Connected to log stream", "websocket")
    ));
    ws2.on("close", () => {
      console.log("Log client disconnected");
      logClients.delete(ws2);
    });
    ws2.on("error", (error) => {
      console.error("WebSocket error:", error);
      logClients.delete(ws2);
    });
  });
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleInfo = console.info;
  console.log = (...args) => {
    originalConsoleLog(...args);
    const message = args.map((arg) => typeof arg === "object" ? JSON.stringify(arg) : String(arg)).join(" ");
    LogStreamService.broadcast(LogStreamService.createLogEntry("info", message, "console"));
  };
  console.error = (...args) => {
    originalConsoleError(...args);
    const message = args.map((arg) => typeof arg === "object" ? JSON.stringify(arg) : String(arg)).join(" ");
    LogStreamService.broadcast(LogStreamService.createLogEntry("error", message, "console"));
  };
  console.warn = (...args) => {
    originalConsoleWarn(...args);
    const message = args.map((arg) => typeof arg === "object" ? JSON.stringify(arg) : String(arg)).join(" ");
    LogStreamService.broadcast(LogStreamService.createLogEntry("warn", message, "console"));
  };
  console.info = (...args) => {
    originalConsoleInfo(...args);
    const message = args.map((arg) => typeof arg === "object" ? JSON.stringify(arg) : String(arg)).join(" ");
    LogStreamService.broadcast(LogStreamService.createLogEntry("info", message, "console"));
  };
  global.LogStreamService = LogStreamService;
  const chatWss = new WebSocketServer({ server: httpServer, path: "/ws" });
  console.log("\u2705 Live support chat WebSocket server initialized on /ws (admin monitoring only)");
  const activeAdminConnections = /* @__PURE__ */ new Map();
  chatWss.on("connection", (ws2, req) => {
    console.log("New WebSocket connection established");
    const session2 = req.session;
    const isAdmin = !!session2?.admin?.id;
    const userId = isAdmin ? "admin" : session2?.userId;
    ws2.on("message", async (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.type === "register") {
          ws2.userId = parsed.userId || userId;
          ws2.isAdmin = parsed.isAdmin || isAdmin;
          console.log(`Registered connection: ${ws2.userId} (Admin: ${ws2.isAdmin})`);
          if (ws2.isAdmin) {
            activeAdminConnections.set(ws2.userId, {
              socket: ws2,
              adminId: ws2.userId
            });
          }
          return;
        }
        switch (parsed.type) {
          case "admin_register":
            if (parsed.isAdmin && parsed.adminId) {
              activeAdminConnections.set(parsed.adminId, {
                socket: ws2,
                adminId: parsed.adminId
              });
              console.log(`Admin ${parsed.adminId} registered for live chat monitoring`);
            }
            break;
          default:
            console.log(`WebSocket message type '${parsed.type}' ignored - use REST API instead`);
            break;
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });
    ws2.on("close", () => {
      for (const [adminId, connection] of activeAdminConnections.entries()) {
        if (connection.socket === ws2) {
          activeAdminConnections.delete(adminId);
          console.log(`Admin ${adminId} disconnected from live chat monitoring`);
          break;
        }
      }
    });
  });
  app2.get("/api/admin/whatsapp/template-parameters/:templateName", requireAdminAuth, async (req, res) => {
    try {
      const { templateName } = req.params;
      const { whatsappService: whatsappService2 } = await Promise.resolve().then(() => (init_whatsapp(), whatsapp_exports));
      const paramInfo = await whatsappService2.getTemplateParameters(templateName);
      const template = await whatsappService2.getTemplateDetails(templateName);
      res.json({
        templateName,
        status: template?.status || "UNKNOWN",
        language: paramInfo.language,
        requiredParameters: paramInfo.required,
        parameterCount: paramInfo.paramCount,
        parameterLabels: paramInfo.required.map((p, i) => `${p} (position ${i + 1})`),
        description: `Template requires ${paramInfo.paramCount} parameters: ${paramInfo.required.join(", ") || "none"}`,
        components: paramInfo.components,
        source: "meta"
      });
    } catch (error) {
      console.error("[Admin] Get template parameters error:", error);
      res.status(500).json({ message: "Failed to get template parameters from Meta" });
    }
  });
  app2.post("/api/admin/whatsapp/send-template", requireAdminAuth, async (req, res) => {
    try {
      const { userId, templateName, parameters } = req.body;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { whatsappService: whatsappService2 } = await Promise.resolve().then(() => (init_whatsapp(), whatsapp_exports));
      const { messagingService: messagingService3 } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
      const templates = await whatsappService2.fetchTemplatesFromMeta();
      const template = templates.find((t) => t.name === templateName);
      if (!template) {
        return res.status(404).json({ message: `Template "${templateName}" not found in Meta` });
      }
      if (template.status !== "APPROVED") {
        return res.status(400).json({
          message: `Template "${templateName}" is not approved. Status: ${template.status}`,
          status: template.status
        });
      }
      let success = false;
      let errorMsg;
      switch (templateName) {
        case "otp":
          const otpCode = parameters?.code || messagingService3.generateOTP();
          success = await whatsappService2.sendOTP(user.phone, otpCode);
          console.log("[Admin] OTP template sent", { userId, templateName, success });
          break;
        case "password_reset":
          const pwdCode = parameters?.code || messagingService3.generateOTP();
          success = await whatsappService2.sendPasswordReset(user.phone, pwdCode);
          console.log("[Admin] Password reset template sent", { userId, templateName, success });
          break;
        case "create_acc":
          success = await whatsappService2.sendAccountCreation(user.phone, user.fullName || "User");
          console.log("[Admin] Create account template sent", { userId, templateName, success });
          break;
        case "kyc_verified":
          success = await whatsappService2.sendKYCVerified(user.phone);
          console.log("[Admin] KYC verified template sent", { userId, templateName, success });
          break;
        case "card_activation":
          success = await whatsappService2.sendCardActivation(user.phone, parameters?.lastFour || "0000");
          console.log("[Admin] Card activation template sent", { userId, templateName, success });
          break;
        case "fund_receipt":
          success = await whatsappService2.sendFundReceipt(
            user.phone,
            parameters?.currency || "KES",
            parameters?.amount || "0",
            parameters?.sender || "Unknown Sender"
          );
          console.log("[Admin] Fund receipt template sent", { userId, templateName, success });
          break;
        case "login_alert":
          success = await whatsappService2.sendLoginAlert(
            user.phone,
            parameters?.location || "Unknown",
            parameters?.ip || "Unknown IP"
          );
          console.log("[Admin] Login alert template sent", { userId, templateName, success });
          break;
        // Generic handler for any other approved template
        default:
          const validation = await whatsappService2.validateTemplateParameters(templateName, parameters || {});
          if (!validation.valid) {
            return res.status(400).json({
              message: validation.error || "Parameter validation failed",
              templateName,
              required: validation.required,
              provided: validation.provided,
              hint: `Provide ${validation.required} parameters for this template`
            });
          }
          const result = await whatsappService2.sendTemplateGeneric(user.phone, templateName, parameters || {});
          success = result.success;
          errorMsg = result.error;
          if (!success && result.error) {
            console.error("[Admin] Generic template send error:", { userId, templateName, error: result.error });
          } else {
            console.log("[Admin] Generic template sent", { userId, templateName, success });
          }
          break;
      }
      if (success) {
        return res.json({
          success: true,
          templateName,
          userId,
          message: "Template delivered to WhatsApp",
          templateStatus: template.status,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      } else {
        return res.status(400).json({
          success: false,
          templateName,
          userId,
          message: errorMsg || "Template delivery failed",
          templateStatus: template.status,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    } catch (error) {
      console.error("[Admin] Send template error:", error);
      res.status(500).json({ message: "Failed to send template", error: String(error) });
    }
  });
  app2.get("/api/admin/mailtrap-settings", requireAdminAuth, async (req, res) => {
    try {
      const setting = await storage.getSystemSetting("email", "mailtrap_api_key");
      const apiKey = setting?.value || process.env.MAILTRAP_API_KEY || "";
      const isConfigured = !!apiKey;
      res.json({
        apiKey: isConfigured ? "\u25CF\u25CF\u25CF\u25CF\u25CF\u25CF\u25CF\u25CF" : "",
        isConfigured
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching Mailtrap settings" });
    }
  });
  app2.post("/api/admin/mailtrap-settings", requireAdminAuth, async (req, res) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey) {
        return res.status(400).json({ message: "API key is required" });
      }
      const trimmedKey = apiKey.trim();
      await storage.setSystemSetting({
        category: "email",
        key: "mailtrap_api_key",
        value: trimmedKey,
        description: "Mailtrap API key for email sending"
      });
      process.env.MAILTRAP_API_KEY = trimmedKey;
      const { mailtrapService: mailtrapService3 } = await Promise.resolve().then(() => (init_mailtrap(), mailtrap_exports));
      await mailtrapService3.refreshApiKey();
      res.json({ success: true, message: "Mailtrap API key saved successfully" });
    } catch (error) {
      console.error("Error saving Mailtrap settings:", error);
      res.status(500).json({ message: "Error saving Mailtrap settings" });
    }
  });
  app2.post("/api/admin/mailtrap-test", requireAdminAuth, async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      const { mailtrapService: mailtrapService3 } = await Promise.resolve().then(() => (init_mailtrap(), mailtrap_exports));
      const success = await mailtrapService3.sendCustomTemplate(email, "placeholder-test", {
        first_name: "Test",
        last_name: "User"
      });
      if (success) {
        res.json({ success: true, message: "Test email sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send test email" });
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      res.status(500).json({ message: "Error sending test email" });
    }
  });
  app2.post("/api/admin/send-template-test", requireAdminAuth, async (req, res) => {
    try {
      const { email, templateUuid, parameters } = req.body;
      if (!email || !templateUuid) {
        return res.status(400).json({ message: "Email and template UUID are required" });
      }
      const { mailtrapService: mailtrapService3 } = await Promise.resolve().then(() => (init_mailtrap(), mailtrap_exports));
      const success = await mailtrapService3.sendTemplate(email, templateUuid, parameters || {});
      res.json({
        success,
        message: success ? "Template sent successfully" : "Failed to send template"
      });
    } catch (error) {
      console.error("[Admin] Send template test error:", error);
      res.status(500).json({ message: "Failed to send template" });
    }
  });
  app2.get("/api/admin/users-list", requireAdminAuth, async (req, res) => {
    try {
      const users2 = await storage.getAllUsers();
      const formattedUsers = users2.map((user) => ({
        id: user.id,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "Unknown User",
        email: user.email,
        phone: user.phone
      }));
      res.json(formattedUsers);
    } catch (error) {
      console.error("[Admin] Get users list error:", error);
      res.status(500).json({ message: "Failed to fetch users list" });
    }
  });
  app2.post("/api/admin/send-template-to-user", requireAdminAuth, async (req, res) => {
    try {
      const { userId, templateUuid, parameters } = req.body;
      if (!userId || !templateUuid) {
        return res.status(400).json({ message: "User ID and template UUID are required" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (!user.email) {
        return res.status(400).json({ message: "User does not have an email address" });
      }
      const { mailtrapService: mailtrapService3 } = await Promise.resolve().then(() => (init_mailtrap(), mailtrap_exports));
      const success = await mailtrapService3.sendTemplate(user.email, templateUuid, parameters || {});
      res.json({
        success,
        message: success ? "Template email sent to user successfully" : "Failed to send template to user"
      });
    } catch (error) {
      console.error("[Admin] Send template to user error:", error);
      res.status(500).json({ message: "Failed to send template to user" });
    }
  });
  app2.get("/api/whatsapp/webhook", async (req, res) => {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "greenpay_verify_token_2024";
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    if (mode === "subscribe" && token === verifyToken) {
      console.log("[WhatsApp] \u2713 Webhook verified");
      res.status(200).send(challenge);
    } else {
      console.error("[WhatsApp] \u2717 Webhook verification failed");
      res.status(403).send("Forbidden");
    }
  });
  app2.post("/api/whatsapp/webhook", async (req, res) => {
    try {
      const body = req.body;
      if (body.object === "whatsapp_business_account") {
        const entries = body.entry || [];
        for (const entry of entries) {
          const changes = entry.changes || [];
          for (const change of changes) {
            if (change.field === "message_status") {
              const statuses = change.value?.statuses || [];
              for (const status of statuses) {
                const messageId = status.id;
                const statusType = status.status;
                console.log("[WhatsApp] Message status update:", { messageId, status: statusType, timestamp: status.timestamp });
                const messages2 = await storage.getWhatsappMessageByMessageId(messageId);
                if (messages2 && messages2.length > 0) {
                  await storage.updateWhatsappMessageStatus(messages2[0].id, statusType);
                  console.log("[WhatsApp] Updated message status to:", statusType);
                }
              }
            }
            if (change.field === "message_template_status_update") {
              const statuses = change.value?.statuses || [];
              for (const status of statuses) {
                console.log("[WhatsApp] Template status:", { status: status.status });
              }
            }
            if (change.field === "message_template_status_update" || change.field === "messaging_product") {
              const phoneNumber = change.value?.contacts?.[0]?.wa_id;
              if (change.value?.messages) {
                for (const msg of change.value.messages) {
                  if (msg.type === "typing") {
                    console.log("[WhatsApp] User typing indicator received from:", phoneNumber);
                  } else if (msg.type === "read") {
                    console.log("[WhatsApp] User read receipt received from:", phoneNumber);
                  }
                }
              }
            }
            if (change.field === "messages") {
              const messages2 = change.value?.messages || [];
              for (const message of messages2) {
                if (message.type === "message_read") {
                  console.log("[WhatsApp] Message read:", { messageId: message.id });
                }
              }
            }
            if (change.field === "messages") {
              const messages2 = change.value?.messages || [];
              for (const message of messages2) {
                const phoneNumber = change.value?.contacts?.[0]?.wa_id;
                const type = message.type;
                let content = "";
                let mediaUrl = "";
                const [accessTokenSetting] = await Promise.all([
                  storage.getSystemSetting("messaging", "whatsapp_access_token")
                ]);
                const accessToken = accessTokenSetting?.value;
                let messageType = "text";
                let fileName = "";
                let fileSize = 0;
                if (type === "text" && message.text?.body) {
                  content = message.text.body;
                } else if (type === "image" && message.image?.id) {
                  messageType = "image";
                  const mediaId = message.image.id;
                  const caption = message.image.caption || "Sent an image";
                  if (accessToken) {
                    try {
                      const mediaResponse = await fetch(`https://graph.facebook.com/v20.0/${mediaId}?fields=url`, {
                        headers: { "Authorization": `Bearer ${accessToken}` }
                      });
                      if (mediaResponse.ok) {
                        const mediaData = await mediaResponse.json();
                        const downloadUrl = mediaData.url;
                        if (downloadUrl) {
                          const imgResponse = await fetch(downloadUrl);
                          const buffer = await imgResponse.arrayBuffer();
                          const bufferObj = Buffer.from(buffer);
                          const fileTypeInfo = await fileTypeFromBuffer(bufferObj);
                          const actualMimeType = fileTypeInfo?.mime || "image/jpeg";
                          const ext = fileTypeInfo?.ext || "jpg";
                          mediaUrl = await cloudinaryStorage2.uploadChatFile(
                            bufferObj,
                            `whatsapp-image-${mediaId}.${ext}`,
                            actualMimeType
                          );
                          fileName = `whatsapp-image-${mediaId}.${ext}`;
                          fileSize = buffer.byteLength;
                          console.log("[WhatsApp] Image stored in Cloudinary:", { mediaUrl, size: fileSize, mimeType: actualMimeType });
                        }
                      }
                    } catch (err) {
                      console.error("[WhatsApp] Failed to process image:", err);
                    }
                  }
                  content = caption;
                } else if (type === "video" && message.video?.id) {
                  messageType = "video";
                  const mediaId = message.video.id;
                  const caption = message.video.caption || "Sent a video";
                  if (accessToken) {
                    try {
                      const mediaResponse = await fetch(`https://graph.facebook.com/v20.0/${mediaId}?fields=url`, {
                        headers: { "Authorization": `Bearer ${accessToken}` }
                      });
                      if (mediaResponse.ok) {
                        const mediaData = await mediaResponse.json();
                        const downloadUrl = mediaData.url;
                        if (downloadUrl) {
                          const vidResponse = await fetch(downloadUrl);
                          const buffer = await vidResponse.arrayBuffer();
                          const bufferObj = Buffer.from(buffer);
                          const fileTypeInfo = await fileTypeFromBuffer(bufferObj);
                          const actualMimeType = fileTypeInfo?.mime || "video/mp4";
                          const ext = fileTypeInfo?.ext || "mp4";
                          mediaUrl = await cloudinaryStorage2.uploadChatFile(
                            bufferObj,
                            `whatsapp-video-${mediaId}.${ext}`,
                            actualMimeType
                          );
                          fileName = `whatsapp-video-${mediaId}.${ext}`;
                          fileSize = buffer.byteLength;
                          console.log("[WhatsApp] Video stored in Cloudinary:", { mediaUrl, size: fileSize, mimeType: actualMimeType });
                        }
                      }
                    } catch (err) {
                      console.error("[WhatsApp] Failed to process video:", err);
                    }
                  }
                  content = caption;
                } else if (type === "file" && message.document?.id) {
                  messageType = "file";
                  const mediaId = message.document.id;
                  const filename = message.document.filename || "document";
                  fileName = filename;
                  if (accessToken) {
                    try {
                      const mediaResponse = await fetch(`https://graph.facebook.com/v20.0/${mediaId}?fields=url`, {
                        headers: { "Authorization": `Bearer ${accessToken}` }
                      });
                      if (mediaResponse.ok) {
                        const mediaData = await mediaResponse.json();
                        const downloadUrl = mediaData.url;
                        if (downloadUrl) {
                          const fileResponse = await fetch(downloadUrl);
                          const buffer = await fileResponse.arrayBuffer();
                          mediaUrl = await cloudinaryStorage2.uploadChatFile(
                            Buffer.from(buffer),
                            filename,
                            "application/octet-stream"
                          );
                          fileSize = buffer.byteLength;
                        }
                      }
                    } catch (err) {
                      console.error("[WhatsApp] Failed to process file:", err);
                    }
                  }
                  content = filename;
                } else if (type === "audio" && message.audio?.id) {
                  const mediaId = message.audio.id;
                  if (accessToken) {
                    try {
                      const mediaResponse = await fetch(`https://graph.facebook.com/v20.0/${mediaId}?fields=url`, {
                        headers: { "Authorization": `Bearer ${accessToken}` }
                      });
                      if (mediaResponse.ok) {
                        const mediaData = await mediaResponse.json();
                        const downloadUrl = mediaData.url;
                        if (downloadUrl) {
                          const audioResponse = await fetch(downloadUrl);
                          const buffer = await audioResponse.arrayBuffer();
                          mediaUrl = await cloudinaryStorage2.uploadChatFile(
                            Buffer.from(buffer),
                            `whatsapp-audio-${mediaId}.ogg`,
                            "audio/ogg"
                          );
                        }
                      }
                    } catch (err) {
                      console.error("[WhatsApp] Failed to process audio:", err);
                    }
                  }
                  content = "[Audio message]";
                } else {
                  continue;
                }
                if (phoneNumber && content) {
                  let conversation = await storage.getWhatsappConversation(phoneNumber);
                  if (!conversation) {
                    conversation = await storage.createWhatsappConversation({
                      phoneNumber,
                      displayName: change.value?.contacts?.[0]?.profile?.name || phoneNumber,
                      lastMessageAt: /* @__PURE__ */ new Date(),
                      status: "active"
                    });
                  } else {
                    await storage.updateWhatsappConversation(conversation.id, { lastMessageAt: /* @__PURE__ */ new Date() });
                  }
                  await storage.createWhatsappMessage({
                    conversationId: conversation.id,
                    phoneNumber,
                    content,
                    isFromAdmin: false,
                    status: "received",
                    messageId: message.id,
                    messageType,
                    fileUrl: mediaUrl || void 0,
                    fileName: fileName || void 0,
                    fileSize: fileSize || void 0
                  });
                  console.log(`[WhatsApp] Received ${type} message from ${phoneNumber}: ${content}`, mediaUrl ? `URL: ${mediaUrl}` : "");
                }
              }
            }
          }
        }
        res.status(200).json({ status: "ok" });
      } else {
        res.status(400).send("Bad Request");
      }
    } catch (error) {
      console.error("[WhatsApp] Webhook error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/admin/whatsapp/conversations", requireAdminAuth, async (req, res) => {
    try {
      console.log("[WhatsApp] Fetching conversations");
      const conversations2 = await storage.getWhatsappConversations();
      console.log("[WhatsApp] Found conversations:", { count: conversations2?.length || 0 });
      res.json(conversations2 || []);
    } catch (error) {
      console.error("[WhatsApp] Get conversations error:", error);
      res.status(500).json({ message: "Failed to fetch conversations", error: String(error) });
    }
  });
  app2.get("/api/admin/whatsapp/messages/:conversationId", requireAdminAuth, async (req, res) => {
    try {
      const messages2 = await storage.getWhatsappMessages(req.params.conversationId);
      res.json(messages2);
    } catch (error) {
      console.error("[Admin] Get WhatsApp messages error:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });
  app2.post("/api/admin/whatsapp/typing", requireAdminAuth, async (req, res) => {
    try {
      const { phoneNumber } = req.body;
      if (!phoneNumber) {
        return res.status(400).json({ message: "Phone number is required" });
      }
      const [accessTokenSetting, phoneIdSetting] = await Promise.all([
        storage.getSystemSetting("messaging", "whatsapp_access_token"),
        storage.getSystemSetting("messaging", "whatsapp_phone_number_id")
      ]);
      const accessToken = accessTokenSetting?.value;
      const phoneNumberId = String(phoneIdSetting?.value || "").trim();
      if (!accessToken?.trim() || !phoneNumberId) {
        return res.status(400).json({ message: "WhatsApp not configured" });
      }
      const cleanPhone = phoneNumber.replace(/\D/g, "");
      const finalPhone = cleanPhone.startsWith("254") ? cleanPhone : "254" + cleanPhone.slice(-9);
      const apiUrl = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
      const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: finalPhone,
        type: "typing"
      };
      const apiResponse = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (apiResponse.ok) {
        console.log("[WhatsApp] Typing indicator sent to:", finalPhone);
        res.json({ success: true, message: "Typing indicator sent" });
      } else {
        const error = await apiResponse.json();
        console.error("[WhatsApp] Failed to send typing indicator:", error);
        res.status(apiResponse.status).json({ success: false, error });
      }
    } catch (error) {
      console.error("[WhatsApp] Typing indicator error:", error);
      res.status(500).json({ message: "Failed to send typing indicator" });
    }
  });
  app2.post("/api/admin/whatsapp/send", requireAdminAuth, async (req, res) => {
    try {
      const { conversationId, phoneNumber, message, mediaUrl, mediaType } = req.body;
      console.log("[WhatsApp Send] Received request:", { conversationId, phoneNumber, hasMedia: !!mediaUrl, mediaType });
      if (!conversationId || !phoneNumber || !message) {
        console.error("[WhatsApp Send] Missing fields");
        return res.status(400).json({ message: "Missing required fields" });
      }
      const [accessTokenSetting, phoneIdSetting] = await Promise.all([
        storage.getSystemSetting("messaging", "whatsapp_access_token"),
        storage.getSystemSetting("messaging", "whatsapp_phone_number_id")
      ]);
      const accessToken = accessTokenSetting?.value;
      const phoneNumberId = String(phoneIdSetting?.value || "").trim();
      console.log("[WhatsApp Send] Credentials retrieved:", { hasToken: !!accessToken, hasPhoneId: !!phoneNumberId });
      if (!accessToken?.trim() || !phoneNumberId) {
        console.error("[WhatsApp Send] Credentials incomplete");
        return res.status(400).json({ message: "WhatsApp not configured in Messaging Settings. Please configure credentials first." });
      }
      const cleanPhone = phoneNumber.replace(/\D/g, "");
      const finalPhone = cleanPhone.startsWith("254") ? cleanPhone : "254" + cleanPhone.slice(-9);
      const apiUrl = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
      let payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: finalPhone
      };
      if (mediaUrl && mediaType) {
        const typeMap = { "image": "image", "video": "video", "file": "document", "audio": "audio" };
        const waType = typeMap[mediaType] || "document";
        payload.type = waType;
        payload[waType] = { link: mediaUrl };
        if (message) {
          payload[waType].caption = message;
        }
        console.log("[WhatsApp Send] Sending media:", { type: waType, phone: finalPhone });
      } else {
        payload.type = "text";
        payload.text = { body: message };
        console.log("[WhatsApp Send] Sending text:", { phone: finalPhone });
      }
      const apiResponse = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const apiData = await apiResponse.json();
      console.log("[WhatsApp Send] Meta API response:", { status: apiResponse.status, msgId: apiData.messages?.[0]?.id, error: apiData.error });
      if (apiResponse.ok && apiData.messages?.[0]?.id) {
        let fileName = "media";
        if (mediaUrl) {
          const urlParts = new URL(mediaUrl).pathname.split("/");
          fileName = urlParts[urlParts.length - 1] || "media";
        }
        const msgRecord = await storage.createWhatsappMessage({
          conversationId,
          phoneNumber,
          content: message || `[${mediaType?.toUpperCase() || "FILE"}]`,
          isFromAdmin: true,
          status: "sent",
          messageId: apiData.messages[0].id,
          messageType: mediaUrl ? mediaType || "file" : "text",
          fileUrl: mediaUrl,
          fileName: mediaUrl ? fileName : null,
          fileSize: null
          // We don't have file size on send, but DB can store it
        });
        await storage.updateWhatsappConversation(conversationId, { lastMessageAt: /* @__PURE__ */ new Date() });
        console.log("[WhatsApp Send] Message saved successfully:", { msgId: msgRecord.id, hasMedia: !!mediaUrl });
        res.json({ success: true, message: msgRecord });
      } else {
        const errorMsg = apiData.error?.message || "Unknown error from Meta API";
        console.error("[WhatsApp Send] API error:", { status: apiResponse.status, error: errorMsg, data: apiData });
        res.status(500).json({ message: `Failed to send message: ${errorMsg}` });
      }
    } catch (error) {
      console.error("[WhatsApp Send] Error:", error);
      res.status(500).json({ message: "Failed to send message", error: String(error) });
    }
  });
  app2.get("/api/admin/whatsapp/config", requireAdminAuth, async (req, res) => {
    try {
      let config = await storage.getWhatsappConfig();
      console.log("[WhatsApp Config] Get request - config exists:", !!config, "has token:", !!config?.accessToken);
      if (!config) {
        config = await storage.initWhatsappConfig();
        console.log("[WhatsApp Config] Initialized new config");
      }
      res.json({
        phoneNumberId: config.phoneNumberId || "",
        businessAccountId: config.businessAccountId || "",
        verifyToken: config.verifyToken,
        webhookUrl: process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}/api/whatsapp/webhook` : config.webhookUrl,
        isActive: config.isActive
      });
    } catch (error) {
      console.error("[Admin] Get WhatsApp config error:", error);
      res.status(500).json({ message: "Failed to fetch config" });
    }
  });
  app2.post("/api/admin/whatsapp/config", requireAdminAuth, async (req, res) => {
    try {
      const { phoneNumberId, businessAccountId, accessToken, isActive } = req.body;
      console.log("[WhatsApp Config] Saving config:", { phoneNumberId: !!phoneNumberId, businessAccountId: !!businessAccountId, accessToken: !!accessToken, isActive });
      const updated = await storage.updateWhatsappConfig({
        phoneNumberId,
        businessAccountId,
        accessToken,
        isActive
      });
      console.log("[WhatsApp Config] Saved successfully:", { hasToken: !!updated?.accessToken, hasPhoneId: !!updated?.phoneNumberId });
      if (updated) {
        res.json({ success: true, config: updated });
      } else {
        res.status(500).json({ message: "Failed to update config" });
      }
    } catch (error) {
      console.error("[Admin] Update WhatsApp config error:", error);
      res.status(500).json({ message: "Failed to update config" });
    }
  });
  app2.post("/api/api-keys/generate", requireAuth, async (req, res) => {
    try {
      const sessionUserId = req.session?.userId;
      if (!sessionUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const { name, scope, rateLimit } = req.body;
      if (!name || !scope || !Array.isArray(scope)) {
        return res.status(400).json({ error: "Missing required fields: name, scope" });
      }
      const { apiKeyService: apiKeyService2 } = await Promise.resolve().then(() => (init_api_key(), api_key_exports));
      const key = await apiKeyService2.generateApiKey(name, scope, rateLimit || 1e3, sessionUserId);
      res.json({
        success: true,
        key,
        name,
        scope,
        rateLimit: rateLimit || 1e3,
        message: "API key generated successfully. Copy it now - you won't see it again!"
      });
    } catch (error) {
      console.error("[API Keys] Generate error:", error);
      res.status(500).json({ error: "Failed to generate API key" });
    }
  });
  app2.get("/api/api-keys", requireAuth, async (req, res) => {
    try {
      const sessionUserId = req.session?.userId;
      if (!sessionUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const settings = await storage.getSystemSettingsByCategory("api_keys");
      const userApiKeys = settings.filter((s) => {
        try {
          const keyData = JSON.parse(typeof s.value === "string" ? s.value : JSON.stringify(s.value));
          return keyData.userId === sessionUserId;
        } catch (e) {
          return false;
        }
      }).map((s) => {
        const keyData = JSON.parse(typeof s.value === "string" ? s.value : JSON.stringify(s.value));
        return {
          id: s.key,
          name: keyData.name,
          isActive: keyData.isActive,
          scope: keyData.scope,
          rateLimit: keyData.rateLimit,
          createdAt: keyData.createdAt,
          lastUsedAt: keyData.lastUsedAt
        };
      });
      res.json({ keys: userApiKeys });
    } catch (error) {
      console.error("[API Keys] List error:", error);
      res.status(500).json({ error: "Failed to fetch API keys" });
    }
  });
  app2.post("/api/api-keys/:keyId/revoke", requireAuth, async (req, res) => {
    try {
      const sessionUserId = req.session?.userId;
      const { keyId } = req.params;
      if (!sessionUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const settings = await storage.getSystemSettingsByCategory("api_keys");
      const keySettings = settings.find((s) => s.key === keyId);
      if (!keySettings) {
        return res.status(404).json({ error: "API key not found" });
      }
      const keyData = JSON.parse(typeof keySettings.value === "string" ? keySettings.value : JSON.stringify(keySettings.value));
      if (keyData.userId !== sessionUserId) {
        return res.status(403).json({ error: "Access denied" });
      }
      const { apiKeyService: apiKeyService2 } = await Promise.resolve().then(() => (init_api_key(), api_key_exports));
      const success = await apiKeyService2.revokeApiKey(keyId);
      if (success) {
        res.json({ success: true, message: "API key revoked successfully" });
      } else {
        res.status(404).json({ error: "API key not found" });
      }
    } catch (error) {
      console.error("[API Keys] Revoke error:", error);
      res.status(500).json({ error: "Failed to revoke API key" });
    }
  });
  app2.get("/api/ai/remaining-requests", async (req, res) => {
    try {
      const userId = req.user?.id || null;
      const ipAddress = req.ip || req.connection.remoteAddress || "";
      const remaining = await aiRateLimiter.getRemainingRequests(userId, ipAddress);
      res.json({ remainingRequests: remaining });
    } catch (error) {
      console.error("Get remaining requests error:", error);
      res.status(500).json({ error: "Failed to get remaining requests" });
    }
  });
  app2.post("/api/ai/chat", async (req, res) => {
    try {
      const { messages: messages2 } = req.body;
      const user = req.user;
      if (!messages2 || !Array.isArray(messages2)) {
        return res.status(400).json({ error: "Messages array required" });
      }
      const userId = user?.id || null;
      const ipAddress = req.ip || req.connection.remoteAddress || "";
      const limitCheck = await aiRateLimiter.checkAndUpdateLimit(userId, ipAddress);
      if (!limitCheck.allowed) {
        return res.status(429).json({ error: limitCheck.error, remainingRequests: limitCheck.remainingRequests });
      }
      const response = await openaiService.generateResponse(messages2);
      res.json({ response, remainingRequests: limitCheck.remainingRequests });
    } catch (error) {
      console.error("AI chat error:", error);
      res.status(500).json({ error: error.message || "Failed to generate AI response" });
    }
  });
  app2.get("/api/admin/export-env", async (req, res) => {
    try {
      const isAdmin = req.session?.admin?.id || req.user?.id;
      if (!isAdmin) {
        return res.status(401).json({ message: "Authentication required. Please log in as an administrator." });
      }
      const envVars = process.env;
      let envContent = "";
      for (const [key, value] of Object.entries(envVars)) {
        if (value !== void 0 && value !== null) {
          const escapedValue = typeof value === "string" && value.includes('"') ? `'${value}'` : `${value}`;
          envContent += `${key}=${escapedValue}
`;
        }
      }
      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Content-Disposition", `attachment; filename=".env-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}"`);
      res.send(envContent);
      console.log("[Admin] Environment variables exported by admin");
    } catch (error) {
      console.error("Export env error:", error);
      res.status(500).json({ error: "Failed to export environment variables" });
    }
  });
  app2.get("/api/dev/export-env-file", async (req, res) => {
    try {
      const envVars = process.env;
      let envContent = "";
      for (const [key, value] of Object.entries(envVars)) {
        if (value !== void 0 && value !== null) {
          const escapedValue = typeof value === "string" && value.includes('"') ? `'${value}'` : `${value}`;
          envContent += `${key}=${escapedValue}
`;
        }
      }
      res.json({
        success: true,
        content: envContent,
        fileName: `.env-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}`,
        count: Object.keys(envVars).length
      });
      console.log("[Dev] Environment variables exported");
    } catch (error) {
      console.error("Export env error:", error);
      res.status(500).json({ error: "Failed to export environment variables" });
    }
  });
  setTimeout(() => {
    LogStreamService.broadcast(
      LogStreamService.createLogEntry("info", `GreenPay server started on port ${process.env.PORT || 5e3}`, "system")
    );
  }, 1e3);
  app2.post("/api/admin/announcements/upload-media", requireAdminAuth, upload.single("file"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ message: "No file provided" });
      const isVideo = file.mimetype.startsWith("video/");
      const folder = isVideo ? "announcements/video" : "announcements/image";
      const url = await cloudinaryStorage2.uploadFile(`${folder}/${Date.now()}-${file.originalname}`, file.buffer, file.mimetype);
      res.json({ url, type: isVideo ? "video" : "image" });
    } catch (error) {
      console.error("Announcement media upload error:", error);
      res.status(500).json({ message: "Failed to upload media" });
    }
  });
  app2.get("/api/announcements", async (req, res) => {
    try {
      const announcements2 = await storage.getActiveAnnouncements();
      res.json({ announcements: announcements2 });
    } catch (error) {
      console.error("Fetch announcements error:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });
  app2.get("/api/admin/announcements", requireAdminAuth, async (req, res) => {
    try {
      const announcements2 = await storage.getAnnouncements();
      res.json({ announcements: announcements2 });
    } catch (error) {
      console.error("Admin fetch announcements error:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });
  app2.post("/api/admin/announcements", requireAdminAuth, async (req, res) => {
    try {
      const announcementData = insertAnnouncementSchema.parse(req.body);
      const announcement = await storage.createAnnouncement(announcementData);
      res.json({ announcement, message: "Announcement created successfully" });
    } catch (error) {
      console.error("Create announcement error:", error);
      res.status(400).json({ message: "Invalid announcement data" });
    }
  });
  app2.put("/api/admin/announcements/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const announcement = await storage.updateAnnouncement(id, req.body);
      if (announcement) {
        res.json({ announcement, message: "Announcement updated successfully" });
      } else {
        res.status(404).json({ message: "Announcement not found" });
      }
    } catch (error) {
      console.error("Update announcement error:", error);
      res.status(500).json({ message: "Error updating announcement" });
    }
  });
  app2.delete("/api/admin/announcements/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAnnouncement(id);
      res.json({ message: "Announcement deleted successfully" });
    } catch (error) {
      console.error("Delete announcement error:", error);
      res.status(500).json({ message: "Error deleting announcement" });
    }
  });
  app2.post("/api/admin/send-bulk-messages", requireAdminAuth, async (req, res) => {
    try {
      const { userIds, message } = req.body;
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !message) {
        return res.status(400).json({ message: "User IDs array and message are required" });
      }
      const { messagingService: messagingService3 } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
      let sentCount = 0;
      const errors = [];
      for (const userId of userIds) {
        try {
          const user = await storage.getUser(userId);
          if (!user) {
            errors.push(`User ${userId} not found`);
            continue;
          }
          await messagingService3.sendMessage(user.phone, message);
          sentCount++;
        } catch (error) {
          errors.push(`Failed to send to ${userId}: ${String(error)}`);
        }
      }
      console.log(`Admin sent bulk messages to ${sentCount}/${userIds.length} users`);
      res.json({
        success: true,
        sentCount,
        totalRequested: userIds.length,
        errors: errors.length > 0 ? errors : void 0,
        message: `Message sent to ${sentCount} user(s)`
      });
    } catch (error) {
      console.error("Bulk message error:", error);
      res.status(500).json({ message: "Error sending bulk messages" });
    }
  });
  app2.post("/api/fcm/register-token", requireAuth, async (req, res) => {
    try {
      const { token } = req.body;
      const sessionUserId = req.session?.userId;
      if (!token) {
        return res.status(400).json({ message: "FCM token is required" });
      }
      await storage.updateUser(sessionUserId, { fcmToken: token });
      console.log(`FCM token registered for user: ${sessionUserId}`);
      res.json({ message: "FCM token registered successfully" });
    } catch (error) {
      console.error("FCM registration error:", error);
      res.status(500).json({ message: "Failed to register FCM token" });
    }
  });
  app2.post("/api/admin/push-notifications/send-user", requireAdminAuth, async (req, res) => {
    try {
      const { userId, title, body, data } = req.body;
      if (!userId || !title || !body) {
        return res.status(400).json({ message: "userId, title, and body are required" });
      }
      const { notificationQueue: notificationQueue2 } = await Promise.resolve().then(() => (init_notification_queue(), notification_queue_exports));
      const result = await notificationQueue2.sendAdminAlert(userId, title, body);
      await storage.createAdminLog({
        adminId: req.session?.admin?.id || null,
        action: "push_notification_sent",
        details: `Admin sent push notification to user: ${userId}`,
        targetId: userId
      });
      res.json({
        success: result,
        message: result ? "Notification sent" : "Failed to send notification"
      });
    } catch (error) {
      console.error("Push notification error:", error);
      res.status(500).json({ message: "Failed to send notification" });
    }
  });
  app2.post("/api/admin/push-notifications/send-all", requireAdminAuth, async (req, res) => {
    try {
      const { title, body, data } = req.body;
      if (!title || !body) {
        return res.status(400).json({ message: "title and body are required" });
      }
      const { notificationQueue: notificationQueue2 } = await Promise.resolve().then(() => (init_notification_queue(), notification_queue_exports));
      const result = await notificationQueue2.sendBulkNotification({
        title,
        body,
        type: "general",
        data,
        sendToAll: true
      });
      await storage.createAdminLog({
        adminId: req.session?.admin?.id || null,
        action: "bulk_push_notification",
        details: `Admin sent broadcast notification to all users`
      });
      res.json({
        success: result.success > 0,
        sent: result.success,
        failed: result.failure,
        message: `Notification sent to ${result.success} user(s)`
      });
    } catch (error) {
      console.error("Bulk notification error:", error);
      res.status(500).json({ message: "Failed to send bulk notification" });
    }
  });
  app2.post("/api/admin/push-notifications/send-multiple", requireAdminAuth, async (req, res) => {
    try {
      const { userIds, title, body, data } = req.body;
      if (!userIds || !Array.isArray(userIds) || !title || !body) {
        return res.status(400).json({ message: "userIds array, title, and body are required" });
      }
      const { notificationQueue: notificationQueue2 } = await Promise.resolve().then(() => (init_notification_queue(), notification_queue_exports));
      const result = await notificationQueue2.sendBulkNotification({
        title,
        body,
        type: "general",
        data,
        targetUserIds: userIds
      });
      await storage.createAdminLog({
        adminId: req.session?.admin?.id || null,
        action: "targeted_push_notification",
        details: `Admin sent notification to ${userIds.length} user(s)`
      });
      res.json({
        success: result.success > 0,
        sent: result.success,
        failed: result.failure,
        message: `Notification sent to ${result.success} user(s), ${result.failure} failed`
      });
    } catch (error) {
      console.error("Targeted notification error:", error);
      res.status(500).json({ message: "Failed to send notifications" });
    }
  });
  app2.post("/api/admin/sms/send-user", requireAdminAuth, async (req, res) => {
    try {
      const { userId, message } = req.body;
      if (!userId || !message) return res.status(400).json({ message: "userId and message are required" });
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      if (!user.phone) return res.status(400).json({ message: "User has no phone number" });
      const { messagingService: messagingService3 } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
      const result = await messagingService3.sendMessage(user.phone, message);
      await storage.createAdminLog({ adminId: req.session?.admin?.id || null, action: "sms_send_user", details: `SMS sent to ${user.fullName} (${user.phone})` });
      res.json({ success: true, sms: result.sms, whatsapp: result.whatsapp });
    } catch (error) {
      console.error("Admin SMS send-user error:", error);
      res.status(500).json({ message: "Failed to send SMS" });
    }
  });
  app2.post("/api/admin/sms/broadcast", requireAdminAuth, async (req, res) => {
    try {
      const { userIds, all, message } = req.body;
      if (!message) return res.status(400).json({ message: "message is required" });
      let phones = [];
      if (all) {
        const allUsersResult = await storage.getAllUsers({ limit: 1e5 });
        phones = (allUsersResult.users || []).filter((u) => u.phone).map((u) => ({ phone: u.phone }));
      } else if (Array.isArray(userIds) && userIds.length > 0) {
        const found = await Promise.all(userIds.map((id) => storage.getUser(id)));
        phones = found.filter((u) => u?.phone).map((u) => ({ phone: u.phone }));
      } else {
        return res.status(400).json({ message: "Provide userIds array or all: true" });
      }
      const { messagingService: messagingService3 } = await Promise.resolve().then(() => (init_messaging(), messaging_exports));
      const phoneNumbers = phones.map((p) => p.phone);
      const result = await messagingService3.sendSMSToMultiple(phoneNumbers, message);
      await storage.createAdminLog({ adminId: req.session?.admin?.id || null, action: "sms_broadcast", details: `SMS broadcast to ${result.sent} users` });
      res.json({ success: true, sent: result.sent, failed: result.failed, total: phoneNumbers.length });
    } catch (error) {
      console.error("Admin SMS broadcast error:", error);
      res.status(500).json({ message: "Failed to send SMS broadcast" });
    }
  });
  app2.get("/api/admin/email-templates", requireAdminAuth, async (req, res) => {
    try {
      const { mailtrapService: mailtrapService3 } = await Promise.resolve().then(() => (init_mailtrap(), mailtrap_exports));
      const templates = await mailtrapService3.getAllTemplateUuids();
      res.json({ templates });
    } catch (error) {
      console.error("Email templates fetch error:", error);
      res.status(500).json({ message: "Failed to fetch email templates" });
    }
  });
  app2.put("/api/admin/email-templates", requireAdminAuth, async (req, res) => {
    try {
      const { templates } = req.body;
      if (!templates || typeof templates !== "object") {
        return res.status(400).json({ message: "templates object required" });
      }
      for (const [name, uuid] of Object.entries(templates)) {
        await storage.setSystemSetting({
          category: "email_templates",
          key: name,
          value: String(uuid || "").trim(),
          description: `Email template UUID for ${name}`
        });
      }
      res.json({ success: true, message: "Email template UUIDs saved" });
    } catch (error) {
      console.error("Email templates save error:", error);
      res.status(500).json({ message: "Failed to save email templates" });
    }
  });
  app2.post("/api/disputes", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { transactionId, reason, description } = req.body;
      if (!transactionId || !reason) return res.status(400).json({ message: "transactionId and reason required" });
      const [txn] = await db.select().from(transactions).where(eq3(transactions.id, transactionId));
      if (!txn || txn.userId !== userId) return res.status(404).json({ message: "Transaction not found" });
      const existing = await db.select().from(transactionDisputes).where(eq3(transactionDisputes.transactionId, transactionId));
      if (existing.some((d) => d.status === "open" || d.status === "under_review")) {
        return res.status(409).json({ message: "An open dispute already exists for this transaction" });
      }
      const [dispute] = await db.insert(transactionDisputes).values({
        userId,
        transactionId,
        reason,
        description: description || null
      }).returning();
      res.json({ dispute, message: "Dispute submitted successfully" });
    } catch (error) {
      console.error("Error creating dispute:", error);
      res.status(500).json({ message: "Failed to submit dispute" });
    }
  });
  app2.get("/api/disputes", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const disputes = await db.select().from(transactionDisputes).where(eq3(transactionDisputes.userId, userId)).orderBy(desc2(transactionDisputes.createdAt));
      res.json({ disputes });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch disputes" });
    }
  });
  app2.get("/api/admin/disputes", requireAdminAuth, async (req, res) => {
    try {
      const disputes = await db.select({
        id: transactionDisputes.id,
        userId: transactionDisputes.userId,
        transactionId: transactionDisputes.transactionId,
        reason: transactionDisputes.reason,
        description: transactionDisputes.description,
        status: transactionDisputes.status,
        adminNotes: transactionDisputes.adminNotes,
        resolvedAt: transactionDisputes.resolvedAt,
        createdAt: transactionDisputes.createdAt,
        userFullName: users.fullName,
        userEmail: users.email
      }).from(transactionDisputes).leftJoin(users, eq3(transactionDisputes.userId, users.id)).orderBy(desc2(transactionDisputes.createdAt));
      res.json({ disputes });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch disputes" });
    }
  });
  app2.patch("/api/admin/disputes/:id", requireAdminAuth, async (req, res) => {
    try {
      const { status, adminNotes } = req.body;
      const updateData = { updatedAt: /* @__PURE__ */ new Date() };
      if (status) updateData.status = status;
      if (adminNotes !== void 0) updateData.adminNotes = adminNotes;
      if (status === "resolved" || status === "rejected") updateData.resolvedAt = /* @__PURE__ */ new Date();
      const [updated] = await db.update(transactionDisputes).set(updateData).where(eq3(transactionDisputes.id, req.params.id)).returning();
      res.json({ dispute: updated });
    } catch (error) {
      res.status(500).json({ message: "Failed to update dispute" });
    }
  });
  const CRYPTO_RATES = {
    BTC: 65e3,
    ETH: 3200,
    USDT: 1,
    USDC: 1
  };
  const CRYPTO_NETWORKS = {
    BTC: "bitcoin",
    ETH: "ethereum",
    USDT: "tron",
    USDC: "ethereum"
  };
  function generateCryptoAddress(coin) {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const rand = () => chars[Math.floor(Math.random() * chars.length)];
    if (coin === "BTC") return "1" + Array.from({ length: 33 }, rand).join("");
    if (coin === "ETH" || coin === "USDC") return "0x" + Array.from({ length: 40 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
    if (coin === "USDT") return "T" + Array.from({ length: 33 }, rand).join("");
    return Array.from({ length: 34 }, rand).join("");
  }
  app2.get("/api/crypto/deposit-addresses", requireAuth, async (req, res) => {
    try {
      const addrs = await db.select().from(cryptoDepositAddresses).where(eq3(cryptoDepositAddresses.isActive, true)).orderBy(cryptoDepositAddresses.coin);
      res.json({ addresses: addrs, rates: CRYPTO_RATES });
    } catch (error) {
      console.error("Deposit addresses fetch error:", error);
      res.status(500).json({ message: "Failed to fetch deposit addresses" });
    }
  });
  app2.get("/api/crypto/wallets", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const wallets2 = await db.select().from(cryptoWallets).where(eq3(cryptoWallets.userId, userId));
      const supported = ["BTC", "ETH", "USDT", "USDC"];
      const existing = wallets2.map((w) => w.coin);
      const toCreate = supported.filter((c) => !existing.includes(c));
      const newWallets = [];
      for (const coin of toCreate) {
        const [w] = await db.insert(cryptoWallets).values({
          userId,
          coin,
          network: CRYPTO_NETWORKS[coin],
          address: ""
          // no per-user address; admin master addresses are used
        }).returning();
        newWallets.push(w);
      }
      const allWallets = [...wallets2, ...newWallets].map((w) => ({
        ...w,
        usdRate: CRYPTO_RATES[w.coin] || 1,
        usdBalance: (parseFloat(w.balance || "0") * (CRYPTO_RATES[w.coin] || 1)).toFixed(2)
      }));
      res.json({ wallets: allWallets, rates: CRYPTO_RATES });
    } catch (error) {
      console.error("Crypto wallets error:", error);
      res.status(500).json({ message: "Failed to fetch crypto wallets" });
    }
  });
  app2.post("/api/crypto/deposit", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { coin, amount, network } = req.body;
      if (!coin || !amount) return res.status(400).json({ message: "coin and amount required" });
      const rate = CRYPTO_RATES[coin];
      if (!rate) return res.status(400).json({ message: "Unsupported coin" });
      const cryptoAmount = parseFloat(amount);
      const usdValue = cryptoAmount * rate;
      const candidates = await db.select().from(cryptoDepositAddresses).where(eq3(cryptoDepositAddresses.coin, coin));
      const active = candidates.filter((a) => a.isActive);
      const chosen = (network ? active.find((a) => a.network === network) : active[0]) || active[0];
      if (!chosen) {
        return res.status(503).json({ message: `No deposit address configured by admin for ${coin}. Please contact support.` });
      }
      const [cryptoTx] = await db.insert(cryptoTransactions).values({
        userId,
        type: "deposit",
        coin,
        network: chosen.network,
        amount: cryptoAmount.toFixed(8),
        usdValue: usdValue.toFixed(2),
        toAddress: chosen.address,
        status: "pending",
        confirmations: 0,
        requiredConfirmations: coin === "BTC" ? 3 : coin === "ETH" || coin === "USDC" ? 12 : 20
      }).returning();
      res.json({
        cryptoTransaction: cryptoTx,
        depositAddress: chosen.address,
        memo: chosen.memo || null,
        networkLabel: chosen.networkLabel,
        message: `Send exactly ${cryptoAmount} ${coin} on ${chosen.networkLabel} to the address below. Your wallet will be credited after ${cryptoTx.requiredConfirmations} confirmations.`
      });
    } catch (error) {
      console.error("Crypto deposit error:", error);
      res.status(500).json({ message: "Failed to initiate deposit" });
    }
  });
  app2.post("/api/crypto/withdraw", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { coin, amount, toAddress } = req.body;
      if (!coin || !amount || !toAddress) return res.status(400).json({ message: "coin, amount, and toAddress required" });
      const rate = CRYPTO_RATES[coin];
      if (!rate) return res.status(400).json({ message: "Unsupported coin" });
      const cryptoAmount = parseFloat(amount);
      const usdValue = cryptoAmount * rate;
      const [userRow] = await db.select().from(users).where(eq3(users.id, userId));
      if (!userRow) return res.status(404).json({ message: "User not found" });
      if (userRow.isSuspended) {
        return res.status(403).json({ message: userRow.suspensionReason || "Your account is suspended. Crypto withdrawals are disabled. Please contact support." });
      }
      const [usdWallet] = await db.select().from(wallets).where(and2(eq3(wallets.userId, userId), eq3(wallets.currency, "USD"))).limit(1);
      if (usdWallet?.isSuspended) {
        return res.status(403).json({ message: usdWallet.suspendReason || "Your USD wallet is suspended. Crypto withdrawals are disabled." });
      }
      const availableUsd = parseFloat(userRow.balance || "0") - parseFloat(usdWallet?.holdAmount || "0");
      if (availableUsd < usdValue) {
        return res.status(400).json({ message: "Insufficient available wallet balance", available: availableUsd.toFixed(2), held: parseFloat(usdWallet?.holdAmount || "0").toFixed(2) });
      }
      await db.update(users).set({
        balance: (parseFloat(userRow.balance || "0") - usdValue).toFixed(2)
      }).where(eq3(users.id, userId));
      const [cryptoTx] = await db.insert(cryptoTransactions).values({
        userId,
        type: "withdrawal",
        coin,
        network: CRYPTO_NETWORKS[coin] || "unknown",
        amount: cryptoAmount.toFixed(8),
        usdValue: usdValue.toFixed(2),
        toAddress,
        status: "pending",
        confirmations: 0,
        requiredConfirmations: 1
      }).returning();
      await db.insert(transactions).values({
        userId,
        type: "withdraw",
        amount: usdValue.toFixed(2),
        currency: "USD",
        status: "pending",
        description: `Crypto withdrawal: ${cryptoAmount} ${coin}`,
        reference: cryptoTx.id
      });
      res.json({ cryptoTransaction: cryptoTx, message: "Withdrawal initiated. Processing may take 30\u201360 minutes." });
    } catch (error) {
      console.error("Crypto withdrawal error:", error);
      res.status(500).json({ message: "Failed to process withdrawal" });
    }
  });
  app2.post("/api/crypto/buy-card", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { coin } = req.body;
      if (!coin) return res.status(400).json({ message: "coin required" });
      const rate = CRYPTO_RATES[coin];
      if (!rate) return res.status(400).json({ message: "Unsupported coin" });
      const cardPriceSetting = await storage.getSystemSetting("general", "card_price");
      const cardPriceUSD = parseFloat(cardPriceSetting?.value || "60.00");
      const cryptoAmount = cardPriceUSD / rate;
      const [cryptoTx] = await db.insert(cryptoTransactions).values({
        userId,
        type: "card_purchase",
        coin,
        network: CRYPTO_NETWORKS[coin] || "unknown",
        amount: cryptoAmount.toFixed(8),
        usdValue: cardPriceUSD.toFixed(2),
        status: "pending",
        requiredConfirmations: coin === "BTC" ? 3 : 12
      }).returning();
      res.json({
        cryptoTransaction: cryptoTx,
        cryptoAmount: cryptoAmount.toFixed(8),
        coin,
        usdValue: cardPriceUSD,
        message: `Send exactly ${cryptoAmount.toFixed(8)} ${coin} to receive your virtual card after confirmation.`
      });
    } catch (error) {
      console.error("Crypto buy card error:", error);
      res.status(500).json({ message: "Failed to initiate card purchase" });
    }
  });
  app2.get("/api/crypto/transactions", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const txns = await db.select().from(cryptoTransactions).where(eq3(cryptoTransactions.userId, userId)).orderBy(desc2(cryptoTransactions.createdAt));
      res.json({ transactions: txns });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch crypto transactions" });
    }
  });
  app2.get("/api/admin/crypto/transactions", requireAdminAuth, async (req, res) => {
    try {
      const txns = await db.select({
        id: cryptoTransactions.id,
        userId: cryptoTransactions.userId,
        type: cryptoTransactions.type,
        coin: cryptoTransactions.coin,
        network: cryptoTransactions.network,
        amount: cryptoTransactions.amount,
        usdValue: cryptoTransactions.usdValue,
        txHash: cryptoTransactions.txHash,
        fromAddress: cryptoTransactions.fromAddress,
        toAddress: cryptoTransactions.toAddress,
        status: cryptoTransactions.status,
        confirmations: cryptoTransactions.confirmations,
        requiredConfirmations: cryptoTransactions.requiredConfirmations,
        fee: cryptoTransactions.fee,
        adminNotes: cryptoTransactions.adminNotes,
        completedAt: cryptoTransactions.completedAt,
        createdAt: cryptoTransactions.createdAt,
        userFullName: users.fullName,
        userEmail: users.email
      }).from(cryptoTransactions).leftJoin(users, eq3(cryptoTransactions.userId, users.id)).orderBy(desc2(cryptoTransactions.createdAt));
      res.json({ transactions: txns });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch crypto transactions" });
    }
  });
  app2.patch("/api/admin/crypto/transactions/:id", requireAdminAuth, async (req, res) => {
    try {
      const { status, txHash, adminNotes, confirmations } = req.body;
      const updateData = { updatedAt: /* @__PURE__ */ new Date() };
      if (status) updateData.status = status;
      if (txHash) updateData.txHash = txHash;
      if (adminNotes !== void 0) updateData.adminNotes = adminNotes;
      if (confirmations !== void 0) updateData.confirmations = confirmations;
      if (status === "completed") {
        updateData.completedAt = /* @__PURE__ */ new Date();
        const [cryptoTx] = await db.select().from(cryptoTransactions).where(eq3(cryptoTransactions.id, req.params.id));
        if (cryptoTx && cryptoTx.type === "deposit") {
          const [userRow] = await db.select().from(users).where(eq3(users.id, cryptoTx.userId));
          if (userRow) {
            await db.update(users).set({
              balance: (parseFloat(userRow.balance || "0") + parseFloat(cryptoTx.usdValue)).toFixed(2)
            }).where(eq3(users.id, cryptoTx.userId));
            await db.insert(transactions).values({
              userId: cryptoTx.userId,
              type: "deposit",
              amount: cryptoTx.usdValue,
              currency: "USD",
              status: "completed",
              description: `Crypto deposit: ${cryptoTx.amount} ${cryptoTx.coin}`,
              reference: cryptoTx.id,
              completedAt: /* @__PURE__ */ new Date()
            });
          }
        }
        if (cryptoTx && cryptoTx.type === "card_purchase") {
          const [userRow] = await db.select().from(users).where(eq3(users.id, cryptoTx.userId));
          if (userRow) {
            await db.insert(transactions).values({
              userId: cryptoTx.userId,
              type: "card_purchase",
              amount: cryptoTx.usdValue,
              currency: "USD",
              status: "completed",
              description: `Virtual card purchase via ${cryptoTx.coin}`,
              reference: cryptoTx.id,
              completedAt: /* @__PURE__ */ new Date()
            });
          }
        }
      }
      const [updated] = await db.update(cryptoTransactions).set(updateData).where(eq3(cryptoTransactions.id, req.params.id)).returning();
      res.json({ transaction: updated });
    } catch (error) {
      console.error("Admin crypto update error:", error);
      res.status(500).json({ message: "Failed to update crypto transaction" });
    }
  });
  app2.get("/api/admin/crypto/addresses", requireAdminAuth, async (req, res) => {
    try {
      const addrs = await db.select().from(cryptoDepositAddresses).orderBy(cryptoDepositAddresses.coin);
      res.json({ addresses: addrs });
    } catch (error) {
      console.error("Admin fetch crypto addresses error:", error);
      res.status(500).json({ message: "Failed to fetch addresses" });
    }
  });
  app2.post("/api/admin/crypto/addresses", requireAdminAuth, async (req, res) => {
    try {
      const { coin, network, networkLabel, address, memo, qrCodeUrl, minDeposit, isActive, notes } = req.body;
      if (!coin || !network || !networkLabel || !address) {
        return res.status(400).json({ message: "coin, network, networkLabel and address are required" });
      }
      const [created] = await db.insert(cryptoDepositAddresses).values({
        coin: coin.toUpperCase(),
        network,
        networkLabel,
        address,
        memo: memo || null,
        qrCodeUrl: qrCodeUrl || null,
        minDeposit: minDeposit ? String(minDeposit) : "0.00000000",
        isActive: isActive !== false,
        notes: notes || null
      }).returning();
      res.json({ address: created });
    } catch (error) {
      console.error("Admin create crypto address error:", error);
      res.status(500).json({ message: "Failed to create address" });
    }
  });
  app2.put("/api/admin/crypto/addresses/:id", requireAdminAuth, async (req, res) => {
    try {
      const updates = { ...req.body, updatedAt: /* @__PURE__ */ new Date() };
      if (updates.coin) updates.coin = String(updates.coin).toUpperCase();
      if (updates.minDeposit !== void 0) updates.minDeposit = String(updates.minDeposit);
      const [updated] = await db.update(cryptoDepositAddresses).set(updates).where(eq3(cryptoDepositAddresses.id, req.params.id)).returning();
      if (!updated) return res.status(404).json({ message: "Address not found" });
      res.json({ address: updated });
    } catch (error) {
      console.error("Admin update crypto address error:", error);
      res.status(500).json({ message: "Failed to update address" });
    }
  });
  app2.delete("/api/admin/crypto/addresses/:id", requireAdminAuth, async (req, res) => {
    try {
      await db.delete(cryptoDepositAddresses).where(eq3(cryptoDepositAddresses.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Admin delete crypto address error:", error);
      res.status(500).json({ message: "Failed to delete address" });
    }
  });
  app2.get("/api/admin/users/:id/cards", async (req, res) => {
    try {
      const cards = await storage.getVirtualCardsByUserId(req.params.id);
      res.json({ cards });
    } catch (error) {
      console.error("Admin fetch user cards error:", error);
      res.status(500).json({ message: "Failed to fetch user cards" });
    }
  });
  app2.post("/api/transactions/:id/cancel", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const tx = await storage.getTransactionById(req.params.id);
      if (!tx) return res.status(404).json({ message: "Transaction not found" });
      if (tx.userId !== userId) return res.status(403).json({ message: "Not your transaction" });
      if (tx.status !== "pending" && tx.status !== "processing") {
        return res.status(400).json({ message: "Only pending transactions can be cancelled" });
      }
      const deductionTypes = ["send", "withdraw", "transfer", "exchange", "bills", "airtime", "card_purchase"];
      if (deductionTypes.includes(tx.type)) {
        const user = await storage.getUser(userId);
        if (user) {
          const refundAmount = parseFloat(tx.amount || "0") + parseFloat(tx.fee || "0");
          const refundCurrency = normalizeCurrency(tx.currency || "USD");
          const refundWallet = await getUserWallet(userId, refundCurrency);
          if (refundWallet) {
            if (tx.type === "withdraw") {
              await pool.query(
                `UPDATE wallets SET withdrawal_hold_amount = GREATEST(0, withdrawal_hold_amount - $1), updated_at = NOW() WHERE id = $2`,
                [refundAmount, refundWallet.id]
              );
            } else {
              await pool.query(
                `UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE id = $2`,
                [refundAmount, refundWallet.id]
              );
            }
          }
        }
      }
      const updated = await storage.updateTransaction(tx.id, {
        status: "cancelled",
        description: (tx.description || "") + " (cancelled by user)"
      });
      res.json({ transaction: updated, message: "Transaction cancelled and balance refunded" });
    } catch (error) {
      console.error("Cancel transaction error:", error);
      res.status(500).json({ message: "Failed to cancel transaction" });
    }
  });
  app2.get("/api/analytics/summary", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const allTxns = await db.select().from(transactions).where(eq3(transactions.userId, userId)).orderBy(desc2(transactions.createdAt));
      const now = /* @__PURE__ */ new Date();
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          label: d.toLocaleString("default", { month: "short" }),
          month: d.getMonth(),
          year: d.getFullYear(),
          sent: 0,
          received: 0
        });
      }
      const categoryMap = {
        "Send Money": 0,
        "Deposits": 0,
        "Withdrawals": 0,
        "Card Purchase": 0,
        "Exchange": 0,
        "Bills": 0,
        "Airtime": 0,
        "Other": 0
      };
      for (const txn of allTxns) {
        if (txn.status !== "completed") continue;
        const amt = parseFloat(txn.amount || "0");
        const usdAmt = txn.currency === "KES" ? amt / 130 : amt;
        const txDate = new Date(txn.createdAt);
        const mo = months.find((m) => m.month === txDate.getMonth() && m.year === txDate.getFullYear());
        if (mo) {
          if (["send", "withdraw", "card_purchase", "exchange", "airtime", "bill"].includes(txn.type)) mo.sent += usdAmt;
          else if (["receive", "deposit"].includes(txn.type)) mo.received += usdAmt;
        }
        if (txn.type === "send") categoryMap["Send Money"] += usdAmt;
        else if (txn.type === "deposit") categoryMap["Deposits"] += usdAmt;
        else if (txn.type === "withdraw") categoryMap["Withdrawals"] += usdAmt;
        else if (txn.type === "card_purchase") categoryMap["Card Purchase"] += usdAmt;
        else if (txn.type === "exchange") categoryMap["Exchange"] += usdAmt;
        else if (txn.type === "bill") categoryMap["Bills"] += usdAmt;
        else if (txn.type === "airtime") categoryMap["Airtime"] += usdAmt;
        else categoryMap["Other"] += usdAmt;
      }
      const categoryData = Object.entries(categoryMap).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }));
      const totalIn = months.reduce((s, m) => s + m.received, 0);
      const totalOut = months.reduce((s, m) => s + m.sent, 0);
      const txCount = allTxns.filter((t) => t.status === "completed").length;
      res.json({
        monthlyData: months.map((m) => ({ label: m.label, sent: parseFloat(m.sent.toFixed(2)), received: parseFloat(m.received.toFixed(2)) })),
        categoryData,
        summary: {
          totalIn: parseFloat(totalIn.toFixed(2)),
          totalOut: parseFloat(totalOut.toFixed(2)),
          txCount,
          netFlow: parseFloat((totalIn - totalOut).toFixed(2))
        }
      });
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });
  app2.get("/api/wallets", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const currencyMeta = Object.fromEntries(NEXUSPAY_CURRENCIES.map((c) => [c.code, c]));
      let userWallets = await db.select().from(wallets).where(eq3(wallets.userId, userId));
      if (userWallets.length === 0) {
        try {
          const userRecord = await db.select().from(users).where(eq3(users.id, userId)).limit(1);
          const defCurrencySetting = await pool.query(`SELECT value FROM system_settings WHERE key = 'default_currency' LIMIT 1`);
          const defCurrency = defCurrencySetting.rows[0]?.value?.replace(/['"]/g, "") || userRecord[0]?.defaultCurrency || "USD";
          const [newWallet] = await db.insert(wallets).values({ userId, currency: defCurrency, isDefault: true, isActive: true }).returning();
          userWallets = [newWallet];
        } catch (autoCreateErr) {
          console.error("Wallet auto-create error:", autoCreateErr);
        }
      }
      const enriched = userWallets.map((w) => ({
        ...w,
        availableBalance: walletAvailableBalance(w),
        currencyMeta: currencyMeta[w.currency] || null
      }));
      res.json({ wallets: enriched });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  app2.post("/api/wallets", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { currency } = req.body;
      if (!currency) return res.status(400).json({ message: "currency required" });
      const normalizedCurrency = normalizeCurrency(currency);
      const knownCodes = await getEnabledCurrencyCodes();
      if (!knownCodes.includes(normalizedCurrency)) return res.status(400).json({ message: `${normalizedCurrency} is not an enabled currency` });
      const existing = await db.select().from(wallets).where(eq3(wallets.userId, userId));
      if (existing.some((w) => w.currency === normalizedCurrency)) return res.status(400).json({ message: `You already have a ${normalizedCurrency} wallet` });
      const isDefault = existing.length === 0;
      const [newWallet] = await db.insert(wallets).values({ userId, currency: normalizedCurrency, isDefault, isActive: true }).returning();
      res.json({ wallet: newWallet });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  app2.put("/api/wallets/:id/default", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { id } = req.params;
      await db.update(wallets).set({ isDefault: false }).where(eq3(wallets.userId, userId));
      await db.update(wallets).set({ isDefault: true, updatedAt: /* @__PURE__ */ new Date() }).where(eq3(wallets.id, id));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  app2.get("/api/currencies", async (req, res) => {
    try {
      const enabled = await getEnabledCurrencyCodes();
      const defSetting = await pool.query(`SELECT value FROM system_settings WHERE key = 'default_currency' LIMIT 1`);
      const defaultCurrency = (defSetting.rows[0]?.value || "USD").replace(/['"]/g, "").trim();
      const currencies = NEXUSPAY_CURRENCIES.filter((c) => enabled.includes(c.code));
      res.json({ currencies, defaultCurrency, enabled });
    } catch (e) {
      res.json({ currencies: NEXUSPAY_CURRENCIES, defaultCurrency: "USD", enabled: NEXUSPAY_CURRENCIES.map((c) => c.code) });
    }
  });
  app2.post("/api/deposit/nexuspay", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { walletId, currency, amount, phone, email, correspondent, description } = req.body;
      if (!walletId || !currency || !amount) return res.status(400).json({ message: "walletId, currency, and amount are required" });
      const normalizedCurrency = normalizeCurrency(currency);
      if (!(await getEnabledCurrencyCodes()).includes(normalizedCurrency)) {
        return res.status(400).json({ message: `${normalizedCurrency} is not an enabled currency` });
      }
      if (parseFloat(amount) <= 0) return res.status(400).json({ message: "Amount must be greater than 0" });
      const [wallet_] = await db.select().from(wallets).where(eq3(wallets.id, walletId));
      if (!wallet_ || wallet_.userId !== userId) return res.status(403).json({ message: "Wallet not found" });
      if (!wallet_.isActive || wallet_.isSuspended) return res.status(400).json({ message: "This wallet is not active" });
      if (wallet_.currency !== normalizedCurrency) {
        return res.status(400).json({ message: "Selected wallet and deposit currency do not match" });
      }
      const currencyMeta = NEXUSPAY_CURRENCIES.find((c) => c.code === normalizedCurrency);
      const channel = currencyMeta?.channel || "card";
      const result = await nexusPayService.checkout({ amount: parseFloat(amount), currency: normalizedCurrency, channel, phone, email, correspondent, description: description || `Deposit to ${normalizedCurrency} wallet` });
      await db.insert(transactions).values({
        userId,
        type: "deposit",
        amount: String(amount),
        currency: normalizedCurrency,
        status: "pending",
        reference: result.reference,
        description: `NexusPay ${currency} deposit`,
        metadata: { walletId, channel, gateway: currencyMeta?.gateway, redirectUrl: result.redirectUrl }
      });
      res.json({ success: true, reference: result.reference, status: result.status, redirectUrl: result.redirectUrl, message: result.redirectUrl ? "Redirecting to payment page..." : "Check your phone for the payment prompt." });
    } catch (e) {
      console.error("NexusPay deposit error:", e);
      res.status(500).json({ message: e.message || "Deposit failed" });
    }
  });
  app2.get("/api/deposit/nexuspay/status/:reference", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { reference } = req.params;
      const status = await nexusPayService.getStatus(reference);
      if (status.status === "completed") {
        const [txn] = await db.select().from(transactions).where(eq3(transactions.reference, reference));
        if (txn && txn.status !== "completed") {
          const meta = txn.metadata;
          const walletId = meta?.walletId;
          if (walletId) {
            await pool.query(`UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE id = $2 AND user_id = $3`, [parseFloat(status.amount), walletId, userId]);
          }
          await db.update(transactions).set({ status: "completed", completedAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }).where(eq3(transactions.reference, reference));
        }
      } else if (status.status === "failed") {
        await db.update(transactions).set({ status: "failed", updatedAt: /* @__PURE__ */ new Date() }).where(eq3(transactions.reference, reference));
      }
      res.json({ status: status.status, reference, amount: status.amount, currency: status.currency });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  app2.post("/api/exchange/swap", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { fromWalletId, toWalletId, amount } = req.body;
      if (!fromWalletId || !toWalletId || !amount) return res.status(400).json({ message: "fromWalletId, toWalletId, and amount are required" });
      const fromAmt = parseFloat(amount);
      if (fromAmt <= 0) return res.status(400).json({ message: "Amount must be > 0" });
      const userWallets = await db.select().from(wallets).where(eq3(wallets.userId, userId));
      const fromWallet = userWallets.find((w) => w.id === fromWalletId);
      const toWallet = userWallets.find((w) => w.id === toWalletId);
      if (!fromWallet || !toWallet) return res.status(404).json({ message: "Wallet not found" });
      if (fromWallet.isSuspended || toWallet.isSuspended) return res.status(400).json({ message: "One or both wallets are suspended" });
      const fromBalance = parseFloat(fromWallet.balance || "0") - parseFloat(fromWallet.holdAmount || "0");
      if (fromAmt > fromBalance) return res.status(400).json({ message: "Insufficient balance" });
      const exchangeRateSvc = createExchangeRateService(storage);
      const rate = await exchangeRateSvc.getExchangeRate(fromWallet.currency, toWallet.currency);
      const FEE_RATE = 0.015;
      const fee = fromAmt * FEE_RATE;
      const toAmount = (fromAmt - fee) * rate;
      await pool.query(`UPDATE wallets SET balance = balance - $1, updated_at = NOW() WHERE id = $2`, [fromAmt, fromWalletId]);
      await pool.query(`UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE id = $2`, [toAmount, toWalletId]);
      const ref = `EX-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      await db.insert(transactions).values({
        userId,
        type: "exchange",
        amount: String(fromAmt),
        currency: fromWallet.currency,
        fee: String(fee.toFixed(4)),
        exchangeRate: String(rate.toFixed(6)),
        status: "completed",
        reference: ref,
        completedAt: /* @__PURE__ */ new Date(),
        description: `Exchange ${fromWallet.currency} \u2192 ${toWallet.currency}`,
        metadata: { fromWalletId, toWalletId, toCurrency: toWallet.currency, toAmount: toAmount.toFixed(4) }
      });
      res.json({ success: true, fromAmount: fromAmt.toFixed(4), fromCurrency: fromWallet.currency, toAmount: toAmount.toFixed(4), toCurrency: toWallet.currency, rate: rate.toFixed(6), fee: fee.toFixed(4), reference: ref });
    } catch (e) {
      console.error("Exchange error:", e);
      res.status(500).json({ message: e.message || "Exchange failed" });
    }
  });
  app2.get("/api/admin/wallets", requireAdminAuth, async (req, res) => {
    try {
      const search = (req.query.search || "").toLowerCase();
      const allWallets = await pool.query(`
        SELECT w.*, u.full_name, u.email, u.phone
        FROM wallets w JOIN users u ON w.user_id = u.id
        WHERE ($1 = '' OR LOWER(u.full_name) LIKE '%' || $1 || '%'
           OR LOWER(u.email) LIKE '%' || $1 || '%' OR LOWER(u.phone) LIKE '%' || $1 || '%')
        ORDER BY u.full_name ASC, w.currency ASC
      `, [search]);
      const grouped = {};
      for (const row of allWallets.rows) {
        if (!grouped[row.user_id]) grouped[row.user_id] = [];
        grouped[row.user_id].push({
          id: row.id,
          userId: row.user_id,
          currency: row.currency,
          label: row.label,
          balance: row.balance,
          holdAmount: row.hold_amount,
          isDefault: row.is_default,
          isActive: row.is_active,
          isSuspended: row.is_suspended,
          suspendReason: row.suspend_reason,
          createdAt: row.created_at,
          user: { fullName: row.full_name, email: row.email, phone: row.phone }
        });
      }
      res.json({ wallets: allWallets.rows, grouped });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  app2.get("/api/admin/users/:userId/wallets", requireAdminAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const userWallets = await db.select().from(wallets).where(eq3(wallets.userId, userId));
      res.json({ wallets: userWallets });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  app2.post("/api/admin/users/:userId/wallets", requireAdminAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const { currency } = req.body;
      if (!currency) return res.status(400).json({ message: "currency required" });
      const existing = await db.select().from(wallets).where(eq3(wallets.userId, userId));
      if (existing.some((w) => w.currency === currency)) return res.status(400).json({ message: `User already has a ${currency} wallet` });
      const [newWallet] = await db.insert(wallets).values({ userId, currency, isDefault: existing.length === 0, isActive: true }).returning();
      res.json({ wallet: newWallet });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  app2.put("/api/admin/wallets/:id/suspend", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      await db.update(wallets).set({ isSuspended: true, suspendReason: reason || null, updatedAt: /* @__PURE__ */ new Date() }).where(eq3(wallets.id, id));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  app2.put("/api/admin/wallets/:id/unsuspend", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await db.update(wallets).set({ isSuspended: false, suspendReason: null, updatedAt: /* @__PURE__ */ new Date() }).where(eq3(wallets.id, id));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  app2.put("/api/admin/wallets/:id/hold", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { amount } = req.body;
      await db.update(wallets).set({ holdAmount: String(parseFloat(amount || "0")), updatedAt: /* @__PURE__ */ new Date() }).where(eq3(wallets.id, id));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  app2.put("/api/admin/wallets/:id/balance", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, type } = req.body;
      const adj = parseFloat(amount || "0");
      if (adj <= 0) return res.status(400).json({ message: "Amount must be > 0" });
      if (type === "credit") {
        await pool.query(`UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE id = $2`, [adj, id]);
      } else if (type === "debit") {
        await pool.query(`UPDATE wallets SET balance = GREATEST(0, balance - $1), updated_at = NOW() WHERE id = $2`, [adj, id]);
      } else {
        return res.status(400).json({ message: "type must be 'credit' or 'debit'" });
      }
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  app2.delete("/api/admin/wallets/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(wallets).where(eq3(wallets.id, id));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  app2.get("/api/admin/currencies/settings", requireAdminAuth, async (req, res) => {
    try {
      const result = await pool.query(`SELECT key, value FROM system_settings WHERE key IN ('default_currency', 'enabled_currencies', 'nexuspay_api_key')`);
      const map = {};
      for (const row of result.rows) map[row.key] = row.value;
      const fallbackResult = await pool.query(`SELECT key, value FROM system_settings WHERE category = 'exchange_rate_fallback'`);
      const fallbackRates = {};
      for (const row of fallbackResult.rows) fallbackRates[row.key] = row.value;
      res.json({
        defaultCurrency: map.default_currency || "USD",
        enabledCurrencies: (map.enabled_currencies || "USD,KES").split(","),
        nexusApiKey: map.nexuspay_api_key || "",
        fallbackRates
      });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  app2.put("/api/admin/currencies/settings", requireAdminAuth, async (req, res) => {
    try {
      const { defaultCurrency, enabledCurrencies, nexusApiKey, fallbackRates } = req.body;
      const upsert = async (key, value, category) => {
        await pool.query(`INSERT INTO system_settings (key, value, category) VALUES ($1, to_json($2::text), $3) ON CONFLICT (key) DO UPDATE SET value = to_json($2::text), updated_at = NOW()`, [key, value, category]);
      };
      if (defaultCurrency) await upsert("default_currency", defaultCurrency, "general");
      if (enabledCurrencies) await upsert("enabled_currencies", Array.isArray(enabledCurrencies) ? enabledCurrencies.join(",") : enabledCurrencies, "general");
      if (nexusApiKey !== void 0) {
        await upsert("nexuspay_api_key", nexusApiKey, "payment");
        if (nexusApiKey) process.env.NEXUSPAY_API_KEY = nexusApiKey;
      }
      if (fallbackRates && typeof fallbackRates === "object") {
        for (const [code, rate] of Object.entries(fallbackRates)) {
          if (rate) await upsert(code, String(rate), "exchange_rate_fallback");
        }
      }
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  optimizeDeps: {
    exclude: ["@capacitor/push-notifications", "@capacitor/core"]
  },
  server: {
    allowedHosts: true,
    hmr: {
      clientPort: 443,
      protocol: "wss"
    },
    fs: {
      strict: true,
      deny: ["**/.*"]
    },
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
      "Surrogate-Control": "no-store"
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/services/system-logger.ts
init_storage();
var SystemLogger = class _SystemLogger {
  static instance;
  originalConsole = {};
  static getInstance() {
    if (!_SystemLogger.instance) {
      _SystemLogger.instance = new _SystemLogger();
    }
    return _SystemLogger.instance;
  }
  init() {
    this.originalConsole.log = console.log;
    this.originalConsole.warn = console.warn;
    this.originalConsole.error = console.error;
    this.originalConsole.info = console.info;
    console.log = (...args) => {
      this.saveLog("info", args.join(" "));
      this.originalConsole.log(...args);
    };
    console.warn = (...args) => {
      this.saveLog("warn", args.join(" "));
      this.originalConsole.warn(...args);
    };
    console.error = (...args) => {
      this.saveLog("error", args.join(" "));
      this.originalConsole.error(...args);
    };
    console.info = (...args) => {
      this.saveLog("info", args.join(" "));
      this.originalConsole.info(...args);
    };
    setInterval(() => {
      this.cleanupOldLogs();
    }, 10 * 60 * 1e3);
  }
  async saveLog(level, message, source, data) {
    try {
      await storage.createSystemLog({
        level,
        message,
        source,
        data
      });
    } catch (error) {
      this.originalConsole.error("Failed to save system log:", error);
    }
  }
  async logAPIRequest(method, url, statusCode, responseTime) {
    const message = `${method} ${url} ${statusCode}${responseTime ? ` in ${responseTime}ms` : ""}`;
    await this.saveLog("api", message, "express", {
      method,
      url,
      statusCode,
      responseTime
    });
  }
  async cleanupOldLogs() {
    try {
      await storage.deleteOldSystemLogs(30);
    } catch (error) {
      this.originalConsole.error("Failed to cleanup old logs:", error);
    }
  }
};
var systemLogger = SystemLogger.getInstance();

// server/index.ts
init_db();
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "production";
}
var requiredEnvVars = ["PORT"];
var missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingVars.length > 0) {
  console.warn(`Warning: Missing environment variables: ${missingVars.join(", ")}`);
}
var app = express2();
app.use(express2.json({ limit: "50mb" }));
app.use(express2.urlencoded({ extended: true, limit: "50mb" }));
var pgSession = ConnectPgSimple(session);
var sessionStore;
if (process.env.DATABASE_URL) {
  const connectionString2 = process.env.DATABASE_URL.replace(/^"(.*)"$/, "$1").trim();
  const pgPool = new Pool2({
    connectionString: connectionString2,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
  });
  sessionStore = new pgSession({
    pool: pgPool,
    tableName: "user_sessions",
    createTableIfMissing: true
  });
  console.log("Using PostgreSQL session store for production");
} else {
  console.warn("DATABASE_URL not found - falling back to MemoryStore (not recommended for production)");
}
var isReplitEnvironment = process.env.REPLIT_DEPLOYMENT === "1" || !!process.env.REPL_ID || !!process.env.REPLIT_DOMAINS;
var isProduction = process.env.NODE_ENV === "production";
var shouldTrustProxy = isReplitEnvironment || isProduction;
if (shouldTrustProxy) {
  app.set("trust proxy", 1);
}
if (isProduction && !process.env.SESSION_SECRET) {
  console.error("SESSION_SECRET environment variable is required in production");
  process.exit(1);
}
var getSecureCookieSetting = () => {
  if (isProduction && shouldTrustProxy) {
    return "auto";
  }
  return isProduction;
};
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  if (isProduction && req.headers["x-forwarded-proto"] !== "https") {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  if (req.path === "/" && !req.query.s && !req.cookies?.["cache_cleared"]) {
    res.cookie("cache_cleared", "1", { maxAge: 36e5, httpOnly: true, sameSite: "lax" });
  }
  if (req.query.clear_cache === "1") {
    res.setHeader("Clear-Site-Data", '"cache", "storage", "executionContexts"');
  }
  next();
});
var sessionConfig = {
  store: sessionStore,
  secret: process.env.SESSION_SECRET || "greenpay-secret-key-change-in-production-" + Math.random(),
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    // Use secure cookies appropriately for the environment
    secure: getSecureCookieSetting(),
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1e3,
    // 30 days
    sameSite: "lax"
    // More permissive for cross-site navigation compatibility
  }
};
app.use(session(sessionConfig));
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    next();
  });
}
app.use((req, res, next) => {
  res.setHeader("Permissions-Policy", "publickey-credentials-get=*, publickey-credentials-create=*");
  next();
});
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 500) {
        logLine = logLine.slice(0, 499) + "\u2026";
      }
      log(logLine);
      const LogStreamService = global.LogStreamService;
      if (LogStreamService && !path3.includes("/ws")) {
        LogStreamService.broadcast(LogStreamService.createLogEntry(
          res.statusCode >= 400 ? "error" : "api",
          `${req.method} ${path3} ${res.statusCode} in ${duration}ms`,
          "api",
          {
            method: req.method,
            path: path3,
            statusCode: res.statusCode,
            duration,
            response: capturedJsonResponse
          }
        ));
      }
    }
  });
  next();
});
(async () => {
  try {
    systemLogger.init();
    console.log("\u2705 System logger initialized - capturing console output to database");
    await ensureSchema();
    const server = await registerRoutes(app);
    app.use((err, _req, res, _next) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      console.error("Server error:", {
        message: err.message,
        stack: err.stack,
        status
      });
      res.status(status).json({ message });
      if (process.env.NODE_ENV !== "production") {
        throw err;
      }
    });
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
    const port = parseInt(process.env.PORT || "5000", 10);
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true
    }, () => {
      log(`serving on port ${port}`);
    });
    server.on("error", (error) => {
      console.error("Server startup error:", error);
      if (error.code === "EADDRINUSE") {
        console.error(`Port ${port} is already in use`);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();
