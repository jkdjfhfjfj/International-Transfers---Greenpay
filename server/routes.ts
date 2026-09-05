import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import { storage } from "./storage";
import { db, pool } from "./db";
import { insertUserSchema, insertKycDocumentSchema, insertTransactionSchema, insertPaymentRequestSchema, insertRecipientSchema, insertSupportTicketSchema, insertConversationSchema, insertMessageSchema, insertAnnouncementSchema, users, systemLogs, admins, kycDocuments, virtualCards, recipients, transactions, paymentRequests, chatMessages, notifications, supportTickets, conversations, messages, adminLogs, systemSettings, apiConfigurations, transactionDisputes, cryptoWallets, cryptoTransactions, cryptoDepositAddresses, depositBonuses, wallets, loginHistory, virtualAccountSettings, virtualAccountApplications, virtualAccounts, ledgerEntries, withdrawalEvents } from "@shared/schema";
import { nexusPayService, NEXUSPAY_CURRENCIES } from "./services/nexuspay";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcrypt";
import multer from "multer";
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { fileTypeFromBuffer } from 'file-type';
import { whatsappService } from "./services/whatsapp";
import { createExchangeRateService } from "./services/exchange-rate";
import { payHeroService } from "./services/payhero";
import { getWithdrawalFee, getWithdrawalTotals } from "./services/money-movement";
import { paystackService } from "./services/paystack";
import { twoFactorService } from "./services/2fa";
import { biometricService } from "./services/biometric";
import { notificationService } from "./services/notifications";
import { CloudinaryStorageService, ObjectNotFoundError } from "./cloudinaryStorage";
import { statumService } from "./statumService";
import { ActivityLogger } from "./services/activity-logger";
import { validateApiKey, optionalApiKey } from "./middleware/api-key";
import { openaiService } from "./services/ai";
import { aiRateLimiter } from "./services/ai-rate-limiter";
import { getCryptoPrice, getCryptoPrices, SUPPORTED_CRYPTO_COINS } from "./services/crypto-prices";

const cloudinaryStorage = new CloudinaryStorageService();

const normalizeCurrency = (currency: unknown) => String(currency || "").trim().toUpperCase();

async function addWithdrawalEvent(
  transaction: { id: string; userId: string },
  event: {
    status: string;
    title: string;
    description?: string;
    provider?: string | null;
    providerReference?: string | null;
    retryCount?: number;
    refundStatus?: string;
    metadata?: Record<string, unknown>;
  },
) {
  return storage.createWithdrawalEvent({
    transactionId: transaction.id,
    userId: transaction.userId,
    status: event.status,
    title: event.title,
    description: event.description,
    provider: event.provider || null,
    providerReference: event.providerReference || null,
    retryCount: event.retryCount || 0,
    refundStatus: event.refundStatus || "not_applicable",
    metadata: event.metadata,
  });
}

async function sendAccountEmail(
  user: any,
  templateName: string,
  variables: Record<string, string>,
) {
  if (!user?.email) return;
  try {
    const { mailtrapService } = await import("./services/mailtrap");
    await mailtrapService.sendAccountAction(user.email, templateName, {
      first_name: user.fullName?.split(" ")[0] || "User",
      ...variables,
    });
  } catch (error) {
    console.error(`[Email] ${templateName} alert failed:`, error);
  }
}

function getSupportedCurrencyCodes() {
  return NEXUSPAY_CURRENCIES.map((currency) => currency.code);
}

async function getEnabledCurrencyCodes(): Promise<string[]> {
  const fallback = getSupportedCurrencyCodes();
  try {
    const result = await pool.query(`SELECT value FROM system_settings WHERE key = 'enabled_currencies' LIMIT 1`);
    const configured = String(result.rows[0]?.value || "").replace(/['"]/g, "");
    const enabled = configured
      .split(",")
      .map(normalizeCurrency)
      .filter((currency) => fallback.includes(currency));
    return enabled.length ? enabled : fallback;
  } catch {
    return fallback;
  }
}

async function getUserWallet(userId: string, currency: unknown) {
  const code = normalizeCurrency(currency);
  const [wallet] = await db
    .select()
    .from(wallets)
    .where(and(eq(wallets.userId, userId), sql`UPPER(${wallets.currency}) = ${code}`))
    .limit(1);
  if (!wallet || !pool) return wallet;
  const balance = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS balance FROM ledger_entries
     WHERE wallet_id = $1 AND user_id = $2`,
    [wallet.id, userId],
  );
  return { ...wallet, balance: String(balance.rows[0]?.balance ?? wallet.balance ?? "0") };
}

async function ensureUserWallet(userId: string, currency: unknown) {
  const code = normalizeCurrency(currency);
  let wallet = await getUserWallet(userId, code);
  if (!wallet) {
    const enabled = await getEnabledCurrencyCodes();
    if (!enabled.includes(code)) return undefined;
    const existing = await db.select().from(wallets).where(eq(wallets.userId, userId));
    const [created] = await db.insert(wallets).values({
      userId,
      currency: code,
      isDefault: existing.length === 0,
      isActive: true,
    }).returning();
    wallet = created;
  }
  return wallet;
}

function walletAvailableBalance(wallet: { balance?: string | null; holdAmount?: string | null; withdrawalHoldAmount?: string | null }) {
  return Math.max(
    0,
    parseFloat(wallet.balance || "0") -
      parseFloat(wallet.holdAmount || "0") -
      parseFloat(wallet.withdrawalHoldAmount || "0"),
  );
}

type LedgerTarget = {
  walletId?: string;
  virtualAccountId?: string;
  cardId?: string;
};

/**
 * All monetary movements go through this function. The ledger insert is
 * idempotent and the target balance is updated under the same row lock, so a
 * retry or concurrent request cannot create a second debit.
 */
async function applyLedgerEntry(params: LedgerTarget & {
  userId: string;
  currency: string;
  amount: number;
  entryType: string;
  idempotencyKey: string;
  transactionId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}) {
  if (!pool) throw new Error("Database is not configured");
  const target = params.walletId
    ? { table: "wallets", column: "wallet_id", id: params.walletId, holds: "COALESCE(hold_amount, 0) + COALESCE(withdrawal_hold_amount, 0)" }
    : params.virtualAccountId
      ? { table: "virtual_accounts", column: "virtual_account_id", id: params.virtualAccountId, holds: "COALESCE(hold_amount, 0)" }
      : { table: "virtual_cards", column: "card_id", id: params.cardId!, holds: "0" };
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const row = await client.query(
      `SELECT id, user_id, currency, balance, ${target.holds} AS holds
       FROM ${target.table} WHERE id = $1 AND user_id = $2 FOR UPDATE`,
      [target.id, params.userId],
    );
    if (!row.rows[0]) throw new Error("Balance account not found");
    const account = row.rows[0];
    if (normalizeCurrency(account.currency) !== normalizeCurrency(params.currency)) {
      throw new Error("Currency does not match balance account");
    }

    const ledgerBalance = await client.query(
      `SELECT COALESCE(SUM(amount), 0) AS balance FROM ledger_entries WHERE ${target.column} = $1`,
      [target.id],
    );
    const currentBalance = Number(ledgerBalance.rows[0]?.balance || 0);
    const available = currentBalance - Number(account.holds || 0);
    if (params.amount < 0 && available + params.amount < -0.0000001) {
      throw new Error(`Insufficient ${normalizeCurrency(params.currency)} available balance`);
    }

    const inserted = await client.query(
      `INSERT INTO ledger_entries
        (user_id, currency, ${target.column}, amount, entry_type, idempotency_key, transaction_id, description, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (idempotency_key) DO NOTHING
       RETURNING id`,
      [
        params.userId,
        normalizeCurrency(params.currency),
        target.id,
        params.amount,
        params.entryType,
        params.idempotencyKey,
        params.transactionId || null,
        params.description || null,
        params.metadata ? JSON.stringify(params.metadata) : null,
      ],
    );

    const nextBalance = inserted.rowCount
      ? currentBalance + params.amount
      : currentBalance;
    if (inserted.rowCount) {
      await client.query(
        `UPDATE ${target.table} SET balance = $1, updated_at = NOW() WHERE id = $2`,
        [nextBalance, target.id],
      );
    }
    await client.query("COMMIT");
    return {
      applied: Boolean(inserted.rowCount),
      balance: nextBalance,
      availableBalance: Math.max(0, nextBalance - Number(account.holds || 0)),
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getLedgerBalance(target: LedgerTarget, fallback = 0) {
  if (!pool) return fallback;
  const [column, id] = target.walletId
    ? ["wallet_id", target.walletId]
    : target.virtualAccountId
      ? ["virtual_account_id", target.virtualAccountId]
      : ["card_id", target.cardId!];
  const result = await pool.query(`SELECT COALESCE(SUM(amount), $2) AS balance FROM ledger_entries WHERE ${column} = $1`, [id, fallback]);
  return Number(result.rows[0]?.balance || 0);
}

async function reserveWalletWithdrawal(walletId: string, userId: string, amount: number) {
  const result = await pool.query(
    `UPDATE wallets
     SET withdrawal_hold_amount = COALESCE(withdrawal_hold_amount, 0) + $1, updated_at = NOW()
     WHERE id = $2 AND user_id = $3 AND is_active = true AND is_suspended = false
       AND COALESCE(balance, 0) - COALESCE(hold_amount, 0) - COALESCE(withdrawal_hold_amount, 0) >= $1
     RETURNING balance, hold_amount, withdrawal_hold_amount`,
    [amount, walletId, userId],
  );
  return result.rows[0] || null;
}

async function releaseWalletWithdrawal(walletId: string, amount: number) {
  await pool.query(
    `UPDATE wallets SET withdrawal_hold_amount = GREATEST(0, COALESCE(withdrawal_hold_amount, 0) - $1), updated_at = NOW()
     WHERE id = $2`,
    [amount, walletId],
  );
}

async function settleWalletWithdrawal(walletId: string, userId: string, currency: string, amount: number, transactionId: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const walletResult = await client.query(
      `SELECT id, currency, balance, COALESCE(withdrawal_hold_amount, 0) AS withdrawal_hold_amount
       FROM wallets WHERE id = $1 AND user_id = $2 FOR UPDATE`,
      [walletId, userId],
    );
    const wallet = walletResult.rows[0];
    if (!wallet) throw new Error("Wallet not found");
    if (normalizeCurrency(wallet.currency) !== normalizeCurrency(currency)) throw new Error("Currency does not match wallet");
    if (Number(wallet.withdrawal_hold_amount) < amount - 0.0000001) throw new Error("Withdrawal hold not found");

    const existing = await client.query(
      `SELECT id FROM ledger_entries WHERE idempotency_key = $1`,
      [`withdrawal:${transactionId}:settled`],
    );
    if (existing.rowCount === 0) {
      await client.query(
        `INSERT INTO ledger_entries
          (user_id, currency, wallet_id, amount, entry_type, idempotency_key, transaction_id, description)
         VALUES ($1, $2, $3, $4, 'withdrawal_settlement', $5, $6, 'Withdrawal approved')`,
        [userId, normalizeCurrency(currency), walletId, -amount, `withdrawal:${transactionId}:settled`, transactionId],
      );
      await client.query(
        `UPDATE wallets
         SET balance = COALESCE(balance, 0) - $1,
             withdrawal_hold_amount = GREATEST(0, COALESCE(withdrawal_hold_amount, 0) - $1),
             updated_at = NOW()
         WHERE id = $2`,
        [amount, walletId],
      );
    } else {
      await client.query(
        `UPDATE wallets
         SET withdrawal_hold_amount = GREATEST(0, COALESCE(withdrawal_hold_amount, 0) - $1),
             updated_at = NOW()
         WHERE id = $2`,
        [amount, walletId],
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Configure multer for file uploads with memory storage (for cloud upload)
const upload = multer({
  storage: multer.memoryStorage(), // Store files in memory buffer for cloud upload
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit (supports video announcements)
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types including videos
    const allowedMimeTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Images, PDFs, documents, and videos are allowed.'));
    }
  }
});

// Configure multer for database backup files
const backupUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for backups
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/json',
      'application/sql',
      'application/gzip',
      'application/x-gzip',
      'text/plain', // Some systems send .json as text/plain
    ];
    
    const allowedExtensions = ['.json', '.sql', '.gz', '.gzip'];
    const hasValidExtension = allowedExtensions.some((ext) => file.originalname.toLowerCase().endsWith(ext));
    
    if (allowedMimeTypes.includes(file.mimetype) || hasValidExtension) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JSON, SQL, and GZ backup files are allowed.'));
    }
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const otpSchema = z.object({
  code: z.string().length(6),
});

const transferSchema = z.object({
  fromUserId: z.string(),
  toUserId: z.string(),
  amount: z.string(),
  currency: z.string(),
  description: z.string().optional(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Maintenance mode middleware - APPLIED AT END
  const checkMaintenanceMode = async (req: any, res: any, next: any) => {
    try {
      const maintenanceSetting =
        await storage.getSystemSetting("general", "maintenance_mode") ||
        await storage.getSystemSetting("platform", "maintenance_mode");
      const maintenanceEnabled = String(maintenanceSetting?.value) === 'true';
      
      // Admin sessions always bypass maintenance. Users may still reach auth and
      // the maintenance-status endpoint so the client can render a useful page.
      const allowedPaths = [
        '/api/auth/me',
        '/api/auth/login',
        '/api/auth/logout',
        '/api/auth/verify-otp',
        '/api/admin/login',
        '/api/admin/auth/login',
        '/api/system-settings',
        '/health',
      ];
      const isAllowedPath = allowedPaths.some(path => req.path.startsWith(path));
      
      if (maintenanceEnabled && !isAllowedPath && !req.session?.admin) {
        const messageSetting =
          await storage.getSystemSetting("general", "maintenance_message") ||
          await storage.getSystemSetting("platform", "maintenance_message");
        return res.status(503).json({ 
          message: messageSetting?.value || "System is under maintenance. Please try again later.",
          maintenanceMode: true
        });
      }
    } catch (error) {
      console.error('Maintenance check error:', error);
    }
    next();
  };

  // Authentication and authorization middleware
  const requireAuth = (req: any, res: any, next: any) => {
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ 
        message: "Authentication required. Please log in."
      });
    }
    
    next();
  };

  // Session-based "who am I?" endpoint — uses session not URL param, auto-clears stale sessions
  app.get("/api/auth/me", async (req: any, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        // Session has a userId but no matching DB record — clear the broken session
        req.session.destroy(() => {});
        return res.status(401).json({ message: "Session expired — user not found" });
      }

      const { password, ...userResponse } = user as any;
      res.json({ user: userResponse });
    } catch (error) {
      console.error("Auth me error:", error);
      res.status(500).json({ message: "Failed to retrieve session user" });
    }
  });

  // User logout — destroy session
  app.post("/api/auth/logout", (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) console.error("Logout session destroy error:", err);
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });

  // Handle manual deposit proof upload
  app.post("/api/deposit/manual-proof", requireAuth, upload.single('proof'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No proof file uploaded" });
      }

      const userId = (req.session as any).userId;
      const { amount, currency, reference } = req.body;

      // Upload to Cloudinary
      const uploadResult = await cloudinaryStorage.uploadFile(
        req.file.buffer,
        `deposits/${userId}/${Date.now()}_${req.file.originalname}`,
        req.file.mimetype
      );

      // Create a pending transaction
      const transaction = await storage.createTransaction({
        userId,
        amount: amount || "0",
        currency: currency || "USD",
        type: 'deposit',
        status: 'pending',
        description: `Manual deposit proof uploaded. Ref: ${reference || 'N/A'}`,
        reference: reference || `MAN-${Date.now()}`,
        metadata: {
          proofUrl: uploadResult.url,
          originalName: req.file.originalname,
          uploadDate: new Date().toISOString()
        }
      });

      // Notify admins
      await storage.createAdminLog({
        adminId: 1, // System admin
        action: 'MANUAL_DEPOSIT_PROOF',
        details: `User ${userId} uploaded proof for ${amount} ${currency}. Ref: ${reference}`,
        ipAddress: req.ip || '0.0.0.0',
        userAgent: req.headers['user-agent'] || 'Unknown'
      });

      res.json({ 
        success: true, 
        message: "Proof uploaded successfully. Our team will verify and credit your account shortly.",
        transactionId: transaction.id
      });
    } catch (error) {
      console.error('Manual proof upload error:', error);
      res.status(500).json({ message: "Failed to upload proof. Please try again." });
    }
  });

  const requireAdminAuth = (req: any, res: any, next: any) => {
    if (!req.session?.admin?.id) {
      return res.status(401).json({ message: "Admin authentication required" });
    }
    next();
  };

  // Apply maintenance mode middleware globally
  app.use(checkMaintenanceMode);

  // Health check endpoint - must be defined early to avoid catch-all routes
  app.get("/health", (_req, res) => {
    res.status(200).json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV,
      uptime: process.uptime()
    });
  });

  const defaultVirtualAccountCurrencies = ["USD", "GBP", "EUR"];
  const allVirtualAccountCurrencies = getSupportedCurrencyCodes();

  async function getVirtualAccountCurrencies() {
    try {
      const result = await pool.query(`SELECT value FROM system_settings WHERE key = 'virtual_account_currencies' LIMIT 1`);
      const configured = String(result.rows[0]?.value || "").replace(/['"]/g, "");
      const currencies = configured.split(",").map(normalizeCurrency)
        .filter(currency => allVirtualAccountCurrencies.includes(currency));
      return currencies.length ? currencies : defaultVirtualAccountCurrencies;
    } catch {
      return defaultVirtualAccountCurrencies;
    }
  }

  app.get("/api/virtual-accounts", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const applications = await db.select().from(virtualAccountApplications).where(eq(virtualAccountApplications.userId, userId));
      const settings = await db.select().from(virtualAccountSettings).where(eq(virtualAccountSettings.isActive, true));
      const accounts = await db.select().from(virtualAccounts).where(eq(virtualAccounts.userId, userId));
      const supportedCurrencies = await getVirtualAccountCurrencies();
      res.json({
        supportedCurrencies,
        applications: applications.map((app: any) => ({
          ...app,
          accountDetails: app.status === "approved" ? settings.find((s: any) => s.currency === app.currency) || null : null,
          virtualAccount: app.status === "approved"
            ? (() => {
                const account = accounts.find((a: any) => a.applicationId === app.id);
                return account ? {
                  ...account,
                  balance: account.balance,
                  availableBalance: Math.max(0, Number(account.balance || 0) - Number(account.holdAmount || 0)),
                } : null;
              })()
            : null,
        })),
      });
    } catch (error) {
      console.error("Virtual accounts fetch error:", error);
      res.status(500).json({ message: "Failed to load virtual accounts" });
    }
  });

  app.post("/api/virtual-accounts/apply", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const schema = z.object({
        currency: z.string().transform(normalizeCurrency),
        sourceOfIncome: z.string().min(2),
        monthlyVolume: z.string().min(1),
        purpose: z.string().min(5),
        expectedSenders: z.string().optional(),
        declarations: z.object({
          notUsCitizen: z.boolean(),
          notPoliticallyExposed: z.boolean(),
          beneficialOwner: z.boolean(),
          truthfulInformation: z.boolean(),
          acceptsTerms: z.boolean(),
        }),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) {
        const firstIssue = parsed.error.issues[0];
        return res.status(400).json({
          message: firstIssue?.message || "Please complete all required application fields.",
          field: firstIssue?.path?.join("."),
          errors: parsed.error.issues.map(issue => ({ field: issue.path.join("."), message: issue.message })),
        });
      }
      const data = parsed.data;
      if (!(await getVirtualAccountCurrencies()).includes(data.currency)) {
        return res.status(400).json({ message: `${data.currency} virtual accounts are not currently available` });
      }
      if (!Object.values(data.declarations).every(Boolean)) {
        return res.status(400).json({ message: "All compliance declarations must be accepted before submitting." });
      }
      const existing = await db.select().from(virtualAccountApplications).where(and(eq(virtualAccountApplications.userId, userId), eq(virtualAccountApplications.currency, data.currency)));
      if (existing[0] && existing[0].status !== "rejected") return res.status(409).json({ message: "You already have an application for this currency." });
      const [application] = await db.insert(virtualAccountApplications).values({ ...data, userId }).returning();
      await storage.createNotification({ userId, title: `${data.currency} virtual account application received`, message: "Your application is pending admin review.", type: "info", isGlobal: false });
      res.status(201).json(application);
    } catch (error: any) {
      console.error("Virtual account apply error:", error);
      res.status(400).json({ message: error?.message || "Failed to submit application" });
    }
  });

  app.get("/api/admin/virtual-accounts", requireAdminAuth, async (_req, res) => {
    try {
      const applications = await db.select({ application: virtualAccountApplications, user: users }).from(virtualAccountApplications).leftJoin(users, eq(virtualAccountApplications.userId, users.id)).orderBy(desc(virtualAccountApplications.createdAt));
      const settings = await db.select().from(virtualAccountSettings).orderBy(virtualAccountSettings.currency);
      const accounts = await db.select().from(virtualAccounts).orderBy(virtualAccounts.createdAt);
      res.json({ applications, settings, accounts, supportedCurrencies: await getVirtualAccountCurrencies(), allCurrencies: allVirtualAccountCurrencies });
    } catch (error) {
      res.status(500).json({ message: "Failed to load virtual account admin data" });
    }
  });

  app.put("/api/admin/virtual-accounts/settings/:currency", requireAdminAuth, async (req: any, res) => {
    try {
      const currency = String(req.params.currency).toUpperCase();
      if (!allVirtualAccountCurrencies.includes(currency)) return res.status(400).json({ message: "Unsupported currency" });
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
        isActive: z.boolean().optional(),
      });
      const parsed = bodySchema.safeParse(req.body);
      if (!parsed.success) {
        const firstIssue = parsed.error.issues[0];
        return res.status(400).json({ message: firstIssue?.message || "Please complete the required account details.", errors: parsed.error.issues });
      }
      const values = { ...parsed.data, currency, updatedBy: req.session.admin.id, updatedAt: new Date() };
      const existing = await db.select().from(virtualAccountSettings).where(eq(virtualAccountSettings.currency, currency));
      const [setting] = existing[0]
        ? await db.update(virtualAccountSettings).set(values).where(eq(virtualAccountSettings.currency, currency)).returning()
        : await db.insert(virtualAccountSettings).values(values).returning();
      res.json(setting);
    } catch (error: any) { res.status(400).json({ message: error?.message || "Failed to save account details" }); }
  });

  app.put("/api/admin/virtual-accounts/currencies", requireAdminAuth, async (req: any, res) => {
    try {
      const currencies = z.array(z.string()).transform(values =>
        Array.from(new Set(values.map(normalizeCurrency).filter(currency => allVirtualAccountCurrencies.includes(currency))))
      ).parse(req.body.currencies);
      if (!currencies.length) return res.status(400).json({ message: "Select at least one virtual-account currency" });
      await pool.query(
        `INSERT INTO system_settings (key, value, category) VALUES ('virtual_account_currencies', to_json($1::text), 'virtual_accounts')
         ON CONFLICT (key) DO UPDATE SET value = to_json($1::text), updated_at = NOW()`,
        [currencies.join(",")],
      );
      res.json({ supportedCurrencies: currencies });
    } catch (error: any) {
      res.status(400).json({ message: error?.message || "Failed to save virtual-account currencies" });
    }
  });

  app.patch("/api/admin/virtual-accounts/applications/:id", requireAdminAuth, async (req: any, res) => {
    try {
      const status = req.body.status;
      if (!["approved", "rejected"].includes(status)) return res.status(400).json({ message: "Invalid status" });
      const [application] = await db.update(virtualAccountApplications).set({ status, adminNotes: req.body.adminNotes || null, reviewedBy: req.session.admin.id, reviewedAt: new Date(), updatedAt: new Date() }).where(eq(virtualAccountApplications.id, req.params.id)).returning();
      if (!application) return res.status(404).json({ message: "Application not found" });
      const [user] = await db.select().from(users).where(eq(users.id, application.userId));
      const [account] = await db.select().from(virtualAccountSettings).where(eq(virtualAccountSettings.currency, application.currency));
      if (status === "approved") {
        await pool.query(
          `INSERT INTO virtual_accounts (user_id, application_id, currency)
           VALUES ($1, $2, $3) ON CONFLICT (application_id) DO NOTHING`,
          [application.userId, application.id, application.currency],
        );
      }
      const [firstName, ...rest] = (user?.fullName || "User").split(" ");
      if (user && status === "approved") {
        await storage.createNotification({ userId: user.id, title: `${application.currency} Virtual Account Approved`, message: "Your virtual account details are now available. Check Virtual Accounts to view your bank details.", type: "success", isGlobal: false, actionUrl: "/virtual-accounts" });
        const { mailtrapService } = await import('./services/mailtrap');
        mailtrapService.sendVirtualAccountApproved(user.email, firstName, rest.join(" "), {
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
          payment_instructions: account?.paymentInstructions || "",
        }).catch(console.error);
      }
      if (user && status === "rejected") {
        await storage.createNotification({ userId: user.id, title: `${application.currency} Virtual Account Application`, message: req.body.adminNotes || "Your virtual account application was not approved at this time. You may re-apply.", type: "error", isGlobal: false, actionUrl: "/virtual-accounts" });
        const { mailtrapService } = await import('./services/mailtrap');
        // Send generic email notification for rejection
        mailtrapService.sendVirtualAccountApproved(user.email, firstName, rest.join(" "), {
          currency: application.currency,
          application_id: application.id,
          account_name: "N/A",
          bank_name: "", account_number: "", routing_number: "", sort_code: "", iban: "", swift_code: "", bank_address: "", beneficiary_address: "",
          payment_instructions: `Your ${application.currency} virtual account application was not approved. Reason: ${req.body.adminNotes || "Please contact support for details."}`,
        }).catch(console.error);
      }
      res.json(application);
    } catch (error: any) { res.status(400).json({ message: error?.message || "Failed to review application" }); }
  });

  app.put("/api/admin/virtual-accounts/:id/hold", requireAdminAuth, async (req: any, res) => {
    try {
      const amount = Number(req.body.amount);
      if (!Number.isFinite(amount) || amount < 0) return res.status(400).json({ message: "Hold amount must be zero or greater" });
      const result = await pool.query(
        `UPDATE virtual_accounts SET hold_amount = $1, updated_at = NOW()
         WHERE id = $2 AND balance - $1 >= 0
         RETURNING *`,
        [amount, req.params.id],
      );
      if (!result.rows[0]) return res.status(400).json({ message: "Hold cannot exceed the virtual-account balance or account was not found" });
      res.json({ account: result.rows[0] });
    } catch (error: any) { res.status(500).json({ message: error?.message || "Failed to update virtual-account hold" }); }
  });

  app.put("/api/admin/virtual-accounts/:id/balance", requireAdminAuth, async (req: any, res) => {
    try {
      const amount = Number(req.body.amount);
      const type = req.body.type;
      if (!Number.isFinite(amount) || amount <= 0 || !["credit", "debit"].includes(type)) {
        return res.status(400).json({ message: "Enter a positive amount and choose credit or debit" });
      }
      const account = await db.query.virtualAccounts.findFirst({ where: eq(virtualAccounts.id, req.params.id) });
      if (!account) return res.status(404).json({ message: "Virtual account not found" });
      const result = await applyLedgerEntry({
        virtualAccountId: account.id,
        userId: account.userId,
        currency: account.currency,
        amount: type === "credit" ? amount : -amount,
        entryType: `admin_virtual_account_${type}`,
        idempotencyKey: `admin-va:${account.id}:${Date.now()}:${Math.random()}`,
        description: `Admin ${type} to virtual account`,
      });
      res.json({ account: { ...account, balance: result.balance, availableBalance: result.availableBalance } });
    } catch (error: any) { res.status(400).json({ message: error?.message || "Failed to update virtual-account balance" }); }
  });

  app.post("/api/virtual-accounts/:id/transfer", requireAuth, async (req: any, res) => {
    try {
      const userId = req.session.userId;
      const amount = Number(req.body.amount);
      if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ message: "Enter a valid transfer amount" });
      const account = await db.query.virtualAccounts.findFirst({ where: and(eq(virtualAccounts.id, req.params.id), eq(virtualAccounts.userId, userId)) });
      if (!account || !account.isActive) return res.status(404).json({ message: "Virtual account not found or inactive" });
      const wallet = await ensureUserWallet(userId, account.currency);
      if (!wallet) return res.status(400).json({ message: `${account.currency} wallet is not enabled` });
      const reference = `VA-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const debit = await applyLedgerEntry({
        virtualAccountId: account.id, userId, currency: account.currency, amount: -amount,
        entryType: "virtual_account_transfer_out", idempotencyKey: `${reference}:debit`,
        description: `Transfer from ${account.currency} virtual account`,
      });
      try {
        const credit = await applyLedgerEntry({
          walletId: wallet.id, userId, currency: wallet.currency, amount,
          entryType: "virtual_account_transfer_in", idempotencyKey: `${reference}:credit`,
          description: `Transfer from ${account.currency} virtual account`,
        });
        const transaction = await storage.createTransaction({
          userId, type: "receive", amount: String(amount), currency: account.currency, status: "completed",
          reference, description: `Transfer from ${account.currency} virtual account`,
          metadata: { source: "virtual_account", virtualAccountId: account.id, walletId: wallet.id },
        });
        res.json({ transaction, virtualAccountBalance: debit.availableBalance, walletBalance: credit.availableBalance });
      } catch (creditError) {
        await applyLedgerEntry({
          virtualAccountId: account.id, userId, currency: account.currency, amount,
          entryType: "virtual_account_transfer_rollback", idempotencyKey: `${reference}:rollback`,
          description: "Rollback failed virtual-account transfer",
        });
        throw creditError;
      }
    } catch (error: any) {
      res.status(400).json({ message: error?.message || "Virtual-account transfer failed" });
    }
  });

  // Demo API Keys endpoint - shows available demo keys for testing
  app.get("/api/demo-keys", (_req, res) => {
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

  // Serve private objects from object storage (profile photos, KYC documents, chat files)
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      console.log(`📥 File request received: /objects/${req.params.objectPath}`);
      const userId = (req.session as any)?.userId;
      const adminId = (req.session as any)?.admin?.id;
      console.log(`🔐 Auth check - userId: ${userId}, adminId: ${adminId}`);
      
      // Require authentication to access private objects
      if (!userId && !adminId) {
        console.warn('⚠️ Unauthorized file access attempt:', req.params.objectPath);
        console.log('Session data:', JSON.stringify(req.session, null, 2));
        return res.status(401).json({ message: "Authentication required" });
      }

      // Extract the object key from the path
      // The path comes in as /objects/kyc/uuid.jpg, we need just kyc/uuid.jpg
      let objectKey = req.params.objectPath;
      
      // Remove leading slash if present
      if (objectKey.startsWith('/')) {
        objectKey = objectKey.substring(1);
      }
      
      console.log(`✅ Authenticated - downloading: ${objectKey} for ${adminId ? 'admin' : 'user'} ${adminId || userId}`);
      
      // Download and stream the file
      // Note: Cloudinary serves files via URLs
      // File keys use UUIDs making them non-guessable
      await cloudinaryStorage.downloadToResponse(objectKey, res);
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        console.warn(`⚠️ File not found: ${req.params.objectPath}`);
        return res.status(404).json({ message: "File not found" });
      }
      console.error('❌ File download error:', error);
      return res.status(500).json({ message: "Failed to serve file" });
    }
  });

  // Create default admin account if none exists
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
      console.log("✅ Default admin account created");
    }
  } catch (error) {
    console.error("Failed to create default admin:", error);
  }
  // Authentication routes with real WhatsApp integration
  app.post("/api/auth/signup", optionalApiKey, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Format phone number consistently (+254XXXXXXXXX)
      const { messagingService } = await import('./services/messaging');
      userData.phone = messagingService.formatPhoneNumber(userData.phone);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Create user with hashed password (now handled in storage)
      const user = await storage.createUser(userData);
      
      // Auto-verify phone and email for smoother onboarding
      await storage.updateUser(user.id, { 
        isPhoneVerified: true, 
        isEmailVerified: true
      });

      // Send welcome SMS/WhatsApp/Email with instructions
      if (user.phone || user.email) {
        const { messagingService } = await import('./services/messaging');
        const { whatsappService } = await import('./services/whatsapp');
        const domain = process.env.REPLIT_DOMAINS || 'greenpay.app';
        const loginUrl = `https://${domain.split(',')[0]}/login`;
        
        if (user.phone) {
          // Send WhatsApp create_acc template if WhatsApp is configured
          whatsappService.sendAccountCreation(user.phone, user.fullName || 'User')
            .catch(err => console.error('[Signup] WhatsApp account creation error:', err));
          
          // Also send fallback SMS message
          messagingService.sendMessage(
            user.phone,
            `Welcome to GreenPay! To send and receive money, you need to: 1) Purchase a virtual card 2) Verify your KYC. Login here: ${loginUrl}`
          ).catch(err => console.error('Welcome message error:', err));
        }
        
        if (user.email) {
          // Send welcome email
          const { mailtrapService } = await import('./services/mailtrap');
          mailtrapService.sendWelcome(user.email, user.fullName?.split(' ')[0] || 'User', user.fullName?.split(' ')[1] || '')
            .catch(err => console.error('[Signup] Email welcome error:', err));
        }
      }
      
      // Auto-create default wallet for new user
      try {
        const defCurrencySetting = await pool.query(`SELECT value FROM system_settings WHERE key = 'default_currency' LIMIT 1`);
        const defCurrency = defCurrencySetting.rows[0]?.value?.replace(/['"]/g, '') || "USD";
        await db.insert(wallets).values({ userId: user.id, currency: defCurrency, isDefault: true, isActive: true });
      } catch (walletErr) {
        console.error('[Signup] Wallet auto-create error:', walletErr);
      }

      // Remove password from response
      const { password, ...userResponse } = user;
      
      // Redirect to login after signup
      // (req.session as any).userId = user.id;
      // (req.session as any).user = { id: user.id, email: user.email };
      
      // Force session save to ensure it's written if needed later
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error('Session save error after signup:', saveErr);
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
      console.error('Signup error:', error);
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  // ── Google OAuth ─────────────────────────────────────────────────────────
  // Uses in-memory state map (avoids session persistence issues through cross-origin redirects)
  // Uses popup window approach (avoids "desktop mode" by keeping the parent app in the iframe)

  const googleOAuthStates = new Map<string, number>(); // state → expiry timestamp
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of googleOAuthStates) { if (now > v) googleOAuthStates.delete(k); }
  }, 60_000);

  function getGoogleRedirectUri(req: any): string {
    if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI;
    const domains = process.env.REPLIT_DOMAINS || process.env.REPLIT_DEV_DOMAIN;
    if (domains) return `https://${domains.split(',')[0]}/auth/google/callback`;
    return `${req.protocol}://${req.get('host')}/auth/google/callback`;
  }

  function googlePopupHtml(result: string, message: string): string {
    const redirectMap: Record<string, string> = {
      login: '/dashboard',
      new_user: '/auth/google/complete',
      cancelled: '/login',
      suspended: '/login',
      error: '/login',
    };
    const fallback = redirectMap[result] || '/login';
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

  app.get("/auth/google", (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) return res.send(googlePopupHtml("error", "Google sign-in is not configured."));
    const state = Math.random().toString(36).substring(2, 18);
    googleOAuthStates.set(state, Date.now() + 10 * 60 * 1000);
    const redirectUri = getGoogleRedirectUri(req);
    const params = new URLSearchParams({
      client_id: clientId, redirect_uri: redirectUri,
      response_type: "code", scope: "openid email profile",
      access_type: "offline", prompt: "select_account", state,
    });
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  });

  app.get("/auth/google/callback", async (req, res) => {
    const { code, state, error } = req.query as Record<string, string>;
    if (error || !code) return res.send(googlePopupHtml("cancelled", "Sign-in was cancelled."));

    const expiry = googleOAuthStates.get(state);
    if (!expiry || Date.now() > expiry) return res.send(googlePopupHtml("error", "Session expired, please try again."));
    googleOAuthStates.delete(state);

    try {
      const clientId = process.env.GOOGLE_CLIENT_ID!;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
      const redirectUri = getGoogleRedirectUri(req);

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
      });
      const tokenData = await tokenRes.json() as any;
      if (!tokenData.access_token) {
        console.error("[Google OAuth] Token exchange failed:", tokenData);
        return res.send(googlePopupHtml("error", "Could not authenticate with Google."));
      }

      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const profile = await userInfoRes.json() as any;

      const existingUser = await storage.getUserByEmail(profile.email);
      if (existingUser) {
        if ((existingUser as any).isSuspended) return res.send(googlePopupHtml("suspended", "This account has been suspended."));
        if (!(existingUser as any).googleId) {
          await storage.updateUser(existingUser.id, { googleId: profile.id } as any);
        }
        await storage.updateUser(existingUser.id, { lastLoginAt: new Date() });
        (req.session as any).userId = existingUser.id;
        (req.session as any).user = { id: existingUser.id, email: existingUser.email };
        // Track login device
        try {
          const ua = req.headers['user-agent'] || 'Unknown';
          await db.insert(loginHistory).values({
            userId: existingUser.id,
            ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip || 'Unknown',
            userAgent: ua,
            deviceType: ua.toLowerCase().includes('mobile') ? 'mobile' : 'desktop',
            browser: 'Google OAuth',
            status: 'success',
          });
        } catch (_) {}
        await new Promise<void>(r => req.session.save(() => r()));
        return res.send(googlePopupHtml("login", "Signed in! Redirecting..."));
      } else {
        (req.session as any).googlePending = {
          googleId: profile.id, email: profile.email,
          fullName: profile.name, profilePhotoUrl: profile.picture,
        };
        await new Promise<void>(r => req.session.save(() => r()));
        return res.send(googlePopupHtml("new_user", "Almost there! Setting up your account..."));
      }
    } catch (err) {
      console.error("[Google OAuth] Callback error:", err);
      return res.send(googlePopupHtml("error", "Something went wrong. Please try again."));
    }
  });

  app.get("/api/auth/google/pending", (req, res) => {
    const pending = (req.session as any).googlePending;
    if (!pending) return res.json({ pending: false });
    res.json({ pending: true, fullName: pending.fullName, email: pending.email, profilePhotoUrl: pending.profilePhotoUrl });
  });

  app.post("/api/auth/google/complete", async (req, res) => {
    const pending = (req.session as any).googlePending;
    if (!pending) return res.status(400).json({ message: "Session expired. Please sign in with Google again." });

    const { fullName, phone, country } = req.body;
    if (!fullName || !phone || !country) return res.status(400).json({ message: "Full name, phone and country are required" });

    try {
      const { messagingService } = await import('./services/messaging');
      const formattedPhone = messagingService.formatPhoneNumber(phone);

      const existing = await storage.getUserByEmail(pending.email);
      if (existing) return res.status(400).json({ message: "An account with this email already exists. Please log in." });

      const { db: database } = await import('./db');
      const { eq } = await import('drizzle-orm');
      const phoneCheck = await database.select().from(users).where(eq(users.phone, formattedPhone));
      if (phoneCheck.length > 0) return res.status(400).json({ message: "This phone number is already registered." });

      const bcrypt = await import('bcrypt');
      const randomPassword = await bcrypt.hash(Math.random().toString(36) + Date.now().toString(), 10);

      const user = await storage.createUser({
        fullName: fullName.trim(),
        email: pending.email,
        phone: formattedPhone,
        country,
        password: randomPassword,
      });

      await storage.updateUser(user.id, {
        isEmailVerified: true, isPhoneVerified: true,
        googleId: pending.googleId, profilePhotoUrl: pending.profilePhotoUrl,
      } as any);

      delete (req.session as any).googlePending;
      (req.session as any).userId = user.id;
      (req.session as any).user = { id: user.id, email: user.email };

      // Track new Google signup as first login device
      try {
        const ua = req.headers['user-agent'] || 'Unknown';
        await db.insert(loginHistory).values({
          userId: user.id,
          ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.ip || 'Unknown',
          userAgent: ua,
          deviceType: ua.toLowerCase().includes('mobile') ? 'mobile' : 'desktop',
          browser: 'Google OAuth',
          status: 'success',
        });
      } catch (_) {}

      // Auto-create default wallet for new Google user
      try {
        const defCurrencySetting = await pool.query(`SELECT value FROM system_settings WHERE key = 'default_currency' LIMIT 1`);
        const defCurrency = (defCurrencySetting.rows[0]?.value || 'USD').replace(/['"]/g, '').trim();
        await db.insert(wallets).values({ userId: user.id, currency: defCurrency, isDefault: true, isActive: true });
      } catch (_) {}

      const { whatsappService } = await import('./services/whatsapp');
      const { mailtrapService } = await import('./services/mailtrap');
      whatsappService.sendAccountCreation(formattedPhone, fullName).catch(() => {});
      mailtrapService.sendWelcome(pending.email, fullName.split(' ')[0] || 'User', fullName.split(' ')[1] || '').catch(() => {});

      const { password: _, ...userResponse } = user;
      await new Promise<void>(r => req.session.save(() => r()));
      res.json({ success: true, user: { ...userResponse, isEmailVerified: true, isPhoneVerified: true } });
    } catch (err) {
      console.error("[Google OAuth] Complete error:", err);
      res.status(500).json({ message: "Failed to create account. Please try again." });
    }
  });

  app.post("/api/auth/login", optionalApiKey, async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password using bcrypt FIRST - before any session manipulation
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check if account is suspended — use === true to guard against undefined/null
      if ((user as any).isSuspended === true) {
        return res.status(403).json({
          message: "Your account has been suspended. Please contact support for assistance.",
          accountSuspended: true,
          suspensionReason: (user as any).suspensionReason || null,
        });
      }

      // Update last login timestamp
      await storage.updateUser(user.id, { lastLoginAt: new Date() } as any);

      // Check admin-enforced security requirements
      const twoFactorRequiredSetting = await storage.getSystemSetting("security", "two_factor_required");
      const twoFactorRequired = twoFactorRequiredSetting?.value === 'true';
      
      const kycRequiredSetting = await storage.getSystemSetting("security", "kyc_auto_approval");
      const kycRequired = kycRequiredSetting?.value === 'false'; // false means KYC is REQUIRED
      
      // Check if OTP is required (based on admin toggle)
      const enableOtpSetting = await storage.getSystemSetting("messaging", "enable_otp_messages");
      const otpRequired = enableOtpSetting?.value !== 'false'; // Default to true if not set
      
      // Check which OTP methods are enabled
      const otpEmailSetting = await storage.getSystemSetting("messaging", "otp_email_enabled");
      const otpSmsSetting = await storage.getSystemSetting("messaging", "otp_sms_enabled");
      const otpWhatsappSetting = await storage.getSystemSetting("messaging", "otp_whatsapp_enabled");
      
      const emailEnabled = otpEmailSetting?.value !== 'false'; // Default to true
      const smsEnabled = otpSmsSetting?.value !== 'false'; // Default to true
      const whatsappEnabled = otpWhatsappSetting?.value !== 'false'; // Default to true
      
      // Check PIN requirement
      const pinRequiredSetting = await storage.getSystemSetting("security", "pin_required");
      const pinRequired = pinRequiredSetting?.value === 'true';
      
      // Check if messaging credentials are configured (SMS or WhatsApp)
      const apiKeySetting = await storage.getSystemSetting("messaging", "sms_api_key");
      const appIdSetting = await storage.getSystemSetting("messaging", "sms_app_id");
      const senderIdSetting = await storage.getSystemSetting("messaging", "sms_sender_id");
      const whatsappTokenSetting = await storage.getSystemSetting("messaging", "whatsapp_access_token");
      const whatsappPhoneSetting = await storage.getSystemSetting("messaging", "whatsapp_phone_number_id");
      
      // SMS is configured if we have sms_api_key, sms_app_id, and sms_sender_id (from db or env)
      const smsConfigured = !!(
        (apiKeySetting?.value || process.env.SMS_API_KEY) && 
        (appIdSetting?.value || process.env.SMS_APP_ID) && 
        (senderIdSetting?.value || process.env.SMS_SENDER_ID)
      );
      
      // WhatsApp is configured if we have access_token and phone_number_id (from db or env)
      const whatsappConfigured = !!(
        (whatsappTokenSetting?.value || process.env.WHATSAPP_ACCESS_TOKEN) && 
        (whatsappPhoneSetting?.value || process.env.WHATSAPP_PHONE_NUMBER_ID)
      );
      
      // At least one messaging channel must be configured for OTP
      const messagesConfigured = smsConfigured || whatsappConfigured;
      
      // Check enforcement requirements
      if (kycRequired && user.kycStatus !== 'verified') {
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
      
      // If OTP is disabled by admin, allow direct login (or check PIN if required)
      if (!otpRequired) {
        console.log('OTP disabled by admin');
        
        // Check both admin PIN requirement AND user PIN setting
        if ((pinRequired || user.pinEnabled) && user.pinCode) {
          return res.status(200).json({
            message: "PIN verification required",
            requiresPin: true,
            userId: user.id
          });
        }
        
        // Direct login without OTP
        req.session.regenerate((err) => {
          if (err) {
            console.error('Session regeneration error:', err);
            return res.status(500).json({ message: "Session error" });
          }

          (req.session as any).userId = user.id;
          (req.session as any).user = { id: user.id, email: user.email };

          storage.createLoginHistory({
            userId: user.id,
            ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'Unknown',
            userAgent: req.headers['user-agent'] || 'Unknown',
            deviceType: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop',
            browser: req.headers['user-agent']?.split('/')[0] || 'Unknown',
            location: (req.headers['cf-ipcountry'] as string) || 'Unknown',
            status: 'success',
          }).catch(err => console.error('Login history error:', err));

          notificationService.sendSecurityNotification(
            user.id,
            "New login detected from your account"
          ).catch(err => console.error('Notification error:', err));

          const { password: _, ...userResponse } = user;
          
          req.session.save((saveErr) => {
            if (saveErr) {
              console.error('Session save error:', saveErr);
              return res.status(500).json({ message: "Session save error" });
            }
            res.json({ user: userResponse });
          });
        });
        return;
      }

      // OTP is required - attempt to send if messaging is configured
      if (messagesConfigured) {
        // OTP is required and messaging is configured - send OTP
        const { messagingService } = await import('./services/messaging');
        const { mailtrapService } = await import('./services/mailtrap');
        const otpCode = messagingService.generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store OTP in user record
        await storage.updateUserOtp(user.id, otpCode, otpExpiry);

        // Send OTP via SMS, WhatsApp, and Email concurrently
        const [smsWhatsappResult, emailResult] = await Promise.all([
          messagingService.sendOTP(user.phone, otpCode),
          user.email ? mailtrapService.sendOTP(user.email, user.firstName || 'User', user.lastName || '', otpCode) : Promise.resolve(false)
        ]);
        
        const result = { ...smsWhatsappResult, email: emailResult };

        // When messaging is configured, OTP delivery failure is an error (don't bypass)
        if (!result.sms && !result.whatsapp && !result.email) {
          console.error('OTP delivery failed - messaging configured but delivery failed');
          return res.status(500).json({ 
            message: "Failed to send verification code. Please try again or contact support." 
          });
        }

        // OTP was sent successfully - require verification
        req.session.regenerate((err) => {
          if (err) {
            console.error('Session regeneration error:', err);
            return res.status(500).json({ message: "Session error" });
          }

          // Store pending login data (user not authenticated yet)
          (req.session as any).pendingLoginUserId = user.id;
          (req.session as any).loginIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
          (req.session as any).loginLocation = req.headers['cf-ipcountry'] || 'Unknown Location';

          req.session.save((saveErr) => {
            if (saveErr) {
              console.error('Session save error:', saveErr);
              return res.status(500).json({ message: "Session save error" });
            }

            const sentMethods = [];
            if (result.sms) sentMethods.push('SMS');
            if (result.whatsapp) sentMethods.push('WhatsApp');
            if (result.email) sentMethods.push('Email');

            res.json({ 
              requiresOtp: true,
              userId: user.id,
              phone: user.phone,
              sentVia: sentMethods.length > 0 ? sentMethods.join(' and ') : 'SMS, WhatsApp or Email',
              message: `Verification code sent to ${sentMethods.length > 0 ? sentMethods.join(', ') : 'SMS, WhatsApp or Email'}`
            });
          });
        });
      } else {
        // Messaging not configured - allow login without OTP
        req.session.regenerate((err) => {
          if (err) {
            console.error('Session regeneration error:', err);
            return res.status(500).json({ message: "Session error" });
          }

          const userResponse = {
            id: user.id,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            phone: user.phone || '',
            avatar: user.avatar || '',
            kycStatus: user.kycStatus || 'pending',
            balance: user.balance || 0
          };

          (req.session as any).userId = user.id;
          (req.session as any).userRole = user.role || 'user';

          req.session.save((err) => {
            if (err) {
              console.error('Session save error:', err);
              return res.status(500).json({ message: "Session error" });
            }
            res.json({ user: userResponse });
          });
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({ message: "Invalid login data" });
    }
  });

  app.post("/api/auth/verify-otp", optionalApiKey, async (req, res) => {
    try {
      const { code } = otpSchema.parse(req.body);
      const { userId } = req.body;
      
      // Get pending login user ID from session
      const pendingUserId = (req.session as any).pendingLoginUserId || userId;
      const loginIp = (req.session as any).loginIp || req.ip;
      const loginLocation = (req.session as any).loginLocation || 'Unknown Location';
      
      if (!pendingUserId) {
        return res.status(401).json({ message: "Session expired. Please login again." });
      }
      
      // Verify OTP against stored code
      const isValid = await storage.verifyUserOtp(pendingUserId, code);
      
      if (isValid) {
        const user = await storage.getUser(pendingUserId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        // Complete login - set session data
        (req.session as any).userId = user.id;
        (req.session as any).user = { id: user.id, email: user.email };
        
        // Save login history
        storage.createLoginHistory({
          userId: user.id,
          ipAddress: loginIp || 'Unknown',
          userAgent: req.headers['user-agent'] || 'Unknown',
          deviceType: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop',
          browser: req.headers['user-agent']?.split('/')[0] || 'Unknown',
          location: loginLocation,
          status: 'success',
        }).catch(err => console.error('Login history error:', err));
        
        // Clear pending login data
        delete (req.session as any).pendingLoginUserId;
        delete (req.session as any).loginIp;
        delete (req.session as any).loginLocation;
        
        // Send login alert via SMS, WhatsApp, and Email
        const { messagingService } = await import('./services/messaging');
        const { mailtrapService } = await import('./services/mailtrap');
        
        Promise.all([
          messagingService.sendLoginAlert(user.phone, loginLocation, loginIp || 'Unknown IP'),
          user.email ? mailtrapService.sendLoginAlert(
            user.email,
            user.firstName || 'User',
            user.lastName || '',
            loginLocation,
            loginIp || 'Unknown IP',
            req.headers['user-agent'] || 'Unknown Device'
          ) : Promise.resolve(false)
        ]).catch(err => console.error('Login alert error:', err));
        
        // Send in-app notification
        notificationService.sendSecurityNotification(
          user.id,
          "New login detected from your account"
        ).catch(err => console.error('Notification error:', err));
        
        const { password, ...userResponse } = user;
        
        // Save session before responding
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error('Session save error:', saveErr);
            return res.status(500).json({ message: "Session save error" });
          }
          res.json({ success: true, user: userResponse });
        });
      } else {
        res.status(400).json({ message: "Invalid or expired OTP code" });
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      res.status(400).json({ message: "Invalid OTP data" });
    }
  });

  // Resend OTP
  app.post("/api/auth/resend-otp", optionalApiKey, async (req, res) => {
    try {
      const { userId } = req.body;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { messagingService } = await import('./services/messaging');
      const { mailtrapService } = await import('./services/mailtrap');
      const otpCode = messagingService.generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      
      await storage.updateUserOtp(user.id, otpCode, otpExpiry);
      
      // Send OTP via SMS, WhatsApp, and Email concurrently
      const [smsWhatsappResult, emailResult] = await Promise.all([
        messagingService.sendOTP(user.phone, otpCode),
        user.email ? mailtrapService.sendOTP(user.email, user.firstName || 'User', user.lastName || '', otpCode) : Promise.resolve(false)
      ]);
      
      const result = { ...smsWhatsappResult, email: emailResult };
      
      if (!result.sms && !result.whatsapp && !result.email) {
        return res.status(500).json({ message: "Failed to resend verification code" });
      }
      
      const sentMethods = [];
      if (result.sms) sentMethods.push('SMS');
      if (result.whatsapp) sentMethods.push('WhatsApp');
      if (result.email) sentMethods.push('Email');
      
      res.json({ 
        message: `New OTP sent via ${sentMethods.join(', ')}`
      });
    } catch (error) {
      console.error('Resend OTP error:', error);
      res.status(500).json({ message: "Failed to resend OTP" });
    }
  });

  // Forgot password - Send reset code (by phone or email)
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { contact } = req.body;
      
      if (!contact) {
        return res.status(400).json({ message: "Phone number or email address is required" });
      }

      // Import services upfront
      const { messagingService } = await import('./services/messaging');
      const { mailtrapService } = await import('./services/mailtrap');

      // Detect if input is email or phone
      const isEmail = contact.includes('@');
      let user;

      if (isEmail) {
        // Find user by email
        user = await storage.getUserByEmail(contact.toLowerCase().trim());
        if (!user) {
          return res.status(404).json({ message: "No account found with this email address" });
        }
      } else {
        // Find user by phone number
        const formattedPhone = messagingService.formatPhoneNumber(contact);
        user = await storage.getUserByPhone(formattedPhone);
        if (!user) {
          return res.status(404).json({ message: "No account found with this phone number" });
        }
      }

      // Generate reset code (6-digit OTP)
      const resetCode = messagingService.generateOTP();
      const resetExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      // Store reset code in user's OTP field
      await storage.updateUserOtp(user.id, resetCode, resetExpiry);
      
      // Send reset code via SMS, WhatsApp, and Email concurrently
      const [smsWhatsappResult, emailResult] = await Promise.all([
        messagingService.sendPasswordReset(user.phone, resetCode),
        user.email ? mailtrapService.sendPasswordReset(user.email, user.firstName || 'User', user.lastName || '', resetCode) : Promise.resolve(false)
      ]);
      
      const result = { ...smsWhatsappResult, email: emailResult };
      
      if (!result.sms && !result.whatsapp && !result.email) {
        return res.status(500).json({ message: "Failed to send reset code" });
      }
      
      const sentMethods = [];
      if (result.sms) sentMethods.push('SMS');
      if (result.whatsapp) sentMethods.push('WhatsApp');
      if (result.email) sentMethods.push('Email');
      
      res.json({ 
        phone: user.phone,
        sentVia: sentMethods.join(', ')
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: "Failed to send reset code" });
    }
  });

  // Forgot password - Send reset code (by email)
  app.post("/api/auth/forgot-password-email", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email address is required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email.toLowerCase().trim());
      
      if (!user) {
        return res.status(404).json({ message: "No account found with this email address" });
      }

      // Generate reset code (6-digit OTP)
      const { messagingService } = await import('./services/messaging');
      const resetCode = messagingService.generateOTP();
      const resetExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      // Store reset code in user's OTP field
      await storage.updateUserOtp(user.id, resetCode, resetExpiry);
      
      // Send reset code via SMS, WhatsApp, and Email concurrently
      const [smsWhatsappResult, emailResult] = await Promise.all([
        messagingService.sendPasswordReset(user.phone, resetCode),
        user.email ? mailtrapService.sendPasswordReset(user.email, user.firstName || 'User', user.lastName || '', resetCode) : Promise.resolve(false)
      ]);
      
      const result = { ...smsWhatsappResult, email: emailResult };
      
      if (!result.sms && !result.whatsapp && !result.email) {
        return res.status(500).json({ message: "Failed to send reset code" });
      }
      
      const sentMethods = [];
      if (result.sms) sentMethods.push('SMS');
      if (result.whatsapp) sentMethods.push('WhatsApp');
      if (result.email) sentMethods.push('Email');
      
      res.json({ 
        email: user.email,
        sentVia: sentMethods.join(', ')
      });
    } catch (error) {
      console.error('Forgot password by email error:', error);
      res.status(500).json({ message: "Failed to send reset code" });
    }
  });

  app.post("/api/auth/reset-password-email", async (req, res) => {
    try {
      const { email, code, newPassword } = req.body;
      
      if (!email || !code || !newPassword) {
        return res.status(400).json({ message: "Email, code, and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email.toLowerCase().trim());
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify reset code
      const isValid = await storage.verifyUserOtp(user.id, code);
      
      if (!isValid) {
        return res.status(400).json({ message: "Invalid or expired reset code" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password
      await storage.updateUserPassword(user.id, hashedPassword);
      
      // Clear OTP
      await storage.updateUserOtp(user.id, null, null);
      
      const { mailtrapService } = await import('./services/mailtrap');
      
      // Send confirmation email
      Promise.all([
        messagingService.sendMessage(
          user.phone,
          "Your password has been reset successfully. You can now log in with your new password."
        ),
        user.email ? mailtrapService.sendTemplate(user.email, '7711c72e-431b-4fb9-bea9-9738d4d8bfe7', {
          first_name: user.firstName || 'User',
          last_name: user.lastName || '',
          message: 'Your password has been reset successfully. You can now log in.'
        }) : Promise.resolve(false)
      ]).catch(err => console.error('Password reset notification error:', err));
      
      res.json({ 
        success: true,
        message: "Password reset successful" 
      });
    } catch (error) {
      console.error('Reset password by email error:', error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { contact } = req.body;
      if (!contact) {
        return res.status(400).json({ message: "Phone number or email is required" });
      }

      const { messagingService } = await import('./services/messaging');
      
      let user;
      if (contact.includes('@')) {
        user = await storage.getUserByEmail(contact);
      } else {
        const formattedPhone = messagingService.formatPhoneNumber(contact);
        user = await storage.getUserByPhone(formattedPhone);
      }
      
      if (!user) {
        // Return 200 even if user not found for security
        return res.json({ 
          success: true, 
          message: "If an account exists, a reset code has been sent." 
        });
      }

      const otpCode = messagingService.generateOTP();
      const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

      // Store OTP in database
      await storage.updateUserOtp(user.id, otpCode, otpExpiry);

      // Send via messaging services
      const { mailtrapService } = await import('./services/mailtrap');
      const { whatsappService } = await import('./services/whatsapp');

      // Attempt multi-channel delivery
      const results = await Promise.allSettled([
        user.phone ? messagingService.sendMessage(user.phone, `Your GreenPay password reset code is: ${otpCode}`) : Promise.resolve(false),
        user.phone ? whatsappService.sendOTP(user.phone, otpCode) : Promise.resolve(false),
        user.email ? mailtrapService.sendTemplate(user.email, 'b54e3d3c-9a2c-4b6e-8e8e-8a9e9a9e9a9e', {
          first_name: user.firstName || 'User',
          otp_code: otpCode
        }) : Promise.resolve(false)
      ]);

      console.log(`[ForgotPassword] Reset code sent to user ${user.id}`);

      res.json({ 
        success: true, 
        message: "Reset code sent successfully",
        sentVia: user.email && contact.includes('@') ? 'email' : 'phone'
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: "Failed to process request" });
    }
  });

  // Reset password - Verify code and update password
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { phone, code, newPassword } = req.body;
      
      if (!phone || !code || !newPassword) {
        return res.status(400).json({ message: "Contact, code, and new password are required" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const { messagingService } = await import('./services/messaging');
      
      let user;
      if (phone.includes('@')) {
        user = await storage.getUserByEmail(phone);
      } else {
        const formattedPhone = messagingService.formatPhoneNumber(phone);
        user = await storage.getUserByPhone(formattedPhone);
      }
      
      if (!user) {
        console.error(`[ResetPassword] User not found for contact: ${phone}`);
        return res.status(404).json({ message: "User not found" });
      }

      // Verify reset code directly from database (no session check)
      const isValid = await storage.verifyUserOtp(user.id, code);
      if (!isValid) {
        console.error(`[ResetPassword] Invalid or expired code for user ${user.id}`);
        return res.status(400).json({ message: "Invalid or expired reset code" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password
      await storage.updateUserPassword(user.id, hashedPassword);
      
      // Clear OTP
      await storage.updateUserOtp(user.id, null, null);
      
      // Send confirmation message
      const { mailtrapService } = await import('./services/mailtrap');
      Promise.all([
        messagingService.sendMessage(
          user.phone,
          "Your password has been reset successfully. You can now log in with your new password."
        ),
        user.email ? mailtrapService.sendTemplate(user.email, '7711c72e-431b-4fb9-bea9-9738d4d8bfe7', {
          first_name: user.firstName || 'User',
          last_name: user.lastName || '',
          message: 'Your password has been reset successfully. You can now log in.'
        }) : Promise.resolve(false)
      ]).catch(err => console.error('Password reset notification error:', err));
      
      console.log(`[ResetPassword] Success for user ${user.id}`);
      res.json({ 
        success: true,
        message: "Password reset successful" 
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Conversation endpoints
  app.get("/api/conversations/user-conversation", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      
      if (!userId) {
        console.log(`[CONVERSATION AUTH] FAILED - No userId in session for conversation request`);
        return res.status(401).json({ message: "Authentication required" });
      }

      console.log(`[CONVERSATION PRIVACY] User ${userId.substring(0, 8)}... requesting conversation`);

      // Check if user already has an active conversation
      const existingConversations = await storage.getConversationsByUserId(userId);
      console.log(`[CONVERSATION PRIVACY] User ${userId.substring(0, 8)}... has ${existingConversations.length} existing conversations`);
      
      const activeConversation = existingConversations.find(c => c.status === "active");

      if (activeConversation) {
        console.log(`[CONVERSATION PRIVACY] Returning conversation ${activeConversation.id.substring(0, 8)}... for user ${userId.substring(0, 8)}...`);
        return res.json(activeConversation);
      }

      // Create new conversation if none exists
      const newConversation = await storage.createConversation({
        userId,
        title: "Support Chat",
        adminId: null
      });

      // Notify admin about new live chat request via SMS
      try {
        const { messagingService } = await import('./services/messaging');
        await messagingService.sendAdminChatNotification(userId);
      } catch (smsError) {
        console.error('Failed to send admin chat notification:', smsError);
      }

      console.log(`[CONVERSATION PRIVACY] Created new conversation ${newConversation.id.substring(0, 8)}... for user ${userId.substring(0, 8)}...`);
      res.json(newConversation);
    } catch (error) {
      console.error('Get/Create conversation error:', error);
      res.status(500).json({ message: "Failed to get or create conversation" });
    }
  });

  app.get("/api/messages/:conversationId", async (req, res) => {
    try {
      const { conversationId } = req.params;
      const userId = (req.session as any)?.userId;
      const adminId = (req.session as any)?.admin?.id;
      
      console.log(`[MESSAGES PRIVACY] User ${userId?.substring(0, 8) || 'none'}... requesting messages for conversation ${conversationId.substring(0, 8)}...`);
      
      if (!userId && !adminId) {
        console.log(`[MESSAGES AUTH] FAILED - No userId or adminId in session`);
        return res.status(401).json({ message: "Authentication required" });
      }

      // CRITICAL: Verify user or admin has access to this conversation
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        console.log(`[MESSAGES PRIVACY] Conversation ${conversationId.substring(0, 8)}... not found`);
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      console.log(`[MESSAGES PRIVACY] Conversation ${conversationId.substring(0, 8)}... belongs to user ${conversation.userId.substring(0, 8)}...`);
      
      // Allow access if user owns conversation OR if user is an admin
      if (conversation.userId !== userId && !adminId) {
        console.log(`[MESSAGES PRIVACY] ACCESS DENIED - User ${userId?.substring(0, 8)}... tried to access conversation owned by ${conversation.userId.substring(0, 8)}...`);
        return res.status(403).json({ message: "Access denied" });
      }

      const messages = await storage.getMessagesByConversationId(conversationId);
      console.log(`[MESSAGES PRIVACY] Returning ${messages.length} messages for conversation ${conversationId.substring(0, 8)}...`);
      res.json(messages);
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      const adminId = (req.session as any)?.admin?.id;
      
      console.log(`[MESSAGES PRIVACY] User ${userId?.substring(0, 8) || 'none'}... sending message`);
      
      if (!userId && !adminId) {
        console.log(`[MESSAGES AUTH] FAILED - No userId or adminId in session`);
        return res.status(401).json({ message: "Authentication required" });
      }

      const messageData = insertMessageSchema.parse(req.body);
      console.log(`[MESSAGES PRIVACY] Message for conversation ${messageData.conversationId.substring(0, 8)}...`);
      
      // CRITICAL: Verify user or admin has access to this conversation
      const conversation = await storage.getConversation(messageData.conversationId);
      if (!conversation) {
        console.log(`[MESSAGES PRIVACY] Conversation ${messageData.conversationId.substring(0, 8)}... not found for message`);
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      console.log(`[MESSAGES PRIVACY] Conversation ${messageData.conversationId.substring(0, 8)}... belongs to user ${conversation.userId.substring(0, 8)}...`);
      
      // Allow access if user owns conversation OR if user is an admin
      if (conversation.userId !== userId && !adminId) {
        console.log(`[MESSAGES PRIVACY] ACCESS DENIED - User ${userId?.substring(0, 8)}... tried to send message to conversation owned by ${conversation.userId.substring(0, 8)}...`);
        return res.status(403).json({ message: "Access denied" });
      }

      // Determine sender type and ID based on who is authenticated
      const senderId = adminId || userId;
      const senderType = adminId ? "admin" : "user";

      console.log(`[MESSAGES PRIVACY] Creating message from ${senderType} ${senderId?.substring(0, 8)}... in conversation ${messageData.conversationId.substring(0, 8)}...`);

      // Create the message
      const message = await storage.createMessage({
        ...messageData,
        senderId: senderId!,
        senderType
      } as any);

      // If sender is admin, notify user via SMS
      if (senderType === 'admin') {
        try {
          const { messagingService } = await import('./services/messaging');
          const user = await storage.getUser(conversation.userId);
          if (user && user.phone) {
            const domain = process.env.REPLIT_DOMAINS || 'greenpay.app';
            const loginUrl = `https://${domain.split(',')[0]}/login`;
            const notification = `You have a new message from GreenPay support. Login to reply: ${loginUrl}`;
            await messagingService.sendMessage(user.phone, notification);
          }
        } catch (smsError) {
          console.error('Failed to send user chat notification:', smsError);
        }
      }

      res.json({ message });
    } catch (error) {
      console.error('Create message error:', error);
      res.status(400).json({ message: "Invalid message data" });
    }
  });

  app.put("/api/messages/:id/read", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req.session as any)?.userId;
      const adminId = (req.session as any)?.admin?.id;
      
      if (!userId && !adminId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const message = await storage.markMessageAsRead(id);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      res.json({ message });
    } catch (error) {
      console.error('Mark message read error:', error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // File upload — tries Cloudinary first, falls back to base64 data URL
  app.post("/api/upload", upload.single('file'), async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      const adminId = (req.session as any)?.admin?.id;
      
      if (!userId && !adminId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const cloudinaryReady = !!(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
      );

      if (cloudinaryReady) {
        try {
          const url = await cloudinaryStorage.uploadChatFile(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype
          );
          return res.json({ 
            url, fileUrl: url,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            message: "File uploaded successfully"
          });
        } catch (uploadError) {
          console.error('[Upload] Cloudinary upload error:', uploadError);
          // Fall through to base64 fallback
        }
      }

      // Base64 fallback — always works, no external service needed
      const base64 = req.file.buffer.toString('base64');
      const dataUrl = `data:${req.file.mimetype};base64,${base64}`;
      console.log('[Upload] Returning base64 data URL (Cloudinary not configured or failed)');
      return res.json({
        url: dataUrl,
        fileUrl: dataUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        message: "File stored as base64 (no cloud storage)"
      });
    } catch (error) {
      console.error('[Upload] Request error:', error);
      res.status(500).json({ message: "Failed to upload file", error: String(error) });
    }
  });

  // Note: Chat files are now served via /objects/ endpoint (using object storage)

  // User endpoint: get extracted Didit identity data for profile display
  app.get("/api/kyc/extracted-data", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      // Primary: read from the denormalised columns written at verification time
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      const kyc = await storage.getKycByUserId(userId);
      const u = user as any;

      // Fallback: parse raw diditDecision if denormalised columns are empty
      const decision = (kyc as any)?.diditDecision as any;
      const docFeatures = decision?.features?.document || {};

      const extractedData = {
        fullName:        u.kycFullName        || [docFeatures.first_name, docFeatures.last_name].filter(Boolean).join(' ') || null,
        firstName:       docFeatures.first_name || null,
        lastName:        docFeatures.last_name  || null,
        dateOfBirth:     u.kycDateOfBirth     || docFeatures.date_of_birth   || null,
        idNumber:        u.kycIdNumber        || docFeatures.document_number  || null,
        documentType:    u.kycDocumentType    || docFeatures.document_type    || kyc?.documentType || null,
        nationality:     u.kycNationality     || docFeatures.nationality      || null,
        gender:          u.kycGender          || docFeatures.gender           || null,
        expiryDate:      u.kycIdExpiryDate    || docFeatures.expiry_date      || null,
        address:         u.kycAddress         || docFeatures.address          || kyc?.address      || null,
        issuingCountry:  u.kycIssuingCountry  || docFeatures.issuing_country  || null,
        diditStatus:     (kyc as any)?.diditStatus || null,
        kycStatus:       kyc?.status || user.kycStatus,
      };

      const hasData = Object.values(extractedData).some(v => v && typeof v === 'string' && v.trim());
      if (!hasData) return res.json({ extractedData: null });

      res.json({ extractedData });
    } catch (error) {
      console.error('[KYC] Extracted data error:', error);
      res.status(500).json({ message: "Failed to fetch KYC data" });
    }
  });

  // ── Didit.me KYC Integration ─────────────────────────────────────────────

  // Start a didit verification session — returns the didit URL to show the user
  app.post("/api/kyc/didit/start", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const { createDiditSession, isDiditConfigured } = await import('./services/didit');

      if (!isDiditConfigured()) {
        return res.status(503).json({
          message: "KYC verification service is not configured. Please contact support.",
          configured: false,
        });
      }

      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (user.kycStatus === 'verified') {
        return res.status(409).json({ message: "Your KYC is already verified." });
      }

      // Build callback URL that didit will redirect the user to after verification
      const appUrl = process.env.APP_URL || `https://${req.get('host')}`;
      const callbackUrl = `${appUrl}/kyc-callback`;

      const session = await createDiditSession(userId, callbackUrl);
      if (!session) {
        return res.status(502).json({ message: "Failed to create verification session. Please try again." });
      }

      // Store session in kyc_documents (upsert pattern)
      let existingKyc = await storage.getKycByUserId(userId);
      if (existingKyc && existingKyc.status !== 'rejected') {
        // Update existing record with new session
        await storage.updateKycDocument(existingKyc.id, {
          diditSessionId: session.session_id,
          diditStatus: session.status,
          diditDecision: { sessionUrl: session.url } as any,
          status: 'pending',
        } as any);
      } else {
        // Create a new kyc_documents record for this session
        await storage.createKycDocument({
          userId,
          documentType: 'didit_verification',
          status: 'pending',
          diditSessionId: session.session_id,
          diditStatus: session.status,
          diditDecision: { sessionUrl: session.url } as any,
        } as any);
      }

      // Update user KYC status to pending
      await storage.updateUser(userId, { kycStatus: 'pending' });

      res.json({
        sessionId: session.session_id,
        url: session.url,
        status: session.status,
      });
    } catch (error) {
      console.error('[Didit] Start session error:', error);
      res.status(500).json({ message: "Failed to start verification" });
    }
  });

  // Poll current session status for a user
  app.get("/api/kyc/didit/status", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const kyc = await storage.getKycByUserId(userId);
      if (!kyc || !(kyc as any).diditSessionId) {
        // Return doc status so frontend can show re-verification notice
        return res.json({ status: null, kycStatus: 'not_submitted', docStatus: kyc?.status || null });
      }

      const { getSessionDecision, mapDiditStatusToKyc, isTerminalStatus } = await import('./services/didit');

      const decision = await getSessionDecision((kyc as any).diditSessionId);
      if (!decision) {
        return res.json({
          status: (kyc as any).diditStatus,
          kycStatus: (kyc as any).status,
          sessionId: (kyc as any).diditSessionId,
          sessionUrl: (kyc as any).diditDecision?.sessionUrl || null,
        });
      }

      const diditStatus = decision.status;
      const kycStatus = mapDiditStatusToKyc(diditStatus);

      // Update DB if status changed
      if (diditStatus !== (kyc as any).diditStatus || kycStatus !== kyc.status) {
        await storage.updateKycDocument(kyc.id, {
          diditStatus,
          status: kycStatus,
          diditDecision: decision as any,
          verifiedAt: kycStatus === 'verified' ? new Date() : undefined,
        } as any);
        await storage.updateUser(userId, { kycStatus });

        // Send notifications on terminal statuses
        if (isTerminalStatus(diditStatus)) {
          const user = await storage.getUser(userId);
          if (user) {
            const { messagingService } = await import('./services/messaging');
            const { mailtrapService } = await import('./services/mailtrap');
            if (kycStatus === 'verified') {
              Promise.all([
                messagingService.sendKYCVerified(user.phone),
                user.email ? mailtrapService.sendKYCVerified(user.email, user.fullName?.split(' ')[0] || 'User', '') : Promise.resolve(),
              ]).catch(err => console.error('[Didit] Notification error:', err));
            }
          }
        }
      }

      res.json({
        status: diditStatus,
        kycStatus,
        sessionId: (kyc as any).diditSessionId,
        sessionUrl: (kyc as any).diditDecision?.sessionUrl || null,
        decision: isTerminalStatus(diditStatus) ? decision : undefined,
      });
    } catch (error) {
      console.error('[Didit] Status poll error:', error);
      res.status(500).json({ message: "Failed to check verification status" });
    }
  });

  // Webhook endpoint — didit calls this when a session status changes
  app.post("/api/kyc/didit/webhook", async (req, res) => {
    try {
      const { verifyWebhookSignature, mapDiditStatusToKyc, isTerminalStatus } = await import('./services/didit');

      // Verify webhook signature if secret is configured
      const webhookSecret = process.env.DIDIT_WEBHOOK_SECRET;
      if (webhookSecret) {
        const signature = req.headers['x-didit-signature'] as string;
        if (!signature) {
          return res.status(401).json({ message: "Missing webhook signature" });
        }
        const rawBody = JSON.stringify(req.body);
        const valid = verifyWebhookSignature(rawBody, signature, webhookSecret);
        if (!valid) {
          return res.status(401).json({ message: "Invalid webhook signature" });
        }
      }

      const payload = req.body;
      const { session_id: sessionId, vendor_data: userId, status: diditStatus } = payload;

      if (!sessionId || !userId || !diditStatus) {
        return res.status(400).json({ message: "Invalid webhook payload" });
      }

      console.log(`[Didit] Webhook: session ${sessionId} → ${diditStatus} (user: ${userId})`);

      const kycStatus = mapDiditStatusToKyc(diditStatus);

      // Find and update the kyc_documents record
      const kyc = await storage.getKycByUserId(userId);
      if (kyc) {
        await storage.updateKycDocument(kyc.id, {
          diditStatus,
          status: kycStatus,
          diditDecision: payload as any,
          verifiedAt: kycStatus === 'verified' ? new Date() : undefined,
        } as any);
      }

      // Update user status
      await storage.updateUser(userId, { kycStatus });

      // Auto-populate KYC identity fields when verified via webhook
      if (kycStatus === 'verified') {
        // Duplicate ID check
        const doc = payload?.features?.document || {};
        const idNumber = doc.document_number || null;
        if (idNumber) {
          const existing = await db.select({ id: users.id }).from(users).where(eq(users.kycIdNumber, idNumber));
          if (existing.some(u => u.id !== userId)) {
            console.warn(`[Didit] Webhook: duplicate ID ${idNumber} — user ${userId} blocked`);
            await storage.updateUser(userId, { kycStatus: 'rejected' });
            await storage.updateKycDocument(kyc!.id, { status: 'rejected', verificationNotes: 'Duplicate ID — this document is already linked to another account.' } as any);
            return res.json({ received: true });
          }
        }
        const kycFields = {
          kycFullName: [doc.first_name, doc.last_name].filter(Boolean).join(' ') || null,
          kycDateOfBirth: doc.date_of_birth || null,
          kycIdNumber: idNumber,
          kycNationality: doc.nationality || null,
          kycGender: doc.gender || null,
          kycAddress: doc.address || null,
          kycDocumentType: doc.document_type || null,
          kycIdExpiryDate: doc.expiry_date || null,
          kycIssuingCountry: doc.issuing_country || null,
        };
        const filtered = Object.fromEntries(Object.entries(kycFields).filter(([, v]) => v != null));
        if (Object.keys(filtered).length > 0) await storage.updateUser(userId, filtered as any);
      }

      // Send notifications on terminal statuses
      if (isTerminalStatus(diditStatus)) {
        const user = await storage.getUser(userId);
        if (user) {
          const { messagingService } = await import('./services/messaging');
          const { mailtrapService } = await import('./services/mailtrap');

          if (kycStatus === 'verified') {
            Promise.all([
              messagingService.sendKYCVerified(user.phone),
              user.email ? mailtrapService.sendKYCVerified(user.email, user.fullName?.split(' ')[0] || 'User', '') : Promise.resolve(),
            ]).catch(err => console.error('[Didit] Notification error:', err));
          }

          // Create in-app notification
          await storage.createNotification({
            userId,
            title: kycStatus === 'verified' ? 'KYC Verified ✅' : 'KYC Update',
            message: kycStatus === 'verified'
              ? 'Your identity has been verified. You now have full access to all features.'
              : kycStatus === 'rejected'
              ? 'Your KYC verification was not successful. Please try again.'
              : 'Your KYC is under review. We\'ll notify you once complete.',
            type: kycStatus === 'verified' ? 'success' : kycStatus === 'rejected' ? 'error' : 'info',
            isGlobal: false,
          } as any);
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error('[Didit] Webhook error:', error);
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  // KYC routes with file upload
  app.post("/api/kyc/submit", upload.fields([
    { name: 'frontImage', maxCount: 1 },
    { name: 'backImage', maxCount: 1 },
    { name: 'selfie', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const { userId, documentType, dateOfBirth, address } = req.body;
      
      if (!userId || !documentType || !dateOfBirth || !address) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      if (!files?.frontImage || !files?.backImage || !files?.selfie) {
        return res.status(400).json({ message: "All document images are required" });
      }

      // Check if user has already submitted KYC documents
      const existingKyc = await storage.getKycByUserId(userId);
      
      if (existingKyc) {
        // If status is pending or verified, don't allow resubmission
        if (existingKyc.status === 'pending') {
          return res.status(409).json({ 
            message: "Your KYC documents are currently under review. Please wait for admin verification.",
            status: existingKyc.status
          });
        }
        
        if (existingKyc.status === 'verified') {
          return res.status(409).json({ 
            message: "Your KYC documents have already been verified.",
            status: existingKyc.status
          });
        }
        
        // If status is rejected, allow resubmission by updating the existing record
        if (existingKyc.status === 'rejected') {
          // Upload new files to cloud storage
          let frontImageUrl: string | null = null;
          let backImageUrl: string | null = null;
          let selfieUrl: string | null = null;

          try {
            [frontImageUrl, backImageUrl, selfieUrl] = await Promise.all([
              cloudinaryStorage.uploadKycDocument(
                files.frontImage[0].buffer,
                files.frontImage[0].originalname,
                files.frontImage[0].mimetype
              ),
              cloudinaryStorage.uploadKycDocument(
                files.backImage[0].buffer,
                files.backImage[0].originalname,
                files.backImage[0].mimetype
              ),
              cloudinaryStorage.uploadKycDocument(
                files.selfie[0].buffer,
                files.selfie[0].originalname,
                files.selfie[0].mimetype
              )
            ]);
          } catch (uploadError) {
            console.error('❌ KYC document upload error:', uploadError);
            return res.status(500).json({ message: "Failed to upload documents to storage" });
          }

          // Update existing KYC document
          const updatedKyc = await storage.updateKycDocument(existingKyc.id, {
            documentType,
            dateOfBirth,
            address,
            frontImageUrl,
            backImageUrl,
            selfieUrl,
            status: 'pending',
            verificationNotes: null,
            updatedAt: new Date()
          });

          // Update user KYC status to pending
          await storage.updateUser(userId, { kycStatus: "pending" });

          // Send notification
          await notificationService.sendNotification({
            title: "KYC Documents Resubmitted",
            body: "Your updated documents have been submitted for review. You will be notified once verified.",
            userId,
            type: "general"
          });

          // Send SMS/WhatsApp notification about 48hr wait
          const user = await storage.getUser(userId);
          if (user?.phone) {
            const { messagingService } = await import('./services/messaging');
            messagingService.sendMessage(
              user.phone,
              "Your KYC documents have been resubmitted. Our team will review them within 48 hours. You'll be notified once verified."
            ).catch(err => console.error('KYC resubmission message error:', err));
          }

          return res.json({ kyc: updatedKyc, message: "KYC documents resubmitted successfully" });
        }
      }

      // First time submission - upload files to cloud storage
      let frontImageUrl: string | null = null;
      let backImageUrl: string | null = null;
      let selfieUrl: string | null = null;

      try {
        [frontImageUrl, backImageUrl, selfieUrl] = await Promise.all([
          cloudinaryStorage.uploadKycDocument(
            files.frontImage[0].buffer,
            files.frontImage[0].originalname,
            files.frontImage[0].mimetype
          ),
          cloudinaryStorage.uploadKycDocument(
            files.backImage[0].buffer,
            files.backImage[0].originalname,
            files.backImage[0].mimetype
          ),
          cloudinaryStorage.uploadKycDocument(
            files.selfie[0].buffer,
            files.selfie[0].originalname,
            files.selfie[0].mimetype
          )
        ]);
      } catch (uploadError) {
        console.error('❌ KYC document upload error:', uploadError);
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
      
      // Update user KYC status to pending for admin review
      await storage.updateUser(userId, { kycStatus: "pending" });
      
      // Send notification
      await notificationService.sendNotification({
        title: "KYC Documents Submitted",
        body: "Your documents have been submitted for review. You will be notified once verified.",
        userId,
        type: "general"
      });

      // Send SMS/WhatsApp notification about 48hr wait
      const user = await storage.getUser(userId);
      if (user?.phone) {
        const { messagingService } = await import('./services/messaging');
        messagingService.sendMessage(
          user.phone,
          "Your KYC documents have been submitted successfully. Our team will review them within 48 hours. You'll be notified once verified."
        ).catch(err => console.error('KYC submission message error:', err));
      }
      
      res.json({ kyc, message: "KYC documents submitted successfully" });
    } catch (error) {
      console.error('KYC submission error:', error);
      res.status(500).json({ message: "Failed to submit KYC documents" });
    }
  });

  app.get("/api/kyc/:userId", async (req, res) => {
    try {
      const kyc = await storage.getKycByUserId(req.params.userId);
      res.json({ kyc });
    } catch (error) {
      res.status(500).json({ message: "Error fetching KYC data" });
    }
  });

  // Virtual Card routes with Paystack integration
  app.post("/api/virtual-card/initialize-payment", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      console.log('Card payment request - userId:', userId, 'type:', typeof userId);
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const user = await storage.getUser(userId);
      console.log('Card payment - Found user:', !!user, user?.email);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Users may purchase up to four cards. A card's status does not reduce
      // the count, so retries or inactive cards cannot be used to bypass the cap.
      const existingCards = await storage.getVirtualCardsByUserId(userId);
      if (existingCards.length >= 4) {
        return res.status(400).json({
          message: "You have reached the maximum of 4 virtual cards.",
        });
      }

      // Allow card purchase for production - KYC verification can be added later
      // Note: In production environment, additional KYC verification may be required

      // Generate unique reference
      const reference = payHeroService.generateReference();
      
      // Validate user email
      if (!user.email || !user.email.includes('@') || !user.email.includes('.')) {
        return res.status(400).json({ message: "Invalid user email. Please update your profile with a valid email address." });
      }

      // Validate user phone number for M-Pesa
      if (!user.phone) {
        return res.status(400).json({ message: "Phone number is required for M-Pesa payments. Please update your profile." });
      }

      // Get current card price from system settings
      const cardPriceSetting = await storage.getSystemSetting("virtual_card", "price");
      const usdAmount = parseFloat(cardPriceSetting?.value || "60.00");
      const kesAmount = await payHeroService.convertUSDtoKES(usdAmount);
      
      console.log(`Converting $${usdAmount} USD to ${kesAmount} KES for card purchase`);

      // Initialize payment with PayHero M-Pesa STK Push  
      const callbackUrl = `${req.protocol}://${req.get('host')}/payment-processing?reference=${reference}&type=virtual-card`;
      
      const paymentData = await payHeroService.initiateMpesaPayment(
        kesAmount, // Amount in KES
        user.phone, // Phone number for M-Pesa STK Push
        reference, // External reference
        user.fullName, // Customer name
        callbackUrl // Callback URL for tracking
      );
      
      if (!paymentData.success) {
        if (paymentData.status === 'INVALID_PHONE_NUMBER' || paymentData.status === 'INVALID_PHONE_FORMAT') {
          return res.status(400).json({ 
            message: 'Invalid phone number format. Please enter a valid international phone number with country code (e.g., +254712345678, +2348012345678).',
            status: paymentData.status 
          });
        }
        if (paymentData.status === 'TIMEOUT') {
          return res.status(504).json({
            message: 'M-Pesa service is taking too long to respond. Please wait a moment and try again.',
            status: 'TIMEOUT'
          });
        }
        return res.status(400).json({ 
          message: paymentData.message || 'Payment initiation failed. Please try again or contact support.',
          status: paymentData.status 
        });
      }
      
      res.json({ 
        success: true,
        reference: paymentData.reference,
        checkoutRequestId: paymentData.CheckoutRequestID,
        status: paymentData.status,
        message: 'STK Push sent to your phone. Please enter your M-Pesa PIN to complete payment.'
      });

      // Create a transaction record for tracking
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
      console.error('Card payment initialization error:', error);
      res.status(500).json({ message: "Error initializing card payment" });
    }
  });

  // PayHero callback to handle card activation, deposits, and transaction status
  app.post("/api/payments/payhero/callback", async (req, res) => {
    try {
      const { CheckoutRequestID, ResultCode, ResultDesc, ExternalReference } = req.body;
      
      const transaction = await db.query.transactions.findFirst({
        where: eq(transactions.paystackReference, ExternalReference || CheckoutRequestID)
      });

      if (!transaction) {
        console.error(`[PayHero] Transaction not found for ref: ${ExternalReference || CheckoutRequestID}`);
        return res.sendStatus(200);
      }

      if (ResultCode === 0) {
        await storage.updateTransactionStatus(transaction.id, "completed");
        await storage.updateTransactionMetadata(transaction.id, {
          ...((transaction.metadata as object) || {}),
          status_reason: "M-Pesa payment successful",
          checkoutRequestId: CheckoutRequestID
        });

        if (transaction.type === 'card_purchase') {
          const { virtualCardService } = await import('./services/virtual-card');
          await virtualCardService.generateCard(transaction.userId);
          await storage.updateUser(transaction.userId, { hasVirtualCard: true });
          notificationService.sendNotification({
            userId: transaction.userId,
            title: "Virtual Card Activated",
            message: "Your virtual card has been successfully generated and is ready for use.",
            type: "success"
          }).catch(err => console.error('Notification error:', err));
        }

        if (transaction.type === 'deposit') {
          // Credit user balance
          const user = await storage.getUser(transaction.userId);
          if (user) {
            const depositAmount = parseFloat(transaction.amount);
            const depositCurrency = normalizeCurrency(transaction.currency || "USD");
            const depositWallet = await ensureUserWallet(transaction.userId, depositCurrency);
            if (!depositWallet) {
              throw new Error(`${depositCurrency} wallet is not enabled`);
            }
            await applyLedgerEntry({
              walletId: depositWallet.id,
              userId: transaction.userId,
              currency: depositCurrency,
              amount: depositAmount,
              entryType: "deposit",
              idempotencyKey: `deposit:${transaction.id}`,
              transactionId: transaction.id,
              description: transaction.description || "Deposit",
            });

            notificationService.sendNotification({
              userId: transaction.userId,
              title: "Deposit Successful",
              message: `Your M-Pesa deposit of $${depositAmount.toFixed(2)} has been credited to your wallet.`,
              type: "success"
            }).catch(err => console.error('Notification error:', err));

            // Send deposit confirmation SMS + transaction completed email
            try {
              const { messagingService: depositSms } = await import('./services/messaging');
              const { mailtrapService: depositMailtrap } = await import('./services/mailtrap');
              if (user.phone) {
                depositSms.sendDepositConfirmation(user.phone, depositAmount.toFixed(2), 'USD', 'M-Pesa', user.email, user.fullName).catch(() => {});
              }
              if (user.email) {
                depositMailtrap.sendTransactionCompleted(
                  user.email,
                  user.firstName || user.fullName?.split(' ')[0] || 'User',
                  user.lastName || user.fullName?.split(' ')[1] || '',
                  depositAmount.toFixed(2), 'USD', 'deposit', transaction.id
                ).catch(() => {});
              }
            } catch (_) {}

            // Check for applicable deposit bonuses — apply highest matching bonus
            try {
              const activeBonuses = await db.select().from(depositBonuses)
                .where(eq(depositBonuses.isActive, true));
              // Filter eligible bonuses and pick the one with highest bonusValue
              const eligible = activeBonuses
                .filter(b => (b.method === 'mpesa' || b.method === 'any') && depositAmount >= parseFloat(b.minAmount))
                .map(b => ({
                  bonus: b,
                  value: b.bonusType === 'percentage'
                    ? (depositAmount * parseFloat(b.bonusAmount)) / 100
                    : parseFloat(b.bonusAmount)
                }))
                .filter(e => e.value > 0)
                .sort((a, b) => b.value - a.value); // highest bonus first

              if (eligible.length > 0) {
                const { bonus, value: bonusValue } = eligible[0];
                await applyLedgerEntry({
                  walletId: depositWallet.id,
                  userId: transaction.userId,
                  currency: depositCurrency,
                  amount: bonusValue,
                  entryType: "deposit_bonus",
                  idempotencyKey: `deposit-bonus:${transaction.id}:${bonus.id}`,
                  description: bonus.description || "Deposit bonus",
                });
                await storage.createTransaction({
                  userId: transaction.userId,
                  type: 'deposit',
                  amount: bonusValue.toFixed(2),
                  currency: depositCurrency,
                  status: 'completed',
                  description: `Deposit bonus: ${bonus.description || `+${depositCurrency} ${bonusValue.toFixed(2)} for depositing via M-Pesa`}`,
                  fee: '0.00',
                  metadata: { bonusId: bonus.id, bonusType: 'deposit_bonus', triggerMethod: 'mpesa' }
                });
                notificationService.sendNotification({
                  userId: transaction.userId,
                  title: "Deposit Bonus Credited!",
                  message: `You received a $${bonusValue.toFixed(2)} bonus for your M-Pesa deposit!`,
                  type: "success"
                }).catch(err => console.error('Bonus notification error:', err));
              }
            } catch (bonusErr) {
              console.error('[PayHero Bonus Error]:', bonusErr);
            }
          }
        }
      } else {
        await storage.updateTransactionStatus(transaction.id, "failed");
        await storage.updateTransactionMetadata(transaction.id, {
          ...((transaction.metadata as object) || {}),
          status_reason: ResultDesc || "M-Pesa payment failed or cancelled",
          resultCode: ResultCode
        });

        notificationService.sendNotification({
          userId: transaction.userId,
          title: "Payment Failed",
          message: `Your ${transaction.type === 'deposit' ? 'deposit' : 'card purchase'} payment failed: ${ResultDesc}`,
          type: "error"
        }).catch(err => console.error('Notification error:', err));
      }

      res.sendStatus(200);
    } catch (error) {
      console.error('[PayHero Callback Error]:', error);
      res.sendStatus(500);
    }
  });

  // ── M-Pesa deposit via PayHero STK Push ─────────────────────────────────────
  app.post("/api/deposit/mpesa", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
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
      } catch (e) { console.warn("[Deposit/Mpesa] Using fallback rate"); }

      const kesAmount = parseFloat(amount) * exchangeRate;
      const reference = `DEP-${Date.now()}-${userId.slice(-6)}`;
      const callbackUrl = `${req.protocol}://${req.get('host')}/api/payments/payhero/callback`;

      const paymentData = await payHeroService.initiateMpesaPayment(
        Math.round(kesAmount),
        phoneToUse,
        reference,
        user.fullName,
        callbackUrl
      );

      if (!paymentData.success) {
        if (paymentData.status === 'INVALID_PHONE_NUMBER' || paymentData.status === 'INVALID_PHONE_FORMAT') {
          return res.status(400).json({ message: "Invalid phone number. Use format: 07XXXXXXXX or +2547XXXXXXXX", status: paymentData.status });
        }
        if (paymentData.status === 'TIMEOUT') {
          return res.status(504).json({ message: "M-Pesa service is taking too long to respond. Please wait a moment and try again.", status: 'TIMEOUT' });
        }
        return res.status(400).json({ message: paymentData.message || "Could not initiate M-Pesa payment. Please try again.", status: paymentData.status });
      }

      await storage.createTransaction({
        userId,
        type: 'deposit',
        amount: parseFloat(amount).toFixed(2),
        currency: 'USD',
        status: 'pending',
        description: `M-Pesa deposit via PayHero`,
        fee: '0.00',
        exchangeRate: exchangeRate.toString(),
        paystackReference: paymentData.reference || reference,
        metadata: { paymentMethod: 'mpesa', phoneNumber: phoneToUse, kesAmount: kesAmount.toFixed(2), exchangeRate }
      });

      res.json({
        success: true,
        reference: paymentData.reference || reference,
        checkoutRequestId: paymentData.CheckoutRequestID,
        message: "STK Push sent to your phone. Enter your M-Pesa PIN to complete payment."
      });
    } catch (error) {
      console.error('[Deposit/Mpesa Error]:', error);
      res.status(500).json({ message: "Error initiating M-Pesa deposit" });
    }
  });

  // Poll M-Pesa deposit status
  app.get("/api/deposit/mpesa/status/:reference", requireAuth, async (req, res) => {
    try {
      const { reference } = req.params;
      const transaction = await db.query.transactions.findFirst({
        where: eq(transactions.paystackReference, reference)
      });
      if (!transaction) return res.status(404).json({ message: "Transaction not found" });
      res.json({ status: transaction.status, amount: transaction.amount, description: transaction.description });
    } catch (error) {
      res.status(500).json({ message: "Error checking status" });
    }
  });

  // ── Public deposit config (enabled methods, bank details, active bonuses) ───
  app.get("/api/deposit/config", requireAuth, async (req, res) => {
    try {
      const keys = [
        "mpesa_enabled", "crypto_enabled", "bank_transfer_enabled", "card_enabled", "global_enabled",
        "bank_name", "bank_account_name", "bank_account_number", "bank_swift_code",
        "bank_branch", "bank_currency", "bank_routing_number", "bank_additional_info"
      ];
      const settingsMap: Record<string, string> = {};
      for (const key of keys) {
        const s = await storage.getSystemSetting("deposit_methods", key);
        if (s) settingsMap[key] = String(s.value);
      }
      const activeBonuses = await db.select().from(depositBonuses)
        .where(eq(depositBonuses.isActive, true));
      res.json({ methods: settingsMap, bonuses: activeBonuses });
    } catch (error) {
      console.error("[Deposit Config Error]:", error);
      res.status(500).json({ message: "Error loading deposit config" });
    }
  });

  // User profile management endpoints
  app.put("/api/users/:id/profile", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = (req.session as any)?.userId;
      
      console.log('Profile update request:', { 
        urlId: id, 
        sessionUserId: userId,
        hasSession: !!req.session,
        sessionKeys: Object.keys(req.session || {})
      });
      
      // Verify user is updating their own profile
      if (!userId) {
        return res.status(401).json({ message: "Please log in to update your profile" });
      }
      
      if (userId !== id) {
        return res.status(403).json({ message: "You can only update your own profile" });
      }

      const { fullName, email, phone, country, profilePhotoUrl } = req.body;

      // KYC-verified users can only update their profile photo
      const currentUser = await storage.getUser(id);
      if (currentUser?.kycStatus === 'verified') {
        if (profilePhotoUrl === undefined) {
          return res.status(403).json({ message: "Your profile details are locked after KYC verification. Only your profile photo can be updated." });
        }
        const updatedUser = await storage.updateUser(id, { profilePhotoUrl });
        if (!updatedUser) return res.status(404).json({ message: "User not found" });
        (req.session as any).userId = updatedUser.id;
        const { password, ...userResponse } = updatedUser;
        return res.json({ user: userResponse, message: "Profile photo updated successfully" });
      }

      // Check if email is already taken by another user
      if (email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== id) {
          return res.status(400).json({ message: "Email already in use" });
        }
      }
      
      // Check if phone is already taken by another user
      if (phone) {
        const existingUser = await storage.getUserByPhone(phone);
        if (existingUser && existingUser.id !== id) {
          return res.status(400).json({ message: "Phone number already in use" });
        }
      }

      const updateData: any = {
        fullName,
        email,
        phone,
        country,
      };

      // Only update profile photo if provided
      if (profilePhotoUrl !== undefined) {
        updateData.profilePhotoUrl = profilePhotoUrl;
      }

      const updatedUser = await storage.updateUser(id, updateData);

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update session with new user data
      (req.session as any).userId = updatedUser.id;

      const { password, ...userResponse } = updatedUser;
      res.json({ user: userResponse, message: "Profile updated successfully" });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(400).json({ message: "Failed to update profile" });
    }
  });

  app.put("/api/users/:id/settings", async (req, res) => {
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
      console.error('Settings update error:', error);
      res.status(400).json({ message: "Failed to update settings" });
    }
  });

  // Profile photo upload endpoint
  app.post("/api/users/:id/profile-photo", requireAuth, upload.single('photo'), async (req, res) => {
    try {
      const { id } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "No photo file provided" });
      }

      // Validate file type
      if (!file.mimetype.startsWith('image/')) {
        return res.status(400).json({ message: "File must be an image" });
      }

      // Upload profile picture to Cloudinary
      const photoUrl = await cloudinaryStorage.uploadProfilePicture(
        file.buffer,
        file.originalname,
        file.mimetype
      );

      // Update user's profile photo URL
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
      console.error('Profile photo upload error:', error);
      res.status(500).json({ message: "Failed to upload profile photo" });
    }
  });

  // Password change endpoint
  app.post("/api/users/:id/change-password", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new password are required" });
      }

      // Validate new password strength (server-side)
      if (newPassword.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters long" });
      }

      // Get user
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      await storage.updateUser(id, { password: hashedPassword });

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // KYC endpoints
  app.get("/api/kyc/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const kyc = await storage.getKycByUserId(userId);
      res.json({ kyc });
    } catch (error) {
      console.error('KYC fetch error:', error);
      res.status(500).json({ message: "Failed to fetch KYC data" });
    }
  });

  // 2FA setup endpoint
  app.post("/api/auth/setup-2fa", async (req, res) => {
    try {
      const { userId } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Generate proper 2FA secret and QR code
      const secret = speakeasy.generateSecret({
        name: `GreenPay (${user.email})`,
        issuer: 'GreenPay'
      });
      
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);
      
      // Save secret to user (in production, save encrypted)
      await storage.updateUser(userId, { twoFactorSecret: secret.base32 });
      
      res.json({ 
        qrCodeUrl,
        secret: secret.base32, // Don't send in production
        message: "Scan QR code with your authenticator app"
      });
    } catch (error) {
      console.error('2FA setup error:', error);
      res.status(500).json({ message: "Failed to setup 2FA" });
    }
  });

  // Biometric setup endpoint
  app.post("/api/auth/setup-biometric", async (req, res) => {
    try {
      const { userId } = req.body;
      
      // In production, use WebAuthn for proper biometric authentication
      await storage.updateUser(userId, { biometricEnabled: true });
      
      res.json({ message: "Biometric authentication enabled" });
    } catch (error) {
      console.error('Biometric setup error:', error);
      res.status(500).json({ message: "Failed to setup biometric authentication" });
    }
  });

  // Push notification registration endpoint
  app.post("/api/notifications/register", async (req, res) => {
    try {
      const { userId, endpoint } = req.body;
      
      // Register user for push notifications
      await storage.updateUser(userId, { pushNotificationsEnabled: true });
      
      // In production, save the push subscription endpoint
      res.json({ message: "Push notifications registered" });
    } catch (error) {
      console.error('Notification registration error:', error);
      res.status(500).json({ message: "Failed to register for notifications" });
    }
  });

  app.post("/api/virtual-card/verify-payment", async (req, res) => {
    try {
      const { reference, userId } = req.body;
      
      if (!reference || !userId) {
        return res.status(400).json({ message: "Reference and user ID are required" });
      }

      console.log('PayHero payment verification not supported - using callback method');

      // PayHero uses callbacks for payment verification, not manual verification
      return res.status(400).json({ 
        message: "Payment verification not supported with PayHero. Payments are processed via callbacks.",
        success: false
      });
    } catch (error) {
      console.error('Card payment verification error:', error);
      res.status(500).json({ 
        message: "Error verifying card payment",
        success: false
      });
    }
  });

  // Payment callback handler for Paystack
  app.get("/api/payment-callback", async (req, res) => {
    try {
      const { reference, trxref, type } = req.query;
      const actualReference = reference || trxref;
      
      console.log('Payment callback received:', { reference: actualReference, type });

      if (!actualReference) {
        return res.status(400).json({ message: "Payment reference is required" });
      }

      // Verify the payment with Paystack
      const verificationResult = await paystackService.verifyPayment(actualReference as string);
      
      if (!verificationResult.status) {
        console.error('Callback payment verification failed:', verificationResult.message);
        return res.redirect(`/payment-failed?reference=${actualReference}&error=${encodeURIComponent(verificationResult.message)}`);
      }

      const paymentData = verificationResult.data;
      
      if (paymentData.status === 'success') {
        // Payment successful - redirect to success page
        if (type === 'virtual-card') {
          return res.redirect(`/payment-success?reference=${actualReference}&type=virtual-card`);
        } else {
          return res.redirect(`/payment-success?reference=${actualReference}&type=deposit`);
        }
      } else {
        // Payment failed - redirect to failure page
        return res.redirect(`/payment-failed?reference=${actualReference}&status=${paymentData.status}`);
      }
    } catch (error) {
      console.error('Payment callback error:', error);
      return res.redirect(`/payment-failed?error=${encodeURIComponent('Payment verification failed')}`);
    }
  });

  // Paystack webhook handler for real-time payment updates
  app.post("/api/webhook/paystack", async (req, res) => {
    try {
      const event = req.body;
      console.log('Paystack webhook received:', event.event, event.data?.reference);

      // Verify webhook authenticity (in production, verify signature)
      if (event.event === 'charge.success') {
        const { reference, status, amount, currency } = event.data;
        
        console.log('Webhook payment success:', { reference, status, amount, currency });
        
        // Handle successful payment here if needed
        // This is a backup to the callback URL method
        
      } else if (event.event === 'charge.failed') {
        const { reference, status } = event.data;
        console.log('Webhook payment failed:', { reference, status });
      }

      // Always respond with 200 to acknowledge webhook
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

  // Payment callback/webhook for verification
  app.get("/api/payment-callback", async (req, res) => {
    try {
      const { reference, type } = req.query;
      console.log(`Payment callback received: ref=${reference}, type=${type}`);

      if (!reference) {
        return res.status(400).send("Reference missing");
      }

      const verification = await paystackService.verifyPayment(reference as string);
      
      if (verification.status && verification.data.status === 'success') {
        const transaction = await db.query.transactions.findFirst({
          where: eq(transactions.paystackReference, reference as string)
        });

        if (transaction && transaction.status === 'pending') {
          // 1. Update transaction status
          await storage.updateTransactionStatus(transaction.id, 'completed');
          
          // 2. Credit user balance
          const user = await storage.getUser(transaction.userId);
          if (user) {
            const depositAmount = parseFloat(transaction.amount);
            const depositCurrency = normalizeCurrency(transaction.currency || "USD");
            const depositWallet = await ensureUserWallet(user.id, depositCurrency);
            if (!depositWallet) throw new Error(`${depositCurrency} wallet is not enabled`);
            const balanceResult = await applyLedgerEntry({
              walletId: depositWallet.id,
              userId: user.id,
              currency: depositCurrency,
              amount: depositAmount,
              entryType: "deposit",
              idempotencyKey: `deposit:${transaction.id}`,
              transactionId: transaction.id,
              description: transaction.description || "Deposit",
            });
            const newBalance = balanceResult.balance.toFixed(2);
            
            // 3. Send in-app notification
            await notificationService.sendNotification({
              userId: user.id,
              title: "Deposit Successful",
              message: `Your deposit of $${depositAmount} has been credited to your wallet.`,
              type: "transaction"
            });

            // 4. Send SMS + email on transaction completed
            try {
              const { messagingService: psTxSms } = await import('./services/messaging');
              const { mailtrapService: psTxMailtrap } = await import('./services/mailtrap');
              if (user.phone) {
                psTxSms.sendTransactionNotification(user.phone, 'deposit', depositAmount.toFixed(2), 'USD', 'completed', transaction.id)
                  .catch(() => {});
              }
              if (user.email) {
                psTxMailtrap.sendTransactionCompleted(
                  user.email,
                  user.firstName || user.fullName?.split(' ')[0] || 'User',
                  user.lastName || user.fullName?.split(' ')[1] || '',
                  depositAmount.toFixed(2), 'USD', 'deposit', transaction.id
                ).catch(() => {});
              }
            } catch (_) {}
            
            console.log(`User ${user.id} credited with $${depositAmount}. New balance: ${newBalance}`);
          }
        }
        
        // Redirect to dashboard with success message
        return res.redirect('/dashboard?deposit=success');
      } else {
        console.warn(`Payment verification failed for ref=${reference}:`, verification.message);
        return res.redirect('/deposit?error=payment_failed');
      }
    } catch (error) {
      console.error('Payment callback error:', error);
      res.redirect('/deposit?error=server_error');
    }
  });

  // Verify deposit payment initialization
  app.post("/api/deposit/initialize-payment", requireAuth, async (req, res) => {
    try {
      const { amount, currency, paymentMethod, billingAddress, billingCity, billingCountry } = req.body;
      const userId = (req.session as any).userId;
      
      console.log('Deposit payment request - userId:', userId, 'amount:', amount, 'currency:', currency, 'method:', paymentMethod);
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // 1. Convert USD to KES
      let finalAmountKes = parseFloat(amount);
      let exchangeRate = 129; // Fallback

      try {
        const rateService = await createExchangeRateService();
        exchangeRate = await rateService.getRate("USD", "KES");
      } catch (e) {
        console.warn("Using fallback exchange rate for deposit initialization");
      }
      
      finalAmountKes = parseFloat(amount) * exchangeRate;

      // Validate user email
      if (!user.email || !user.email.includes('@')) {
        return res.status(400).json({ message: "Valid email required for payment" });
      }

      // 2. Initialize payment with Paystack
      const reference = paystackService.generateReference();
      const callbackUrl = `${req.protocol}://${req.get('host')}/api/payment-callback?reference=${reference}&type=deposit`;
      
      const paystackAmount = Math.round(finalAmountKes * 100);
      
      // Determine channels based on method
      let channels = ['card', 'mobile_money'];
      if (paymentMethod === 'card') channels = ['card'];
      if (paymentMethod === 'mpesa' || paymentMethod === 'airtel') channels = ['mobile_money'];

      const paymentMetadata: Record<string, any> = { paymentMethod };
      if (billingAddress) paymentMetadata.billing_address = billingAddress;
      if (billingCity) paymentMetadata.billing_city = billingCity;
      if (billingCountry) paymentMetadata.billing_country = billingCountry;

      const paymentData = await paystackService.initializePayment(
        user.email,
        parseFloat(finalAmountKes.toFixed(2)),
        reference,
        'KES',
        user.phone || undefined,
        callbackUrl,
        paymentMetadata
      );
      
      if (!paymentData.status) {
        return res.status(400).json({ message: paymentData.message });
      }
      
      // 3. Create a pending transaction record
      await storage.createTransaction({
        userId,
        type: 'deposit',
        amount: amount.toString(),
        currency: 'USD',
        status: 'pending',
        description: `Deposit via ${paymentMethod}`,
        fee: '0.00',
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
        reference: reference
      });
    } catch (error) {
      console.error('Deposit payment initialization error:', error);
      res.status(500).json({ message: "Error initializing deposit payment" });
    }
  });

  // Verify deposit payment
  app.post("/api/deposit/verify-payment", async (req, res) => {
    try {
      const { reference } = req.body;
      if (!reference) return res.status(400).json({ message: "Reference required" });

      const verification = await paystackService.verifyPayment(reference);
      
      if (verification.status && verification.data.status === 'success') {
        const transaction = await db.query.transactions.findFirst({
          where: eq(transactions.paystackReference, reference)
        });

        if (transaction && transaction.status === 'pending') {
          await storage.updateTransactionStatus(transaction.id, 'completed');
          const user = await storage.getUser(transaction.userId);
          if (user) {
            const depositAmount = parseFloat(transaction.amount);
            const depositCurrency = normalizeCurrency(transaction.currency || "USD");
            const depositWallet = await ensureUserWallet(user.id, depositCurrency);
            if (!depositWallet) throw new Error(`${depositCurrency} wallet is not enabled`);
            const balanceResult = await applyLedgerEntry({
              walletId: depositWallet.id,
              userId: user.id,
              currency: depositCurrency,
              amount: depositAmount,
              entryType: "deposit",
              idempotencyKey: `deposit:${transaction.id}`,
              transactionId: transaction.id,
              description: transaction.description || "Deposit",
            });
            const newBalance = balanceResult.balance.toFixed(2);
            
            await notificationService.sendNotification({
              userId: user.id,
              title: "Deposit Successful",
              message: `Your deposit of $${depositAmount} has been credited to your wallet.`,
              type: "transaction"
            });

            // SMS + email on transaction completed
            try {
              const { messagingService: ps2TxSms } = await import('./services/messaging');
              const { mailtrapService: ps2TxMailtrap } = await import('./services/mailtrap');
              if (user.phone) {
                ps2TxSms.sendTransactionNotification(user.phone, 'deposit', depositAmount.toFixed(2), 'USD', 'completed', transaction.id)
                  .catch(() => {});
              }
              if (user.email) {
                ps2TxMailtrap.sendTransactionCompleted(
                  user.email,
                  user.firstName || user.fullName?.split(' ')[0] || 'User',
                  user.lastName || user.fullName?.split(' ')[1] || '',
                  depositAmount.toFixed(2), 'USD', 'deposit', transaction.id
                ).catch(() => {});
              }
            } catch (_) {}
          }
        }
        
        return res.json({ status: 'success', message: 'Payment verified and credited' });
      }
      
      res.status(400).json({ status: 'failed', message: verification.data?.gateway_response || 'Payment not successful' });
    } catch (error) {
      console.error('Verify payment error:', error);
      res.status(500).json({ message: "Error verifying payment" });
    }
  });

  // Airtime purchase endpoint - uses KES balance and Statum API
  app.post("/api/airtime/purchase", requireAuth, async (req, res) => {
    try {
      const sessionUserId = (req as any).session?.userId;
      const { phoneNumber, amount, currency, provider, pin } = req.body;

      if (!sessionUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Security: users can only purchase airtime for themselves
      const userId = sessionUserId;

      console.log(`📱 Airtime purchase request - User: ${userId}, Phone: ${phoneNumber}, Amount: ${amount} ${currency}, Provider: ${provider}`);

      if (!phoneNumber || !amount || !currency || !provider) {
        console.warn(`⚠️ Missing required fields in airtime purchase request`);
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Get user
      const user = await storage.getUser(userId);
      if (!user) {
        console.error(`❌ User not found: ${userId}`);
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
      console.log(`👤 User ${user.fullName} (${user.email}) - KES wallet balance: ${wallet.balance}`);

      // Check PIN if required by admin settings
      const settings = await storage.getSystemSettings();
      const pinRequired = settings.some(s => s.key === "pin_required" && s.value === "true");
      
      if (pinRequired && user.pinEnabled) {
        if (!pin) {
          return res.status(400).json({ message: "PIN required", requiresPin: true });
        }
        
        // Verify PIN
        const isPinValid = await bcrypt.compare(pin, user.pinCode || "");
        if (!isPinValid) {
          return res.status(401).json({ message: "Invalid PIN", success: false });
        }
      }

      // Reserve the amount from the canonical KES wallet before calling the
      // provider. This prevents two concurrent purchases from spending the
      // same balance.
      const purchaseAmount = parseFloat(amount);
      const kesBalance = walletAvailableBalance(wallet);
      
      if (kesBalance < purchaseAmount) {
        console.warn(`⚠️ Insufficient balance - Required: ${purchaseAmount}, Available: ${kesBalance}`);
        return res.status(400).json({ 
          message: "Insufficient KES balance. Please convert USD to KES using the Exchange feature." 
        });
      }

      let airtimeDebit;
      try {
        airtimeDebit = await applyLedgerEntry({
          walletId: wallet.id, userId, currency: "KES", amount: -purchaseAmount,
          entryType: "airtime", idempotencyKey: `airtime:${userId}:${Date.now()}`,
          description: `Airtime purchase for ${phoneNumber}`,
        });
      } catch (error: any) {
        return res.status(400).json({ message: error?.message || "Insufficient KES balance" });
      }

      // Call Statum API to purchase airtime
      console.log(`📞 Calling Statum API for airtime purchase...`);
      let statumResponse;
      try {
        statumResponse = await statumService.purchaseAirtime(phoneNumber, purchaseAmount);
      } catch (providerError) {
        await applyLedgerEntry({
          walletId: wallet.id, userId, currency: "KES", amount: purchaseAmount,
          entryType: "airtime_rollback", idempotencyKey: `airtime-rollback:${userId}:${Date.now()}`,
          description: "Rollback failed airtime purchase",
        });
        throw providerError;
      }
      
      console.log(`✅ Statum API response:`, statumResponse);

      // Create transaction record
      const transaction = await storage.createTransaction({
        userId,
        type: "airtime",
        amount: amount.toString(),
        currency: "KES",
        status: "completed",
        fee: "0.00",
        description: `Airtime purchase for ${phoneNumber} (${provider})`,
        reference: statumResponse.transaction_id || undefined,
        recipientDetails: {
          phoneNumber,
          provider
        },
        metadata: {
          statumResponse
        }
      });

      console.log(`💾 Transaction created: ${transaction.id}`);

      const newKesBalance = kesBalance - purchaseAmount;
      console.log(`✅ Updated user balance: ${kesBalance} -> ${newKesBalance}`);
      console.log(`🎉 Airtime purchase completed successfully`);

      res.json({ 
        success: true,
        message: "Airtime purchased successfully",
        transaction,
        statumResponse
      });
    } catch (error) {
      console.error('❌ Airtime purchase error:', error);
      const errorMessage = error instanceof Error ? error.message : "Error purchasing airtime";
      res.status(500).json({ message: errorMessage });
    }
  });

  // Claim airtime bonus endpoint
  app.post("/api/airtime/claim-bonus", requireAuth, async (req, res) => {
    let bonusClaimReserved = false;
    try {
      const sessionUserId = (req as any).session?.userId;

      if (!sessionUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Security: users can only claim bonus for themselves
      const userId = sessionUserId;

      console.log(`🎁 Airtime bonus claim request - User: ${userId}`);

      const user = await storage.getUser(userId);
      if (!user) {
        console.error(`❌ User not found: ${userId}`);
        return res.status(404).json({ message: "User not found" });
      }

      console.log(`👤 User ${user.fullName} - Already claimed: ${user.hasClaimedAirtimeBonus}`);

      // Check if user has already claimed the bonus
      if (user.hasClaimedAirtimeBonus) {
        console.warn(`⚠️ User ${userId} has already claimed airtime bonus`);
        return res.status(400).json({ message: "You have already claimed your airtime bonus" });
      }

      // Get bonus settings from system settings
      const bonusAmountSetting = await storage.getSystemSetting("general", "airtime_bonus_amount");
      const bonusEnabledSetting = await storage.getSystemSetting("general", "enable_airtime_bonus");
      const requireKycSetting = await storage.getSystemSetting("general", "airtime_bonus_require_kyc");
      const requireEmailSetting = await storage.getSystemSetting("general", "airtime_bonus_require_email");

      const bonusAmount = parseFloat(String(bonusAmountSetting?.value || "10"));
      const isEnabled = ["true", "1", "yes", "on"].includes(String(bonusEnabledSetting?.value ?? "").toLowerCase());
      const requireKyc = String(requireKycSetting?.value || "none").toLowerCase(); // none, basic, advanced
      const requireEmail = ["true", "1", "yes", "on"].includes(String(requireEmailSetting?.value ?? "").toLowerCase());

      if (!isEnabled) {
        return res.status(400).json({ message: "Bonus claiming is currently disabled" });
      }
      if (!Number.isFinite(bonusAmount) || bonusAmount <= 0) {
        return res.status(400).json({ message: "A valid positive airtime bonus amount is not configured" });
      }

      // Check KYC requirement
      if (requireKyc === "basic" && user.kycStatus !== "verified") {
        return res.status(400).json({ message: "Basic KYC verification is required to claim this bonus" });
      }
      if (requireKyc === "advanced" && (user as any).advancedKycStatus !== "verified") {
        return res.status(400).json({ message: "Advanced KYC verification is required to claim this bonus" });
      }

      // Check email verification requirement
      if (requireEmail && !user.isEmailVerified) {
        return res.status(400).json({ message: "Email verification is required to claim this bonus" });
      }

      // Credit the canonical KES wallet, not the legacy user-level balance.
      const wallet = await ensureUserWallet(userId, "KES");
      if (!wallet) {
        return res.status(400).json({ message: "KES wallet is not enabled. Please contact support." });
      }
      const claimResult = await pool.query(
        `UPDATE users
         SET has_claimed_airtime_bonus = true, updated_at = NOW()
         WHERE id = $1 AND has_claimed_airtime_bonus IS NOT TRUE
         RETURNING id`,
        [userId],
      );
      if (claimResult.rowCount !== 1) {
        return res.status(400).json({ message: "You have already claimed your airtime bonus" });
      }
      bonusClaimReserved = true;
      const currentKesBalance = walletAvailableBalance(wallet);
      const bonusResult = await applyLedgerEntry({
        walletId: wallet.id,
        userId,
        currency: "KES",
        amount: bonusAmount,
        entryType: "airtime_bonus",
        idempotencyKey: `airtime-bonus:${userId}`,
        description: "Welcome airtime bonus",
      });
      const newKesBalance = bonusResult.balance;

      console.log(`💰 Bonus credited: ${currentKesBalance} -> ${newKesBalance} KES`);

      // Create transaction record for the bonus
      const transaction = await storage.createTransaction({
        userId,
        type: "deposit",
        amount: bonusAmount.toString(),
        currency: "KES",
        status: "completed",
        fee: "0.00",
        description: `Welcome Airtime Bonus - KES ${bonusAmount}`
      });

      console.log(`💾 Bonus transaction created: ${transaction.id}`);
      console.log(`✅ Airtime bonus claimed successfully`);
      bonusClaimReserved = false;

      res.json({
        success: true,
        message: `Airtime bonus claimed successfully! KES ${bonusAmount} has been added to your balance.`,
        newBalance: newKesBalance.toFixed(2),
        bonusAmount,
        transaction
      });
    } catch (error) {
      console.error('❌ Claim bonus error:', error);
      if (bonusClaimReserved) {
        await pool.query(
          `UPDATE users SET has_claimed_airtime_bonus = false, updated_at = NOW() WHERE id = $1`,
          [(req as any).session?.userId],
        ).catch(() => {});
      }
      const message = error instanceof Error ? error.message : "Error claiming airtime bonus";
      res.status(500).json({ message });
    }
  });

  // Bill payment endpoint - KPLC, Zuku, StartimesTV, Nairobi Water, etc
  app.post("/api/bills/pay", requireAuth, async (req, res) => {
    try {
      const sessionUserId = (req as any).session?.userId;
      const { provider, meterNumber, accountNumber, amount } = req.body;

      if (!sessionUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Security: users can only pay bills from their own account
      const userId = sessionUserId;

      console.log(`💳 Bill payment request - User: ${userId}, Provider: ${provider}, Amount: ${amount} KES`);

      if (!provider || !amount || (!meterNumber && !accountNumber)) {
        console.warn(`⚠️ Missing required fields in bill payment request`);
        return res.status(400).json({ message: "Missing required fields" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        console.error(`❌ User not found: ${userId}`);
        return res.status(404).json({ message: "User not found" });
      }

      const kesWallet = await getUserWallet(userId, "KES");
      if (!kesWallet) {
        return res.status(400).json({ message: "KES wallet not found" });
      }
      const kesBalance = walletAvailableBalance(kesWallet);
      const paymentAmount = parseFloat(amount);
      
      if (kesBalance < paymentAmount) {
        console.warn(`⚠️ Insufficient balance - Required: ${paymentAmount}, Available: ${kesBalance}`);
        return res.status(400).json({ 
          message: "Insufficient KES balance. Please convert USD to KES using the Exchange feature." 
        });
      }

      // Create bill payment record as PENDING - verify with provider first
      const billPayment = await storage.createBillPayment({
        userId,
        provider,
        meterNumber: meterNumber || null,
        accountNumber: accountNumber || null,
        amount: amount.toString(),
        currency: "KES",
        status: "pending",
        fee: "0.00",
        description: `Bill payment for ${provider}${meterNumber ? ` (${meterNumber})` : accountNumber ? ` (${accountNumber})` : ''}`,
        reference: `BP-${Date.now()}`,
        metadata: { meterNumber, accountNumber, provider }
      });

      console.log(`💾 Bill payment created (PENDING): ${billPayment.id}`);

      // Create transaction record as PENDING
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

      try {
        await applyLedgerEntry({
          walletId: kesWallet.id, userId, currency: "KES", amount: -paymentAmount,
          entryType: "bill_payment", idempotencyKey: `bill:${billPayment.id}`,
          description: `Bill payment - ${provider}`,
        });
      } catch (error: any) {
        return res.status(400).json({ message: error?.message || "Insufficient KES balance" });
      }

      // The amount is debited once and the bill remains pending until provider
      // verification completes. A failed verification must refund this debit.
      console.log(`⏳ Bill payment pending verification with provider`);

      res.json({ 
        success: true,
        message: "Bill payment submitted for verification. You will receive confirmation shortly.",
        billPayment,
        status: "pending"
      });
    } catch (error) {
      console.error('❌ Bill payment error:', error);
      const errorMessage = error instanceof Error ? error.message : "Error processing bill payment";
      res.status(500).json({ message: errorMessage });
    }
  });

  // Get bill payments history
  app.get("/api/bills/history/:userId", requireAuth, async (req, res) => {
    try {
      const sessionUserId = (req as any).session?.userId;
      const requestedUserId = req.params.userId;
      
      // Security: users can only view their own bill history
      if (sessionUserId !== requestedUserId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const payments = await storage.getBillPaymentsByUserId(requestedUserId);
      res.json({ payments });
    } catch (error) {
      console.error('Error fetching bill payments:', error);
      res.status(500).json({ message: "Error fetching bill payments" });
    }
  });

  app.get("/api/virtual-card/:userId", requireAuth, async (req, res) => {
    try {
      const sessionUserId = (req as any).session?.userId;
      const requestedUserId = req.params.userId;
      
      // Security: users can only view their own virtual cards
      if (sessionUserId !== requestedUserId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const cards = await storage.getVirtualCardsByUserId(requestedUserId);
      const ledgerCards = await Promise.all(cards.map(async card => {
        const balance = await getLedgerBalance({ cardId: card.id }, Number(card.balance || 0));
        return { ...card, balance: balance.toString(), availableBalance: balance.toString() };
      }));
      // Also return the primary card (most recent active) for backward compat
      const card = ledgerCards.find(c => c.status === 'active') || ledgerCards[0] || null;
      res.json({ card, cards: ledgerCards });
    } catch (error) {
      res.status(500).json({ message: "Error fetching virtual card" });
    }
  });

  // User freeze own card
  app.post("/api/virtual-card/:cardId/freeze", requireAuth, async (req, res) => {
    try {
      const sessionUserId = (req as any).session?.userId;
      const { cardId } = req.params;
      
      const card = await storage.getVirtualCardById(cardId);
      if (!card) return res.status(404).json({ message: "Card not found" });
      if (card.userId !== sessionUserId) return res.status(403).json({ message: "Access denied" });
      if (card.status !== 'active') return res.status(400).json({ message: "Only active cards can be frozen" });
      
      const updated = await storage.updateVirtualCard(cardId, { status: 'frozen', freezeReason: 'Frozen by cardholder' });
      res.json({ card: updated, message: "Card frozen successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error freezing card" });
    }
  });

  // User unfreeze own card
  app.post("/api/virtual-card/:cardId/unfreeze", requireAuth, async (req, res) => {
    try {
      const sessionUserId = (req as any).session?.userId;
      const { cardId } = req.params;
      
      const card = await storage.getVirtualCardById(cardId);
      if (!card) return res.status(404).json({ message: "Card not found" });
      if (card.userId !== sessionUserId) return res.status(403).json({ message: "Access denied" });
      if (card.status !== 'frozen') return res.status(400).json({ message: "Card is not frozen" });
      // Only allow unfreeze if frozen by user (not admin)
      if (card.freezeReason && card.freezeReason !== 'Frozen by cardholder') {
        return res.status(403).json({ message: "This card was frozen by an admin and cannot be unfrozen by you" });
      }
      
      const updated = await storage.updateVirtualCard(cardId, { status: 'active', freezeReason: null });
      res.json({ card: updated, message: "Card unfrozen successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error unfreezing card" });
    }
  });

  // Transfer between wallet and card
  app.post("/api/virtual-card/transfer", requireAuth, async (req, res) => {
    try {
      const sessionUserId = (req as any).session?.userId;
      const { cardId, direction, amount } = req.body; // direction: 'wallet_to_card' | 'card_to_wallet'
      
      if (!cardId || !direction || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "Invalid transfer parameters" });
      }
      
      const transferAmount = parseFloat(amount);
      const card = await storage.getVirtualCardById(cardId);
      if (!card) return res.status(404).json({ message: "Card not found" });
      if (card.userId !== sessionUserId) return res.status(403).json({ message: "Access denied" });
      if (card.status !== 'active') return res.status(400).json({ message: "Card must be active to transfer funds" });
      
      const user = await storage.getUser(sessionUserId);
      if (!user) return res.status(404).json({ message: "User not found" });
      
      const wallet = await getUserWallet(sessionUserId, "USD");
      if (!wallet) return res.status(400).json({ message: "USD wallet not found" });
      const walletBalance = walletAvailableBalance(wallet);
      const cardBalance = await getLedgerBalance({ cardId: card.id }, Number(card.balance || 0));
      
      if (direction === 'wallet_to_card') {
        const walletDebit = await applyLedgerEntry({
          walletId: wallet.id, userId: sessionUserId, currency: "USD", amount: -transferAmount,
          entryType: "card_funding", idempotencyKey: `card-transfer:${cardId}:${Date.now()}:wallet-debit`,
          description: "Transfer from wallet to virtual card",
        });
        let cardCredit;
        try {
          cardCredit = await applyLedgerEntry({
            cardId: card.id, userId: sessionUserId, currency: "USD", amount: transferAmount,
            entryType: "card_funding", idempotencyKey: `card-transfer:${cardId}:${Date.now()}:card-credit`,
            description: "Transfer from wallet to virtual card",
          });
        } catch (error) {
          await applyLedgerEntry({
            walletId: wallet.id, userId: sessionUserId, currency: "USD", amount: transferAmount,
            entryType: "card_funding_rollback", idempotencyKey: `card-transfer:${cardId}:${Date.now()}:wallet-rollback`,
            description: "Rollback failed card funding",
          });
          throw error;
        }
        const newWalletBalance = walletDebit.availableBalance.toFixed(2);
        const newCardBalance = cardCredit.balance.toFixed(2);
        
        await storage.createTransaction({
          userId: sessionUserId,
          type: 'card_transfer',
          amount: amount.toString(),
          currency: 'USD',
          status: 'completed',
          description: `Wallet to card transfer`,
          completedAt: new Date(),
          metadata: { direction: 'wallet_to_card', cardId }
        });
        
        res.json({ message: "Funds transferred to card", walletBalance: newWalletBalance, cardBalance: newCardBalance });
      } else if (direction === 'card_to_wallet') {
        if (cardBalance < transferAmount) {
          return res.status(400).json({ message: "Insufficient card balance" });
        }
        const cardDebit = await applyLedgerEntry({
          cardId: card.id, userId: sessionUserId, currency: "USD", amount: -transferAmount,
          entryType: "card_withdrawal", idempotencyKey: `card-transfer:${cardId}:${Date.now()}:card-debit`,
          description: "Transfer from virtual card to wallet",
        });
        let walletCredit;
        try {
          walletCredit = await applyLedgerEntry({
            walletId: wallet.id, userId: sessionUserId, currency: "USD", amount: transferAmount,
            entryType: "card_withdrawal", idempotencyKey: `card-transfer:${cardId}:${Date.now()}:wallet-credit`,
            description: "Transfer from virtual card to wallet",
          });
        } catch (error) {
          await applyLedgerEntry({
            cardId: card.id, userId: sessionUserId, currency: "USD", amount: transferAmount,
            entryType: "card_withdrawal_rollback", idempotencyKey: `card-transfer:${cardId}:${Date.now()}:card-rollback`,
            description: "Rollback failed card withdrawal",
          });
          throw error;
        }
        const newCardBalance = cardDebit.balance.toFixed(2);
        const newWalletBalance = walletCredit.availableBalance.toFixed(2);
        
        await storage.createTransaction({
          userId: sessionUserId,
          type: 'card_transfer',
          amount: amount.toString(),
          currency: 'USD',
          status: 'completed',
          description: `Card to wallet transfer`,
          completedAt: new Date(),
          metadata: { direction: 'card_to_wallet', cardId }
        });
        
        res.json({ message: "Funds transferred to wallet", walletBalance: newWalletBalance, cardBalance: newCardBalance });
      } else {
        res.status(400).json({ message: "Invalid direction. Use 'wallet_to_card' or 'card_to_wallet'" });
      }
    } catch (error) {
      console.error('Card transfer error:', error);
      res.status(500).json({ message: "Error processing transfer" });
    }
  });

  // Exchange rates API
  // Create exchange rate service with storage for database-backed configuration
  const exchangeRateService = createExchangeRateService(storage);
  
  app.get("/api/exchange-rates/:from/:to", optionalApiKey, async (req, res) => {
    try {
      const { from, to } = req.params;
      const rate = await exchangeRateService.getExchangeRate(from.toUpperCase(), to.toUpperCase());
      
      res.json({ 
        from: from.toUpperCase(),
        to: to.toUpperCase(),
        rate,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Exchange rate error:', error);
      res.status(500).json({ message: "Error fetching exchange rate" });
    }
  });

  app.get("/api/exchange-rates/:base", optionalApiKey, async (req, res) => {
    try {
      const { base } = req.params;
      const ALL_CURRENCIES = ['KES', 'EUR', 'GBP', 'NGN', 'GHS', 'TZS', 'UGX', 'ZAR', 'CAD', 'AUD', 'JPY', 'CNY', 'INR', 'AED', 'SAR', 'USD'];
      const targets = ALL_CURRENCIES.filter(c => c !== base.toUpperCase());
      const rates = await exchangeRateService.getMultipleRates(base.toUpperCase(), targets);
      
      res.json({ 
        base: base.toUpperCase(),
        rates,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Multiple exchange rates error:', error);
      res.status(500).json({ message: "Error fetching exchange rates" });
    }
  });


  // Real-time Transaction routes
  app.post("/api/transactions/send", requireAuth, async (req, res) => {
    try {
      const sessionUserId = (req as any).session?.userId;
      const { amount, currency, recipientDetails, targetCurrency } = req.body;
      
      if (!sessionUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Security: users can only send from their own account
      const userId = sessionUserId;
      
      // Verify user exists and has virtual card
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!user?.hasVirtualCard) {
        return res.status(400).json({ message: "Virtual card required for transactions" });
      }

      // Get real-time exchange rate
      const exchangeRate = await exchangeRateService.getExchangeRate(currency, targetCurrency);
      const convertedAmount = (parseFloat(amount) * exchangeRate).toFixed(2);
      const fee = (parseFloat(amount) * 0.02).toFixed(2); // 2% fee
      
      // Create transaction
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
          processingStarted: new Date().toISOString()
        }
      });

      // Simulate processing time (in real app, this would be async)
      setTimeout(async () => {
        try {
          await storage.updateTransaction(transaction.id, { 
            status: "completed",
            completedAt: new Date()
          });
          
          // Send notification
          await notificationService.sendTransactionNotification(userId, {
            ...transaction,
            status: "completed"
          });
          
          // Send transaction notification via SMS, WhatsApp and Email
          const { messagingService } = await import('./services/messaging');
          const { mailtrapService: sendMailtrap } = await import('./services/mailtrap');
          messagingService.sendTransactionNotification(user.phone, 'send', amount, currency, 'completed', transaction.id)
            .catch(err => console.error('Transaction notification error:', err));
          if (user.email) {
            sendMailtrap.sendTransactionCompleted(
              user.email,
              user.firstName || user.fullName?.split(' ')[0] || 'User',
              user.lastName || user.fullName?.split(' ')[1] || '',
              amount, currency, 'send', transaction.id
            ).catch(err => console.error('Transaction completed email error:', err));
          }
        } catch (error) {
          console.error('Transaction completion error:', error);
        }
      }, 5000); // 5 second delay
      
      res.json({ 
        transaction,
        convertedAmount,
        exchangeRate,
        message: "Transaction initiated successfully"
      });
    } catch (error) {
      console.error('Send transaction error:', error);
      res.status(400).json({ message: "Transaction failed" });
    }
  });

  app.post("/api/transactions/receive", requireAuth, async (req, res) => {
    try {
      const sessionUserId = (req as any).session?.userId;
      
      if (!sessionUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const { amount, currency, senderDetails } = req.body;
      
      // Security: can only receive to own account
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

      // Update user balance
      const user = await storage.getUser(userId);
      const receiveCurrency = normalizeCurrency(currency);
      const receiveWallet = await ensureUserWallet(userId, receiveCurrency);
      if (!receiveWallet) return res.status(400).json({ message: `${receiveCurrency} wallet is not enabled` });
      const newBalance = (walletAvailableBalance(receiveWallet) + parseFloat(amount)).toFixed(2);
      await applyLedgerEntry({
        walletId: receiveWallet.id,
        userId,
        currency: receiveCurrency,
        amount: parseFloat(amount),
        entryType: "receive",
        idempotencyKey: `receive:${transaction.id}`,
        transactionId: transaction.id,
        description: transaction.description || "Received funds",
      });
      
      // Send notification
      await notificationService.sendTransactionNotification(userId, transaction);
      
      // Send fund receipt notification via SMS, WhatsApp, and Email
      if (user) {
        const { messagingService } = await import('./services/messaging');
        const { mailtrapService } = await import('./services/mailtrap');
        messagingService.sendFundReceipt(user.phone, amount, currency, senderDetails.name)
          .catch(err => console.error('Fund receipt notification error:', err));
        if (user.email) {
          mailtrapService.sendFundReceipt(user.email, user.fullName?.split(' ')[0] || 'User', user.fullName?.split(' ')[1] || '', amount, currency, senderDetails.name)
            .catch(err => console.error('Fund receipt email error:', err));
        }
      }
      
      res.json({ transaction, message: "Payment received successfully" });
    } catch (error) {
      console.error('Receive transaction error:', error);
      res.status(400).json({ message: "Transaction failed" });
    }
  });

  app.get("/api/transactions/:userId", requireAuth, async (req, res) => {
    try {
      const sessionUserId = (req as any).session?.userId;
      const requestedUserId = req.params.userId;
      
      // Security: users can only view their own transactions
      if (sessionUserId !== requestedUserId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const transactions = await storage.getTransactionsByUserId(requestedUserId);
      res.json({ transactions });
    } catch (error) {
      res.status(500).json({ message: "Error fetching transactions" });
    }
  });

  app.get("/api/transactions/status/:transactionId", requireAuth, async (req, res) => {
    try {
      const sessionUserId = (req as any).session?.userId;
      
      if (!sessionUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const transaction = await storage.getTransaction(req.params.transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      // Security: users can only view their own transactions
      if ((transaction as any).userId !== sessionUserId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const timeline = transaction.type === "withdraw"
        ? await storage.getWithdrawalEvents(transaction.id)
        : [];
      res.json({ transaction, timeline });
    } catch (error) {
      res.status(500).json({ message: "Error fetching transaction status" });
    }
  });

  app.get("/api/withdrawals/:id/timeline", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      const transaction = await storage.getTransaction(req.params.id);
      if (!transaction || transaction.type !== "withdraw") return res.status(404).json({ message: "Withdrawal not found" });
      if (transaction.userId !== userId) return res.status(403).json({ message: "Access denied" });
      res.json({ transaction, timeline: await storage.getWithdrawalEvents(transaction.id) });
    } catch (error) {
      console.error("Withdrawal timeline error:", error);
      res.status(500).json({ message: "Failed to load withdrawal timeline" });
    }
  });

  // Export transactions to email with PDF attachment
  app.post("/api/transactions/export-email", requireAuth, async (req, res) => {
    try {
      const { transactions } = req.body;
      const userId = (req.session as any).userId;

      if (!transactions || !Array.isArray(transactions)) {
        return res.status(400).json({ message: "Transactions array required" });
      }

      if (transactions.length === 0) {
        return res.status(400).json({ message: "No transactions to export" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Build transaction summary
      let totalSent = 0;
      let totalReceived = 0;
      let transactionCount = transactions.length;

      transactions.forEach((txn: any) => {
        const amount = parseFloat(txn.amount);
        if (txn.type === 'send' || txn.type === 'withdraw') {
          totalSent += amount;
        } else if (txn.type === 'receive' || txn.type === 'deposit') {
          totalReceived += amount;
        }
      });

      // Generate PDF
      const { generateTransactionPDF } = await import('./lib/pdf-export');
      const pdfBuffer = await generateTransactionPDF(transactions, {
        fullName: user.fullName,
        email: user.email,
        phone: user.phone
      });

      const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

      const generatedOn = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      const templateVariables: any = {
        user_name: user.fullName || user.email,
        total_transactions: transactionCount.toString(),
        total_sent: totalSent.toFixed(2),
        total_received: totalReceived.toFixed(2),
        generated_on: generatedOn,
        account_email: user.email,
      };

      const attachments = [
        {
          filename: `transactions-${new Date().toISOString().split('T')[0]}.pdf`,
          content: pdfBase64,
          disposition: 'attachment'
        }
      ];

      // Send via Mailtrap
      const { MailtrapService } = await import('./services/mailtrap');
      const mailtrapService = new MailtrapService();
      
      const success = await mailtrapService.sendTemplate(
        user.email,
        '307e5609-66bb-4235-8653-27f0d5d74a39',
        templateVariables,
        attachments
      );

      if (success) {
        console.log(`✅ Transaction export email sent to ${user.email} - ${transactionCount} transactions with PDF`);
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
      console.error('Transaction export error:', error);
      res.status(500).json({ message: "Error exporting transactions to email" });
    }
  });

  // 2FA routes
  app.post("/api/auth/2fa/setup", async (req, res) => {
    try {
      const { userId } = req.body;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { secret, qrCodeUrl, backupCodes } = twoFactorService.generateSecret(user.email);
      
      // Store secret and backup codes temporarily (user needs to verify before enabling)
      await storage.updateUser(userId, { 
        twoFactorSecret: secret,
        twoFactorBackupCodes: JSON.stringify(backupCodes)
      });
      
      res.json({ qrCodeUrl, backupCodes, secret });
    } catch (error) {
      console.error('2FA setup error:', error);
      res.status(500).json({ message: "Error setting up 2FA" });
    }
  });

  app.post("/api/auth/2fa/verify", async (req, res) => {
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
      console.error('2FA verification error:', error);
      res.status(500).json({ message: "Error verifying 2FA" });
    }
  });

  app.post("/api/users/:userId/disable-2fa", requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const { password } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (password) {
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash || '');
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
      console.error('Disable 2FA error:', error);
      res.status(500).json({ message: "Error disabling 2FA" });
    }
  });

  // Biometric authentication routes
  app.post("/api/auth/biometric/setup", async (req, res) => {
    try {
      const { userId, credentialId } = req.body;
      
      if (!credentialId) {
        return res.status(400).json({ message: "Invalid credential" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Store biometric credential as JSON string
      await storage.updateUser(userId, { 
        biometricEnabled: true,
        biometricCredentialId: JSON.stringify({ credentialId })
      });
      
      const updatedUser = await storage.getUser(userId);
      const { password: _, ...userResponse } = updatedUser || {};
      res.json({ success: true, message: "Biometric authentication enabled", user: userResponse });
    } catch (error) {
      console.error('Biometric setup error:', error);
      res.status(500).json({ message: "Error setting up biometric authentication" });
    }
  });

  app.post("/api/auth/biometric/verify", async (req, res) => {
    try {
      const { userId, credentialId } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user || !user.biometricEnabled) {
        return res.status(400).json({ message: "Biometric not enabled" });
      }

      // Verify the credential matches
      const storedCred = user.biometricCredentialId ? JSON.parse(user.biometricCredentialId) : null;
      if (storedCred && storedCred.credentialId === credentialId) {
        res.json({ success: true, verified: true });
      } else {
        res.status(401).json({ success: false, verified: false });
      }
    } catch (error) {
      console.error('Biometric verification error:', error);
      res.status(500).json({ message: "Error verifying biometric" });
    }
  });

  app.post("/api/users/:userId/disable-biometric", async (req, res) => {
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
      console.error('Disable biometric error:', error);
      res.status(500).json({ message: "Error disabling biometric" });
    }
  });

  app.post("/api/auth/biometric/login", async (req, res) => {
    try {
      const { credentialId } = req.body;
      
      if (!credentialId) {
        return res.status(400).json({ message: "Invalid credential" });
      }

      console.log(`[Biometric Login] Attempting login with credentialId: ${credentialId}`);

      // Find user with matching biometric credential directly using SQL if possible, 
      // or filter the list more reliably.
      const allUsers = await storage.getAllUsers();
      const users = Array.isArray(allUsers) ? allUsers : [];
      
      const user = users.find((u: any) => {
        if (!u.biometricEnabled || !u.biometricCredentialId) return false;
        try {
          const stored = typeof u.biometricCredentialId === 'string'
            ? JSON.parse(u.biometricCredentialId)
            : u.biometricCredentialId;
          
          // Match the credential ID
          return stored && (stored.credentialId === credentialId || u.biometricCredentialId.includes(credentialId));
        } catch (e) {
          console.error(`[Biometric Login] Error parsing credential for user ${u.id}:`, e);
          // Fallback to simple string check if JSON parse fails
          return typeof u.biometricCredentialId === 'string' && u.biometricCredentialId.includes(credentialId);
        }
      });
      
      if (!user) {
        console.warn(`[Biometric Login] No user found for credentialId: ${credentialId}`);
        return res.status(401).json({ 
          message: "No passkey found for this device in our records. Please ensure you have enabled biometric login in Settings while logged in." 
        });
      }

      console.log(`[Biometric Login] Success for user: ${user.email}`);

      // Establish session
      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regeneration error:', err);
          return res.status(500).json({ message: "Session error" });
        }

        (req.session as any).userId = user.id;
        (req.session as any).user = { id: user.id, email: user.email };

        storage.createLoginHistory({
          userId: user.id,
          ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'Unknown',
          userAgent: req.headers['user-agent'] || 'Unknown',
          deviceType: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop',
          browser: req.headers['user-agent']?.split('/')[0] || 'Unknown',
          location: (req.headers['cf-ipcountry'] as string) || 'Unknown',
          status: 'success',
        }).catch(err => console.error('Login history error:', err));

        const { password: _, ...userResponse } = user;
        
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error('Session save error:', saveErr);
            return res.status(500).json({ message: "Session save error" });
          }
          res.json({ success: true, user: userResponse });
        });
      });
    } catch (error) {
      console.error('Biometric login error:', error);
      res.status(500).json({ message: "Error during biometric login" });
    }
  });

  // Middleware to verify biometric for crucial activities
  async function verifyBiometricForActivity(req: any, res: any, next: any) {
    try {
      const userId = req.user?.id || req.body?.userId;
      if (!userId) return next();

      const user = await storage.getUser(userId);
      if (!user || !user.biometricEnabled) return next(); // Skip if not enabled

      // For crucial activities when biometric is enabled, require verification
      if (req.headers['x-require-biometric'] === 'true') {
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

  app.use(verifyBiometricForActivity);

  // Push notifications
  app.post("/api/notifications/register", async (req, res) => {
    try {
      const { userId, token } = req.body;
      
      const success = await notificationService.registerPushToken(userId, token);
      
      if (success) {
        res.json({ success: true, message: "Push notifications registered" });
      } else {
        res.status(400).json({ message: "Failed to register push notifications" });
      }
    } catch (error) {
      console.error('Push notification registration error:', error);
      res.status(500).json({ message: "Error registering push notifications" });
    }
  });

  // Recipient management routes
  app.post("/api/recipients", requireAuth, async (req, res) => {
    try {
      const sessionUserId = (req as any).session?.userId;
      
      if (!sessionUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const recipientData = insertRecipientSchema.parse({
        ...req.body,
        userId: sessionUserId
      });
      const recipient = await storage.createRecipient(recipientData);
      await notificationService.sendNotification({
        title: "Beneficiary saved",
        body: `${recipient.name} was added to your beneficiaries.`,
        userId: sessionUserId,
        type: "general",
        metadata: { actionUrl: "/withdraw", action: "beneficiary_added", beneficiaryId: recipient.id },
      });
      await sendAccountEmail(await storage.getUser(sessionUserId), "beneficiary_added", {
        beneficiary_name: recipient.name,
        beneficiary_type: recipient.recipientType || "beneficiary",
        beneficiary_reference: recipient.id,
      });
      res.json({ recipient, message: "Recipient added successfully" });
    } catch (error) {
      console.error('Create recipient error:', error);
      res.status(400).json({ message: "Invalid recipient data" });
    }
  });

  app.get("/api/recipients/:userId", requireAuth, async (req, res) => {
    try {
      const sessionUserId = (req as any).session?.userId;
      const requestedUserId = req.params.userId;
      
      // Security: users can only view their own recipients
      if (sessionUserId !== requestedUserId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const recipients = await storage.getRecipientsByUserId(requestedUserId);
      res.json({ recipients });
    } catch (error) {
      res.status(500).json({ message: "Error fetching recipients" });
    }
  });

  app.put("/api/recipients/:id", requireAuth, async (req, res) => {
    try {
      const sessionUserId = (req as any).session?.userId;
      
      if (!sessionUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Verify recipient belongs to user
      const recipientData = await storage.getRecipient(req.params.id);
      if (!recipientData || (recipientData as any).userId !== sessionUserId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const recipient = await storage.updateRecipient(req.params.id, req.body);
      if (recipient) {
        await notificationService.sendNotification({
          title: "Beneficiary updated",
          body: `${recipient.name} was updated successfully.`,
          userId: sessionUserId,
          type: "general",
          metadata: { actionUrl: "/withdraw", action: "beneficiary_updated", beneficiaryId: recipient.id },
        });
        await sendAccountEmail(await storage.getUser(sessionUserId), "beneficiary_updated", {
          beneficiary_name: recipient.name,
          beneficiary_type: recipient.recipientType || "beneficiary",
          beneficiary_reference: recipient.id,
        });
        res.json({ recipient, message: "Recipient updated successfully" });
      } else {
        res.status(404).json({ message: "Recipient not found" });
      }
    } catch (error) {
      console.error('Update recipient error:', error);
      res.status(500).json({ message: "Error updating recipient" });
    }
  });

  app.delete("/api/recipients/:id", requireAuth, async (req, res) => {
    try {
      const sessionUserId = (req as any).session?.userId;
      
      if (!sessionUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Verify recipient belongs to user
      const recipientData = await storage.getRecipient(req.params.id);
      if (!recipientData || (recipientData as any).userId !== sessionUserId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteRecipient(req.params.id);
      await notificationService.sendNotification({
        title: "Beneficiary removed",
        body: `${recipientData.name} was removed from your beneficiaries.`,
        userId: sessionUserId,
        type: "general",
        metadata: { actionUrl: "/withdraw", action: "beneficiary_deleted", beneficiaryId: req.params.id },
      });
      await sendAccountEmail(await storage.getUser(sessionUserId), "beneficiary_deleted", {
        beneficiary_name: recipientData.name,
        beneficiary_reference: recipientData.id,
      });
      res.json({ message: "Recipient deleted successfully" });
    } catch (error) {
      console.error('Delete recipient error:', error);
      res.status(500).json({ message: "Error deleting recipient" });
    }
  });

  // User settings and profile updates
  app.put("/api/users/:userId/settings", async (req, res) => {
    try {
      const { userId } = req.params;
      const { defaultCurrency, pushNotificationsEnabled, twoFactorEnabled, biometricEnabled, darkMode, ...settings } = req.body;
      
      // Save settings to user profile
      const updateData: Record<string, any> = { ...settings };
      if (defaultCurrency) updateData.defaultCurrency = defaultCurrency;
      if (pushNotificationsEnabled !== undefined) updateData.pushNotificationsEnabled = pushNotificationsEnabled;
      if (twoFactorEnabled !== undefined) updateData.twoFactorEnabled = twoFactorEnabled;
      if (biometricEnabled !== undefined) updateData.biometricEnabled = biometricEnabled;
      if (darkMode !== undefined) updateData.darkMode = darkMode;
      
      const user = await storage.updateUser(userId, updateData);

      // Sync default wallet to match new defaultCurrency
      if (defaultCurrency && user) {
        try {
          const userWallets = await db.select().from(wallets).where(eq(wallets.userId, userId));
          const matchingWallet = userWallets.find(w => normalizeCurrency(w.currency) === normalizeCurrency(defaultCurrency));
          if (matchingWallet) {
            // Set this wallet as default, unset others
            await db.update(wallets).set({ isDefault: false }).where(eq(wallets.userId, userId));
            await db.update(wallets).set({ isDefault: true, updatedAt: new Date() }).where(eq(wallets.id, matchingWallet.id));
          } else {
            // Create wallet for the selected currency if it doesn't exist
            const enabledSetting = await pool.query(`SELECT value FROM system_settings WHERE key = 'enabled_currencies' LIMIT 1`);
            const enabled = (enabledSetting.rows[0]?.value?.replace(/['"]/g, '') || "USD,KES").split(",");
            if (enabled.includes(defaultCurrency)) {
              await db.update(wallets).set({ isDefault: false }).where(eq(wallets.userId, userId));
              await db.insert(wallets).values({ userId, currency: defaultCurrency, isDefault: true, isActive: true });
            }
          }
        } catch (walletSyncErr) {
          console.error('Wallet sync error:', walletSyncErr);
        }
      }
      
      if (user) {
        const { password, ...userResponse } = user;
        res.json({ user: userResponse, message: "Settings updated successfully" });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error('Settings update error:', error);
      res.status(500).json({ message: "Error updating settings" });
    }
  });

  // Real-time exchange and currency conversion - supports dual wallet (USD/KES)
  app.post("/api/exchange/convert", optionalApiKey, async (req, res) => {
    try {
      const { amount, fromCurrency, toCurrency, userId } = req.body;
      
      // Get user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify user has virtual card for exchanges
      if (!user.hasVirtualCard) {
        return res.status(400).json({ message: "Virtual card required for currency exchanges" });
      }

      const exchangeAmount = parseFloat(amount);
      const fee = (exchangeAmount * 0.015).toFixed(2); // 1.5% exchange fee
      const totalDeducted = exchangeAmount + parseFloat(fee);

      // Get exchange rate
      const exchangeRate = await exchangeRateService.getExchangeRate(fromCurrency, toCurrency);
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
      const sourceLedgerBalance = await getLedgerBalance({ walletId: sourceWallet.id }, Number(sourceWallet.balance || 0));
      const available = walletAvailableBalance({ ...sourceWallet, balance: sourceLedgerBalance.toString() });
      if (available < totalDeducted) {
        return res.status(400).json({ message: `Insufficient ${sourceCurrency} balance` });
      }

      const exchangeReference = `EX-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      let sourceDebited = false;
      try {
        await applyLedgerEntry({
          walletId: sourceWallet.id, userId, currency: sourceCurrency, amount: -totalDeducted,
          entryType: "exchange", idempotencyKey: `exchange:${exchangeReference}:debit`,
          description: `Exchange ${sourceCurrency} to ${targetCurrency}`,
        });
        sourceDebited = true;
        await applyLedgerEntry({
          walletId: targetWallet.id, userId, currency: targetCurrency, amount: parseFloat(convertedAmount),
          entryType: "exchange", idempotencyKey: `exchange:${exchangeReference}:credit`,
          description: `Exchange from ${sourceCurrency}`,
        });
      } catch (error: any) {
        if (sourceDebited) {
          await applyLedgerEntry({
            walletId: sourceWallet.id, userId, currency: sourceCurrency, amount: totalDeducted,
            entryType: "exchange_rollback", idempotencyKey: `exchange:${exchangeReference}:rollback`,
            description: "Rollback failed exchange",
          }).catch(() => {});
        }
        return res.status(400).json({ message: error?.message || `Insufficient ${sourceCurrency} balance` });
      }
      
      // Create exchange transaction
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
      console.error('Exchange error:', error);
      res.status(400).json({ message: "Exchange failed" });
    }
  });

  // Payment Request routes with working payment links
  app.post("/api/payment-requests", requireAuth, async (req, res) => {
    try {
      const sessionUserId = (req as any).session?.userId;
      if (!sessionUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const requestedRecipient = req.body?.toUserId
        ? await storage.getUser(String(req.body.toUserId))
        : undefined;
      const requestData = insertPaymentRequestSchema.parse({
        ...req.body,
        fromUserId: sessionUserId,
        toUserId: req.body?.toUserId || undefined,
        toEmail: req.body?.toEmail || requestedRecipient?.email || undefined,
        toPhone: req.body?.toPhone || requestedRecipient?.phone || undefined,
        amount: String(req.body?.amount ?? ""),
        currency: normalizeCurrency(req.body?.currency || "KES"),
      });
      
      // Generate unique payment link
      const paymentId = Math.random().toString(36).substring(2, 15);
      const paymentLink = `${req.protocol}://${req.get('host')}/pay/${paymentId}`;
      
      const request = await storage.createPaymentRequest({
        ...requestData,
        paymentLink,
      });
      
      // Send notification if recipient has account
      if (requestData.toUserId || requestData.toEmail || requestData.toPhone) {
        const recipientUser = requestData.toUserId
          ? await storage.getUser(requestData.toUserId)
          : requestData.toEmail
            ? await storage.getUserByEmail(requestData.toEmail)
            : requestData.toPhone
              ? await storage.getUserByPhone(requestData.toPhone)
              : undefined;

        if (recipientUser) {
          await notificationService.sendNotification({
            title: "Payment Request",
            body: `You have received a payment request for ${requestData.currency} ${requestData.amount}`,
            userId: recipientUser.id,
            type: "general",
            metadata: { paymentRequestId: request.id },
          });
        }
      }
      
      res.json({ request, message: "Payment request created successfully" });
    } catch (error) {
      console.error('Payment request error:', error);
      res.status(400).json({ message: "Invalid payment request data" });
    }
  });

  app.get("/api/payment-requests/:userId", requireAuth, async (req, res) => {
    try {
      const sessionUserId = (req as any).session?.userId;
      const requestedUserId = req.params.userId;
      
      // Security: users can only view their own payment requests
      if (sessionUserId !== requestedUserId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const requests = await storage.getPaymentRequestsByUserId(requestedUserId);
      res.json({ requests });
    } catch (error) {
      res.status(500).json({ message: "Error fetching payment requests" });
    }
  });

  app.post("/api/payment-requests/:id/pay", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const sessionUserId = (req as any).session?.userId;
      
      if (!sessionUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const paymentRequest = await storage.getPaymentRequest(id);
      if (!paymentRequest) {
        return res.status(404).json({ message: "Payment request not found" });
      }

      if (paymentRequest.status !== 'pending') {
        return res.status(400).json({ message: "Payment request already processed" });
      }

      // Security: use authenticated session user ID, not request body
      const payerUserId = sessionUserId;

      // Process payment
      const transaction = await storage.createTransaction({
        userId: payerUserId,
        type: "send",
        amount: paymentRequest.amount.toString(),
        currency: paymentRequest.currency,
        recipientDetails: { paymentRequestId: id },
        status: "completed",
        fee: "0.00",
        description: `Payment for request: ${paymentRequest.message || 'Payment request'}`
      });

      // Mark payment request as paid
      await storage.updatePaymentRequest(id, { status: 'paid' });
      
      // Notify requester
      await notificationService.sendNotification({
        title: "Payment Received",
        body: `Your payment request for ${paymentRequest.currency} ${paymentRequest.amount} has been paid`,
        userId: paymentRequest.fromUserId,
        type: "transaction"
      });
      
      res.json({ transaction, message: "Payment completed successfully" });
    } catch (error) {
      console.error('Payment processing error:', error);
      res.status(500).json({ message: "Error processing payment" });
    }
  });

  app.put("/api/payment-requests/:id/:action", requireAuth, async (req, res) => {
    try {
      const { id, action } = req.params;
      const sessionUserId = (req as any).session?.userId;
      if (!sessionUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const paymentRequest = await storage.getPaymentRequest(id);
      if (!paymentRequest) {
        return res.status(404).json({ message: "Payment request not found" });
      }

      if (action === "cancel") {
        if (paymentRequest.fromUserId !== sessionUserId) {
          return res.status(403).json({ message: "Not authorized to cancel this request" });
        }
        const updated = await storage.updatePaymentRequest(id, { status: "cancelled" });
        return res.json({ paymentRequest: updated, message: "Payment request cancelled" });
      }

      const recipientMatches =
        paymentRequest.toUserId === sessionUserId ||
        (!paymentRequest.toUserId && (
          paymentRequest.toEmail === (await storage.getUser(sessionUserId))?.email ||
          paymentRequest.toPhone === (await storage.getUser(sessionUserId))?.phone
        ));

      if (!recipientMatches || !["accept", "decline"].includes(action)) {
        return res.status(403).json({ message: "Not authorized to perform this action" });
      }
      if (paymentRequest.status !== "pending") {
        return res.status(400).json({ message: "Payment request already processed" });
      }

      if (action === "decline") {
        const updated = await storage.updatePaymentRequest(id, { status: "declined" });
        return res.json({ paymentRequest: updated, message: "Payment request declined" });
      }

      const payer = await storage.getUser(sessionUserId);
      const requester = await storage.getUser(paymentRequest.fromUserId);
      if (!payer || !requester) {
        return res.status(404).json({ message: "User not found" });
      }
      if (payer.id === requester.id) {
        return res.status(400).json({ message: "You cannot pay your own payment request" });
      }

      const amount = Number(paymentRequest.amount);
      const currency = normalizeCurrency(paymentRequest.currency);
      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ message: "Invalid payment amount" });
      }

      let sendTransaction: Awaited<ReturnType<typeof storage.createTransaction>>;
      let receiveTransaction: Awaited<ReturnType<typeof storage.createTransaction>>;

      if (db && pool) {
        const payerWallet = await ensureUserWallet(payer.id, currency);
        const requesterWallet = await ensureUserWallet(requester.id, currency);
        if (!payerWallet || !requesterWallet) {
          return res.status(400).json({ message: `${currency} wallet is not available` });
        }

        const payerAvailable = walletAvailableBalance(payerWallet);
        if (payerAvailable < amount) {
          return res.status(400).json({ message: `Insufficient ${currency} balance` });
        }

        sendTransaction = await storage.createTransaction({
          userId: payer.id,
          type: "send",
          amount: amount.toFixed(2),
          currency,
          status: "completed",
          description: `Payment request to ${requester.fullName}`,
          recipientId: requester.id,
          fee: "0.00",
        });
        receiveTransaction = await storage.createTransaction({
          userId: requester.id,
          type: "receive",
          amount: amount.toFixed(2),
          currency,
          status: "completed",
          description: `Payment request paid by ${payer.fullName}`,
          recipientId: payer.id,
          fee: "0.00",
        });

        let debitApplied = false;
        try {
          const debit = await applyLedgerEntry({
            walletId: payerWallet.id,
            userId: payer.id,
            currency,
            amount: -amount,
            entryType: "payment_request",
            idempotencyKey: `payment-request:${id}:debit`,
            transactionId: sendTransaction.id,
            description: `Payment request to ${requester.fullName}`,
          });
          debitApplied = debit.applied;
          await applyLedgerEntry({
            walletId: requesterWallet.id,
            userId: requester.id,
            currency,
            amount,
            entryType: "payment_request",
            idempotencyKey: `payment-request:${id}:credit`,
            transactionId: receiveTransaction.id,
            description: `Payment request paid by ${payer.fullName}`,
          });
        } catch (ledgerError) {
          if (debitApplied) {
            await applyLedgerEntry({
              walletId: payerWallet.id,
              userId: payer.id,
              currency,
              amount,
              entryType: "payment_request_refund",
              idempotencyKey: `payment-request:${id}:debit-compensation`,
              transactionId: sendTransaction.id,
              description: "Compensation for incomplete payment request",
            }).catch((compensationError) => {
              console.error("Payment request compensation failed:", compensationError);
            });
          }
          await storage.updateTransaction(sendTransaction.id, {
            status: "failed",
            failureReason: ledgerError instanceof Error ? ledgerError.message : "Ledger settlement failed",
          });
          await storage.updateTransaction(receiveTransaction.id, {
            status: "failed",
            failureReason: ledgerError instanceof Error ? ledgerError.message : "Ledger settlement failed",
          });
          throw ledgerError;
        }
      } else {
        // MemStorage fallback for local/demo mode where wallets are not persisted.
        const payerBalance = Number(payer.balance || 0);
        if (payerBalance < amount) {
          return res.status(400).json({ message: `Insufficient ${currency} balance` });
        }
        sendTransaction = await storage.createTransaction({
          userId: payer.id,
          type: "send",
          amount: amount.toFixed(2),
          currency,
          status: "completed",
          description: `Payment request to ${requester.fullName}`,
          recipientId: requester.id,
          fee: "0.00",
        });
        receiveTransaction = await storage.createTransaction({
          userId: requester.id,
          type: "receive",
          amount: amount.toFixed(2),
          currency,
          status: "completed",
          description: `Payment request paid by ${payer.fullName}`,
          recipientId: payer.id,
          fee: "0.00",
        });
        await storage.updateUser(payer.id, { balance: (payerBalance - amount).toFixed(2) });
        await storage.updateUser(requester.id, {
          balance: (Number(requester.balance || 0) + amount).toFixed(2),
        });
      }

      const updated = await storage.updatePaymentRequest(id, { status: "paid" });
      await notificationService.sendNotification({
        title: "Payment Request Paid",
        body: `Your request for ${currency} ${amount.toFixed(2)} has been paid.`,
        userId: requester.id,
        type: "transaction",
        metadata: { paymentRequestId: id },
      });
      return res.json({ paymentRequest: updated, message: "Payment completed successfully" });
    } catch (error) {
      console.error("Payment request action error:", error);
      return res.status(500).json({ message: "Failed to process payment request" });
    }
  });

  // Get payment requests RECEIVED by user (not sent)
  app.get("/api/payment-requests-received", requireAuth, async (req, res) => {
    try {
      const sessionUserId = (req as any).session?.userId;
      
      if (!sessionUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = await storage.getUser(sessionUserId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const receivedRequests = await storage.getPaymentRequestsReceivedByUser(
        sessionUserId,
        user.email,
        user.phone,
      );
      
      res.json({ requests: receivedRequests });
    } catch (error) {
      console.error('Error fetching received payment requests:', error);
      res.status(500).json({ message: "Error fetching payment requests" });
    }
  });

  // Get unique receive payment link for user
  app.get("/api/receive-payment-link", requireAuth, async (req, res) => {
    try {
      const sessionUserId = (req as any).session?.userId;
      
      if (!sessionUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const user = await storage.getUser(sessionUserId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Generate unique receive link
      const receiveLink = `${req.protocol}://${req.get('host')}/pay-to/${sessionUserId}`;
      const qrValue = `greenpay://pay/${sessionUserId}`;
      
      res.json({ 
        receiveLink,
        qrValue,
        accountNumber: `GP-${sessionUserId.slice(-9)}`,
        accountName: user.fullName,
        bankName: "GreenPay Digital Bank"
      });
    } catch (error) {
      console.error('Error generating receive link:', error);
      res.status(500).json({ message: "Error generating receive link" });
    }
  });

  // Admin Authentication Routes
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password, twoFactorCode } = req.body;
      
      const admin = await storage.getAdminByEmail(email);
      if (!admin || !admin.isActive) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, admin.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check 2FA if enabled
      if (admin.twoFactorEnabled && admin.twoFactorSecret) {
        if (!twoFactorCode) {
          return res.status(401).json({ 
            message: "2FA code required", 
            requiresTwoFactor: true 
          });
        }

        const verified = speakeasy.totp.verify({
          secret: admin.twoFactorSecret,
          encoding: 'ascii',
          token: twoFactorCode,
          window: 2
        });

        if (!verified) {
          return res.status(401).json({ message: "Invalid 2FA code" });
        }
      }

      // Only after ALL authentication checks pass - regenerate session to prevent fixation
      req.session.regenerate((err) => {
        if (err) {
          console.error('Admin session regeneration error:', err);
          return res.status(500).json({ message: "Session error" });
        }

        // Update last login
        storage.updateAdmin(admin.id, { lastLoginAt: new Date() }).catch(updateErr => {
          console.error('Admin update error:', updateErr);
        });

        // Set admin session data only after successful authentication
        req.session.admin = {
          id: admin.id,
          email: admin.email,
          fullName: admin.fullName,
          role: admin.role,
          isActive: admin.isActive
        };

        // Log admin login
        storage.createAdminLog({
          adminId: admin.id,
          action: "LOGIN",
          ipAddress: req.ip,
          userAgent: req.get('User-Agent') || null
        }).catch(logErr => {
          console.error('Admin log error:', logErr);
        });

        // Save session before responding
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error('Admin session save error:', saveErr);
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
      console.error('Admin login error:', error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Check admin session
  app.get("/api/admin/session", (req, res) => {
    if (req.session?.admin?.id) {
      return res.json({ admin: req.session.admin });
    }
    res.status(401).json({ message: "Not authenticated" });
  });

  // Admin logout
  app.post("/api/admin/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get admin profile
  app.get("/api/admin/profile", requireAdminAuth, async (req, res) => {
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
      console.error('Error fetching admin profile:', error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Update admin profile
  app.put("/api/admin/profile", requireAdminAuth, async (req, res) => {
    try {
      const { email, currentPassword, newPassword } = req.body;
      const admin = req.session?.admin;
      
      if (!admin) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Get current admin from database
      const dbAdmin = await storage.getAdminById(admin.id);
      if (!dbAdmin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      // If changing password, verify current password
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ message: "Current password required to set new password" });
        }
        
        const isPasswordValid = await bcrypt.compare(currentPassword, dbAdmin.password);
        if (!isPasswordValid) {
          return res.status(401).json({ message: "Current password is incorrect" });
        }

        if (newPassword.length < 8) {
          return res.status(400).json({ message: "New password must be at least 8 characters" });
        }
      }

      // Update admin
      const updates: any = {};
      if (email && email !== dbAdmin.email) {
        const existingAdmin = await storage.getAdminByEmail(email);
        if (existingAdmin && existingAdmin.id !== admin.id) {
          return res.status(409).json({ message: "Email already in use" });
        }
        updates.email = email;
      }

      if (newPassword) {
        updates.password = await bcrypt.hash(newPassword, 10);
      }

      if (Object.keys(updates).length === 0) {
        return res.json({ message: "No changes made" });
      }

      // Update in database
      const updatedAdmin = await storage.updateAdmin(admin.id, updates);
      
      // Update session
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
      console.error('Error updating admin profile:', error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Create new admin (only existing admins can do this)
  app.post("/api/admin/create-admin", requireAdminAuth, async (req, res) => {
    try {
      const { email, password, fullName, role } = req.body;
      
      if (!email || !password || !fullName) {
        return res.status(400).json({ message: "Email, password, and fullName are required" });
      }

      const existingAdmin = await storage.getAdminByEmail(email);
      if (existingAdmin) {
        return res.status(409).json({ message: "Admin with this email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newAdmin = await storage.createAdmin({
        email,
        password: hashedPassword,
        fullName,
        role: role || "admin",
      });

      storage.createAdminLog({
        adminId: (req.session as any).admin.id,
        action: "CREATE_ADMIN",
        details: `Created admin: ${email}`,
        ipAddress: req.ip,
      }).catch(err => console.error('Admin log error:', err));

      res.json({ admin: newAdmin, message: "Admin created successfully" });
    } catch (error) {
      console.error('Create admin error:', error);
      res.status(500).json({ message: "Failed to create admin" });
    }
  });

  // Admin Dashboard Data
  app.get("/api/admin/dashboard", async (req, res) => {
    try {
      const [
        usersCount,
        transactionsCount,
        { volume, revenue },
        allUsers,
        allTransactions,
        kycDocuments
      ] = await Promise.all([
        storage.getUsersCount(),
        storage.getTransactionsCount(),
        storage.getTotalVolume(),
        storage.getAllUsers(),
        storage.getAllTransactions(),
        storage.getAllKycDocuments()
      ]);

      const activeUsers = allUsers.filter(u => u.isEmailVerified || u.isPhoneVerified).length;
      const pendingKyc = kycDocuments.filter(d => d.status === 'pending').length;
      const completedTransactions = allTransactions.filter(t => t.status === 'completed').length;
      const pendingTransactions = allTransactions.filter(t => t.status === 'pending').length;

      // Calculate daily transaction trends (last 7 days)
      const today = new Date();
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const transactionTrends = last7Days.map(date => {
        const dayTransactions = allTransactions.filter(t => 
          t.createdAt && t.createdAt.toISOString().split('T')[0] === date
        );
        return {
          date,
          count: dayTransactions.length,
          volume: dayTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0)
        };
      });

      res.json({
        metrics: {
          totalUsers: usersCount,
          activeUsers,
          blockedUsers: allUsers.filter(u => !u.isEmailVerified && !u.isPhoneVerified).length,
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
      console.error('Dashboard data error:', error);
      res.status(500).json({ message: "Failed to load dashboard data" });
    }
  });

  // Admin User Management
  app.get("/api/admin/users", async (req, res) => {
    try {
      const { page = 1, limit = 20, status, search } = req.query;
      let users = await storage.getAllUsers();

      // Filter by status
      if (status) {
        users = users.filter(user => {
          switch (status) {
            case 'active': return user.isEmailVerified || user.isPhoneVerified;
            case 'pending': return user.kycStatus === 'pending';
            case 'verified': return user.kycStatus === 'verified';
            case 'blocked': return !user.isEmailVerified && !user.isPhoneVerified;
            default: return true;
          }
        });
      }

      // Search filter
      if (search) {
        const searchTerm = search.toString().toLowerCase();
        users = users.filter(user => 
          user.fullName.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm) ||
          user.phone.includes(searchTerm)
        );
      }

      // Pagination
      const startIndex = (Number(page) - 1) * Number(limit);
      const paginatedUsers = users.slice(startIndex, startIndex + Number(limit));
      const usersWithLedgerBalances = await Promise.all(paginatedUsers.map(async user => {
        const userWallets = await db.select().from(wallets).where(eq(wallets.userId, user.id));
        const balances: Record<string, number> = {};
        for (const wallet of userWallets) {
          const ledgerBalance = await getLedgerBalance({ walletId: wallet.id }, Number(wallet.balance || 0));
          balances[normalizeCurrency(wallet.currency)] = walletAvailableBalance({
            ...wallet,
            balance: ledgerBalance.toString(),
          });
        }
        return {
          ...user,
          balance: (balances.USD ?? Number(user.balance || 0)).toFixed(2),
          kesBalance: (balances.KES ?? Number((user as any).kesBalance || 0)).toFixed(2),
        };
      }));

      res.json({
        users: usersWithLedgerBalances,
        total: users.length,
        page: Number(page),
        totalPages: Math.ceil(users.length / Number(limit))
      });
    } catch (error) {
      console.error('Users fetch error:', error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Admin KYC Management
  app.get("/api/admin/kyc", async (req, res) => {
    try {
      const kycDocuments = await storage.getAllKycDocuments();
      res.json({ kycDocuments });
    } catch (error) {
      console.error('KYC fetch error:', error);
      res.status(500).json({ message: "Failed to fetch KYC documents" });
    }
  });

  app.put("/api/admin/kyc/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, verificationNotes } = req.body;

      // 're_verification_requested' resets the user so they can redo Didit flow
      const isReVerify = status === 're_verification_requested';
      const docStatus = isReVerify ? 're_verification_requested' : status;
      const userKycStatus = isReVerify ? 'not_submitted' : status;

      // ── Duplicate ID check when manually approving ──────────────────────────
      if (status === 'verified') {
        const kycDoc = await storage.getKycByUserId(
          (await db.select({ userId: kycDocuments.userId }).from(kycDocuments).where(eq(kycDocuments.id, id)))[0]?.userId
        );
        const decision = (kycDoc as any)?.diditDecision;
        const idNumber = decision?.features?.document?.document_number || null;
        if (idNumber) {
          const existing = await db.select({ id: users.id }).from(users)
            .where(eq(users.kycIdNumber, idNumber));
          const conflict = existing.find(u => u.id !== kycDoc?.userId);
          if (conflict) {
            return res.status(409).json({ message: `This ID document (${idNumber}) is already linked to another account. Verification blocked to prevent duplicate accounts.` });
          }
        }
      }

      const updatedKyc = await storage.updateKycDocument(id, {
        status: docStatus,
        verificationNotes,
        verifiedAt: status === 'verified' ? new Date() : null,
        // Clear didit session so a fresh one is created on retry
        ...(isReVerify ? { diditSessionId: null, diditStatus: null } as any : {}),
      });

      if (updatedKyc) {
        // Auto-populate KYC identity fields on user when verified
        if (status === 'verified') {
          const decision = (updatedKyc as any).diditDecision;
          const doc = decision?.features?.document || {};
          const kycFields = {
            kycFullName: [doc.first_name, doc.last_name].filter(Boolean).join(' ') || null,
            kycDateOfBirth: doc.date_of_birth || null,
            kycIdNumber: doc.document_number || null,
            kycNationality: doc.nationality || null,
            kycGender: doc.gender || null,
            kycAddress: doc.address || null,
            kycDocumentType: doc.document_type || null,
            kycIdExpiryDate: doc.expiry_date || null,
            kycIssuingCountry: doc.issuing_country || null,
          };
          // Only write fields that have actual values
          const filteredKycFields = Object.fromEntries(Object.entries(kycFields).filter(([, v]) => v != null));
          if (Object.keys(filteredKycFields).length > 0) {
            await storage.updateUser(updatedKyc.userId, filteredKycFields as any);
          }
        }

        // Update user KYC status
        await storage.updateUser(updatedKyc.userId, { kycStatus: userKycStatus });

        // Notify user
        const user = await storage.getUser(updatedKyc.userId);
        if (user) {
          if (status === 'verified') {
            const { messagingService } = await import('./services/messaging');
            const { mailtrapService } = await import('./services/mailtrap');
            Promise.all([
              messagingService.sendKYCVerified(user.phone),
              user.email ? mailtrapService.sendKYCVerified(
                user.email,
                user.fullName?.split(' ')[0] || 'User',
                user.fullName?.split(' ').slice(1).join(' ') || ''
              ) : Promise.resolve(false)
            ]).catch(err => console.error('KYC notification error:', err));
          }

          // In-app notification
          const notifMsg = isReVerify
            ? 'Admin has requested you to re-verify your identity. Please complete a new verification.'
            : status === 'verified'
            ? 'Your identity has been verified. You now have full access to all features.'
            : status === 'rejected'
            ? `Your KYC verification was rejected. ${verificationNotes ? 'Reason: ' + verificationNotes : 'Please try again.'}`
            : 'Your KYC status has been updated.';

          await storage.createNotification({
            userId: updatedKyc.userId,
            title: isReVerify ? 'Re-verification Required' : status === 'verified' ? 'KYC Verified ✅' : status === 'rejected' ? 'KYC Rejected ❌' : 'KYC Update',
            message: notifMsg,
            type: isReVerify ? 'warning' : status === 'verified' ? 'success' : status === 'rejected' ? 'error' : 'info',
            isGlobal: false,
          } as any);
        }
      }

      res.json({ kyc: updatedKyc });
    } catch (error) {
      console.error('KYC update error:', error);
      res.status(500).json({ message: "Failed to update KYC" });
    }
  });

  // Admin: manually poll Didit for the latest decision on a KYC document
  app.post("/api/admin/kyc/:id/poll-didit", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;

      // Fetch the KYC document
      const [kyc] = await db.select().from(kycDocuments).where(eq(kycDocuments.id, id));
      if (!kyc) return res.status(404).json({ message: "KYC document not found" });

      const sessionId = (kyc as any).diditSessionId;
      if (!sessionId) {
        return res.status(400).json({ message: "No Didit session attached to this document" });
      }

      const { getSessionDecision, mapDiditStatusToKyc, isTerminalStatus } = await import('./services/didit');
      const decision = await getSessionDecision(sessionId);

      if (!decision) {
        return res.status(502).json({ message: "Failed to fetch decision from Didit" });
      }

      const diditStatus = decision.status;
      const kycStatus = mapDiditStatusToKyc(diditStatus);

      // Extract structured data from Didit decision features
      const docFeatures = (decision as any).features?.document || {};
      const extractedData = {
        firstName: docFeatures.first_name || null,
        lastName: docFeatures.last_name || null,
        fullName: [docFeatures.first_name, docFeatures.last_name].filter(Boolean).join(' ') || null,
        dateOfBirth: docFeatures.date_of_birth || null,
        idNumber: docFeatures.document_number || null,
        documentType: docFeatures.document_type || null,
        nationality: docFeatures.nationality || null,
        gender: docFeatures.gender || null,
        expiryDate: docFeatures.expiry_date || null,
        address: docFeatures.address || null,
        issuingCountry: docFeatures.issuing_country || null,
      };

      // Duplicate ID check before approving via poll
      if (kycStatus === 'verified' && extractedData.idNumber) {
        const existing = await db.select({ id: users.id }).from(users).where(eq(users.kycIdNumber, extractedData.idNumber));
        if (existing.some(u => u.id !== kyc.userId)) {
          return res.status(409).json({ message: `This ID document (${extractedData.idNumber}) is already linked to another account. Verification blocked.` });
        }
      }

      // Update the kyc_documents record
      await storage.updateKycDocument(id, {
        diditStatus,
        status: kycStatus,
        diditDecision: decision as any,
        verifiedAt: kycStatus === 'verified' ? new Date() : undefined,
      } as any);

      // Update user status
      await storage.updateUser(kyc.userId, { kycStatus });

      // Auto-populate KYC identity fields when verified via poll
      if (kycStatus === 'verified') {
        const kycFields = {
          kycFullName: extractedData.fullName || null,
          kycDateOfBirth: extractedData.dateOfBirth || null,
          kycIdNumber: extractedData.idNumber || null,
          kycNationality: extractedData.nationality || null,
          kycGender: extractedData.gender || null,
          kycAddress: extractedData.address || null,
          kycDocumentType: extractedData.documentType || null,
          kycIdExpiryDate: extractedData.expiryDate || null,
          kycIssuingCountry: extractedData.issuingCountry || null,
        };
        const filtered = Object.fromEntries(Object.entries(kycFields).filter(([, v]) => v != null));
        if (Object.keys(filtered).length > 0) await storage.updateUser(kyc.userId, filtered as any);
      }

      // Send notifications on terminal statuses
      if (isTerminalStatus(diditStatus)) {
        const user = await storage.getUser(kyc.userId);
        if (user) {
          const { messagingService } = await import('./services/messaging');
          const { mailtrapService } = await import('./services/mailtrap');
          if (kycStatus === 'verified') {
            Promise.all([
              messagingService.sendKYCVerified(user.phone),
              user.email ? mailtrapService.sendKYCVerified(user.email, user.fullName?.split(' ')[0] || 'User', '') : Promise.resolve(),
            ]).catch(err => console.error('[Didit] Notification error:', err));
          }
          await storage.createNotification({
            userId: kyc.userId,
            title: kycStatus === 'verified' ? 'KYC Verified ✅' : 'KYC Update',
            message: kycStatus === 'verified'
              ? 'Your identity has been verified. You now have full access to all features.'
              : kycStatus === 'rejected'
              ? 'Your KYC verification was not successful. Please try again.'
              : 'Your KYC is under review.',
            type: kycStatus === 'verified' ? 'success' : kycStatus === 'rejected' ? 'error' : 'info',
            isGlobal: false,
          } as any);
        }
      }

      res.json({
        diditStatus,
        kycStatus,
        decision,
        extractedData,
        sessionId,
      });
    } catch (error) {
      console.error('[Admin] Poll Didit error:', error);
      res.status(500).json({ message: "Failed to poll Didit" });
    }
  });

  // ── Advanced KYC (user-facing) ────────────────────────────────────────────
  app.post("/api/kyc/advanced/submit", requireAuth, upload.fields([
    { name: 'facialPhoto', maxCount: 1 },
    { name: 'addressProof', maxCount: 1 },
  ]), async (req, res) => {
    try {
      const sessionUserId = (req as any).session?.userId;
      if (!sessionUserId) return res.status(401).json({ message: "Unauthorized" });

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const { addressProofType, fullAddress, city, postalCode, country } = req.body;

      if (!files?.facialPhoto || !files?.addressProof) {
        return res.status(400).json({ message: "Facial photo and address proof are required" });
      }
      if (!addressProofType || !fullAddress) {
        return res.status(400).json({ message: "Address proof type and full address are required" });
      }

      // Check existing advanced KYC
      const { advancedKycDocuments: advKycTable } = await import("@shared/schema");
      const existing = await db.select().from(advKycTable).where(eq(advKycTable.userId, sessionUserId));
      if (existing.length > 0 && existing[0].status === 'pending') {
        return res.status(409).json({ message: "Your advanced KYC is currently under review" });
      }
      if (existing.length > 0 && existing[0].status === 'verified') {
        return res.status(409).json({ message: "Your advanced KYC is already verified" });
      }

      let facialPhotoUrl: string | null = null;
      let addressProofUrl: string | null = null;

      try {
        [facialPhotoUrl, addressProofUrl] = await Promise.all([
          cloudinaryStorage.uploadKycDocument(files.facialPhoto[0].buffer, files.facialPhoto[0].originalname, files.facialPhoto[0].mimetype),
          cloudinaryStorage.uploadKycDocument(files.addressProof[0].buffer, files.addressProof[0].originalname, files.addressProof[0].mimetype),
        ]);
      } catch (uploadErr) {
        // Fallback to base64 if cloudinary not configured
        const buf1 = files.facialPhoto[0].buffer;
        facialPhotoUrl = `data:${files.facialPhoto[0].mimetype};base64,${buf1.toString('base64')}`;
        const buf2 = files.addressProof[0].buffer;
        addressProofUrl = `data:${files.addressProof[0].mimetype};base64,${buf2.toString('base64')}`;
      }

      if (existing.length > 0) {
        // Update rejected submission
        await db.update(advKycTable).set({
          facialPhotoUrl, addressProofUrl, addressProofType, fullAddress, city, postalCode, country,
          status: 'pending', verificationNotes: null, verifiedAt: null, updatedAt: new Date(),
        }).where(eq(advKycTable.userId, sessionUserId));
      } else {
        await db.insert(advKycTable).values({
          userId: sessionUserId, facialPhotoUrl, addressProofUrl, addressProofType, fullAddress, city, postalCode, country,
        });
      }

      await storage.updateUser(sessionUserId, { advancedKycStatus: 'pending' } as any);

      res.json({ success: true, message: "Advanced KYC submitted successfully" });
    } catch (e: any) {
      console.error('Advanced KYC submit error:', e);
      res.status(500).json({ message: "Failed to submit advanced KYC" });
    }
  });

  app.get("/api/kyc/advanced", requireAuth, async (req, res) => {
    try {
      const sessionUserId = (req as any).session?.userId;
      if (!sessionUserId) return res.status(401).json({ message: "Unauthorized" });
      const { advancedKycDocuments: advKycTable } = await import("@shared/schema");
      const docs = await db.select().from(advKycTable).where(eq(advKycTable.userId, sessionUserId));
      res.json({ advancedKyc: docs[0] || null });
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch advanced KYC" });
    }
  });

  // ── Admin Advanced KYC ────────────────────────────────────────────────────
  app.get("/api/admin/kyc/advanced", requireAdminAuth, async (req, res) => {
    try {
      const { advancedKycDocuments: advKycTable } = await import("@shared/schema");
      const docs = await db.select().from(advKycTable).orderBy(advKycTable.createdAt);
      res.json({ advancedKycDocuments: docs });
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch advanced KYC documents" });
    }
  });

  app.put("/api/admin/kyc/advanced/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, verificationNotes } = req.body;
      const { advancedKycDocuments: advKycTable } = await import("@shared/schema");
      const [updated] = await db.update(advKycTable).set({
        status, verificationNotes,
        verifiedAt: status === 'verified' ? new Date() : null,
        updatedAt: new Date(),
      }).where(eq(advKycTable.id, id)).returning();

      if (updated) {
        await storage.updateUser(updated.userId, { advancedKycStatus: status } as any);
      }

      res.json({ advancedKyc: updated });
    } catch (e) {
      res.status(500).json({ message: "Failed to update advanced KYC" });
    }
  });

  // Admin Transaction Management
  app.get("/api/admin/transactions", async (req, res) => {
    try {
      const { page = 1, limit = 20, status, type } = req.query;
      let transactions = await storage.getAllTransactions();

      // Filters
      if (status) {
        transactions = transactions.filter(t => t.status === status);
      }
      if (type) {
        transactions = transactions.filter(t => t.type === type);
      }

      // Pagination
      const startIndex = (Number(page) - 1) * Number(limit);
      const paginatedTransactions = transactions.slice(startIndex, startIndex + Number(limit));

      res.json({
        transactions: paginatedTransactions,
        total: transactions.length,
        page: Number(page),
        totalPages: Math.ceil(transactions.length / Number(limit))
      });
    } catch (error) {
      console.error('Transactions fetch error:', error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Admin Virtual Cards Management
  app.get("/api/admin/virtual-cards", async (req, res) => {
    try {
      const search = ((req.query.search as string) || "").toLowerCase().trim();
      const allCards = await storage.getAllVirtualCards();

      // Enrich each card with owner user info
      const enriched = await Promise.all(
        allCards.map(async (card) => {
          const user = await storage.getUser(card.userId);
          const balance = await getLedgerBalance({ cardId: card.id }, Number(card.balance || 0));
          return {
            ...card,
            balance: balance.toString(),
            availableBalance: balance.toString(),
            userName: user?.fullName || "Unknown",
            userEmail: user?.email || "",
            userPhone: user?.phone || "",
          };
        })
      );

      const cards = search
        ? enriched.filter(
            (c) =>
              c.cardHolderName.toLowerCase().includes(search) ||
              c.cardNumber.toLowerCase().includes(search) ||
              c.userName.toLowerCase().includes(search) ||
              c.userEmail.toLowerCase().includes(search) ||
              c.userPhone.toLowerCase().includes(search) ||
              c.userId.toLowerCase().includes(search)
          )
        : enriched;

      res.json({ cards });
    } catch (error) {
      console.error('Virtual cards fetch error:', error);
      res.status(500).json({ message: "Failed to fetch virtual cards" });
    }
  });

  // Admin Logs
  app.get("/api/admin/logs", async (req, res) => {
    try {
      const logs = await storage.getAdminLogs();
      res.json({ logs });
    } catch (error) {
      console.error('Admin logs fetch error:', error);
      res.status(500).json({ message: "Failed to fetch admin logs" });
    }
  });

  // Admin User Actions
  // Admin edit user profile (name, email, phone, country)
  app.put("/api/admin/users/:id/profile", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      if (!user) return res.status(404).json({ message: "User not found" });

      const { fullName, email, phone, country,
              kycFullName, kycDateOfBirth, kycIdNumber, kycNationality,
              kycGender, kycAddress, kycDocumentType, kycIdExpiryDate, kycIssuingCountry } = req.body;

      const updates: Record<string, any> = {};
      if (fullName !== undefined) updates.fullName = fullName.trim();
      if (email !== undefined) updates.email = email.trim().toLowerCase();
      if (phone !== undefined) updates.phone = phone.trim();
      if (country !== undefined) updates.country = country.trim();
      // Admin-editable KYC identity fields
      if (kycFullName       !== undefined) updates.kycFullName       = kycFullName?.trim()       || null;
      if (kycDateOfBirth    !== undefined) updates.kycDateOfBirth    = kycDateOfBirth?.trim()    || null;
      if (kycIdNumber       !== undefined) updates.kycIdNumber       = kycIdNumber?.trim()       || null;
      if (kycNationality    !== undefined) updates.kycNationality    = kycNationality?.trim()    || null;
      if (kycGender         !== undefined) updates.kycGender         = kycGender?.trim()         || null;
      if (kycAddress        !== undefined) updates.kycAddress        = kycAddress?.trim()        || null;
      if (kycDocumentType   !== undefined) updates.kycDocumentType   = kycDocumentType?.trim()   || null;
      if (kycIdExpiryDate   !== undefined) updates.kycIdExpiryDate   = kycIdExpiryDate?.trim()   || null;
      if (kycIssuingCountry !== undefined) updates.kycIssuingCountry = kycIssuingCountry?.trim() || null;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "No fields to update" });
      }

      const updatedUser = await storage.updateUser(id, updates);
      await storage.createAdminLog({
        adminId: (req as any).session?.admin?.id || null,
        action: "user_profile_updated",
        details: `Admin updated profile for user ${user.email}: ${Object.keys(updates).join(", ")}`,
        targetId: id,
      });

      res.json({ user: updatedUser, message: "Profile updated successfully" });
    } catch (error) {
      console.error("Update user profile error:", error);
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });

  app.put("/api/admin/users/:id/block", async (req, res) => {
    try {
      const { id } = req.params;
      
      await storage.updateUser(id, {
        isEmailVerified: false,
        isPhoneVerified: false
      });

      res.json({ message: "User blocked successfully" });
    } catch (error) {
      console.error('Block user error:', error);
      res.status(500).json({ message: "Failed to block user" });
    }
  });

  app.put("/api/admin/users/:id/unblock", async (req, res) => {
    try {
      const { id } = req.params;
      
      await storage.updateUser(id, {
        isEmailVerified: true,
        isPhoneVerified: true
      });

      res.json({ message: "User unblocked successfully" });
    } catch (error) {
      console.error('Unblock user error:', error);
      res.status(500).json({ message: "Failed to unblock user" });
    }
  });

  // Admin: Request Advanced KYC from a user
  app.post("/api/admin/users/:id/request-advanced-kyc", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      if (!user) return res.status(404).json({ message: "User not found" });
      await storage.updateUser(id, { advancedKycRequested: true } as any);
      res.json({ message: "Advanced KYC requested successfully" });
    } catch (error) {
      console.error("Request advanced KYC error:", error);
      res.status(500).json({ message: "Failed to request advanced KYC" });
    }
  });

  // Admin: Cancel Advanced KYC request
  app.post("/api/admin/users/:id/cancel-advanced-kyc-request", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      if (!user) return res.status(404).json({ message: "User not found" });
      await storage.updateUser(id, { advancedKycRequested: false } as any);
      res.json({ message: "Advanced KYC request cancelled" });
    } catch (error) {
      console.error("Cancel advanced KYC request error:", error);
      res.status(500).json({ message: "Failed to cancel request" });
    }
  });

  // Admin User Account Management
  app.put("/api/admin/users/:id/account", async (req, res) => {
    try {
      const { id } = req.params;
      const { action } = req.body;

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let updateData: any = {};
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
          updateData = { isSuspended: true, suspendedAt: new Date(), suspensionReason: reason || "Account suspended by administrator" };
          logMessage = `Admin suspended user account: ${user.email}. Reason: ${reason || "No reason provided"}`;
          break;
        }
        case "unsuspend":
          // Use direct SQL to guarantee all suspension fields are cleared atomically
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
          const hashedDefault = await bcrypt.hash(defaultPassword, 10);
          updateData = { password: hashedDefault };
          logMessage = `Admin reset password to default for user: ${user.email}`;
          break;
        }
        case "change_password": {
          const { newPassword } = req.body;
          if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
          }
          const hashedNew = await bcrypt.hash(newPassword, 10);
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

      // Log admin action
      await storage.createAdminLog({
        adminId: req.session.admin?.id || null,
        action: `user_account_${action}`,
        details: logMessage,
        targetId: id,
      });

      // Fetch and return updated user
      const updatedUser = await storage.getUser(id);
      const { password, ...userWithoutPassword } = updatedUser as any;

      res.json({ 
        message: "Account action completed successfully",
        user: userWithoutPassword
      });
    } catch (error) {
      console.error('Admin account action error:', error);
      res.status(500).json({ message: "Failed to perform account action" });
    }
  });

  // Admin User Security Management
  app.put("/api/admin/users/:id/security", async (req, res) => {
    try {
      const { id } = req.params;
      const { action } = req.body;

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let updateData: any = {};
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

      // Log admin action
      await storage.createAdminLog({
        adminId: req.session.admin?.id || null,
        action: `user_security_${action}`,
        details: logMessage,
        targetId: id,
      });

      res.json({ message: "Security action completed successfully" });
    } catch (error) {
      console.error('Admin security action error:', error);
      res.status(500).json({ message: "Failed to perform security action" });
    }
  });

  // Admin User Notification Settings
  app.put("/api/admin/users/:id/notifications", async (req, res) => {
    try {
      const { id } = req.params;
      const { action } = req.body;

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let updateData: any = {};
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

      // Log admin action
      await storage.createAdminLog({
        adminId: req.session.admin?.id || null,
        action: `user_notifications_${action}`,
        details: logMessage,
        targetId: id,
      });

      res.json({ message: "Notification settings updated successfully" });
    } catch (error) {
      console.error('Admin notification action error:', error);
      res.status(500).json({ message: "Failed to update notification settings" });
    }
  });

  // Admin: Get user-specific transactions
  app.get("/api/admin/users/:id/transactions", async (req, res) => {
    try {
      const { id } = req.params;
      const transactions = await storage.getTransactionsByUserId(id);
      res.json({ transactions });
    } catch (error) {
      console.error('Admin user transactions error:', error);
      res.status(500).json({ message: "Failed to fetch user transactions" });
    }
  });

  // Admin: Get user's crypto transactions
  app.get("/api/admin/users/:id/crypto-transactions", async (req, res) => {
    try {
      const { id } = req.params;
      const txns = await db.select().from(cryptoTransactions)
        .where(eq(cryptoTransactions.userId, id))
        .orderBy(desc(cryptoTransactions.createdAt));
      res.json({ transactions: txns });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch crypto transactions" });
    }
  });

  // Admin: Full edit of a regular transaction
  app.put("/api/admin/transactions/:id/edit", async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, currency, type, description, status, createdAt, fee } = req.body;
      const existing = await storage.getTransaction(id);
      if (!existing) return res.status(404).json({ message: "Transaction not found" });

      const updates: any = {};
      if (amount !== undefined) updates.amount = String(amount);
      if (currency !== undefined) updates.currency = currency;
      if (type !== undefined) updates.type = type;
      if (description !== undefined) updates.description = description;
      if (fee !== undefined) updates.fee = String(fee);
      if (status !== undefined) updates.status = status;
      if (createdAt !== undefined) updates.createdAt = new Date(createdAt);
      updates.updatedAt = new Date();

      const updated = await storage.updateTransaction(id, updates);
      res.json({ transaction: updated, message: "Transaction updated" });
    } catch (error) {
      console.error('Admin edit transaction error:', error);
      res.status(500).json({ message: "Failed to update transaction" });
    }
  });

  // Admin: Delete a regular transaction
  app.delete("/api/admin/transactions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const existing = await storage.getTransaction(id);
      if (!existing) return res.status(404).json({ message: "Transaction not found" });
      await db.delete(transactions).where(eq(transactions.id, id));
      res.json({ message: "Transaction deleted" });
    } catch (error) {
      console.error('Admin delete transaction error:', error);
      res.status(500).json({ message: "Failed to delete transaction" });
    }
  });

  // Admin: Full edit of a crypto transaction
  app.put("/api/admin/crypto/transactions/:id/edit", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, txHash, adminNotes, amount, usdValue, coin, network, createdAt } = req.body;
      const updateData: any = { updatedAt: new Date() };
      if (status !== undefined) updateData.status = status;
      if (txHash !== undefined) updateData.txHash = txHash;
      if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
      if (amount !== undefined) updateData.amount = String(amount);
      if (usdValue !== undefined) updateData.usdValue = String(usdValue);
      if (coin !== undefined) updateData.coin = coin;
      if (network !== undefined) updateData.network = network;
      if (createdAt !== undefined) updateData.createdAt = new Date(createdAt);
      if (status === "completed") updateData.completedAt = new Date();

      await db.update(cryptoTransactions).set(updateData)
        .where(eq(cryptoTransactions.id, id));
      const [updated] = await db.select().from(cryptoTransactions)
        .where(eq(cryptoTransactions.id, id));
      res.json({ transaction: updated, message: "Crypto transaction updated" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update crypto transaction" });
    }
  });

  // Admin: Delete a crypto transaction
  app.delete("/api/admin/crypto/transactions/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(cryptoTransactions).where(eq(cryptoTransactions.id, id));
      res.json({ message: "Crypto transaction deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete crypto transaction" });
    }
  });

  // Admin: Update a specific transaction status
  app.put("/api/admin/transactions/:txId/status", async (req, res) => {
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

      // Refund logic: if admin moves a deduction-type tx to failed/cancelled and
      // it was previously pending/processing/completed (i.e. balance had been deducted),
      // credit the user back.
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
            await applyLedgerEntry({
              walletId: refundWallet.id,
              userId: before.userId,
              currency: refundCurrency,
              amount: refundAmount,
              entryType: "admin_transaction_refund",
              idempotencyKey: `admin-refund:${before.id}`,
              transactionId: before.id,
              description: `Refund for ${before.type}`,
            });
          }
          console.log(`✅ Refunded ${before.currency} ${refundAmount} to user ${user.email} (admin marked ${status})`);

          try {
            await notificationService.sendNotification({
              title: status === "cancelled" ? "Transaction Cancelled & Refunded" : "Transaction Failed & Refunded",
              body: `Your ${before.type} of ${before.currency} ${refundAmount} was marked as ${status}. The amount has been refunded to your wallet.`,
              userId: before.userId,
              type: "transaction",
            });
          } catch {}
        }
      }

      res.json({ transaction: updated });
    } catch (error) {
      console.error('Admin update transaction status error:', error);
      res.status(500).json({ message: "Failed to update transaction status" });
    }
  });

  // Admin: Get user card details
  app.get("/api/admin/users/:id/card", async (req, res) => {
    try {
      const { id } = req.params;
      const card = await storage.getVirtualCardByUserId(id);
      res.json({ card: card || null });
    } catch (error) {
      console.error('Admin user card error:', error);
      res.status(500).json({ message: "Failed to fetch user card" });
    }
  });

  // Export User Data
  app.get("/api/admin/users/:id/export", async (req, res) => {
    try {
      const { id } = req.params;

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get all related data
      const kyc = await storage.getKycByUserId(id);
      const virtualCard = await storage.getVirtualCardByUserId(id);
      const transactions = await storage.getTransactionsByUserId(id);
      const recipients = await storage.getRecipientsByUserId(id);
      const paymentRequests = await storage.getPaymentRequestsByUserId(id);

      // Create export data object (excluding sensitive information)
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
          createdAt: user.createdAt,
        },
        kyc: kyc ? {
          status: kyc.status,
          documentType: kyc.documentType,
          verifiedAt: kyc.verifiedAt,
          createdAt: kyc.createdAt,
        } : null,
        virtualCard: virtualCard ? {
          status: virtualCard.status,
          balance: virtualCard.balance,
          purchaseAmount: virtualCard.purchaseAmount,
          purchaseDate: virtualCard.purchaseDate,
        } : null,
        transactions: transactions.map(tx => ({
          id: tx.id,
          type: tx.type,
          amount: tx.amount,
          currency: tx.currency,
          status: tx.status,
          description: tx.description,
          createdAt: tx.createdAt,
        })),
        recipients: recipients.map(recipient => ({
          id: recipient.id,
          name: recipient.name,
          country: recipient.country,
          currency: recipient.currency,
          recipientType: recipient.recipientType,
          createdAt: recipient.createdAt,
        })),
        paymentRequests: paymentRequests.map(req => ({
          id: req.id,
          amount: req.amount,
          currency: req.currency,
          status: req.status,
          createdAt: req.createdAt,
        })),
        exportedAt: new Date().toISOString(),
      };

      // Log admin action
      await storage.createAdminLog({
        adminId: req.session.admin?.id || null,
        action: "user_data_export",
        details: `Admin exported data for user: ${user.email}`,
        targetId: id,
      });

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="user-data-${id}.json"`);
      res.send(JSON.stringify(exportData, null, 2));
    } catch (error) {
      console.error('User data export error:', error);
      res.status(500).json({ message: "Failed to export user data" });
    }
  });

  // Send Custom Notification to User
  app.post("/api/admin/users/:id/notification", async (req, res) => {
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

      // Create notification
      const notification = await storage.createNotification({
        title,
        message,
        type,
        userId: id,
        isGlobal: false,
      });

      // Log admin action
      await storage.createAdminLog({
        adminId: req.session.admin?.id || null,
        action: "send_custom_notification",
        details: `Admin sent custom notification to user: ${user.email} - Title: ${title}`,
        targetId: id,
      });

      res.json({ 
        message: "Notification sent successfully",
        notification: {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
        }
      });
    } catch (error) {
      console.error('Send custom notification error:', error);
      res.status(500).json({ message: "Failed to send notification" });
    }
  });

  // Support Ticket API endpoints
  
  // Submit support ticket (user facing)
  app.post("/api/support/tickets", upload.single('file'), async (req, res) => {
    try {
      const userId = (req.session as any)?.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { issueType, description } = req.body;
      if (!issueType || !description) {
        return res.status(400).json({ message: "Issue type and description required" });
      }

      let fileUrl = undefined;
      let fileName = undefined;
      if (req.file) {
        try {
          fileUrl = await cloudinaryStorage.uploadFile(
            `support-tickets/${userId}/${Date.now()}-${req.file.originalname}`,
            req.file.buffer,
            req.file.mimetype
          );
          fileName = req.file.originalname;
        } catch (error) {
          console.error('Error uploading support ticket file:', error);
          return res.status(400).json({ message: "File upload failed" });
        }
      }

      const ticket = await storage.createSupportTicket({
        issueType,
        description,
        userId,
        status: 'open',
        priority: 'normal',
        fileUrl,
        fileName,
      });

      res.json({ 
        message: "Support ticket submitted successfully",
        ticket: {
          id: ticket.id,
          issueType: ticket.issueType,
          status: ticket.status,
          createdAt: ticket.createdAt,
        }
      });
    } catch (error) {
      console.error('Submit support ticket error:', error);
      res.status(500).json({ message: "Failed to submit support ticket" });
    }
  });

  // Get user's support tickets (NEW user API)
  app.get("/api/user/support-tickets", async (req, res) => {
    try {
      const userId = (req.session as any)?.user?.id;
      
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
            // Replies table might not exist yet
            return { ...ticket, replies: [] };
          }
        })
      );
      res.json({ tickets: ticketsWithReplies });
    } catch (error) {
      console.error('Get user tickets error:', error);
      res.status(500).json({ message: "Failed to fetch support tickets" });
    }
  });

  // Create support ticket (user facing)
  app.post("/api/user/support-tickets", upload.single('file'), async (req, res) => {
    try {
      const userId = (req.session as any)?.user?.id;
      if (!userId) return res.status(401).json({ message: "Authentication required" });

      const { issueType, description } = req.body;
      if (!issueType || !description) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const ticket = await storage.createSupportTicket({ userId, issueType, description, status: 'open', priority: 'medium' });
      res.json({ message: "Ticket created", ticket });
    } catch (error) {
      console.error('Create user ticket error:', error);
      res.status(500).json({ message: "Failed to create ticket" });
    }
  });

  // Send reply on user ticket
  app.post("/api/user/support-tickets/:id/reply", upload.single('file'), async (req, res) => {
    try {
      const userId = (req.session as any)?.user?.id;
      if (!userId) return res.status(401).json({ message: "Authentication required" });

      const { content } = req.body;
      if (!content) return res.status(400).json({ message: "Reply content required" });

      let fileUrl = undefined;
      let fileName = undefined;
      if (req.file) {
        try {
          fileUrl = await cloudinaryStorage.uploadFile(
            `support-tickets/${req.params.id}/${Date.now()}-${req.file.originalname}`,
            req.file.buffer,
            req.file.mimetype
          );
          fileName = req.file.originalname;
        } catch (error) {
          console.error('Error uploading reply file:', error);
          return res.status(400).json({ message: "File upload failed" });
        }
      }

      const reply = await storage.createTicketReply({
        ticketId: req.params.id,
        userId,
        senderType: 'user',
        content,
        fileUrl,
        fileName,
      });
      res.json({ message: "Reply sent", reply });
    } catch (error) {
      console.error('Send reply error:', error);
      res.status(500).json({ message: "Failed to send reply" });
    }
  });

  // Get user's support tickets (legacy)
  app.get("/api/support/tickets", async (req, res) => {
    try {
      const userId = (req.session as any)?.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const tickets = await storage.getSupportTicketsByUserId(userId);
      res.json({ tickets });
    } catch (error) {
      console.error('Get user tickets error:', error);
      res.status(500).json({ message: "Failed to fetch support tickets" });
    }
  });

  // Admin: Get all support tickets
  app.get("/api/admin/support/tickets", requireAdminAuth, async (req, res) => {
    try {
      const { status, priority, page, limit } = req.query;
      
      const result = await storage.getAllSupportTickets({
        status: status as string,
        priority: priority as string, 
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      // Add user details and replies to each ticket (with error handling)
      const ticketsWithDetails = await Promise.all(
        result.tickets.map(async (ticket) => {
          try {
            const user = await storage.getUser(ticket.userId);
            let replies = [];
            try {
              replies = await storage.getTicketReplies(ticket.id);
            } catch (e) {
              // Replies table might not exist yet, continue without them
              replies = [];
            }
            return {
              ...ticket,
              user: user ? { fullName: user.fullName, email: user.email, phone: user.phone } : undefined,
              replies,
            };
          } catch (e) {
            return {
              ...ticket,
              user: undefined,
              replies: [],
            };
          }
        })
      );

      res.json({ ...result, tickets: ticketsWithDetails });
    } catch (error) {
      console.error('Get admin tickets error:', error);
      res.status(500).json({ message: "Failed to fetch support tickets" });
    }
  });

  // Admin: Get specific support ticket
  app.get("/api/admin/support/tickets/:id", requireAdminAuth, async (req, res) => {
    try {
      const ticket = await storage.getSupportTicket(req.params.id);
      
      if (!ticket) {
        return res.status(404).json({ message: "Support ticket not found" });
      }

      res.json({ ticket });
    } catch (error) {
      console.error('Get ticket error:', error);
      res.status(500).json({ message: "Failed to fetch support ticket" });
    }
  });

  // Admin: Update support ticket
  app.put("/api/admin/support/tickets/:id", requireAdminAuth, async (req, res) => {
    try {
      const { status, priority, adminNotes } = req.body;
      const updates: any = {};
      
      if (status) updates.status = status;
      if (priority) updates.priority = priority;
      if (adminNotes) updates.adminNotes = adminNotes;
      if (status === 'resolved') updates.resolvedAt = new Date();

      const ticket = await storage.updateSupportTicket(req.params.id, updates);
      
      if (!ticket) {
        return res.status(404).json({ message: "Support ticket not found" });
      }

      // Log admin action
      await storage.createAdminLog({
        adminId: (req.session as any)?.admin?.id || null,
        action: "update_support_ticket", 
        details: `Admin updated support ticket ${req.params.id} - Status: ${status}`,
        targetId: req.params.id,
      });

      res.json({ 
        message: "Support ticket updated successfully",
        ticket 
      });
    } catch (error) {
      console.error('Update ticket error:', error);
      res.status(500).json({ message: "Failed to update support ticket" });
    }
  });

  // Admin: Delete support ticket
  app.delete("/api/admin/support/tickets/:id", requireAdminAuth, async (req, res) => {
    try {
      const ticket = await storage.getSupportTicket(req.params.id);
      
      if (!ticket) {
        return res.status(404).json({ message: "Support ticket not found" });
      }

      await storage.deleteSupportTicket(req.params.id);

      // Log admin action
      await storage.createAdminLog({
        adminId: (req.session as any)?.admin?.id || null,
        action: "delete_support_ticket", 
        details: `Admin deleted support ticket ${req.params.id}`,
        targetId: req.params.id,
      });

      res.json({ 
        message: "Support ticket deleted successfully"
      });
    } catch (error) {
      console.error('Delete ticket error:', error);
      res.status(500).json({ message: "Failed to delete support ticket" });
    }
  });

  // Admin: Cleanup ticket notifications
  app.post("/api/admin/cleanup-ticket-notifications", requireAdminAuth, async (req, res) => {
    try {
      // Get all users to check their notifications
      const allUsers = await storage.getAllUsers();
      let deletedCount = 0;
      
      for (const user of allUsers) {
        const notifications = await storage.getNotificationsByUserId(user.id);
        
        for (const notification of notifications) {
          // Check if notification is ticket-related (by title, message, or metadata)
          const isTicketNotification = 
            notification.title.toLowerCase().includes('ticket') ||
            notification.title.toLowerCase().includes('support') ||
            notification.message.toLowerCase().includes('ticket') ||
            notification.message.toLowerCase().includes('support') ||
            (notification.metadata && typeof notification.metadata === 'object' && 
             (notification.metadata as any)?.type === 'ticket') ||
            (notification.actionUrl && notification.actionUrl.includes('ticket'));
            
          if (isTicketNotification) {
            await storage.deleteNotification(notification.id);
            deletedCount++;
          }
        }
      }
      
      // Also check global notifications
      const globalNotifications = await storage.getGlobalNotifications();
      for (const notification of globalNotifications) {
        const isTicketNotification = 
          notification.title.toLowerCase().includes('ticket') ||
          notification.title.toLowerCase().includes('support') ||
          notification.message.toLowerCase().includes('ticket') ||
          notification.message.toLowerCase().includes('support') ||
          (notification.metadata && typeof notification.metadata === 'object' && 
           (notification.metadata as any)?.type === 'ticket') ||
          (notification.actionUrl && notification.actionUrl.includes('ticket'));
          
        if (isTicketNotification) {
          await storage.deleteNotification(notification.id);
          deletedCount++;
        }
      }

      // Log admin action
      await storage.createAdminLog({
        adminId: (req.session as any)?.admin?.id || null,
        action: "cleanup_ticket_notifications", 
        details: `Admin cleaned up ${deletedCount} ticket-related notifications`,
        targetId: null,
      });

      res.json({ 
        message: `Successfully deleted ${deletedCount} ticket-related notifications`,
        deletedCount
      });
    } catch (error) {
      console.error('Cleanup ticket notifications error:', error);
      res.status(500).json({ message: "Failed to cleanup ticket notifications" });
    }
  });

  // Admin: Reply to support ticket
  app.post("/api/admin/support-tickets/:id/reply", requireAdminAuth, upload.single('file'), async (req, res) => {
    try {
      const { content } = req.body;
      if (!content) return res.status(400).json({ message: "Reply content required" });

      let fileUrl = undefined;
      let fileName = undefined;
      if (req.file) {
        try {
          fileUrl = await cloudinaryStorage.uploadFile(
            `support-tickets/${req.params.id}/${Date.now()}-${req.file.originalname}`,
            req.file.buffer,
            req.file.mimetype
          );
          fileName = req.file.originalname;
        } catch (error) {
          console.error('Error uploading reply file:', error);
          return res.status(400).json({ message: "File upload failed" });
        }
      }

      const reply = await storage.createTicketReply({
        ticketId: req.params.id,
        userId: (req.session as any)?.admin?.id || '',
        senderType: 'admin',
        content,
        fileUrl,
        fileName,
      });

      await storage.createAdminLog({
        adminId: (req.session as any)?.admin?.id || null,
        action: "reply_support_ticket",
        details: `Admin replied to ticket ${req.params.id}`,
        targetId: req.params.id,
      });

      res.json({ message: "Reply sent", reply });
    } catch (error) {
      console.error('Send admin reply error:', error);
      res.status(500).json({ message: "Failed to send reply" });
    }
  });

  // Admin: Assign support ticket
  app.put("/api/admin/support/tickets/:id/assign", requireAdminAuth, async (req, res) => {
    try {
      const { adminId } = req.body;
      
      const ticket = await storage.assignSupportTicket(req.params.id, adminId);
      
      if (!ticket) {
        return res.status(404).json({ message: "Support ticket not found" });
      }

      // Log admin action  
      await storage.createAdminLog({
        adminId: (req.session as any)?.admin?.id || null,
        action: "assign_support_ticket",
        details: `Admin assigned support ticket ${req.params.id} to admin ${adminId}`,
        targetId: req.params.id,
      });

      res.json({ 
        message: "Support ticket assigned successfully",
        ticket 
      });
    } catch (error) {
      console.error('Assign ticket error:', error);
      res.status(500).json({ message: "Failed to assign support ticket" });
    }
  });


  // Admin Delete Functionality
  app.delete("/api/admin/users/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = (req.session as any)?.admin?.id;
      
      // Get user before deletion for logging
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Delete user's conversations and messages first
      const userConversations = await storage.getConversationsByUserId(id);
      for (const conversation of userConversations) {
        const messages = await storage.getMessagesByConversationId(conversation.id);
        for (const message of messages) {
          await storage.deleteMessage(message.id);
        }
        await storage.deleteConversation(conversation.id);
      }
      
      // Delete the user
      await storage.deleteUser(id);
      
      // Log admin action
      await storage.createAdminLog({
        adminId,
        action: "delete_user",
        details: `Admin deleted user ${user.email} (${user.fullName}) and all associated data`,
        targetId: id,
      });
      
      res.json({ message: "User and all associated data deleted successfully" });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.delete("/api/admin/messages/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = (req.session as any)?.admin?.id;
      
      // Get message before deletion for logging
      const message = await storage.getMessage(id);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      // Delete the message
      await storage.deleteMessage(id);
      
      // Log admin action
      await storage.createAdminLog({
        adminId,
        action: "delete_message",
        details: `Admin deleted message in conversation ${message.conversationId}`,
        targetId: id,
      });
      
      res.json({ message: "Message deleted successfully" });
    } catch (error) {
      console.error('Delete message error:', error);
      res.status(500).json({ message: "Failed to delete message" });
    }
  });

  app.delete("/api/admin/conversations/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = (req.session as any)?.admin?.id;
      
      // Get conversation before deletion for logging
      const conversation = await storage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      // Delete all messages in the conversation first
      const messages = await storage.getMessagesByConversationId(id);
      for (const message of messages) {
        await storage.deleteMessage(message.id);
      }
      
      // Delete the conversation
      await storage.deleteConversation(id);
      
      // Log admin action
      await storage.createAdminLog({
        adminId,
        action: "delete_conversation",
        details: `Admin deleted conversation and ${messages.length} messages for user ${conversation.userId}`,
        targetId: id,
      });
      
      res.json({ message: "Conversation and all messages deleted successfully" });
    } catch (error) {
      console.error('Delete conversation error:', error);
      res.status(500).json({ message: "Failed to delete conversation" });
    }
  });

  // Admin Conversation Management
  app.get("/api/admin/conversations", requireAdminAuth, async (req, res) => {
    try {
      const conversations = await storage.getAllActiveConversations();
      
      // Get detailed info including user details
      const conversationsWithDetails = await Promise.all(
        conversations.map(async (conversation) => {
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
      console.error('Get admin conversations error:', error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Admin: Assign conversation to admin
  app.put("/api/admin/conversations/:id/assign", requireAdminAuth, async (req, res) => {
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

      // Log admin action  
      await storage.createAdminLog({
        adminId: (req.session as any)?.admin?.id || null,
        action: "assign_conversation",
        details: `Admin assigned conversation ${conversationId} to admin ${adminId}`,
        targetId: conversationId,
      });

      res.json({ 
        message: "Conversation assigned successfully",
        conversation
      });
    } catch (error) {
      console.error('Assign conversation error:', error);
      res.status(500).json({ message: "Failed to assign conversation" });
    }
  });

  // Admin user balance management
  app.put("/api/admin/users/:id/balance", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { amount, type, details, currency } = req.body;
      
      // Determine which wallet to update based on currency (default to USD for backward compatibility)
      const targetCurrency = currency?.toUpperCase() || 'USD';
      const adjustmentWallet = await ensureUserWallet(req.params.id, targetCurrency);
      if (!adjustmentWallet) {
        return res.status(400).json({ error: `${targetCurrency} wallet is not enabled` });
      }
      const currentBalance = Number(adjustmentWallet.balance || 0);
      const updateAmount = parseFloat(amount);
      if (!Number.isFinite(updateAmount) || updateAmount <= 0) {
        return res.status(400).json({ error: "Amount must be greater than zero" });
      }
      
      let newBalance: number;
      let transactionType: 'receive' | 'send' | 'deposit';
      
      switch (type) {
        case "add":
          newBalance = currentBalance + updateAmount;
          transactionType = 'deposit'; // Admin deposits should be labeled as 'deposit'
          break;
        case "subtract":
          newBalance = currentBalance - updateAmount;
          transactionType = 'send';
          break;
        case "set":
          newBalance = updateAmount;
          transactionType = updateAmount > currentBalance ? 'deposit' : 'send';
          break;
        default:
          return res.status(400).json({ error: "Invalid update type" });
      }
      const delta = newBalance - currentBalance;
      if (delta !== 0) {
        try {
          await applyLedgerEntry({
            walletId: adjustmentWallet.id,
            userId: req.params.id,
            currency: targetCurrency,
            amount: delta,
            entryType: `admin_balance_${type}`,
            idempotencyKey: `admin-balance:${adjustmentWallet.id}:${Date.now()}:${Math.random()}`,
            description: details || `Admin ${type} ${targetCurrency} balance adjustment`,
          });
        } catch (error: any) {
          return res.status(400).json({ error: error?.message || "Balance adjustment exceeds available funds" });
        }
      }
      const updatedUser = await storage.getUser(req.params.id);
      
      // Create transaction record for history with correct currency
      const transactionAmount = Math.abs(delta);
      const transactionData = {
        userId: req.params.id,
        type: transactionType,
        amount: transactionAmount.toFixed(2),
        currency: targetCurrency,
        status: 'completed' as const,
        description: details || `Admin ${type} ${targetCurrency} balance adjustment`,
        recipientId: null,
        recipientName: 'System Admin',
        fee: '0.00',
        exchangeRate: 1,
        sourceAmount: transactionAmount.toFixed(2),
        sourceCurrency: targetCurrency
      };
      
      await storage.createTransaction(transactionData);
      
      res.json({ user: updatedUser, newBalance, currency: targetCurrency });
    } catch (error) {
      console.error('Admin balance update error:', error);
      res.status(500).json({ error: "Failed to update user balance" });
    }
  });

  // Admin virtual card management (action in URL param)
  app.put("/api/admin/users/:id/card/:action", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { action } = req.params;
      let updateData: any = {};
      
      switch (action) {
        case "issue":
          updateData = { hasVirtualCard: true, cardStatus: "active" };
          
          // Create virtual card record when issuing
          const cardData = {
            userId: req.params.id,
            cardNumber: `4567${Math.random().toString().slice(2, 14)}`,
            expiryMonth: String(new Date().getMonth() + 1).padStart(2, '0'),
            expiryYear: String(new Date().getFullYear() + 5).slice(-2),
            cvv: Math.floor(Math.random() * 900 + 100).toString(),
            cardholderName: user.fullName || user.username,
            status: "active",
            balance: "0.00",
            cardType: "virtual",
            provider: "Mastercard",
            currency: user.defaultCurrency || "USD",
            pin: Math.floor(Math.random() * 9000 + 1000).toString()
          };
          
          try {
            await storage.createVirtualCard(cardData);
          } catch (error) {
            console.error('Error creating virtual card:', error);
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
      console.error('Admin card management error:', error);
      res.status(500).json({ error: "Failed to update card status" });
    }
  });

  // Admin virtual card management (action in body)
  app.put("/api/admin/users/:id/virtual-card", async (req, res) => {
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
          // Issue new virtual card
          result = await storage.createVirtualCard({
            userId: id,
            purchaseAmount: "60.00"
          });
          
          // Update user to reflect they have a card
          await storage.updateUser(id, { hasVirtualCard: true });
          
          // Send card activation notification via SMS, WhatsApp, and Email
          const { messagingService: issueMessaging } = await import('./services/messaging');
          const { mailtrapService: issueMailtrap } = await import('./services/mailtrap');
          const cardLastFour = result.cardNumber.slice(-4);
          issueMessaging.sendCardActivation(user.phone, cardLastFour)
            .catch(err => console.error('Card activation notification error:', err));
          if (user.email) {
            issueMailtrap.sendCardActivation(user.email, user.fullName?.split(' ')[0] || 'User', user.fullName?.split(' ')[1] || '', cardLastFour)
              .catch(err => console.error('Card activation email error:', err));
          }
          break;
          
        case "activate":
        case "freeze":
          // Find and update existing card for reactivation/freezing
          const card = await storage.getVirtualCardByUserId(id);
          if (!card) {
            return res.status(404).json({ error: "Virtual card not found" });
          }
          
          // Don't allow reactivation of inactive cards - they need a new purchase
          if (card.status === "inactive" && action === "activate") {
            return res.status(400).json({ 
              error: "Cannot reactivate an inactive card. User must purchase a new card.",
              requiresPurchase: true
            });
          }
          
          const newStatus = action === "activate" ? "active" : "frozen";
          result = await storage.updateVirtualCard(card.id, { status: newStatus });
          
          // Send card activation notification if activating
          if (action === "activate") {
            const { messagingService: activateMessaging } = await import('./services/messaging');
            const { mailtrapService: activateMailtrap } = await import('./services/mailtrap');
            const activateCardLastFour = card.cardNumber.slice(-4);
            activateMessaging.sendCardActivation(user.phone, activateCardLastFour)
              .catch(err => console.error('Card activation notification error:', err));
            if (user.email) {
              activateMailtrap.sendCardActivation(user.email, user.fullName?.split(' ')[0] || 'User', user.fullName?.split(' ')[1] || '', activateCardLastFour)
                .catch(err => console.error('Card activation email error:', err));
            }
          }
          
          // Log admin action
          await storage.createAdminLog({
            adminId: req.session.admin?.id || null,
            action: `virtual_card_${action}`,
            details: `Admin ${action}d virtual card for user: ${user.email}`,
            targetId: id,
          });
          break;
          
        case "inactive":
          // Find and deactivate card completely
          const inactiveCard = await storage.getVirtualCardByUserId(id);
          if (!inactiveCard) {
            return res.status(404).json({ error: "Virtual card not found" });
          }
          
          // Set card to inactive and remove from user
          result = await storage.updateVirtualCard(inactiveCard.id, { status: "inactive" });
          await storage.updateUser(id, { hasVirtualCard: false });
          
          // Log admin action
          await storage.createAdminLog({
            adminId: req.session.admin?.id || null,
            action: "virtual_card_deactivate",
            details: `Admin permanently deactivated virtual card for user: ${user.email}. User must purchase new card to reactivate.`,
            targetId: id,
          });
          break;
          
        default:
          return res.status(400).json({ error: "Invalid action" });
      }
      
      res.json({ success: true, result });
    } catch (error) {
      console.error('Virtual card update error:', error);
      res.status(500).json({ error: "Failed to update virtual card" });
    }
  });

  // Admin KYC Management
  app.get("/api/admin/kyc", async (req, res) => {
    try {
      const kycDocuments = await storage.getAllKycDocuments();
      res.json({ kycDocuments });
    } catch (error) {
      console.error('KYC fetch error:', error);
      res.status(500).json({ message: "Failed to fetch KYC documents" });
    }
  });

  app.put("/api/admin/kyc/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status, verificationNotes } = req.body;
      
      const updatedKyc = await storage.updateKycDocument(id, {
        status,
        verificationNotes,
        verifiedAt: status === "verified" ? new Date() : null
      });

      if (!updatedKyc) {
        return res.status(404).json({ message: "KYC document not found" });
      }

      res.json({ kycDocument: updatedKyc });
    } catch (error) {
      console.error('KYC update error:', error);
      res.status(500).json({ message: "Failed to update KYC document" });
    }
  });

  // (Duplicate admin transaction GET/PUT removed — primary handlers exist earlier)

  app.put("/api/admin/transactions/:id/date", async (req, res) => {
    try {
      const { id } = req.params;
      const { createdAt } = req.body;
      
      if (!createdAt) {
        return res.status(400).json({ message: "createdAt is required" });
      }

      const updatedTransaction = await storage.updateTransaction(id, { 
        createdAt: new Date(createdAt),
        updatedAt: new Date()
      });
      
      if (!updatedTransaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      res.json({ transaction: updatedTransaction });
    } catch (error) {
      console.error('Transaction date update error:', error);
      res.status(500).json({ message: "Failed to update transaction date" });
    }
  });

  // (Duplicate admin virtual-cards GET/PUT removed — primary handlers exist earlier with search support)

  // Admin reissue virtual card
  app.post("/api/admin/virtual-cards/:id/reissue", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get the old card
      const oldCard = await storage.getVirtualCardById(id);
      if (!oldCard) {
        return res.status(404).json({ message: "Virtual card not found" });
      }

      const userId = oldCard.userId;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Block old card so user doesn't see it as active
      await storage.updateVirtualCard(id, { status: "blocked", blockReason: "Replaced by reissued card" });

      // Create new card with same structure as original cards
      const newCardNumber = `4567${Math.random().toString().slice(2, 14)}`;
      const newCvv = Math.floor(100 + Math.random() * 900).toString();
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 3);
      const newExpiryDate = (expiryDate.getMonth() + 1).toString().padStart(2, '0') + '/' + expiryDate.getFullYear().toString().slice(-2);

      const newCard = await storage.createVirtualCard({
        userId,
        cardNumber: newCardNumber,
        expiryDate: newExpiryDate,
        cvv: newCvv,
        cardHolderName: user.fullName || "Card User",
        status: "active",
        balance: "0.00",
        currency: "USD",
        purchaseDate: new Date()
      });

      // Restore the user's card flag so they regain access to send/transfer/etc.
      await storage.updateUser(userId, { hasVirtualCard: true, cardStatus: "active" });

      // Log admin action
      await storage.createAdminLog({
        adminId: (req as any).session?.admin?.id || null,
        action: "card_reissued",
        details: `Admin reissued virtual card for user: ${user.email}. Old card: ${id}, New card: ${newCard.id}`,
        targetId: userId
      });

      // Send notification to user
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
      console.error('Card reissue error:', error);
      res.status(500).json({ message: "Failed to reissue card" });
    }
  });

  // ─── Public App Download Links ────────────────────────────────────────────
  // Returns admin-configured download URLs for the various app stores / direct APK.
  // Exposed publicly so the in-app Settings page (and any landing pages) can show them.
  app.get("/api/app-downloads", async (req, res) => {
    try {
      const keys = ["play_store_url", "app_store_url", "apk_url", "apk_version", "huawei_app_gallery_url"];
      const out: Record<string, string> = {};
      for (const key of keys) {
        const setting = await storage.getSystemSetting("app_downloads", key);
        if (setting) {
          const v: any = (setting as any).value;
          out[key] = typeof v === "string" ? v : (v?.value ?? String(v ?? ""));
        }
      }
      res.json({
        playStoreUrl: out.play_store_url || "",
        appStoreUrl: out.app_store_url || "",
        apkUrl: out.apk_url || "",
        apkVersion: out.apk_version || "",
        huaweiUrl: out.huawei_app_gallery_url || "",
      });
    } catch (error) {
      console.error("App downloads fetch error:", error);
      res.status(500).json({ message: "Failed to fetch app download links" });
    }
  });

  // System Settings Management
  app.get("/api/admin/settings", async (req, res) => {
    try {
      const settings = await storage.getSystemSettings();
      res.json({ settings });
    } catch (error) {
      console.error('Settings fetch error:', error);
      res.status(500).json({ message: "Failed to fetch system settings" });
    }
  });

  app.put("/api/admin/settings/:key", async (req, res) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      
      // Convert value to string if it's a boolean
      const stringValue = typeof value === 'string' ? value : String(value);
      
      // Determine category based on key
      let category = req.body.category || "messaging";
      if (!req.body.category) {
        if (key.startsWith("maintenance_") || key === "maintenance_mode" || key === "maintenance_message" || key.startsWith("airtime_") || key === "enable_airtime_bonus" || key === "airtime_bonus_require_kyc" || key === "airtime_bonus_require_email") {
          category = "general";
        } else if (key.includes("fee") || key.includes("limit") || key.includes("amount")) {
          category = "fees";
        }
      }
      
      // Try to update existing setting
      let updatedSetting = await storage.updateSystemSetting(key, stringValue);
      
      // If setting doesn't exist, create it
      if (!updatedSetting) {
        updatedSetting = await storage.createSystemSetting({
          category: category,
          key: key,
          value: stringValue
        });
      }

      res.json({ setting: updatedSetting });
    } catch (error) {
      console.error('Setting update error:', error);
      res.status(500).json({ message: "Failed to update setting" });
    }
  });

  app.post("/api/admin/settings", async (req, res) => {
    try {
      const settingData = req.body;
      const newSetting = await storage.createSystemSetting(settingData);
      res.json({ setting: newSetting });
    } catch (error) {
      console.error('Setting creation error:', error);
      res.status(500).json({ message: "Failed to create setting" });
    }
  });

  // API Configuration endpoints
  app.get("/api/admin/api-configurations", requireAdminAuth, async (req, res) => {
    try {
      const configurations = await storage.getAllApiConfigurations();
      res.json({ configurations });
    } catch (error) {
      console.error('API configurations fetch error:', error);
      res.status(500).json({ message: "Failed to fetch API configurations" });
    }
  });

  app.get("/api/admin/api-configurations/:provider", requireAdminAuth, async (req, res) => {
    try {
      const { provider } = req.params;
      const configuration = await storage.getApiConfiguration(provider);
      
      if (!configuration) {
        return res.status(404).json({ message: "Configuration not found" });
      }
      
      res.json({ configuration });
    } catch (error) {
      console.error('API configuration fetch error:', error);
      res.status(500).json({ message: "Failed to fetch API configuration" });
    }
  });

  app.post("/api/admin/api-configurations", requireAdminAuth, async (req, res) => {
    try {
      const configData = req.body;
      const configuration = await storage.createApiConfiguration(configData);
      res.json({ configuration, message: "API configuration created successfully" });
    } catch (error) {
      console.error('API configuration creation error:', error);
      res.status(500).json({ message: "Failed to create API configuration" });
    }
  });

  app.put("/api/admin/api-configurations/:provider", requireAdminAuth, async (req, res) => {
    try {
      const { provider } = req.params;
      const updates = req.body;
      
      const configuration = await storage.updateApiConfiguration(provider, updates);
      
      if (!configuration) {
        return res.status(404).json({ message: "Configuration not found" });
      }
      
      res.json({ configuration, message: "API configuration updated successfully" });
    } catch (error) {
      console.error('API configuration update error:', error);
      res.status(500).json({ message: "Failed to update API configuration" });
    }
  });

  app.delete("/api/admin/api-configurations/:provider", requireAdminAuth, async (req, res) => {
    try {
      const { provider } = req.params;
      await storage.deleteApiConfiguration(provider);
      res.json({ message: "API configuration deleted successfully" });
    } catch (error) {
      console.error('API configuration deletion error:', error);
      res.status(500).json({ message: "Failed to delete API configuration" });
    }
  });

  // User search endpoint for transfers (MUST come before /api/users/:id)
  app.get("/api/users/search", requireAuth, async (req, res) => {
    try {
      const { q: searchQuery } = req.query;
      const currentUserId = req.session?.userId;
      
      console.log('=== USER SEARCH DEBUG ===');
      console.log('Search Query:', { q: searchQuery, type: typeof searchQuery });
      console.log('Current User ID:', currentUserId);
      console.log('Query Parameter received:', req.query);
      
      if (!searchQuery || typeof searchQuery !== 'string' || searchQuery.length < 2) {
        console.log('Query too short or invalid, returning empty array');
        return res.json({ users: [] });
      }
      
      const allUsers = await storage.getAllUsers();
      console.log(`[Search] Total users in database: ${allUsers.length}`);
      
      if (allUsers.length === 0) {
        console.warn('[Search] ⚠️ No users found in database!');
      } else {
        console.log('[Search] Sample users:', allUsers.slice(0, 3).map(u => ({ 
          id: u.id, 
          fullName: u.fullName, 
          email: u.email 
        })));
      }
      
      const query = searchQuery.toLowerCase().trim();
      console.log(`[Search] Searching for: "${query}"`);
      
      // Search by email, full name, or phone number, excluding the current user
      const filteredUsers = allUsers
        .filter((user, idx) => {
          // Skip current user and admin users
          if (user.id === currentUserId) {
            console.log(`[Search] Skipping current user: ${user.email}`);
            return false;
          }
          if (user.isAdmin) {
            console.log(`[Search] Skipping admin user: ${user.email}`);
            return false;
          }
          
          const fullName = (user.fullName || '').toLowerCase().trim();
          const email = (user.email || '').toLowerCase().trim();
          const phone = (user.phone || '').trim();
          
          // Normalize phone numbers to standard format for comparison
          const normalizeToStandardPhone = (p: string) => {
            if (!p) return '';
            const cleaned = p.replace(/[\+\-\s()]/g, '');
            
            // Handle different Kenyan formats
            if (cleaned.startsWith('254')) {
              return cleaned.substring(3); // Remove 254 prefix -> 7xxx
            } else if (cleaned.startsWith('0')) {
              return cleaned.substring(1); // Remove 0 prefix -> 7xxx
            }
            return cleaned; // Already in 7xxx format or other
          };
          
          const normalizedUserPhone = normalizeToStandardPhone(phone);
          const normalizedSearchPhone = normalizeToStandardPhone(searchQuery.trim());
          
          // Check for matches
          const emailMatch = email.includes(query);
          const nameMatch = fullName.includes(query) || 
                           fullName.split(' ').some(part => part.toLowerCase().startsWith(query));
          
          // Enhanced phone matching
          const phoneMatch = normalizedUserPhone && normalizedSearchPhone && (
            normalizedUserPhone === normalizedSearchPhone ||
            normalizedUserPhone.includes(normalizedSearchPhone) ||
            normalizedSearchPhone.includes(normalizedUserPhone)
          );
          
          const isMatch = emailMatch || nameMatch || phoneMatch;
          if (isMatch) {
            console.log(`[Search] ✓ Match found: ${email} | fullName: ${fullName} | emailMatch: ${emailMatch} | nameMatch: ${nameMatch} | phoneMatch: ${phoneMatch}`);
          }
          
          return isMatch;
        })
        .slice(0, 10) // Limit to 10 results
        .map(user => ({
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone
        }));
      
      console.log(`[Search] Final results: found ${filteredUsers.length} matching users`);
      console.log('[Search] Filtered users:', filteredUsers);
      res.json({ users: filteredUsers });
    } catch (error) {
      console.error('[Search] Error searching users:', error);
      res.status(500).json({ message: "Error searching users" });
    }
  });

  // Get user by ID (for refreshing user data)
  app.get("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const requestedId = req.params.id;
      const sessionUserId = (req as any).session?.userId;

      // Security: users can only fetch their own profile
      if (sessionUserId && requestedId !== sessionUserId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const user = await storage.getUser(requestedId);
      if (!user) {
        // Session has a userId but no matching DB record — clear stale session
        console.warn(`[GET /api/users/:id] User ${requestedId} not found in database. Destroying stale session.`);
        if ((req as any).session) {
          (req as any).session.destroy(() => {});
        }
        return res.status(401).json({ error: "Session expired — user not found. Please log in again." });
      }

      const { password, ...userWithoutPassword } = user as any;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Error retrieving user:", error);
      res.status(500).json({ error: "Failed to retrieve user data" });
    }
  });

  // Get login history for a user
  app.get("/api/users/:id/login-history", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const history = await storage.getLoginHistoryByUserId(id, limit);
      res.json({ loginHistory: history });
    } catch (error) {
      console.error("Error retrieving login history:", error);
      res.status(500).json({ error: "Failed to retrieve login history" });
    }
  });

  // Get current user's devices (login history)
  app.get("/api/users/me/devices", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      const history = await storage.getLoginHistoryByUserId(userId, 20);
      res.json({ devices: history });
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve devices" });
    }
  });

  // Revoke all sessions for current user (except current)
  app.post("/api/users/me/revoke-all-sessions", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).session?.userId;
      const currentSid = (req as any).session?.id;
      // Delete all sessions for this user from user_sessions table except the current one
      await db.execute(
        sql`DELETE FROM user_sessions WHERE sess->>'userId' = ${userId} AND sid != ${currentSid}`
      );
      res.json({ message: "All other sessions revoked successfully" });
    } catch (error) {
      console.error("Revoke sessions error:", error);
      res.status(500).json({ error: "Failed to revoke sessions" });
    }
  });

  // Admin: get devices (login history) for a specific user
  app.get("/api/admin/users/:id/devices", async (req, res) => {
    try {
      const { id } = req.params;
      const history = await storage.getLoginHistoryByUserId(id, 30);
      res.json({ devices: history });
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve user devices" });
    }
  });

  // Admin: revoke all sessions for a specific user
  app.post("/api/admin/users/:id/revoke-all-sessions", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await db.execute(
        sql`DELETE FROM user_sessions WHERE sess->>'userId' = ${id}`
      );
      // Log admin action
      await storage.createAdminLog({
        adminId: (req as any).session?.admin?.id || null,
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

  // Transaction Analytics API
  app.get("/api/analytics/:userId/spending", requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const { period = "month" } = req.query;
      
      const transactions = await storage.getTransactionsByUserId(userId);
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      
      const filteredTransactions = transactions.filter(tx => 
        new Date(tx.createdAt!) >= startDate && tx.status === "completed"
      );
      
      const spending = filteredTransactions
        .filter(tx => tx.type === "send")
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
        
      const income = filteredTransactions
        .filter(tx => tx.type === "receive")
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
      
      const categorySpending = filteredTransactions
        .filter(tx => tx.type === "send")
        .reduce((acc, tx) => {
          const category = tx.description?.includes("Virtual Card") ? "Virtual Card" :
                          tx.description?.includes("Transfer") ? "Transfer" :
                          tx.description?.includes("Payment") ? "Payment" : "Other";
          acc[category] = (acc[category] || 0) + parseFloat(tx.amount);
          return acc;
        }, {} as Record<string, number>);
      
      const dailySpending = filteredTransactions
        .filter(tx => tx.type === "send")
        .reduce((acc, tx) => {
          const day = new Date(tx.createdAt!).toISOString().split('T')[0];
          acc[day] = (acc[day] || 0) + parseFloat(tx.amount);
          return acc;
        }, {} as Record<string, number>);
      
      res.json({
        period,
        totalSpending: spending,
        totalIncome: income,
        netFlow: income - spending,
        transactionCount: filteredTransactions.length,
        categoryBreakdown: categorySpending,
        dailySpending,
        averageTransaction: filteredTransactions.length > 0 ? 
          (spending + income) / filteredTransactions.length : 0
      });
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Savings Goals API
  app.post("/api/savings-goals", async (req, res) => {
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
      console.error('Savings goal creation error:', error);
      res.status(500).json({ message: "Failed to create savings goal" });
    }
  });

  app.get("/api/savings-goals/:userId", async (req, res) => {
    try {
      const savingsGoals = await storage.getSavingsGoalsByUserId(req.params.userId);
      res.json({ savingsGoals });
    } catch (error) {
      console.error('Savings goals fetch error:', error);
      res.status(500).json({ message: "Failed to fetch savings goals" });
    }
  });

  app.put("/api/savings-goals/:id/contribute", async (req, res) => {
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
      
      try {
        await applyLedgerEntry({
          walletId: savingsWallet.id, userId, currency: "USD", amount: -contributionAmount,
          entryType: "savings_contribution", idempotencyKey: `savings:${id}:${Date.now()}`,
          description: `Contribution to savings goal`,
        });
      } catch (error: any) {
        return res.status(400).json({ message: error?.message || "Insufficient balance" });
      }
      
      // Update savings goal
      const newAmount = parseFloat(savingsGoal.currentAmount || "0") + contributionAmount;
      await storage.updateSavingsGoal(id, {
        currentAmount: newAmount.toFixed(2)
      });
      
      // Create transaction record
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
      console.error('Savings contribution error:', error);
      res.status(500).json({ message: "Failed to add contribution" });
    }
  });

  // QR Code Payment API  
  app.post("/api/qr-payments/generate", async (req, res) => {
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
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });
      
      res.json({ qrPayment, paymentCode });
    } catch (error) {
      console.error('QR payment generation error:', error);
      res.status(500).json({ message: "Failed to generate QR payment" });
    }
  });

  app.post("/api/qr-payments/process", async (req, res) => {
    try {
      const { paymentCode, payerUserId } = req.body;
      
      const qrPayment = await storage.getQRPaymentByCode(paymentCode);
      if (!qrPayment || !qrPayment.isActive || new Date() > new Date(qrPayment.expiresAt!)) {
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
      
      // Process payment
      await storage.updateUser(payerUserId, {
        balance: (payerBalance - amount).toFixed(2)
      });
      await storage.updateUser(recipient.id, {
        balance: (parseFloat(recipient.balance || "0") + amount).toFixed(2)
      });
      
      // Create transactions
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
      
      // Deactivate QR code
      await storage.updateQRPayment(qrPayment.id, { isActive: false });
      
      res.json({ message: "Payment processed successfully" });
    } catch (error) {
      console.error('QR payment processing error:', error);
      res.status(500).json({ message: "Failed to process QR payment" });
    }
  });

  // PayHero admin settings endpoints
  app.get("/api/admin/payhero-settings", async (req, res) => {
    try {
      // Get settings from database first, fallback to environment
      const channelIdSetting = await storage.getSystemSetting("payhero", "channel_id");
      const providerSetting = await storage.getSystemSetting("payhero", "provider");
      const cardPriceSetting = await storage.getSystemSetting("virtual_card", "price");
      
      // Parse JSON values from database and prioritize database over env variables
      const channelId = channelIdSetting?.value 
        ? (typeof channelIdSetting.value === 'string' ? channelIdSetting.value : JSON.stringify(channelIdSetting.value)).replace(/"/g, '')
        : "3407"; // Default to 3407, not env variable
      
      const settings = {
        channelId,
        provider: providerSetting?.value || "m-pesa",
        cardPrice: cardPriceSetting?.value || "60.00",
        username: process.env.PAYHERO_USERNAME ? "****" : "",
        password: process.env.PAYHERO_PASSWORD ? "****" : "",
      };
      
      res.json(settings);
    } catch (error) {
      console.error('Error fetching PayHero settings:', error);
      res.status(500).json({ message: "Error fetching PayHero settings" });
    }
  });

  app.put("/api/admin/payhero-settings", async (req, res) => {
    try {
      const { channelId, provider, cardPrice } = req.body;
      
      console.log('Admin updated PayHero settings:', { channelId, provider, cardPrice });
      
      // Save settings to database for persistence
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
      
      // Update the PayHero service channel ID in memory using the proper setter
      payHeroService.updateSettings(parseInt(channelId));
      
      res.json({ 
        success: true, 
        message: "PayHero settings updated successfully",
        channelId,
        provider,
        cardPrice 
      });
    } catch (error) {
      console.error('Error updating PayHero settings:', error);
      res.status(500).json({ message: "Error updating PayHero settings" });
    }
  });

  app.post("/api/admin/test-payhero", async (req, res) => {
    try {
      const { amount, phone, reference } = req.body;
      
      console.log('Admin testing PayHero connection:', { amount, phone, reference });
      
      // Test PayHero connection with minimal transaction
      const testResult = await payHeroService.initiateMpesaPayment(
        amount || 1,
        phone || "0700000000", 
        reference || `TEST-${Date.now()}`,
        "Test User",
        null // No callback for test
      );
      
      res.json({
        success: testResult.success,
        status: testResult.status,
        reference: testResult.reference,
        message: testResult.success 
          ? "PayHero connection test successful" 
          : `Connection test failed: ${testResult.status}`
      });
    } catch (error) {
      console.error('PayHero connection test error:', error);
      res.status(500).json({ 
        success: false,
        message: "Connection test failed: " + error.message 
      });
    }
  });

  // Manual M-Pesa payment settings endpoints
  app.get("/api/admin/manual-payment-settings", async (req, res) => {
    try {
      // Get settings from database, fallback to defaults
      const paybillSetting = await storage.getSystemSetting("manual_mpesa", "paybill");
      const accountSetting = await storage.getSystemSetting("manual_mpesa", "account");
      
      const settings = {
        paybill: paybillSetting?.value || "247",
        account: accountSetting?.value || "4664",
      };
      
      res.json(settings);
    } catch (error) {
      console.error('Error fetching manual payment settings:', error);
      res.status(500).json({ message: "Error fetching manual payment settings" });
    }
  });

  app.put("/api/admin/manual-payment-settings", async (req, res) => {
    try {
      const { paybill, account } = req.body;
      
      console.log('Admin updated manual M-Pesa payment settings:', { paybill, account });
      
      // Save settings to database for persistence
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
      console.error('Error updating manual payment settings:', error);
      res.status(500).json({ message: "Error updating manual payment settings" });
    }
  });

  // Public endpoint for getting manual payment settings (for users)
  app.get("/api/manual-payment-settings", async (req, res) => {
    try {
      const paybillSetting = await storage.getSystemSetting("manual_mpesa", "paybill");
      
      res.json({
        paybill: paybillSetting?.value || "247",
        account: "440200259037",
      });
    } catch (error) {
      console.error('Error fetching manual payment settings:', error);
      res.status(500).json({ message: "Error fetching manual payment settings" });
    }
  });

  // ── Admin deposit method settings ─────────────────────────────────────────
  app.get("/api/admin/deposit-settings", requireAdminAuth, async (req, res) => {
    try {
      const keys = [
        "mpesa_enabled","crypto_enabled","bank_transfer_enabled","card_enabled",
        "global_enabled",
        "bank_name","bank_account_name","bank_account_number","bank_swift_code",
        "bank_branch","bank_currency","bank_routing_number","bank_additional_info"
      ];
      const result: Record<string, string> = {};
      for (const key of keys) {
        const s = await storage.getSystemSetting("deposit_methods", key);
        result[key] = s ? String(s.value) : "";
      }
      let bonuses: any[] = [];
      try {
        bonuses = await db.select().from(depositBonuses);
      } catch (_) {
        // deposit_bonuses table may not exist yet in older deployments
      }
      res.json({ methods: result, bonuses });
    } catch (e) { res.status(500).json({ message: "Failed to load deposit settings" }); }
  });

  app.put("/api/admin/deposit-settings", requireAdminAuth, async (req, res) => {
    try {
      const { methods } = req.body;
      if (!methods || typeof methods !== "object") {
        return res.status(400).json({ message: "Invalid methods object" });
      }
      const allowedKeys = [
        "mpesa_enabled","crypto_enabled","bank_transfer_enabled","card_enabled","global_enabled",
        "bank_name","bank_account_name","bank_account_number","bank_swift_code",
        "bank_branch","bank_currency","bank_routing_number","bank_additional_info"
      ];
      for (const key of allowedKeys) {
        if (key in methods) {
          await storage.setSystemSetting({ category: "deposit_methods", key, value: String(methods[key]), description: `Deposit method setting: ${key}` });
        }
      }
      res.json({ success: true });
    } catch (e) { res.status(500).json({ message: "Failed to save deposit settings" }); }
  });

  // ── Admin deposit bonuses CRUD ─────────────────────────────────────────────
  app.get("/api/admin/deposit-bonuses", requireAdminAuth, async (req, res) => {
    try {
      const bonuses = await db.select().from(depositBonuses);
      res.json(bonuses);
    } catch (e) { res.status(500).json({ message: "Failed to load bonuses" }); }
  });

  app.post("/api/admin/deposit-bonuses", requireAdminAuth, async (req, res) => {
    try {
      const { method, minAmount, bonusAmount, bonusType, description, isActive } = req.body;
      const [bonus] = await db.insert(depositBonuses).values({
        method, minAmount: String(minAmount), bonusAmount: String(bonusAmount),
        bonusType: bonusType || "fixed", description, isActive: isActive !== false
      }).returning();
      res.json(bonus);
    } catch (e) { res.status(500).json({ message: "Failed to create bonus" }); }
  });

  app.put("/api/admin/deposit-bonuses/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { method, minAmount, bonusAmount, bonusType, description, isActive } = req.body;
      const [bonus] = await db.update(depositBonuses).set({
        method, minAmount: String(minAmount), bonusAmount: String(bonusAmount),
        bonusType: bonusType || "fixed", description, isActive,
        updatedAt: new Date()
      }).where(eq(depositBonuses.id, id)).returning();
      res.json(bonus);
    } catch (e) { res.status(500).json({ message: "Failed to update bonus" }); }
  });

  app.delete("/api/admin/deposit-bonuses/:id", requireAdminAuth, async (req, res) => {
    try {
      await db.delete(depositBonuses).where(eq(depositBonuses.id, req.params.id));
      res.json({ success: true });
    } catch (e) { res.status(500).json({ message: "Failed to delete bonus" }); }
  });

  // Messaging settings endpoints
  app.get("/api/admin/messaging-settings", async (req, res) => {
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
        whatsappBusinessAccountId: String(whatsappWabaIdSetting?.value || ""),
      };
      
      console.log('[Messaging Settings] Retrieved CommsGrid + WA settings');
      res.json(settings);
    } catch (error) {
      console.error('Error fetching messaging settings:', error);
      res.status(500).json({ message: "Error fetching messaging settings" });
    }
  });

  app.put("/api/admin/messaging-settings", async (req, res) => {
    try {
      const { commsGridApiKey, commsGridSenderId, commsGridDeviceId, whatsapp_access_token, whatsapp_phone_number_id, whatsapp_business_account_id } = req.body;
      
      console.log('Admin updated messaging settings (SMS via CommsGrid, WhatsApp via Meta)');
      
      // SMS Settings (CommsGrid API)
      await storage.setSystemSetting({
        category: "messaging",
        key: "commsGrid_api_key",
        value: (commsGridApiKey || '').trim(),
        description: "CommsGrid API key (Bearer token)"
      });
      
      await storage.setSystemSetting({
        category: "messaging",
        key: "commsGrid_sender_id",
        value: (commsGridSenderId || '').trim(),
        description: "CommsGrid sender ID"
      });

      await storage.setSystemSetting({
        category: "messaging",
        key: "commsGrid_device_id",
        value: (commsGridDeviceId || '').trim(),
        description: "CommsGrid device ID (optional)"
      });
      
      // WhatsApp Settings (Meta Business API)
      await storage.setSystemSetting({
        category: "messaging",
        key: "whatsapp_access_token",
        value: (whatsapp_access_token || '').trim(),
        description: "Meta WhatsApp Business API access token"
      });
      
      await storage.setSystemSetting({
        category: "messaging",
        key: "whatsapp_phone_number_id",
        value: String(whatsapp_phone_number_id || '').trim(),
        description: "Meta WhatsApp Business phone number ID"
      });

      await storage.setSystemSetting({
        category: "messaging",
        key: "whatsapp_business_account_id",
        value: String(whatsapp_business_account_id || '').trim(),
        description: "Meta WhatsApp Business Account ID (WABA ID)"
      });
      
      // Sync env vars so messaging service picks them up immediately
      if (commsGridApiKey) process.env.COMMSGRID_API_KEY = (commsGridApiKey || '').trim();
      if (commsGridSenderId) process.env.COMMSGRID_SENDER_ID = (commsGridSenderId || '').trim();
      if (commsGridDeviceId) process.env.COMMSGRID_DEVICE_ID = (commsGridDeviceId || '').trim();

      // Sync WhatsApp env vars
      process.env.WHATSAPP_ACCESS_TOKEN = (whatsapp_access_token || '').trim();
      process.env.WHATSAPP_PHONE_NUMBER_ID = String(whatsapp_phone_number_id || '').trim();
      process.env.WHATSAPP_BUSINESS_ACCOUNT_ID = String(whatsapp_business_account_id || '').trim();
      
      console.log('[Messaging Settings] Updated CommsGrid SMS + WhatsApp');
      
      // Refresh WhatsApp service credentials after update
      if (whatsapp_access_token && whatsapp_phone_number_id) {
        const { whatsappService } = await import('./services/whatsapp');
        await whatsappService.refreshCredentials();
        console.log('[WhatsApp] Credentials refreshed after admin update');
      }
      
      res.json({ 
        success: true, 
        message: "Messaging settings updated successfully"
      });
    } catch (error) {
      console.error('Error updating messaging settings:', error);
      res.status(500).json({ message: "Error updating messaging settings" });
    }
  });

  // Message type toggles endpoints
  app.get("/api/admin/message-toggles", async (req, res) => {
    try {
      const enableOtpSetting = await storage.getSystemSetting("messaging", "enable_otp_messages");
      const enablePasswordSetting = await storage.getSystemSetting("messaging", "enable_password_reset_messages");
      const enableFundSetting = await storage.getSystemSetting("messaging", "enable_fund_receipt_messages");
      const enableKycSetting = await storage.getSystemSetting("messaging", "enable_kyc_verified_messages");
      const enableCardSetting = await storage.getSystemSetting("messaging", "enable_card_activation_messages");
      const enableLoginAlertSetting = await storage.getSystemSetting("messaging", "enable_login_alert_messages");

      res.json({
        enableOtpMessages: enableOtpSetting?.value !== 'false',
        enablePasswordResetMessages: enablePasswordSetting?.value !== 'false',
        enableFundReceiptMessages: enableFundSetting?.value !== 'false',
        enableKycVerifiedMessages: enableKycSetting?.value !== 'false',
        enableCardActivationMessages: enableCardSetting?.value !== 'false',
        enableLoginAlertMessages: enableLoginAlertSetting?.value !== 'false'
      });
    } catch (error) {
      console.error('Error fetching message toggles:', error);
      res.status(500).json({ message: "Error fetching message toggles" });
    }
  });

  app.put("/api/admin/message-toggles", async (req, res) => {
    try {
      const { enableOtpMessages, enablePasswordResetMessages, enableFundReceiptMessages, enableKycVerifiedMessages, enableCardActivationMessages, enableLoginAlertMessages } = req.body;

      await storage.setSystemSetting({
        category: "messaging",
        key: "enable_otp_messages",
        value: enableOtpMessages ? 'true' : 'false',
        description: "Send OTP verification messages"
      });

      await storage.setSystemSetting({
        category: "messaging",
        key: "enable_password_reset_messages",
        value: enablePasswordResetMessages ? 'true' : 'false',
        description: "Send password reset messages"
      });

      await storage.setSystemSetting({
        category: "messaging",
        key: "enable_fund_receipt_messages",
        value: enableFundReceiptMessages ? 'true' : 'false',
        description: "Send fund receipt notifications"
      });

      await storage.setSystemSetting({
        category: "messaging",
        key: "enable_kyc_verified_messages",
        value: enableKycVerifiedMessages ? 'true' : 'false',
        description: "Send KYC verified notifications"
      });

      await storage.setSystemSetting({
        category: "messaging",
        key: "enable_card_activation_messages",
        value: enableCardActivationMessages ? 'true' : 'false',
        description: "Send card activation messages"
      });

      await storage.setSystemSetting({
        category: "messaging",
        key: "enable_login_alert_messages",
        value: enableLoginAlertMessages ? 'true' : 'false',
        description: "Send login alert notifications"
      });

      console.log('Message toggles updated:', { enableOtpMessages, enablePasswordResetMessages, enableFundReceiptMessages, enableKycVerifiedMessages, enableCardActivationMessages, enableLoginAlertMessages });

      res.json({
        success: true,
        message: "Message toggles updated successfully"
      });
    } catch (error) {
      console.error('Error updating message toggles:', error);
      res.status(500).json({ message: "Error updating message toggles" });
    }
  });

  // Create WhatsApp templates via Meta API
  app.post("/api/admin/whatsapp/create-templates", requireAdminAuth, async (req, res) => {
    try {
      const { whatsappService } = await import('./services/whatsapp');
      
      console.log('[Admin] Creating WhatsApp templates...');
      const results = await whatsappService.createAllTemplates();
      
      const response = {
        message: "WhatsApp template creation completed",
        success: results.success,
        failed: results.failed,
        successCount: results.success.length,
        failedCount: results.failed.length,
        timestamp: new Date().toISOString()
      };
      
      console.log('[Admin] Template creation results:', response);
      res.json(response);
    } catch (error) {
      console.error('[Admin] Create templates error:', error);
      res.status(500).json({ 
        message: "Failed to create templates",
        error: String(error),
        timestamp: new Date().toISOString()
      });
    }
  });

  // Fetch templates from Meta
  app.get("/api/admin/whatsapp/templates", requireAdminAuth, async (req, res) => {
    try {
      const { whatsappService } = await import('./services/whatsapp');
      const templates = await whatsappService.fetchTemplatesFromMeta();
      
      res.json({
        templates: templates,
        count: templates.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[Admin] Fetch templates error:', error);
      res.status(500).json({ 
        message: "Failed to fetch templates from Meta",
        error: String(error),
        timestamp: new Date().toISOString()
      });
    }
  });

  // Verification settings endpoints
  app.get("/api/admin/verification-settings", requireAdminAuth, async (req, res) => {
    try {
      const enableOtpSetting = await storage.getSystemSetting("verification", "enable_phone_otp_login");
      const enableEmailVerifySetting = await storage.getSystemSetting("verification", "enable_email_verification");
      const enableLoginAlertSetting = await storage.getSystemSetting("verification", "enable_login_alert");
      
      res.json({
        enablePhoneOtpLogin: enableOtpSetting?.value !== 'false',
        enableEmailVerification: enableEmailVerifySetting?.value !== 'false',
        enableLoginAlert: enableLoginAlertSetting?.value !== 'false'
      });
    } catch (error) {
      console.error('Error fetching verification settings:', error);
      res.status(500).json({ message: "Error fetching verification settings" });
    }
  });

  app.put("/api/admin/verification-settings", requireAdminAuth, async (req, res) => {
    try {
      const { enablePhoneOtpLogin, enableEmailVerification, enableLoginAlert } = req.body;
      
      await storage.setSystemSetting({
        category: "verification",
        key: "enable_phone_otp_login",
        value: enablePhoneOtpLogin ? 'true' : 'false',
        description: "Require phone OTP for login"
      });
      
      await storage.setSystemSetting({
        category: "verification",
        key: "enable_email_verification",
        value: enableEmailVerification ? 'true' : 'false',
        description: "Require email verification during signup"
      });
      
      await storage.setSystemSetting({
        category: "verification",
        key: "enable_login_alert",
        value: enableLoginAlert ? 'true' : 'false',
        description: "Send login alerts to user"
      });
      
      console.log('Verification settings updated:', { enablePhoneOtpLogin, enableEmailVerification, enableLoginAlert });
      
      res.json({
        success: true,
        message: "Verification settings updated successfully"
      });
    } catch (error) {
      console.error('Error updating verification settings:', error);
      res.status(500).json({ message: "Error updating verification settings" });
    }
  });

  app.post("/api/admin/send-message", async (req, res) => {
    try {
      const { userId, message } = req.body;
      
      if (!userId || !message) {
        return res.status(400).json({ message: "User ID and message are required" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { messagingService } = await import('./services/messaging');
      const result = await messagingService.sendMessage(user.phone, message);
      
      console.log(`Admin sent message to ${user.fullName} (${user.phone}):`, { sms: result.sms, whatsapp: result.whatsapp });
      
      res.json({
        success: true,
        message: "Message sent successfully",
        sms: result.sms,
        whatsapp: result.whatsapp
      });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ message: "Error sending message" });
    }
  });

  // Email settings endpoints
  app.get("/api/admin/email-settings", requireAdminAuth, async (req, res) => {
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
        fromName: fromNameSetting?.value || "GreenPay",
      };
      
      res.json(settings);
    } catch (error) {
      console.error('Error fetching email settings:', error);
      res.status(500).json({ message: "Error fetching email settings" });
    }
  });

  app.put("/api/admin/email-settings", requireAdminAuth, async (req, res) => {
    try {
      const { smtpHost, smtpPort, smtpSecure, smtpUsername, smtpPassword, fromEmail, fromName } = req.body;
      
      console.log('Admin updated email settings');
      
      await storage.setSystemSetting({
        category: "email",
        key: "smtp_host",
        value: (smtpHost || '').trim(),
        description: "SMTP server hostname"
      });
      
      await storage.setSystemSetting({
        category: "email",
        key: "smtp_port",
        value: (smtpPort || '465').toString(),
        description: "SMTP server port"
      });
      
      await storage.setSystemSetting({
        category: "email",
        key: "smtp_secure",
        value: smtpSecure ? 'true' : 'false',
        description: "Use SSL/TLS for SMTP"
      });
      
      await storage.setSystemSetting({
        category: "email",
        key: "smtp_username",
        value: (smtpUsername || '').trim(),
        description: "SMTP username"
      });
      
      await storage.setSystemSetting({
        category: "email",
        key: "smtp_password",
        value: (smtpPassword || '').trim(),
        description: "SMTP password"
      });
      
      await storage.setSystemSetting({
        category: "email",
        key: "from_email",
        value: (fromEmail || '').trim(),
        description: "From email address"
      });
      
      await storage.setSystemSetting({
        category: "email",
        key: "from_name",
        value: (fromName || 'GreenPay').trim(),
        description: "From name"
      });
      
      res.json({ 
        success: true, 
        message: "Email settings updated successfully"
      });
    } catch (error) {
      console.error('Error updating email settings:', error);
      res.status(500).json({ message: "Error updating email settings" });
    }
  });

  // Send test email endpoint
  app.post("/api/admin/send-test-email", requireAdminAuth, async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email address is required" });
      }
      
      const { emailService } = await import('./services/email');
      const result = await emailService.sendTestEmail(email);
      
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
      console.error('Error sending test email:', error);
      res.status(500).json({ message: "Error sending test email" });
    }
  });

  // Send custom email to specific user
  app.post("/api/admin/send-custom-email", requireAdminAuth, async (req, res) => {
    try {
      const { email, subject, message, imageUrl, linkText, linkUrl } = req.body;
      
      if (!email || !subject || !message) {
        return res.status(400).json({ message: "Email, subject, and message are required" });
      }
      
      const { emailService } = await import('./services/email');
      const { emailTemplates } = await import('./services/email-templates');
      
      const html = emailTemplates.custom({
        message,
        imageUrl: imageUrl || undefined,
        linkText: linkText || undefined,
        linkUrl: linkUrl || undefined,
      });
      
      const result = await emailService.sendEmail(email, subject, html);
      
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
      console.error('Error sending custom email:', error);
      res.status(500).json({ message: "Error sending custom email" });
    }
  });

  // User-to-user transfer endpoint with real-time balance updates
  app.post("/api/transfer", requireAuth, async (req, res) => {
    try {
      const { fromUserId, toUserId, amount, currency, description, pin } = req.body;
      
      console.log('=== TRANSFER DEBUG ===');
      console.log('Request Body:', { fromUserId, toUserId, amount, currency });
      
      if (!fromUserId || !toUserId || !amount || !currency) {
        console.error('[Transfer] Missing required fields:', { fromUserId: !!fromUserId, toUserId: !!toUserId, amount: !!amount, currency: !!currency });
        return res.status(400).json({ message: "Missing required fields" });
      }

      const transferAmount = parseFloat(amount);
      if (transferAmount <= 0) {
        console.error('[Transfer] Invalid amount:', transferAmount);
        return res.status(400).json({ message: "Invalid transfer amount" });
      }

      // Get both users
      console.log('[Transfer] Fetching users...');
      const fromUser = await storage.getUser(fromUserId);
      const toUser = await storage.getUser(toUserId);
      
      console.log('[Transfer] From User:', { found: !!fromUser, balance: fromUser?.balance, email: fromUser?.email });
      console.log('[Transfer] To User:', { found: !!toUser, balance: toUser?.balance, email: toUser?.email });

      if (!fromUser || !toUser) {
        console.error('[Transfer] User not found - fromUser:', !!fromUser, 'toUser:', !!toUser);
        return res.status(404).json({ message: "User not found" });
      }

      // Check PIN if required by admin settings OR if user has it enabled
      const settings = await storage.getSystemSettings();
      const pinRequiredByAdmin = settings.some(s => s.key === "pin_required" && s.value === "true");
      
      if ((pinRequiredByAdmin || fromUser.pinEnabled) && fromUser.pinCode) {
        if (!pin) {
          return res.status(400).json({ message: "PIN required", requiresPin: true });
        }
        
        // Verify PIN
        const isPinValid = await bcrypt.compare(pin, fromUser.pinCode);
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
        console.error('[Transfer] Insufficient balance:', { senderBalance, transferAmount });
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Calculate new balances - simple arithmetic
      const senderNewBalance = senderBalance - transferAmount;
      const recipientNewBalance = recipientBalance + transferAmount;
      
      console.log('[Transfer] Balance calculation:', { 
        senderOld: senderBalance, 
        senderNew: senderNewBalance, 
        recipientOld: recipientBalance, 
        recipientNew: recipientNewBalance,
        transferAmount 
      });

      // Create transfer transactions
      const now = new Date().toISOString();
      const transferId = storage.generateTransactionReference();
      let senderDebited = false;

      // Sender transaction (debit)
      const senderTransaction = await storage.createTransaction({
        userId: fromUserId,
        type: 'send',
        amount: amount,
        currency: transferCurrency,
        status: 'completed',
        description: description || `Transfer to ${toUser.fullName}`,
        recipient: toUser.fullName,
        recipientEmail: toUser.email,
        transferId: transferId,
        fee: '0'
      });

      // Recipient transaction (credit)
      const recipientTransaction = await storage.createTransaction({
        userId: toUserId,
        type: 'receive',
        amount: amount,
        currency: transferCurrency,
        status: 'completed',
        description: description || `Transfer from ${fromUser.fullName}`,
        sender: fromUser.fullName,
        senderEmail: fromUser.email,
        transferId: transferId,
        fee: '0'
      });

      // Update both wallets atomically enough to prevent spending more than
      // the sender's available balance during concurrent transfers.
      try {
        await applyLedgerEntry({
          walletId: senderWallet.id, userId: fromUserId, currency: transferCurrency, amount: -transferAmount,
          entryType: "user_transfer", idempotencyKey: `transfer:${transferId}:debit`,
          transactionId: senderTransaction.id, description: description || `Transfer to ${toUser.fullName}`,
        });
        senderDebited = true;
        await applyLedgerEntry({
          walletId: recipientWallet.id, userId: toUserId, currency: transferCurrency, amount: transferAmount,
          entryType: "user_transfer", idempotencyKey: `transfer:${transferId}:credit`,
          transactionId: recipientTransaction.id, description: description || `Transfer from ${fromUser.fullName}`,
        });
      } catch (error: any) {
        if (senderDebited) {
          await applyLedgerEntry({
            walletId: senderWallet.id, userId: fromUserId, currency: transferCurrency, amount: transferAmount,
            entryType: "user_transfer_rollback", idempotencyKey: `transfer:${transferId}:rollback`,
            description: "Rollback failed user transfer",
          }).catch(() => {});
        }
        await storage.updateTransaction(senderTransaction.id, { status: "failed" });
        await storage.updateTransaction(recipientTransaction.id, { status: "failed" });
        return res.status(400).json({ message: error?.message || "Insufficient balance" });
      }

      // Send email to recipient with fund receipt using Mailtrap
      const { MailtrapService } = await import('./services/mailtrap');
      const mailtrapService = new MailtrapService();
      const transactionDate = new Date().toISOString();
      
      mailtrapService.sendTemplate(
        toUser.email,
        '5e2a2ec4-37fb-4178-96c4-598977065f9c',
        {
          sender: fromUser.fullName,
          amount: amount,
          currency: currency,
          date: transactionDate,
          transaction_id: recipientTransaction.id
        }
      ).then(success => {
        if (success) {
          console.log(`✅ Fund receipt email sent to ${toUser.email} - Transaction ID: ${recipientTransaction.id}, Sender: ${fromUser.fullName}, Amount: ${amount} ${currency}, Date: ${transactionDate}`);
        } else {
          console.warn(`⚠️ Failed to send fund receipt email to ${toUser.email}`);
        }
      }).catch(err => {
        console.error('Email sending error:', err);
      });

      // Send notifications to both users
      const { messagingService } = await import('./services/messaging');
      
      // Send SMS/WhatsApp to sender
      messagingService.sendMessage(
        fromUser.phone,
        `You sent $${transferAmount} to ${toUser.fullName}. Your new balance: $${senderNewBalance.toFixed(2)}`
      ).catch(err => console.error('Notification error:', err));

      // Send SMS/WhatsApp to recipient
      messagingService.sendMessage(
        toUser.phone,
        `You received $${transferAmount} from ${fromUser.fullName}. Your new balance: $${recipientNewBalance.toFixed(2)}`
      ).catch(err => console.error('Notification error:', err));

      console.log(`[Transfer] Completed: $${transferAmount} from ${fromUser.fullName} (${fromUserId}) to ${toUser.fullName} (${toUserId})`);

      res.json({ 
        success: true, 
        transferId,
        message: "Transfer completed successfully",
        senderNewBalance: senderNewBalance.toFixed(2),
        recipientNewBalance: recipientNewBalance.toFixed(2)
      });
    } catch (error) {
      console.error('Transfer error:', error);
      res.status(500).json({ message: "Error processing transfer" });
    }
  });

  app.post("/api/auth/reset-pin", async (req, res) => {
    try {
      const { phone, code, newPin } = req.body;
      
      if (!phone || !code || !newPin) {
        return res.status(400).json({ message: "Phone, code, and new PIN are required" });
      }

      if (!/^\d{4}$/.test(newPin)) {
        return res.status(400).json({ message: "PIN must be 4 digits" });
      }

      const { messagingService } = await import('./services/messaging');
      
      let user;
      if (phone.includes('@')) {
        user = await storage.getUserByEmail(phone);
      } else {
        const formattedPhone = messagingService.formatPhoneNumber(phone);
        user = await storage.getUserByPhone(formattedPhone);
      }

      if (!user) {
        console.error(`[ResetPIN] User not found for contact: ${phone}`);
        return res.status(404).json({ message: "User not found" });
      }

      // Verify reset code
      const isValid = await storage.verifyUserOtp(user.id, code);
      if (!isValid) {
        return res.status(400).json({ message: "Invalid or expired reset code" });
      }

      // Hash and update PIN
      const hashedPin = await bcrypt.hash(newPin, 10);
      await storage.updateUser(user.id, { 
        pinCode: hashedPin,
        pinEnabled: true 
      });

      // Clear OTP
      await storage.updateUserOtp(user.id, null, null);

      // Log activity
      console.log(`[ResetPIN] Success for user ${user.id}`);
      
      res.json({ success: true, message: "PIN reset successful" });
    } catch (error) {
      console.error('Reset PIN error:', error);
      res.status(500).json({ message: "Failed to reset PIN" });
    }
  });

  // PIN management endpoints
  app.post("/api/users/:id/pin/setup", requireAuth, async (req, res) => {
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

      // Hash the PIN
      const hashedPin = await bcrypt.hash(pin, 10);

      // Update user with PIN
      await storage.updateUser(id, { 
        pinCode: hashedPin,
        pinEnabled: true
      });

      // Get updated user
      const updatedUser = await storage.getUser(id);
      const { password: _, ...userResponse } = updatedUser;

      res.json({ message: "PIN set successfully", user: userResponse });
    } catch (error) {
      console.error('PIN setup error:', error);
      res.status(500).json({ message: "Failed to set PIN" });
    }
  });

  app.post("/api/users/:id/pin/verify", requireAuth, async (req, res) => {
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

      // Check if PIN is enabled
      if (!user.pinEnabled || !user.pinCode) {
        return res.status(400).json({ message: "PIN not set up", success: false });
      }

      // Verify PIN
      const isPinValid = await bcrypt.compare(pin, user.pinCode);
      if (!isPinValid) {
        return res.status(401).json({ message: "Invalid PIN", success: false });
      }

      res.json({ success: true, message: "PIN verified" });
    } catch (error) {
      console.error('PIN verification error:', error);
      res.status(500).json({ message: "PIN verification failed", success: false });
    }
  });

  // Login PIN verification endpoint
  app.post("/api/auth/verify-pin", async (req, res) => {
    try {
      const { userId, pin } = req.body;

      if (!userId || !pin) {
        return res.status(400).json({ message: "User ID and PIN are required" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify PIN
      if (!user.pinEnabled || !user.pinCode) {
        return res.status(400).json({ message: "PIN not set up" });
      }

      const isPinValid = await bcrypt.compare(pin, user.pinCode);
      if (!isPinValid) {
        return res.status(401).json({ message: "Invalid PIN" });
      }

      // Complete login session
      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regeneration error:', err);
          return res.status(500).json({ message: "Session error" });
        }

        (req.session as any).userId = user.id;
        (req.session as any).user = { id: user.id, email: user.email };

        storage.createLoginHistory({
          userId: user.id,
          ipAddress: req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'Unknown',
          userAgent: req.headers['user-agent'] || 'Unknown',
          deviceType: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop',
          browser: req.headers['user-agent']?.split('/')[0] || 'Unknown',
          location: (req.headers['cf-ipcountry'] as string) || 'Unknown',
          status: 'success',
        }).catch(err => console.error('Login history error:', err));

        const { password: _, ...userResponse } = user;

        req.session.save((saveErr) => {
          if (saveErr) {
            console.error('Session save error:', saveErr);
            return res.status(500).json({ message: "Session save error" });
          }
          res.json({ user: userResponse });
        });
      });
    } catch (error) {
      console.error('PIN login verification error:', error);
      res.status(500).json({ message: "PIN verification failed" });
    }
  });

  // PIN disable/reset endpoint
  app.post("/api/users/:id/pin/disable", requireAuth, async (req, res) => {
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

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid password" });
      }

      // Disable PIN
      const { db } = await import('./db');
      const { users } = await import('../shared/schema');
      const { eq } = await import('drizzle-orm');
      
      await db.update(users).set({
        pinEnabled: false,
        pinCode: null
      }).where(eq(users.id, id));

      // Get updated user
      const updatedUser = await storage.getUser(id);
      
      // Update session if it exists
      if (req.session.user) {
        req.session.user.pinEnabled = false;
      }

      const { password: _, ...userResponse } = updatedUser;
      res.json({ success: true, message: "PIN disabled successfully", user: userResponse });
    } catch (error) {
      console.error('PIN disable error:', error);
      res.status(500).json({ message: "Failed to disable PIN" });
    }
  });

  // Get system settings for admin-to-user sync
  app.get("/api/system-settings", async (req, res) => {
    try {
      const settings = await storage.getSystemSettings();
      const settingsMap: any = {};
      
      settings.forEach(setting => {
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
      console.error('System settings error:', error);
      res.status(500).json({ message: "Failed to load system settings" });
    }
  });

  // Notification endpoints
  app.get("/api/notifications/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Get user-specific notifications and global notifications
      const userNotifications = await storage.getNotificationsByUserId(userId);
      const globalNotifications = await storage.getGlobalNotifications();
      
      // Combine and sort by created date
      const allNotifications = [...userNotifications, ...globalNotifications]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      res.json({ notifications: allNotifications });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: "Error fetching notifications" });
    }
  });

  app.post("/api/notifications/:id/read", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.markNotificationAsRead(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: "Error updating notification" });
    }
  });

  app.delete("/api/notifications/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteNotification(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ message: "Error deleting notification" });
    }
  });

  // Admin withdrawal management endpoints
  app.get("/api/admin/withdrawals", requireAdminAuth, async (req, res) => {
    try {
      const transactionResult = await storage.getAllTransactions();
      // DatabaseStorage returns an array while the legacy MemStorage
      // implementation returns a paginated object.
      const transactions = Array.isArray(transactionResult)
        ? transactionResult
        : transactionResult.transactions;
      const withdrawals = transactions.filter(t => t.type === 'withdraw');
      
      // Get user info for each withdrawal
      const withdrawalsWithUserInfo = await Promise.all(
        withdrawals.map(async (withdrawal) => {
          const user = await storage.getUser(withdrawal.userId);
          return {
            ...withdrawal,
            adminNotes: withdrawal.failureReason,
            processedAt: withdrawal.completedAt,
            provider: (withdrawal.metadata as any)?.provider || null,
            providerReference: (withdrawal.metadata as any)?.providerReference || null,
            retryCount: (withdrawal.metadata as any)?.retryCount || 0,
            refundStatus: (withdrawal.metadata as any)?.refundStatus || (withdrawal.status === "failed" ? "completed" : "not_applicable"),
            userInfo: {
              fullName: user?.fullName || 'Unknown',
              email: user?.email || 'Unknown',
              phone: user?.phone || 'Unknown'
            }
          };
        })
      );
      
      res.json({ withdrawals: withdrawalsWithUserInfo });
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      res.status(500).json({ message: "Error fetching withdrawal requests" });
    }
  });

  app.post("/api/admin/withdrawals/:id/approve", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { adminNotes } = req.body;
      const previousTransaction = await storage.getTransaction(id);
      if (!previousTransaction) return res.status(404).json({ message: "Withdrawal not found" });
      if (previousTransaction.status === "completed") {
        return res.json({ transaction: previousTransaction, message: "Withdrawal was already approved" });
      }
      if (previousTransaction.status !== "pending") {
        return res.status(409).json({ message: `Withdrawal is already ${previousTransaction.status}` });
      }
      
      const user = await storage.getUser(previousTransaction.userId);
      if (!user) return res.status(404).json({ message: "Withdrawal owner not found" });
      const totalDeduction = parseFloat(previousTransaction.amount) + parseFloat(previousTransaction.fee || "0");
      const wallet = await getUserWallet(user.id, previousTransaction.currency);
      if (!wallet) return res.status(400).json({ message: `${previousTransaction.currency} wallet not found` });

      // Settle the hold and ledger debit atomically before marking the request
      // completed. This prevents a failed settlement from creating a false
      // successful withdrawal.
      await settleWalletWithdrawal(wallet.id, user.id, previousTransaction.currency, totalDeduction, previousTransaction.id);
      const notes = adminNotes || "Approved by admin";
      const transaction = await storage.updateTransaction(id, {
        status: "completed",
        description: previousTransaction.description,
        failureReason: notes,
        completedAt: new Date(),
      });

      if (transaction) {
        await addWithdrawalEvent(transaction, {
          status: "completed",
          title: "Withdrawal completed",
          description: notes,
          provider: req.body.provider || null,
          providerReference: req.body.providerReference || null,
          refundStatus: "not_applicable",
        });
        await sendAccountEmail(user, "withdrawal_completed", {
          amount: String(transaction.amount),
          currency: transaction.currency,
          transaction_id: transaction.id,
          reference: transaction.reference || transaction.id,
          status: "Completed",
        });
        await notificationService.sendNotification({
          title: "Withdrawal Approved",
          body: `Your withdrawal of ${transaction.currency} ${transaction.amount} has been approved and processed.`,
          userId: user.id,
          type: "transaction"
        });
      }
      
      res.json({ transaction, message: "Withdrawal approved successfully" });
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      res.status(500).json({ message: "Error approving withdrawal" });
    }
  });

  app.post("/api/admin/withdrawals/:id/reject", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { adminNotes } = req.body;
      
      const previousTransaction = await storage.getTransaction(id);
      if (!previousTransaction) return res.status(404).json({ message: "Withdrawal not found" });
      if (previousTransaction.status !== "pending") {
        return res.status(409).json({ message: `Withdrawal is already ${previousTransaction.status}` });
      }
      const transaction = await storage.updateTransaction(id, {
        status: 'failed',
        failureReason: adminNotes || 'Rejected by admin',
      });
      
      if (transaction) {
        // REFUND the balance to user since withdrawal was rejected
        const user = await storage.getUser(transaction.userId);
        if (user) {
          const refundAmount = parseFloat(transaction.amount) + parseFloat(transaction.fee || '0');
          const wallet = await getUserWallet(transaction.userId, transaction.currency);
          if (wallet) {
            await releaseWalletWithdrawal(wallet.id, refundAmount);
          }
          await addWithdrawalEvent(transaction, {
            status: "refunded",
            title: "Withdrawal rejected and refunded",
            description: adminNotes || "Rejected by admin",
            refundStatus: "completed",
            providerReference: req.body.providerReference || null,
          });
          await sendAccountEmail(user, "withdrawal_refunded", {
            amount: String(refundAmount),
            currency: transaction.currency,
            transaction_id: transaction.id,
            reference: transaction.reference || transaction.id,
            status: "Refunded",
            refund_status: "Completed",
          });
          console.log(`✅ Released ${transaction.currency} ${refundAmount} withdrawal hold for ${user.email}`);
          
          // Notify user
          await notificationService.sendNotification({
            title: "Withdrawal Rejected & Refunded",
            body: `Your withdrawal request has been rejected. ${transaction.currency} ${refundAmount} has been refunded to your account. ${adminNotes || 'Please contact support for details.'}`,
            userId: user.id,
            type: "transaction"
          });
        }
      }
      
      res.json({ transaction, message: "Withdrawal rejected and balance refunded" });
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      res.status(500).json({ message: "Error rejecting withdrawal" });
    }
  });

  // Admin notification broadcast
  app.post("/api/admin/broadcast-notification", async (req, res) => {
    try {
      const { title, message, type, actionUrl, expiresIn } = req.body;
      
      if (!title || !message) {
        return res.status(400).json({ message: "Title and message are required" });
      }
      
      const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 60 * 1000) : null;
      
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
      console.error('Error broadcasting notification:', error);
      res.status(500).json({ message: "Error broadcasting notification" });
    }
  });

  app.get("/api/admin/notifications", async (req, res) => {
    try {
      const globalNotifications = await storage.getGlobalNotifications();
      res.json({ notifications: globalNotifications });
    } catch (error) {
      console.error('Error fetching admin notifications:', error);
      res.status(500).json({ message: "Error fetching notifications" });
    }
  });

  // Delete notification
  app.delete("/api/admin/notifications/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      await storage.deleteNotification(id);
      
      res.json({ 
        success: true, 
        message: "Notification deleted successfully" 
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ message: "Error deleting notification" });
    }
  });

  // System logs endpoints
  app.get("/api/admin/system-logs", async (req, res) => {
    try {
      const minutes = req.query.minutes ? parseInt(req.query.minutes as string) : 30;
      const logs = await storage.getSystemLogs(minutes);
      res.json({ logs });
    } catch (error) {
      console.error('Error fetching system logs:', error);
      res.status(500).json({ message: "Error fetching system logs" });
    }
  });

  // Update withdrawal status
  app.put("/api/admin/withdrawals/:id/status", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, adminNotes, provider, providerReference, retryCount, refundStatus } = req.body;
      
      if (!status || !['pending', 'processing', 'retrying', 'completed', 'failed', 'refunded'].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be pending, processing, retrying, completed, failed, or refunded." });
      }
      
      const existing = await storage.getTransaction(id);
      if (!existing || existing.type !== "withdraw") {
        return res.status(404).json({ message: "Withdrawal request not found" });
      }
      if (status === "completed" && existing.status === "pending") {
        const user = await storage.getUser(existing.userId);
        const wallet = user ? await getUserWallet(user.id, existing.currency) : undefined;
        if (!user || !wallet) return res.status(400).json({ message: "Withdrawal wallet not found" });
        await settleWalletWithdrawal(
          wallet.id,
          user.id,
          existing.currency,
          parseFloat(existing.amount) + parseFloat(existing.fee || "0"),
          existing.id,
        );
      } else if (status === "failed" && existing.status === "pending") {
        const wallet = await getUserWallet(existing.userId, existing.currency);
        if (wallet) {
          await releaseWalletWithdrawal(wallet.id, parseFloat(existing.amount) + parseFloat(existing.fee || "0"));
        }
      }
      const updatedWithdrawal = await storage.updateTransaction(id, {
        status,
        failureReason: adminNotes || (status === "completed" ? "Approved by admin" : status === "failed" ? "Rejected by admin" : null),
        completedAt: status !== "pending" ? new Date() : null,
        metadata: {
          ...((existing.metadata as Record<string, unknown>) || {}),
          ...(provider ? { provider } : {}),
          ...(providerReference ? { providerReference } : {}),
          ...(retryCount !== undefined ? { retryCount: Number(retryCount) || 0 } : {}),
          ...(refundStatus ? { refundStatus } : {}),
        },
      });
      
      if (!updatedWithdrawal) {
        return res.status(404).json({ message: "Withdrawal request not found" });
      }
      
      if (updatedWithdrawal) {
        const eventStatus = status === "failed" && (refundStatus === "completed" || existing.status === "pending") ? "refunded" : status;
        await addWithdrawalEvent(updatedWithdrawal, {
          status: eventStatus,
          title: eventStatus === "refunded" ? "Withdrawal refunded" : `Withdrawal ${status}`,
          description: adminNotes || undefined,
          provider,
          providerReference,
          retryCount: Number(retryCount) || 0,
          refundStatus: refundStatus || (eventStatus === "refunded" ? "completed" : "not_applicable"),
        });
        const user = await storage.getUser(updatedWithdrawal.userId);
        const template = eventStatus === "refunded" ? "withdrawal_refunded" : status === "completed" ? "withdrawal_completed" : status === "failed" ? "withdrawal_failed" : status === "processing" ? "withdrawal_processing" : "withdrawal_pending";
        await notificationService.sendNotification({
          title: `Withdrawal ${eventStatus}`,
          body: adminNotes || `Your withdrawal is now ${eventStatus}.`,
          userId: updatedWithdrawal.userId,
          type: "transaction",
          metadata: { actionUrl: `/transactions`, transactionId: updatedWithdrawal.id, withdrawalStatus: eventStatus },
        });
        await sendAccountEmail(user, template, {
          amount: String(updatedWithdrawal.amount),
          currency: updatedWithdrawal.currency,
          transaction_id: updatedWithdrawal.id,
          reference: updatedWithdrawal.reference || updatedWithdrawal.id,
          status: eventStatus,
          reason: adminNotes || "",
          refund_status: refundStatus || "",
        });
      }
      res.json({ 
        withdrawal: updatedWithdrawal,
        message: `Withdrawal status updated to ${status}` 
      });
    } catch (error) {
      console.error('Error updating withdrawal status:', error);
      res.status(500).json({ message: "Error updating withdrawal status" });
    }
  });

  app.get("/api/admin/withdrawals/:id/timeline", requireAdminAuth, async (req, res) => {
    try {
      const transaction = await storage.getTransaction(req.params.id);
      if (!transaction || transaction.type !== "withdraw") return res.status(404).json({ message: "Withdrawal not found" });
      res.json({ transaction, timeline: await storage.getWithdrawalEvents(transaction.id) });
    } catch (error) {
      console.error("Admin withdrawal timeline error:", error);
      res.status(500).json({ message: "Failed to load withdrawal timeline" });
    }
  });

  // System settings endpoint for card price
  app.get("/api/system-settings/card-price", async (req, res) => {
    try {
      const cardPriceSetting = await storage.getSystemSetting("virtual_card", "price");
      const cardPrice = cardPriceSetting?.value || "60.00";
      res.json({ price: cardPrice });
    } catch (error) {
      console.error('Error fetching card price:', error);
      res.status(500).json({ message: "Error fetching card price" });
    }
  });

  // Update system settings card price endpoint
  app.put("/api/system-settings/card-price", async (req, res) => {
    try {
      const { price } = req.body;
      
      if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        return res.status(400).json({ message: "Valid price is required" });
      }
      
      const formattedPrice = parseFloat(price).toFixed(2);
      
      // Check if setting exists
      const existingSetting = await storage.getSystemSetting("virtual_card", "price");
      
      if (existingSetting) {
        // Update existing setting
        await storage.updateSystemSetting(existingSetting.id, { value: formattedPrice });
      } else {
        // Create new setting
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
      console.error('Error updating card price:', error);
      res.status(500).json({ message: "Error updating card price" });
    }
  });

  // Discount enabled setting
  app.get("/api/system-settings/discount-enabled", async (req, res) => {
    try {
      const setting = await storage.getSystemSetting("virtual_card", "discount_enabled");
      const enabled = setting?.value !== "false";
      res.json({ enabled });
    } catch (error) {
      res.status(500).json({ message: "Error fetching discount setting" });
    }
  });

  app.put("/api/system-settings/discount-enabled", async (req, res) => {
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

  // Convert USD to KES endpoint
  app.post("/api/convert-to-kes", async (req, res) => {
    try {
      const { usdAmount } = req.body;
      
      if (!usdAmount || isNaN(parseFloat(usdAmount)) || parseFloat(usdAmount) <= 0) {
        return res.status(400).json({ message: "Valid USD amount is required" });
      }
      
      const kesAmount = await payHeroService.convertUSDtoKES(parseFloat(usdAmount));
      
      res.json({ 
        usdAmount: parseFloat(usdAmount),
        kesAmount: kesAmount,
        exchangeRate: 129
      });
    } catch (error) {
      console.error('Error converting USD to KES:', error);
      res.status(500).json({ message: "Error converting currency" });
    }
  });

  // LOG USER ACTIVITY - Frontend calls this to track pages, actions, attempts
  app.post("/api/log-activity", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
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
        status: status || 'success',
        metadata: metadata || null,
        ipAddress: req.ip || null,
        userAgent: req.headers['user-agent'] || null
      });

      res.json({ success: true, activity });
    } catch (error) {
      console.error('Error logging activity:', error);
      res.status(500).json({ message: "Error logging activity" });
    }
  });

  // USER ACTIVITY TIMELINE - Get all user activities from last 48 hours
  app.get("/api/admin/users/:userId/activity", async (req, res) => {
    try {
      const { userId } = req.params;
      const hours = req.query.hours ? parseInt(req.query.hours as string) : 48;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const now = new Date();
      const timeWindowMs = hours * 60 * 60 * 1000;
      const cutoffTime = new Date(now.getTime() - timeWindowMs);

      // Fetch all data for this user
      const transactions = await storage.getTransactionsByUserId(userId);
      const loginHistory = await storage.getLoginHistoryByUserId(userId, 100);
      const kyc = await storage.getKycByUserId(userId);
      const virtualCard = await storage.getVirtualCardByUserId(userId);
      const userActivities = await storage.getUserActivitiesByUserId(userId, 200);

      // Build unified activity timeline
      const activities: any[] = [];

      // Add page visits and user actions
      userActivities.forEach(act => {
        const actDate = new Date(act.createdAt);
        if (actDate >= cutoffTime) {
          const typeIcons: any = {
            page_visit: '📄',
            action: '⚡',
            attempt: '🔄',
            form_submission: '📝'
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
            icon: typeIcons[act.activityType as string] || '✓'
          });
        }
      });

      // Add transactions
      transactions.forEach(txn => {
        const txnDate = new Date(txn.createdAt);
        if (txnDate >= cutoffTime) {
          activities.push({
            id: txn.id,
            type: txn.type === 'send' ? 'transfer_sent' : txn.type === 'receive' ? 'transfer_received' : txn.type,
            action: txn.type === 'send' ? `Sent $${txn.amount} ${txn.currency}` : txn.type === 'receive' ? `Received $${txn.amount} ${txn.currency}` : `${txn.type}: $${txn.amount}`,
            details: {
              amount: txn.amount,
              currency: txn.currency,
              recipient: txn.recipient || txn.sender,
              status: txn.status,
              description: txn.description
            },
            timestamp: txnDate,
            icon: txn.type === 'send' ? '📤' : txn.type === 'receive' ? '📥' : '💳'
          });
        }
      });

      // Add login history
      loginHistory.forEach(login => {
        const loginDate = new Date(login.createdAt);
        if (loginDate >= cutoffTime) {
          activities.push({
            id: login.id,
            type: 'login',
            action: `Login from ${login.location || 'Unknown Location'}`,
            details: {
              device: login.deviceType,
              browser: login.browser,
              ipAddress: login.ipAddress,
              location: login.location,
              status: login.status
            },
            timestamp: loginDate,
            icon: '🔐'
          });
        }
      });

      // Add KYC updates
      if (kyc) {
        const kycDate = new Date(kyc.updatedAt || kyc.createdAt);
        if (kycDate >= cutoffTime) {
          activities.push({
            id: kyc.id,
            type: 'kyc',
            action: `KYC Status: ${kyc.status}`,
            details: {
              documentType: kyc.documentType,
              status: kyc.status,
              verificationNotes: kyc.verificationNotes
            },
            timestamp: kycDate,
            icon: '📋'
          });
        }
      }

      // Add virtual card activities
      if (virtualCard) {
        const cardDate = new Date(virtualCard.purchaseDate || virtualCard.updatedAt);
        if (cardDate >= cutoffTime) {
          activities.push({
            id: virtualCard.id,
            type: 'card_purchase',
            action: `Virtual Card Purchase - $${virtualCard.purchaseAmount}`,
            details: {
              cardNumber: virtualCard.cardNumber,
              status: virtualCard.status,
              balance: virtualCard.balance
            },
            timestamp: cardDate,
            icon: '💳'
          });
        }
      }

      // Sort by timestamp descending (newest first)
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
      console.error('Error fetching user activity:', error);
      res.status(500).json({ message: "Error fetching user activity" });
    }
  });

  // Admin login as user endpoint
  app.post("/api/admin/login-as-user", async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log('Admin logging in as user:', user.email);
      
      // Create session for the user (simulate login)
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
      console.error('Admin login as user error:', error);
      res.status(500).json({ message: "Error logging in as user" });
    }
  });

  // PayHero transaction status endpoint
  app.get("/api/transaction-status/:reference", async (req, res) => {
    try {
      const { reference } = req.params;
      
      if (!reference) {
        return res.status(400).json({ message: "Transaction reference is required" });
      }

      console.log('Checking transaction status for reference:', reference);
      
      const statusResult = await payHeroService.checkTransactionStatus(reference);
      
      res.json({
        success: statusResult.success,
        status: statusResult.status,
        data: statusResult.data,
        message: statusResult.message
      });
    } catch (error) {
      console.error('Transaction status check error:', error);
      res.status(500).json({ message: "Error checking transaction status" });
    }
  });

  // Withdrawal endpoint
  app.post("/api/transactions", requireAuth, async (req, res) => {
    try {
      const sessionUserId = (req as any).session?.userId;
      const { type, amount, currency, description, recipientDetails } = req.body;
      
      if (!sessionUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      if (type !== 'withdraw') {
        return res.status(400).json({ message: "This endpoint only handles withdrawal requests" });
      }
      
      const withdrawAmount = parseFloat(amount);
      
      if (withdrawAmount <= 0) {
        return res.status(400).json({ message: "Invalid withdrawal amount" });
      }
      
      // Security: users can only create transactions for themselves
      const userId = sessionUserId;
      
      // Get user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if ((user as any).isSuspended) {
        return res.status(403).json({ message: (user as any).suspensionReason || "Your account is suspended. Withdrawals are disabled. Please contact support." });
      }
      
      const normalizedWithdrawalCurrency = normalizeCurrency(currency);
      if (!(await getEnabledCurrencyCodes()).includes(normalizedWithdrawalCurrency)) {
        return res.status(400).json({ message: `${normalizedWithdrawalCurrency} is not an enabled currency` });
      }

      // Fees are configured per currency by the admin. Never trust the fee
      // sent by the browser because it can be modified by a client.
      const currencyFeeSetting = await storage.getSystemSetting(
        "fees",
        `withdrawal_fee_${normalizedWithdrawalCurrency}`,
      );
      const defaultFeeSetting = await storage.getSystemSetting("fees", "withdrawal_fee");
      const withdrawFee = getWithdrawalFee(normalizedWithdrawalCurrency, {
        [`withdrawal_fee_${normalizedWithdrawalCurrency}`]: currencyFeeSetting?.value,
        withdrawal_fee: defaultFeeSetting?.value,
      });
      const matchingWallet = await getUserWallet(userId, normalizedWithdrawalCurrency);
      if (!matchingWallet) {
        return res.status(400).json({ message: `Create a ${normalizedWithdrawalCurrency} wallet before withdrawing` });
      }
      if (matchingWallet?.isSuspended) {
        return res.status(403).json({ message: matchingWallet.suspendReason || `${currency} wallet is suspended. Withdrawals are disabled.` });
      }
      const walletHoldAmount = parseFloat(matchingWallet.holdAmount || "0");
      const withdrawableBalance = walletAvailableBalance(matchingWallet);

      // Check sufficient balance after admin holds
      if (withdrawableBalance < withdrawAmount + withdrawFee) {
        return res.status(400).json({ 
          message: "Insufficient balance",
          currency: currency,
          available: withdrawableBalance.toFixed(2),
          held: walletHoldAmount.toFixed(2),
          required: (withdrawAmount + withdrawFee).toFixed(2)
        });
      }
      
      // Create withdrawal transaction with pending status
      const { totalDeduction: totalHold } = getWithdrawalTotals(withdrawAmount, withdrawFee);
      const holdResult = await reserveWalletWithdrawal(matchingWallet.id, userId, totalHold);
      if (!holdResult) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      const transaction = await storage.createTransaction({
        userId,
        type: 'withdraw' as const,
        amount: amount,
        currency: normalizedWithdrawalCurrency,
        status: 'pending' as const, // Withdrawals start as pending for admin approval
        description,
        fee: withdrawFee.toFixed(2),
        recipientDetails,
        reference: storage.generateTransactionReference()
      });

      await addWithdrawalEvent(transaction, {
        status: "pending",
        title: "Withdrawal request submitted",
        description: "Your withdrawal is waiting for review.",
        metadata: { method: req.body.withdrawMethod || null },
      });
      await sendAccountEmail(user, "withdrawal_pending", {
        amount: String(amount),
        currency: normalizedWithdrawalCurrency,
        transaction_id: transaction.id,
        reference: transaction.reference || transaction.id,
        status: "Pending",
      });
      
      // Send notification to admins about new withdrawal request
      await notificationService.sendNotification({
        title: "Withdrawal Request",
        body: `New withdrawal request: ${currency} ${amount} from ${user.fullName}`,
        userId: userId, // This will be extended to notify admins too
        type: "transaction"
      });
      
      res.json({
        transaction,
        message: "Withdrawal request submitted successfully. It will be processed within 1-3 business days.",
      });
    } catch (error) {
      console.error('Withdrawal error:', error);
      res.status(500).json({ message: "Error processing withdrawal request" });
    }
  });

  // PayHero callback endpoint
  app.post("/api/payhero-callback", async (req, res) => {
    try {
      console.log('PayHero callback received:', JSON.stringify(req.body, null, 2));
      
      const callbackData = req.body;
      const { reference, type } = req.query;
      
      if (!callbackData.response) {
        console.error('Invalid PayHero callback data - missing response');
        return res.status(400).json({ message: "Invalid callback data" });
      }

      const paymentResult = payHeroService.processCallback(callbackData);
      console.log('Processed payment result:', paymentResult);
      
      if (paymentResult.success) {
        if (type === 'virtual-card') {
          // Find the user by phone number from the callback data
          let userId = null;
          let userPhone = null;
          
          // Extract phone from callback data if available
          if (callbackData.response && callbackData.response.phoneNumber) {
            userPhone = callbackData.response.phoneNumber;
          } else if (callbackData.phone) {
            userPhone = callbackData.phone;
          }
          
          // Find user by phone number
          if (userPhone) {
            const users = await storage.getAllUsers();
            const user = users.find(u => u.phone === userPhone);
            if (user) {
              userId = user.id;
            }
          }
          
          // Fallback: find by payment reference in existing transactions (for existing users)
          if (!userId) {
            const transactions = await storage.getAllTransactions();
            for (const transaction of transactions) {
              if (transaction.reference === paymentResult.reference) {
                userId = transaction.userId;
                break;
              }
            }
          }
          
          if (!userId) {
            console.error('Could not find user for payment reference:', paymentResult.reference, 'phone:', userPhone);
            return res.status(200).json({ message: "Payment processed but user not found" });
          }

          // Webhook retries must not create a second active card.
          const existingCards = await storage.getVirtualCardsByUserId(userId);
          if (existingCards.length >= 4) {
            console.log(`Virtual card limit reached for user ${userId}; skipping callback`);
            return res.status(200).json({ message: "Virtual card limit reached" });
          }

          // Create virtual card for the user
          const cardData = {
            userId: userId,
            cardNumber: `5399 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`,
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 3), // 3 years from now
            cvv: Math.floor(100 + Math.random() * 900).toString(),
            balance: 0,
            status: 'active' as const,
            type: 'virtual' as const
          };

          const newCard = await storage.createVirtualCard(cardData);
          console.log('Virtual card created successfully:', newCard.id);

          // Create a transaction record for the card purchase
          const transactionData = {
            userId: userId,
            amount: paymentResult.amount.toString(),
            currency: 'KES',
            status: 'completed' as const,
            type: 'card_purchase' as const,
            description: `Virtual card purchase - Payment via M-Pesa (${paymentResult.mpesaReceiptNumber})`,
            fee: '0.00',
            reference: paymentResult.reference,
            recipientDetails: null
          };

          await storage.createTransaction(transactionData);
          console.log('Card purchase transaction recorded for user:', userId);
        }
        
        console.log('PayHero payment completed successfully');
        res.status(200).json({ message: "Payment processed successfully" });
      } else {
        console.log('PayHero payment failed:', paymentResult.status);
        res.status(200).json({ message: "Payment failed", status: paymentResult.status });
      }
    } catch (error) {
      console.error('PayHero callback processing error:', error);
      res.status(500).json({ message: "Error processing payment callback" });
    }
  });

  // System status endpoint - checks app features health
  app.get("/api/system/status", async (req, res) => {
    try {
      console.log('🔍 System status check initiated');
      
      const statusChecks: any = {
        timestamp: new Date().toISOString(),
        features: {},
        overall: 'healthy'
      };

      // Check if users can access their account
      try {
        await storage.getAllUsers();
        statusChecks.features.accountAccess = { 
          status: 'healthy', 
          message: 'You can log in and access your account',
          icon: '👤'
        };
        console.log('✅ Account Access: Healthy');
      } catch (error) {
        statusChecks.features.accountAccess = { 
          status: 'unhealthy', 
          message: 'Account access is currently unavailable',
          icon: '👤'
        };
        statusChecks.overall = 'degraded';
        console.error('❌ Account Access: Unhealthy', error);
      }

      // Check if file uploads/downloads work with Cloudinary
      try {
        // Just check if Cloudinary is configured
        if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
          statusChecks.features.fileUploads = { 
            status: 'healthy', 
            message: 'Document uploads and profile photos working',
            icon: '📁'
          };
          console.log('✅ File Uploads: Healthy');
        } else {
          statusChecks.features.fileUploads = { 
            status: 'degraded', 
            message: 'File storage not configured - uploads won\'t work',
            icon: '📁'
          };
          console.warn('⚠️ File Uploads: Not configured');
        }
      } catch (error) {
        statusChecks.features.fileUploads = { 
          status: 'degraded', 
          message: 'Document uploads may have issues',
          icon: '📁'
        };
        console.warn('⚠️ File Uploads: Degraded', error);
      }

      // Check if currency exchange works
      try {
        const rate = await exchangeRateService.getExchangeRate('USD', 'KES');
        statusChecks.features.currencyExchange = { 
          status: 'healthy', 
          message: `You can exchange USD to KES (rate: ${rate})`,
          icon: '💱'
        };
        console.log('✅ Currency Exchange: Healthy');
      } catch (error) {
        statusChecks.features.currencyExchange = { 
          status: 'degraded', 
          message: 'Using backup exchange rates',
          icon: '💱'
        };
        console.warn('⚠️ Currency Exchange: Degraded', error);
      }

      // Check if airtime purchase is available
      const statumConfigured = statumService.isConfigured();
      if (statumConfigured) {
        statusChecks.features.airtimePurchase = { 
          status: 'healthy', 
          message: 'You can buy airtime for all networks',
          icon: '📱'
        };
        console.log('✅ Airtime Purchase: Healthy');
      } else {
        statusChecks.features.airtimePurchase = { 
          status: 'unhealthy', 
          message: 'Airtime purchases are temporarily unavailable',
          icon: '📱'
        };
        statusChecks.overall = 'degraded';
        console.warn('⚠️ Airtime Purchase: Unhealthy');
      }

      // Check money transfers
      try {
        const transactions = await storage.getAllTransactions();
        statusChecks.features.moneyTransfers = { 
          status: 'healthy', 
          message: 'You can send and receive money',
          icon: '💸'
        };
        console.log('✅ Money Transfers: Healthy');
      } catch (error) {
        statusChecks.features.moneyTransfers = { 
          status: 'unhealthy', 
          message: 'Money transfers are currently unavailable',
          icon: '💸'
        };
        statusChecks.overall = 'degraded';
        console.warn('⚠️ Money Transfers: Unhealthy', error);
      }

      // Check virtual cards
      try {
        const cards = await storage.getAllVirtualCards();
        statusChecks.features.virtualCards = { 
          status: 'healthy', 
          message: 'You can purchase and manage virtual cards',
          icon: '💳'
        };
        console.log('✅ Virtual Cards: Healthy');
      } catch (error) {
        statusChecks.features.virtualCards = { 
          status: 'unhealthy', 
          message: 'Virtual card services are unavailable',
          icon: '💳'
        };
        console.warn('⚠️ Virtual Cards: Unhealthy', error);
      }

      // Check notifications
      try {
        statusChecks.features.notifications = { 
          status: 'healthy', 
          message: 'You will receive notifications for transactions',
          icon: '🔔'
        };
        console.log('✅ Notifications: Healthy');
      } catch (error) {
        statusChecks.features.notifications = { 
          status: 'degraded', 
          message: 'Notifications may be delayed',
          icon: '🔔'
        };
        console.warn('⚠️ Notifications: Degraded', error);
      }

      console.log(`🏁 System status check completed - Overall: ${statusChecks.overall}`);
      res.json(statusChecks);
    } catch (error) {
      console.error('❌ Status check error:', error);
      res.status(500).json({ 
        overall: 'unhealthy',
        error: 'Failed to perform status check',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Database Connection Check
  app.get("/api/admin/database/check", requireAdminAuth, async (req, res) => {
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

  // User Console Logs Endpoint - Get system logs tied to specific users
  app.get("/api/admin/user-activities", requireAdminAuth, async (req, res) => {
    try {
      const { userId } = req.query;
      
      let query = db.select().from(systemLogs);
      
      // If userId provided, filter by that user's logs
      if (userId && typeof userId === "string") {
        query = query.where((logs) => logs.source.like(`%:${userId}%`));
      }
      
      const activities = await query
        .orderBy(desc(systemLogs.timestamp))
        .limit(500);

      const formattedActivities = activities.map((log) => {
        const data = log.data as any;
        const source = log.source || "";
        const userId = source.split(":")[1] || "system";
        
        return {
          id: log.id,
          userId,
          level: log.level,
          message: log.message,
          source: log.source,
          timestamp: log.timestamp,
          data,
        };
      });

      res.json(formattedActivities);
    } catch (error) {
      console.error("Failed to fetch user activities:", error);
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  // Database Backup & Restore Endpoints
  interface BackupFile {
    id: string;
    filename: string;
    data: Buffer;
    createdAt: Date;
  }
  
  const backups = new Map<string, BackupFile>();

  // Export database backup
  app.post("/api/admin/database/backup", requireAdminAuth, async (req, res) => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupId = `backup_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
      
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
        apiConfigurations: await db.select().from(apiConfigurations),
      };

      const backup = {
        timestamp: new Date().toISOString(),
        version: "1.0",
        tables: Object.keys(tables).reduce((acc, table) => {
          acc[table] = {
            recordCount: tables[table as keyof typeof tables].length,
            columns: Object.keys(tables[table as keyof typeof tables][0] || {})
          };
          return acc;
        }, {} as any),
        data: tables
      };

      const jsonData = JSON.stringify(backup, null, 2);
      const buffer = Buffer.from(jsonData);
      const filename = `greenpay_backup_${timestamp}.json`;

      backups.set(backupId, {
        id: backupId,
        filename,
        data: buffer,
        createdAt: new Date()
      });

      const totalRecords = Object.values(tables).reduce((sum, arr) => sum + arr.length, 0);
      
      res.json({
        success: true,
        backup: {
          id: backupId,
          filename,
          createdAt: new Date().toISOString(),
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

  // Download backup file
  app.get("/api/admin/database/backup/:id/download", requireAdminAuth, async (req, res) => {
    try {
      const backup = backups.get(req.params.id);
      if (!backup) {
        return res.status(404).json({ error: "Backup not found" });
      }

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${backup.filename}"`);
      res.send(backup.data);
    } catch (error) {
      console.error("Download backup error:", error);
      res.status(500).json({ error: "Failed to download backup" });
    }
  });

  // Helper function for database restore logic (shared between authenticated and unauthenticated endpoints)
  const performDatabaseRestore = async (fileBuffer: Buffer) => {
    const backup = JSON.parse(fileBuffer.toString());
    
    if (!backup.data || !backup.version) {
      throw new Error("Invalid backup file format");
    }

    const recordsRestored: { [key: string]: number } = {};

    // Restore users
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

    // Restore other tables
    const tableMap: { [key: string]: any } = {
      admins, kycDocuments, virtualCards, recipients, transactions,
      paymentRequests, chatMessages, notifications, supportTickets,
      conversations, messages, adminLogs, systemLogs, systemSettings, apiConfigurations
    };

    for (const [tableName, tableData] of Object.entries(backup.data)) {
      if (tableName === 'users' || !Array.isArray(tableData)) continue;
      
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

  // Restore database from backup (AUTHENTICATED - admin panel)
  app.post("/api/admin/database/restore", requireAdminAuth, backupUpload.single("file"), async (req, res) => {
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

  // Restore database from backup (UNAUTHENTICATED - login page only)
  app.post("/api/admin/database/restore-public", backupUpload.single("file"), async (req, res) => {
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

  // SEO - XML Sitemap for Google Search Console
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const baseUrl = 'https://geepay.us';
      const today = new Date().toISOString().split('T')[0];

      // Define all public pages that should be indexed by Google
      // Only include pages accessible without authentication
      const publicPages = [
        // Core marketing pages
        { url: '/', priority: '1.0', changefreq: 'daily', desc: 'Homepage - International Money Transfer to Kenya' },
        { url: '/login', priority: '0.9', changefreq: 'monthly', desc: 'Login to Geepay Account' },
        { url: '/signup', priority: '0.9', changefreq: 'monthly', desc: 'Sign Up for Geepay' },
        { url: '/status', priority: '0.8', changefreq: 'daily', desc: 'System Status & Service Health' },
        
        // Auth flow pages (public but lower priority)
        { url: '/auth/forgot-password', priority: '0.5', changefreq: 'monthly', desc: 'Reset Password' },
        { url: '/auth/reset-password', priority: '0.5', changefreq: 'monthly', desc: 'Create New Password' },
        { url: '/auth/otp-verification', priority: '0.4', changefreq: 'monthly', desc: 'OTP Verification' },
        
        // Feature landing pages (for SEO targeting)
        { url: '/features/send-money', priority: '0.9', changefreq: 'weekly', desc: 'Send Money to Kenya - Fast & Secure' },
        { url: '/features/virtual-cards', priority: '0.9', changefreq: 'weekly', desc: 'Virtual Cards for Online Payments' },
        { url: '/features/exchange', priority: '0.8', changefreq: 'weekly', desc: 'USD to KES Exchange - Best Rates' },
        { url: '/features/airtime', priority: '0.7', changefreq: 'weekly', desc: 'Buy Airtime for Kenya' },
        
        // Information pages
        { url: '/about', priority: '0.7', changefreq: 'monthly', desc: 'About Geepay' },
        { url: '/pricing', priority: '0.8', changefreq: 'weekly', desc: 'Pricing & Fees' },
        { url: '/security', priority: '0.7', changefreq: 'monthly', desc: 'Security & Compliance' },
        { url: '/help', priority: '0.6', changefreq: 'weekly', desc: 'Help Center & FAQ' },
        { url: '/contact', priority: '0.6', changefreq: 'monthly', desc: 'Contact Support' },
      ];

      // Generate XML sitemap with comments
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <!-- Geepay - International Money Transfer & Digital Wallet -->
  <!-- Target Keywords: send money to Kenya, USD to KES, international remittance, virtual cards -->
${publicPages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

      res.header('Content-Type', 'application/xml');
      res.header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Robots.txt for search engines
  app.get('/robots.txt', (req, res) => {
    const robotsTxt = `User-agent: *
Disallow: /admin/
Disallow: /api/

Sitemap: https://geepay.us/sitemap.xml`;

    res.header('Content-Type', 'text/plain');
    res.send(robotsTxt);
  });

  const httpServer = createServer(app);

  // Set up WebSocket server for real-time log streaming
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/logs' });
  
  // Store for connected log clients
  const logClients = new Set<WebSocket>();
  
  // Log streaming service
  class LogStreamService {
    static broadcast(logEntry: any) {
      const message = JSON.stringify(logEntry);
      logClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          try {
            client.send(message);
          } catch (error) {
            console.error('Error sending log to client:', error);
            logClients.delete(client);
          }
        } else {
          logClients.delete(client);
        }
      });
    }

    static createLogEntry(level: string, message: string, source?: string, data?: any) {
      return {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        level,
        message,
        source,
        data
      };
    }
  }

  // Handle WebSocket connections for logs
  wss.on('connection', (ws) => {
    console.log('Log client connected');
    logClients.add(ws);
    
    // Send welcome message
    ws.send(JSON.stringify(
      LogStreamService.createLogEntry('info', 'Connected to log stream', 'websocket')
    ));

    ws.on('close', () => {
      console.log('Log client disconnected');
      logClients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      logClients.delete(ws);
    });
  });

  // Override console methods to capture logs
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleInfo = console.info;

  console.log = (...args: any[]) => {
    originalConsoleLog(...args);
    const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
    LogStreamService.broadcast(LogStreamService.createLogEntry('info', message, 'console'));
  };

  console.error = (...args: any[]) => {
    originalConsoleError(...args);
    const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
    LogStreamService.broadcast(LogStreamService.createLogEntry('error', message, 'console'));
  };

  console.warn = (...args: any[]) => {
    originalConsoleWarn(...args);
    const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
    LogStreamService.broadcast(LogStreamService.createLogEntry('warn', message, 'console'));
  };

  console.info = (...args: any[]) => {
    originalConsoleInfo(...args);
    const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
    LogStreamService.broadcast(LogStreamService.createLogEntry('info', message, 'console'));
  };

  // Integrate log streaming with existing middleware (handled in index.ts)
  // Export LogStreamService globally for use by existing middleware
  (global as any).LogStreamService = LogStreamService;

  // DISABLED: Legacy WebSocket chat system that was causing message leakage between users
  // The main chat system now uses REST API with proper user isolation
  
  // Set up WebSocket server for admin monitoring only (not for chat messages)
  const chatWss = new WebSocketServer({ server: httpServer, path: '/ws' });
  console.log('✅ Live support chat WebSocket server initialized on /ws (admin monitoring only)');

  // Track active admin connections only
  const activeAdminConnections = new Map<string, { socket: WebSocket, adminId: string }>();

  chatWss.on('connection', (ws, req) => {
    console.log('New WebSocket connection established');
    
    // Determine if this is an admin connection
    const session = (req as any).session;
    const isAdmin = !!session?.admin?.id;
    const userId = isAdmin ? 'admin' : session?.userId;

    ws.on('message', async (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.type === 'register') {
          (ws as any).userId = parsed.userId || userId;
          (ws as any).isAdmin = parsed.isAdmin || isAdmin;
          console.log(`Registered connection: ${(ws as any).userId} (Admin: ${(ws as any).isAdmin})`);
          
          if ((ws as any).isAdmin) {
             activeAdminConnections.set((ws as any).userId, {
                socket: ws,
                adminId: (ws as any).userId
              });
          }
          return;
        }
        
        switch (parsed.type) {
          case 'admin_register':
            if (parsed.isAdmin && parsed.adminId) {
              activeAdminConnections.set(parsed.adminId, {
                socket: ws,
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
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      // Remove admin connection when client disconnects
      for (const [adminId, connection] of activeAdminConnections.entries()) {
        if (connection.socket === ws) {
          activeAdminConnections.delete(adminId);
          console.log(`Admin ${adminId} disconnected from live chat monitoring`);
          break;
        }
      }
    });
  });

  // Get template parameter requirements from Meta
  app.get("/api/admin/whatsapp/template-parameters/:templateName", requireAdminAuth, async (req, res) => {
    try {
      const { templateName } = req.params;
      const { whatsappService } = await import('./services/whatsapp');
      
      const paramInfo = await whatsappService.getTemplateParameters(templateName);
      const template = await whatsappService.getTemplateDetails(templateName);
      
      res.json({
        templateName,
        status: template?.status || 'UNKNOWN',
        language: paramInfo.language,
        requiredParameters: paramInfo.required,
        parameterCount: paramInfo.paramCount,
        parameterLabels: paramInfo.required.map((p, i) => `${p} (position ${i + 1})`),
        description: `Template requires ${paramInfo.paramCount} parameters: ${paramInfo.required.join(', ') || 'none'}`,
        components: paramInfo.components,
        source: 'meta'
      });
    } catch (error) {
      console.error('[Admin] Get template parameters error:', error);
      res.status(500).json({ message: "Failed to get template parameters from Meta" });
    }
  });

  // Send template to individual user - Dynamic for any Meta template
  app.post("/api/admin/whatsapp/send-template", requireAdminAuth, async (req, res) => {
    try {
      const { userId, templateName, parameters } = req.body;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { whatsappService } = await import('./services/whatsapp');
      const { messagingService } = await import('./services/messaging');

      // Get available templates from Meta to verify it exists
      const templates = await whatsappService.fetchTemplatesFromMeta();
      const template = templates.find((t: any) => t.name === templateName);
      
      if (!template) {
        return res.status(404).json({ message: `Template "${templateName}" not found in Meta` });
      }

      if (template.status !== 'APPROVED') {
        return res.status(400).json({ 
          message: `Template "${templateName}" is not approved. Status: ${template.status}`,
          status: template.status
        });
      }

      // Special handling for templates with known handlers
      let success = false;
      let errorMsg: string | undefined;

      switch (templateName) {
        case 'otp':
          const otpCode = parameters?.code || messagingService.generateOTP();
          success = await whatsappService.sendOTP(user.phone, otpCode);
          console.log('[Admin] OTP template sent', { userId, templateName, success });
          break;

        case 'password_reset':
          const pwdCode = parameters?.code || messagingService.generateOTP();
          success = await whatsappService.sendPasswordReset(user.phone, pwdCode);
          console.log('[Admin] Password reset template sent', { userId, templateName, success });
          break;

        case 'create_acc':
          success = await whatsappService.sendAccountCreation(user.phone, user.fullName || 'User');
          console.log('[Admin] Create account template sent', { userId, templateName, success });
          break;

        case 'kyc_verified':
          success = await whatsappService.sendKYCVerified(user.phone);
          console.log('[Admin] KYC verified template sent', { userId, templateName, success });
          break;

        case 'card_activation':
          success = await whatsappService.sendCardActivation(user.phone, parameters?.lastFour || '0000');
          console.log('[Admin] Card activation template sent', { userId, templateName, success });
          break;

        case 'fund_receipt':
          success = await whatsappService.sendFundReceipt(
            user.phone,
            parameters?.currency || 'KES',
            parameters?.amount || '0',
            parameters?.sender || 'Unknown Sender'
          );
          console.log('[Admin] Fund receipt template sent', { userId, templateName, success });
          break;

        case 'login_alert':
          success = await whatsappService.sendLoginAlert(
            user.phone,
            parameters?.location || 'Unknown',
            parameters?.ip || 'Unknown IP'
          );
          console.log('[Admin] Login alert template sent', { userId, templateName, success });
          break;

        // Generic handler for any other approved template
        default:
          // Validate parameters before sending
          const validation = await whatsappService.validateTemplateParameters(templateName, parameters || {});
          if (!validation.valid) {
            return res.status(400).json({ 
              message: validation.error || 'Parameter validation failed',
              templateName,
              required: validation.required,
              provided: validation.provided,
              hint: `Provide ${validation.required} parameters for this template`
            });
          }
          
          // Send the template
          const result = await whatsappService.sendTemplateGeneric(user.phone, templateName, parameters || {});
          success = result.success;
          errorMsg = result.error;
          
          if (!success && result.error) {
            console.error('[Admin] Generic template send error:', { userId, templateName, error: result.error });
          } else {
            console.log('[Admin] Generic template sent', { userId, templateName, success });
          }
          break;
      }

      // Return appropriate response based on success/failure
      if (success) {
        return res.json({ 
          success: true, 
          templateName, 
          userId, 
          message: 'Template delivered to WhatsApp',
          templateStatus: template.status,
          timestamp: new Date().toISOString()
        });
      } else {
        // If failed, return error with details
        return res.status(400).json({ 
          success: false, 
          templateName, 
          userId, 
          message: errorMsg || 'Template delivery failed',
          templateStatus: template.status,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('[Admin] Send template error:', error);
      res.status(500).json({ message: "Failed to send template", error: String(error) });
    }
  });

  // Get Mailtrap settings
  app.get("/api/admin/mailtrap-settings", requireAdminAuth, async (req, res) => {
    try {
      const setting = await storage.getSystemSetting("email", "mailtrap_api_key");
      const apiKey = setting?.value || process.env.MAILTRAP_API_KEY || '';
      const isConfigured = !!apiKey;
      res.json({
        apiKey: isConfigured ? '●●●●●●●●' : '',
        isConfigured
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching Mailtrap settings" });
    }
  });

  // Save Mailtrap API key
  app.post("/api/admin/mailtrap-settings", requireAdminAuth, async (req, res) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey) {
        return res.status(400).json({ message: "API key is required" });
      }

      const trimmedKey = apiKey.trim();

      // Save API key to database (secure storage)
      await storage.setSystemSetting({
        category: "email",
        key: "mailtrap_api_key",
        value: trimmedKey,
        description: "Mailtrap API key for email sending"
      });

      // Also set in environment for current session
      process.env.MAILTRAP_API_KEY = trimmedKey;

      const { mailtrapService } = await import('./services/mailtrap');
      await mailtrapService.refreshApiKey();

      res.json({ success: true, message: "Mailtrap API key saved successfully" });
    } catch (error) {
      console.error('Error saving Mailtrap settings:', error);
      res.status(500).json({ message: "Error saving Mailtrap settings" });
    }
  });

  // Send test email via Mailtrap
  app.post("/api/admin/mailtrap-test", requireAdminAuth, async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const { mailtrapService } = await import('./services/mailtrap');
      const success = await mailtrapService.sendCustomTemplate(email, 'placeholder-test', {
        first_name: 'Test',
        last_name: 'User'
      });

      if (success) {
        res.json({ success: true, message: "Test email sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send test email" });
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      res.status(500).json({ message: "Error sending test email" });
    }
  });

  // Test Mailtrap template by UUID
  app.post("/api/admin/send-template-test", requireAdminAuth, async (req, res) => {
    try {
      const { email, templateUuid, parameters } = req.body;
      if (!email || !templateUuid) {
        return res.status(400).json({ message: "Email and template UUID are required" });
      }

      const { mailtrapService } = await import('./services/mailtrap');
      const success = await mailtrapService.sendTemplate(email, templateUuid, parameters || {});

      res.json({ 
        success,
        message: success ? 'Template sent successfully' : 'Failed to send template'
      });
    } catch (error) {
      console.error('[Admin] Send template test error:', error);
      res.status(500).json({ message: "Failed to send template" });
    }
  });

  // Get list of users for admin dropdown
  app.get("/api/admin/users-list", requireAdminAuth, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const formattedUsers = users.map((user: any) => ({
        id: user.id,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown User',
        email: user.email,
        phone: user.phone
      }));
      res.json(formattedUsers);
    } catch (error) {
      console.error('[Admin] Get users list error:', error);
      res.status(500).json({ message: "Failed to fetch users list" });
    }
  });

  // Send Mailtrap template to specific user (email only)
  app.post("/api/admin/send-template-to-user", requireAdminAuth, async (req, res) => {
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

      const { mailtrapService } = await import('./services/mailtrap');
      const success = await mailtrapService.sendTemplate(user.email, templateUuid, parameters || {});

      res.json({ 
        success,
        message: success ? 'Template email sent to user successfully' : 'Failed to send template to user'
      });
    } catch (error) {
      console.error('[Admin] Send template to user error:', error);
      res.status(500).json({ message: "Failed to send template to user" });
    }
  });

  // WhatsApp webhook - verification endpoint
  app.get("/api/whatsapp/webhook", async (req, res) => {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "greenpay_verify_token_2024";
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === verifyToken) {
      console.log("[WhatsApp] ✓ Webhook verified");
      res.status(200).send(challenge);
    } else {
      console.error("[WhatsApp] ✗ Webhook verification failed");
      res.status(403).send("Forbidden");
    }
  });

  // WhatsApp webhook - receive messages and status updates
  app.post("/api/whatsapp/webhook", async (req, res) => {
    try {
      const body = req.body;
      
      if (body.object === "whatsapp_business_account") {
        const entries = body.entry || [];
        for (const entry of entries) {
          const changes = entry.changes || [];
          for (const change of changes) {
            // Handle message status updates (delivered, read, sent, failed)
            if (change.field === "message_status") {
              const statuses = change.value?.statuses || [];
              for (const status of statuses) {
                const messageId = status.id;
                const statusType = status.status; // sent, delivered, read, failed
                console.log('[WhatsApp] Message status update:', { messageId, status: statusType, timestamp: status.timestamp });
                
                // Update message status in database
                const messages = await storage.getWhatsappMessageByMessageId(messageId);
                if (messages && messages.length > 0) {
                  await storage.updateWhatsappMessageStatus(messages[0].id, statusType);
                  console.log('[WhatsApp] Updated message status to:', statusType);
                }
              }
            }
            
            // Handle typing indicator and online status
            if (change.field === "message_template_status_update") {
              const statuses = change.value?.statuses || [];
              for (const status of statuses) {
                console.log('[WhatsApp] Template status:', { status: status.status });
              }
            }
            
            // Handle messaging product status (includes typing_on, typing_off, read)
            if (change.field === "message_template_status_update" || change.field === "messaging_product") {
              const phoneNumber = change.value?.contacts?.[0]?.wa_id;
              
              // Check for typing indicators in the webhook
              if (change.value?.messages) {
                for (const msg of change.value.messages) {
                  if (msg.type === 'typing') {
                    console.log('[WhatsApp] User typing indicator received from:', phoneNumber);
                  } else if (msg.type === 'read') {
                    console.log('[WhatsApp] User read receipt received from:', phoneNumber);
                  }
                }
              }
            }
            
            // Handle read receipts and online status
            if (change.field === "messages") {
              const messages = change.value?.messages || [];
              for (const message of messages) {
                // Track when messages are read
                if (message.type === 'message_read') {
                  console.log('[WhatsApp] Message read:', { messageId: message.id });
                }
              }
            }
            
            // Handle messages
            if (change.field === "messages") {
              const messages = change.value?.messages || [];
              for (const message of messages) {
                const phoneNumber = change.value?.contacts?.[0]?.wa_id;
                const type = message.type; // text, image, video, file, audio
                
                let content = '';
                let mediaUrl = '';

                // Get access token for fetching media URLs
                const [accessTokenSetting] = await Promise.all([
                  storage.getSystemSetting("messaging", "whatsapp_access_token")
                ]);
                const accessToken = accessTokenSetting?.value;

                // Handle different message types - download to Cloudinary
                let messageType = 'text';
                let fileName = '';
                let fileSize = 0;

                if (type === 'text' && message.text?.body) {
                  content = message.text.body;
                } else if (type === 'image' && message.image?.id) {
                  messageType = 'image';
                  const mediaId = message.image.id;
                  const caption = message.image.caption || 'Sent an image';
                  if (accessToken) {
                    try {
                      // Fetch download URL from Meta
                      const mediaResponse = await fetch(`https://graph.facebook.com/v20.0/${mediaId}?fields=url`, {
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                      });
                      if (mediaResponse.ok) {
                        const mediaData = await mediaResponse.json();
                        const downloadUrl = mediaData.url;
                        if (downloadUrl) {
                          // Download from Meta and upload to Cloudinary
                          const imgResponse = await fetch(downloadUrl);
                          const buffer = await imgResponse.arrayBuffer();
                          const bufferObj = Buffer.from(buffer);
                          
                          // Detect actual MIME type from file content
                          const fileTypeInfo = await fileTypeFromBuffer(bufferObj);
                          const actualMimeType = fileTypeInfo?.mime || 'image/jpeg';
                          const ext = fileTypeInfo?.ext || 'jpg';
                          
                          mediaUrl = await cloudinaryStorage.uploadChatFile(
                            bufferObj,
                            `whatsapp-image-${mediaId}.${ext}`,
                            actualMimeType
                          );
                          fileName = `whatsapp-image-${mediaId}.${ext}`;
                          fileSize = buffer.byteLength;
                          console.log('[WhatsApp] Image stored in Cloudinary:', { mediaUrl, size: fileSize, mimeType: actualMimeType });
                        }
                      }
                    } catch (err) {
                      console.error('[WhatsApp] Failed to process image:', err);
                    }
                  }
                  content = caption;
                } else if (type === 'video' && message.video?.id) {
                  messageType = 'video';
                  const mediaId = message.video.id;
                  const caption = message.video.caption || 'Sent a video';
                  if (accessToken) {
                    try {
                      const mediaResponse = await fetch(`https://graph.facebook.com/v20.0/${mediaId}?fields=url`, {
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                      });
                      if (mediaResponse.ok) {
                        const mediaData = await mediaResponse.json();
                        const downloadUrl = mediaData.url;
                        if (downloadUrl) {
                          const vidResponse = await fetch(downloadUrl);
                          const buffer = await vidResponse.arrayBuffer();
                          const bufferObj = Buffer.from(buffer);
                          
                          // Detect actual MIME type from file content
                          const fileTypeInfo = await fileTypeFromBuffer(bufferObj);
                          const actualMimeType = fileTypeInfo?.mime || 'video/mp4';
                          const ext = fileTypeInfo?.ext || 'mp4';
                          
                          mediaUrl = await cloudinaryStorage.uploadChatFile(
                            bufferObj,
                            `whatsapp-video-${mediaId}.${ext}`,
                            actualMimeType
                          );
                          fileName = `whatsapp-video-${mediaId}.${ext}`;
                          fileSize = buffer.byteLength;
                          console.log('[WhatsApp] Video stored in Cloudinary:', { mediaUrl, size: fileSize, mimeType: actualMimeType });
                        }
                      }
                    } catch (err) {
                      console.error('[WhatsApp] Failed to process video:', err);
                    }
                  }
                  content = caption;
                } else if (type === 'file' && message.document?.id) {
                  messageType = 'file';
                  const mediaId = message.document.id;
                  const filename = message.document.filename || 'document';
                  fileName = filename;
                  if (accessToken) {
                    try {
                      const mediaResponse = await fetch(`https://graph.facebook.com/v20.0/${mediaId}?fields=url`, {
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                      });
                      if (mediaResponse.ok) {
                        const mediaData = await mediaResponse.json();
                        const downloadUrl = mediaData.url;
                        if (downloadUrl) {
                          const fileResponse = await fetch(downloadUrl);
                          const buffer = await fileResponse.arrayBuffer();
                          mediaUrl = await cloudinaryStorage.uploadChatFile(
                            Buffer.from(buffer),
                            filename,
                            'application/octet-stream'
                          );
                          fileSize = buffer.byteLength;
                        }
                      }
                    } catch (err) {
                      console.error('[WhatsApp] Failed to process file:', err);
                    }
                  }
                  content = filename;
                } else if (type === 'audio' && message.audio?.id) {
                  const mediaId = message.audio.id;
                  if (accessToken) {
                    try {
                      const mediaResponse = await fetch(`https://graph.facebook.com/v20.0/${mediaId}?fields=url`, {
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                      });
                      if (mediaResponse.ok) {
                        const mediaData = await mediaResponse.json();
                        const downloadUrl = mediaData.url;
                        if (downloadUrl) {
                          const audioResponse = await fetch(downloadUrl);
                          const buffer = await audioResponse.arrayBuffer();
                          mediaUrl = await cloudinaryStorage.uploadChatFile(
                            Buffer.from(buffer),
                            `whatsapp-audio-${mediaId}.ogg`,
                            'audio/ogg'
                          );
                        }
                      }
                    } catch (err) {
                      console.error('[WhatsApp] Failed to process audio:', err);
                    }
                  }
                  content = '[Audio message]';
                } else {
                  continue; // Skip unknown types
                }

                if (phoneNumber && content) {
                  let conversation = await storage.getWhatsappConversation(phoneNumber);
                  if (!conversation) {
                    conversation = await storage.createWhatsappConversation({
                      phoneNumber,
                      displayName: change.value?.contacts?.[0]?.profile?.name || phoneNumber,
                      lastMessageAt: new Date(),
                      status: 'active'
                    });
                  } else {
                    await storage.updateWhatsappConversation(conversation.id, { lastMessageAt: new Date() });
                  }

                  await storage.createWhatsappMessage({
                    conversationId: conversation.id,
                    phoneNumber,
                    content: content,
                    isFromAdmin: false,
                    status: 'received',
                    messageId: message.id,
                    messageType: messageType,
                    fileUrl: mediaUrl || undefined,
                    fileName: fileName || undefined,
                    fileSize: fileSize || undefined
                  });

                  console.log(`[WhatsApp] Received ${type} message from ${phoneNumber}: ${content}`, mediaUrl ? `URL: ${mediaUrl}` : '');
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

  // Get WhatsApp conversations (admin)
  app.get("/api/admin/whatsapp/conversations", requireAdminAuth, async (req, res) => {
    try {
      console.log('[WhatsApp] Fetching conversations');
      const conversations = await storage.getWhatsappConversations();
      console.log('[WhatsApp] Found conversations:', { count: conversations?.length || 0 });
      res.json(conversations || []);
    } catch (error) {
      console.error("[WhatsApp] Get conversations error:", error);
      res.status(500).json({ message: "Failed to fetch conversations", error: String(error) });
    }
  });

  // Get WhatsApp messages for conversation (admin)
  app.get("/api/admin/whatsapp/messages/:conversationId", requireAdminAuth, async (req, res) => {
    try {
      const messages = await storage.getWhatsappMessages(req.params.conversationId);
      res.json(messages);
    } catch (error) {
      console.error("[Admin] Get WhatsApp messages error:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send typing indicator
  app.post("/api/admin/whatsapp/typing", requireAdminAuth, async (req, res) => {
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
      const phoneNumberId = String(phoneIdSetting?.value || '').trim();

      if (!accessToken?.trim() || !phoneNumberId) {
        return res.status(400).json({ message: "WhatsApp not configured" });
      }

      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const finalPhone = cleanPhone.startsWith('254') ? cleanPhone : '254' + cleanPhone.slice(-9);

      const apiUrl = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
      const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: finalPhone,
        type: "typing"
      };

      const apiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (apiResponse.ok) {
        console.log('[WhatsApp] Typing indicator sent to:', finalPhone);
        res.json({ success: true, message: "Typing indicator sent" });
      } else {
        const error = await apiResponse.json();
        console.error('[WhatsApp] Failed to send typing indicator:', error);
        res.status(apiResponse.status).json({ success: false, error });
      }
    } catch (error) {
      console.error("[WhatsApp] Typing indicator error:", error);
      res.status(500).json({ message: "Failed to send typing indicator" });
    }
  });

  // Send WhatsApp message (admin)
  app.post("/api/admin/whatsapp/send", requireAdminAuth, async (req, res) => {
    try {
      const { conversationId, phoneNumber, message, mediaUrl, mediaType } = req.body;
      console.log('[WhatsApp Send] Received request:', { conversationId, phoneNumber, hasMedia: !!mediaUrl, mediaType });
      
      if (!conversationId || !phoneNumber || !message) {
        console.error('[WhatsApp Send] Missing fields');
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Get credentials from messaging settings
      const [accessTokenSetting, phoneIdSetting] = await Promise.all([
        storage.getSystemSetting("messaging", "whatsapp_access_token"),
        storage.getSystemSetting("messaging", "whatsapp_phone_number_id")
      ]);

      const accessToken = accessTokenSetting?.value;
      const phoneNumberId = String(phoneIdSetting?.value || '').trim();
      
      console.log('[WhatsApp Send] Credentials retrieved:', { hasToken: !!accessToken, hasPhoneId: !!phoneNumberId });
      
      if (!accessToken?.trim() || !phoneNumberId) {
        console.error('[WhatsApp Send] Credentials incomplete');
        return res.status(400).json({ message: "WhatsApp not configured in Messaging Settings. Please configure credentials first." });
      }

      // Clean phone number - ensure it starts with country code
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const finalPhone = cleanPhone.startsWith('254') ? cleanPhone : '254' + cleanPhone.slice(-9);
      
      const apiUrl = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
      let payload: any = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: finalPhone,
      };

      if (mediaUrl && mediaType) {
        // Send media message
        const typeMap: any = { 'image': 'image', 'video': 'video', 'file': 'document', 'audio': 'audio' };
        const waType = typeMap[mediaType] || 'document';
        
        payload.type = waType;
        payload[waType] = { link: mediaUrl };
        if (message) {
          payload[waType].caption = message;
        }
        console.log('[WhatsApp Send] Sending media:', { type: waType, phone: finalPhone });
      } else {
        // Send text message
        payload.type = "text";
        payload.text = { body: message };
        console.log('[WhatsApp Send] Sending text:', { phone: finalPhone });
      }

      const apiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const apiData = await apiResponse.json();
      console.log('[WhatsApp Send] Meta API response:', { status: apiResponse.status, msgId: apiData.messages?.[0]?.id, error: apiData.error });

      if (apiResponse.ok && apiData.messages?.[0]?.id) {
        // Extract filename from URL if available
        let fileName = 'media';
        if (mediaUrl) {
          const urlParts = new URL(mediaUrl).pathname.split('/');
          fileName = urlParts[urlParts.length - 1] || 'media';
        }

        const msgRecord = await storage.createWhatsappMessage({
          conversationId,
          phoneNumber,
          content: message || `[${mediaType?.toUpperCase() || 'FILE'}]`,
          isFromAdmin: true,
          status: 'sent',
          messageId: apiData.messages[0].id,
          messageType: mediaUrl ? mediaType || 'file' : 'text',
          fileUrl: mediaUrl,
          fileName: mediaUrl ? fileName : null,
          fileSize: null // We don't have file size on send, but DB can store it
        });

        await storage.updateWhatsappConversation(conversationId, { lastMessageAt: new Date() });
        console.log('[WhatsApp Send] Message saved successfully:', { msgId: msgRecord.id, hasMedia: !!mediaUrl });
        res.json({ success: true, message: msgRecord });
      } else {
        const errorMsg = apiData.error?.message || 'Unknown error from Meta API';
        console.error('[WhatsApp Send] API error:', { status: apiResponse.status, error: errorMsg, data: apiData });
        res.status(500).json({ message: `Failed to send message: ${errorMsg}` });
      }
    } catch (error) {
      console.error("[WhatsApp Send] Error:", error);
      res.status(500).json({ message: "Failed to send message", error: String(error) });
    }
  });

  // Get/Update WhatsApp config (admin)
  app.get("/api/admin/whatsapp/config", requireAdminAuth, async (req, res) => {
    try {
      let config = await storage.getWhatsappConfig();
      console.log('[WhatsApp Config] Get request - config exists:', !!config, 'has token:', !!config?.accessToken);
      if (!config) {
        config = await storage.initWhatsappConfig();
        console.log('[WhatsApp Config] Initialized new config');
      }
      res.json({
        phoneNumberId: config.phoneNumberId || '',
        businessAccountId: config.businessAccountId || '',
        verifyToken: config.verifyToken,
        webhookUrl: process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}/api/whatsapp/webhook` : config.webhookUrl,
        isActive: config.isActive
      });
    } catch (error) {
      console.error("[Admin] Get WhatsApp config error:", error);
      res.status(500).json({ message: "Failed to fetch config" });
    }
  });

  app.post("/api/admin/whatsapp/config", requireAdminAuth, async (req, res) => {
    try {
      const { phoneNumberId, businessAccountId, accessToken, isActive } = req.body;
      console.log('[WhatsApp Config] Saving config:', { phoneNumberId: !!phoneNumberId, businessAccountId: !!businessAccountId, accessToken: !!accessToken, isActive });
      
      const updated = await storage.updateWhatsappConfig({
        phoneNumberId,
        businessAccountId,
        accessToken,
        isActive
      });
      
      console.log('[WhatsApp Config] Saved successfully:', { hasToken: !!updated?.accessToken, hasPhoneId: !!updated?.phoneNumberId });
      
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

  // API Key Management Endpoints
  app.post("/api/api-keys/generate", requireAuth, async (req, res) => {
    try {
      const sessionUserId = (req as any).session?.userId;
      
      if (!sessionUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { name, scope, rateLimit } = req.body;
      
      if (!name || !scope || !Array.isArray(scope)) {
        return res.status(400).json({ error: "Missing required fields: name, scope" });
      }

      const { apiKeyService } = await import('./services/api-key');
      const key = await apiKeyService.generateApiKey(name, scope, rateLimit || 1000, sessionUserId);
      
      res.json({ 
        success: true, 
        key,
        name,
        scope,
        rateLimit: rateLimit || 1000,
        message: "API key generated successfully. Copy it now - you won't see it again!"
      });
    } catch (error) {
      console.error("[API Keys] Generate error:", error);
      res.status(500).json({ error: "Failed to generate API key" });
    }
  });

  app.get("/api/api-keys", requireAuth, async (req, res) => {
    try {
      const sessionUserId = (req as any).session?.userId;
      
      if (!sessionUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Get all API keys and filter by user ID
      const settings = await storage.getSystemSettingsByCategory('api_keys');
      const userApiKeys = settings.filter(s => {
        try {
          const keyData = JSON.parse(typeof s.value === 'string' ? s.value : JSON.stringify(s.value));
          return keyData.userId === sessionUserId;
        } catch (e) {
          return false;
        }
      }).map(s => {
        const keyData = JSON.parse(typeof s.value === 'string' ? s.value : JSON.stringify(s.value));
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

  app.post("/api/api-keys/:keyId/revoke", requireAuth, async (req, res) => {
    try {
      const sessionUserId = (req as any).session?.userId;
      const { keyId } = req.params;
      
      if (!sessionUserId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Verify key belongs to user before revoking
      const settings = await storage.getSystemSettingsByCategory('api_keys');
      const keySettings = settings.find(s => s.key === keyId);
      
      if (!keySettings) {
        return res.status(404).json({ error: "API key not found" });
      }

      const keyData = JSON.parse(typeof keySettings.value === 'string' ? keySettings.value : JSON.stringify(keySettings.value));
      
      // Security: only allow users to revoke their own keys
      if (keyData.userId !== sessionUserId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const { apiKeyService } = await import('./services/api-key');
      
      const success = await apiKeyService.revokeApiKey(keyId);
      
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

  // Get AI Remaining Requests
  app.get("/api/ai/remaining-requests", async (req, res) => {
    try {
      const userId = req.user?.id || null;
      const ipAddress = req.ip || req.connection.remoteAddress || '';
      const remaining = await aiRateLimiter.getRemainingRequests(userId, ipAddress);
      res.json({ remainingRequests: remaining });
    } catch (error: any) {
      console.error('Get remaining requests error:', error);
      res.status(500).json({ error: 'Failed to get remaining requests' });
    }
  });

  // AI Chat Endpoint
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      const user = req.user;
      
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array required" });
      }

      // Check rate limits using database persistence
      const userId = user?.id || null;
      const ipAddress = req.ip || req.connection.remoteAddress || '';
      const limitCheck = await aiRateLimiter.checkAndUpdateLimit(userId, ipAddress);

      if (!limitCheck.allowed) {
        return res.status(429).json({ error: limitCheck.error, remainingRequests: limitCheck.remainingRequests });
      }

      const response = await openaiService.generateResponse(messages);
      res.json({ response, remainingRequests: limitCheck.remainingRequests });
    } catch (error: any) {
      console.error('AI chat error:', error);
      res.status(500).json({ error: error.message || "Failed to generate AI response" });
    }
  });

  // Export Environment Variables as .env file
  app.get("/api/admin/export-env", async (req, res) => {
    try {
      // Check admin authentication or session
      const isAdmin = req.session?.admin?.id || req.user?.id;
      if (!isAdmin) {
        return res.status(401).json({ message: "Authentication required. Please log in as an administrator." });
      }

      const envVars = process.env;
      let envContent = '';

      // Collect all environment variables and format as KEY=VALUE
      for (const [key, value] of Object.entries(envVars)) {
        if (value !== undefined && value !== null) {
          // Escape values that contain special characters
          const escapedValue = typeof value === 'string' && value.includes('"') 
            ? `'${value}'` 
            : `${value}`;
          envContent += `${key}=${escapedValue}\n`;
        }
      }

      // Set response headers for file download
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename=".env-${new Date().toISOString().split('T')[0]}"`);
      res.send(envContent);
      
      console.log('[Admin] Environment variables exported by admin');
    } catch (error: any) {
      console.error('Export env error:', error);
      res.status(500).json({ error: 'Failed to export environment variables' });
    }
  });

  // Direct .env export for development (saves to file)
  app.get("/api/dev/export-env-file", async (req, res) => {
    try {
      const envVars = process.env;
      let envContent = '';

      // Collect all environment variables and format as KEY=VALUE
      for (const [key, value] of Object.entries(envVars)) {
        if (value !== undefined && value !== null) {
          // Escape values that contain special characters
          const escapedValue = typeof value === 'string' && value.includes('"') 
            ? `'${value}'` 
            : `${value}`;
          envContent += `${key}=${escapedValue}\n`;
        }
      }

      res.json({ 
        success: true, 
        content: envContent,
        fileName: `.env-${new Date().toISOString().split('T')[0]}`,
        count: Object.keys(envVars).length 
      });
      
      console.log('[Dev] Environment variables exported');
    } catch (error: any) {
      console.error('Export env error:', error);
      res.status(500).json({ error: 'Failed to export environment variables' });
    }
  });

  // Send initial system info
  setTimeout(() => {
    LogStreamService.broadcast(
      LogStreamService.createLogEntry('info', `GreenPay server started on port ${process.env.PORT || 5000}`, 'system')
    );
  }, 1000);

  // Announcement Media Upload (images + videos via Cloudinary)
  app.post("/api/admin/announcements/upload-media", requireAdminAuth, upload.single("file"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ message: "No file provided" });
      const isVideo = file.mimetype.startsWith("video/");
      const folder = isVideo ? "announcements/video" : "announcements/image";
      const url = await cloudinaryStorage.uploadFile(`${folder}/${Date.now()}-${file.originalname}`, file.buffer, file.mimetype);
      res.json({ url, type: isVideo ? "video" : "image" });
    } catch (error) {
      console.error("Announcement media upload error:", error);
      res.status(500).json({ message: "Failed to upload media" });
    }
  });

  // Announcements API
  app.get("/api/announcements", async (req, res) => {
    try {
      const announcements = await storage.getActiveAnnouncements();
      res.json({ announcements });
    } catch (error) {
      console.error('Fetch announcements error:', error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.get("/api/admin/announcements", requireAdminAuth, async (req, res) => {
    try {
      const announcements = await storage.getAnnouncements();
      res.json({ announcements });
    } catch (error) {
      console.error('Admin fetch announcements error:', error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.post("/api/admin/announcements", requireAdminAuth, async (req, res) => {
    try {
      const announcementData = insertAnnouncementSchema.parse(req.body);
      const announcement = await storage.createAnnouncement(announcementData);
      res.json({ announcement, message: "Announcement created successfully" });
    } catch (error) {
      console.error('Create announcement error:', error);
      res.status(400).json({ message: "Invalid announcement data" });
    }
  });

  app.put("/api/admin/announcements/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const announcement = await storage.updateAnnouncement(id, req.body);
      if (announcement) {
        res.json({ announcement, message: "Announcement updated successfully" });
      } else {
        res.status(404).json({ message: "Announcement not found" });
      }
    } catch (error) {
      console.error('Update announcement error:', error);
      res.status(500).json({ message: "Error updating announcement" });
    }
  });

  app.delete("/api/admin/announcements/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAnnouncement(id);
      res.json({ message: "Announcement deleted successfully" });
    } catch (error) {
      console.error('Delete announcement error:', error);
      res.status(500).json({ message: "Error deleting announcement" });
    }
  });

  app.post("/api/admin/send-bulk-messages", requireAdminAuth, async (req, res) => {
    try {
      const { userIds, message } = req.body;
      
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !message) {
        return res.status(400).json({ message: "User IDs array and message are required" });
      }
      
      const { messagingService } = await import('./services/messaging');
      let sentCount = 0;
      const errors: string[] = [];
      
      for (const userId of userIds) {
        try {
          const user = await storage.getUser(userId);
          if (!user) {
            errors.push(`User ${userId} not found`);
            continue;
          }
          
          await messagingService.sendMessage(user.phone, message);
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
        errors: errors.length > 0 ? errors : undefined,
        message: `Message sent to ${sentCount} user(s)`
      });
    } catch (error) {
      console.error('Bulk message error:', error);
      res.status(500).json({ message: "Error sending bulk messages" });
    }
  });

  // FCM Token Management
  app.post("/api/fcm/register-token", requireAuth, async (req, res) => {
    try {
      const { token } = req.body;
      const sessionUserId = (req as any).session?.userId;
      
      if (!token) {
        return res.status(400).json({ message: "FCM token is required" });
      }
      
      // Update user's FCM token
      await storage.updateUser(sessionUserId, { fcmToken: token });
      
      console.log(`FCM token registered for user: ${sessionUserId}`);
      res.json({ message: "FCM token registered successfully" });
    } catch (error) {
      console.error('FCM registration error:', error);
      res.status(500).json({ message: "Failed to register FCM token" });
    }
  });

  // Admin: Send push notification to specific user
  app.post("/api/admin/push-notifications/send-user", requireAdminAuth, async (req, res) => {
    try {
      const { userId, title, body, data } = req.body;
      
      if (!userId || !title || !body) {
        return res.status(400).json({ message: "userId, title, and body are required" });
      }
      
      const { notificationQueue } = await import('./services/notification-queue');
      const result = await notificationQueue.sendAdminAlert(userId, title, body);
      
      // Log admin action
      await storage.createAdminLog({
        adminId: (req as any).session?.admin?.id || null,
        action: 'push_notification_sent',
        details: `Admin sent push notification to user: ${userId}`,
        targetId: userId,
      });
      
      res.json({ 
        success: result,
        message: result ? "Notification sent" : "Failed to send notification"
      });
    } catch (error) {
      console.error('Push notification error:', error);
      res.status(500).json({ message: "Failed to send notification" });
    }
  });

  // Admin: Send push notification to all users
  app.post("/api/admin/push-notifications/send-all", requireAdminAuth, async (req, res) => {
    try {
      const { title, body, data } = req.body;
      
      if (!title || !body) {
        return res.status(400).json({ message: "title and body are required" });
      }
      
      const { notificationQueue } = await import('./services/notification-queue');
      const result = await notificationQueue.sendBulkNotification({
        title,
        body,
        type: 'general',
        data,
        sendToAll: true,
      });
      
      // Log admin action
      await storage.createAdminLog({
        adminId: (req as any).session?.admin?.id || null,
        action: 'bulk_push_notification',
        details: `Admin sent broadcast notification to all users`,
      });
      
      res.json({ 
        success: result.success > 0,
        sent: result.success,
        failed: result.failure,
        message: `Notification sent to ${result.success} user(s)`
      });
    } catch (error) {
      console.error('Bulk notification error:', error);
      res.status(500).json({ message: "Failed to send bulk notification" });
    }
  });

  // Admin: Send to multiple users
  app.post("/api/admin/push-notifications/send-multiple", requireAdminAuth, async (req, res) => {
    try {
      const { userIds, title, body, data } = req.body;
      
      if (!userIds || !Array.isArray(userIds) || !title || !body) {
        return res.status(400).json({ message: "userIds array, title, and body are required" });
      }
      
      const { notificationQueue } = await import('./services/notification-queue');
      const result = await notificationQueue.sendBulkNotification({
        title,
        body,
        type: 'general',
        data,
        targetUserIds: userIds,
      });
      
      // Log admin action
      await storage.createAdminLog({
        adminId: (req as any).session?.admin?.id || null,
        action: 'targeted_push_notification',
        details: `Admin sent notification to ${userIds.length} user(s)`,
      });
      
      res.json({ 
        success: result.success > 0,
        sent: result.success,
        failed: result.failure,
        message: `Notification sent to ${result.success} user(s), ${result.failure} failed`
      });
    } catch (error) {
      console.error('Targeted notification error:', error);
      res.status(500).json({ message: "Failed to send notifications" });
    }
  });

  // ============================================================
  // ADMIN SMS ROUTES (CommsGrid)
  // ============================================================

  app.post("/api/admin/sms/send-user", requireAdminAuth, async (req, res) => {
    try {
      const { userId, message } = req.body;
      if (!userId || !message) return res.status(400).json({ message: "userId and message are required" });
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      if (!user.phone) return res.status(400).json({ message: "User has no phone number" });
      const { messagingService } = await import('./services/messaging');
      const result = await messagingService.sendMessage(user.phone, message);
      await storage.createAdminLog({ adminId: (req as any).session?.admin?.id || null, action: 'sms_send_user', details: `SMS sent to ${user.fullName} (${user.phone})` });
      res.json({ success: true, sms: result.sms, whatsapp: result.whatsapp });
    } catch (error) {
      console.error('Admin SMS send-user error:', error);
      res.status(500).json({ message: "Failed to send SMS" });
    }
  });

  app.post("/api/admin/sms/broadcast", requireAdminAuth, async (req, res) => {
    try {
      const { userIds, all, message } = req.body;
      if (!message) return res.status(400).json({ message: "message is required" });

      let phones: { phone: string }[] = [];
      if (all) {
        const allUsersResult = await storage.getAllUsers({ limit: 100000 });
        phones = (allUsersResult.users || []).filter((u: any) => u.phone).map((u: any) => ({ phone: u.phone }));
      } else if (Array.isArray(userIds) && userIds.length > 0) {
        const found = await Promise.all(userIds.map((id: string) => storage.getUser(id)));
        phones = found.filter((u: any) => u?.phone).map((u: any) => ({ phone: u.phone }));
      } else {
        return res.status(400).json({ message: "Provide userIds array or all: true" });
      }

      const { messagingService } = await import('./services/messaging');
      const phoneNumbers = phones.map(p => p.phone);
      const result = await messagingService.sendSMSToMultiple(phoneNumbers, message);

      await storage.createAdminLog({ adminId: (req as any).session?.admin?.id || null, action: 'sms_broadcast', details: `SMS broadcast to ${result.sent} users` });
      res.json({ success: true, sent: result.sent, failed: result.failed, total: phoneNumbers.length });
    } catch (error) {
      console.error('Admin SMS broadcast error:', error);
      res.status(500).json({ message: "Failed to send SMS broadcast" });
    }
  });

  // ============================================================
  // ADMIN EMAIL TEMPLATE UUID MANAGEMENT
  // ============================================================

  app.get("/api/admin/email-templates", requireAdminAuth, async (req, res) => {
    try {
      const { mailtrapService } = await import('./services/mailtrap');
      const templates = await mailtrapService.getAllTemplateUuids();
      res.json({ templates });
    } catch (error) {
      console.error('Email templates fetch error:', error);
      res.status(500).json({ message: "Failed to fetch email templates" });
    }
  });

  app.put("/api/admin/email-templates", requireAdminAuth, async (req, res) => {
    try {
      const { templates } = req.body; // { templateName: uuid }
      if (!templates || typeof templates !== 'object') {
        return res.status(400).json({ message: "templates object required" });
      }
      for (const [name, uuid] of Object.entries(templates)) {
        await storage.setSystemSetting({
          category: "email_templates",
          key: name,
          value: String(uuid || '').trim(),
          description: `Email template UUID for ${name}`,
        });
      }
      res.json({ success: true, message: "Email template UUIDs saved" });
    } catch (error) {
      console.error('Email templates save error:', error);
      res.status(500).json({ message: "Failed to save email templates" });
    }
  });

  app.put("/api/admin/email-templates/:name", requireAdminAuth, async (req, res) => {
    try {
      const name = String(req.params.name);
      if (!/^[a-z0-9_]+$/.test(name)) {
        return res.status(400).json({ message: "Invalid template name" });
      }
      const uuid = String(req.body?.uuid || "").trim();
      await storage.setSystemSetting({
        category: "email_templates",
        key: name,
        value: uuid,
        description: `Email template UUID for ${name}`,
      });
      res.json({ success: true, name, uuid });
    } catch (error) {
      console.error("Email template save error:", error);
      res.status(500).json({ message: "Failed to save email template" });
    }
  });

  // ============================================================
  // TRANSACTION DISPUTES
  // ============================================================

  app.post("/api/disputes", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { transactionId, reason, description } = req.body;
      if (!transactionId || !reason) return res.status(400).json({ message: "transactionId and reason required" });

      // Check transaction belongs to user
      const [txn] = await db.select().from(transactions).where(eq(transactions.id, transactionId));
      if (!txn || txn.userId !== userId) return res.status(404).json({ message: "Transaction not found" });

      // Check no existing open dispute
      const existing = await db.select().from(transactionDisputes)
        .where(eq(transactionDisputes.transactionId, transactionId));
      if (existing.some((d: any) => d.status === 'open' || d.status === 'under_review')) {
        return res.status(409).json({ message: "An open dispute already exists for this transaction" });
      }

      const [dispute] = await db.insert(transactionDisputes).values({
        userId,
        transactionId,
        reason,
        description: description || null,
      }).returning();

      res.json({ dispute, message: "Dispute submitted successfully" });
    } catch (error) {
      console.error("Error creating dispute:", error);
      res.status(500).json({ message: "Failed to submit dispute" });
    }
  });

  app.get("/api/disputes", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const disputes = await db.select().from(transactionDisputes)
        .where(eq(transactionDisputes.userId, userId))
        .orderBy(desc(transactionDisputes.createdAt));
      res.json({ disputes });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch disputes" });
    }
  });

  // Admin: get all disputes
  app.get("/api/admin/disputes", requireAdminAuth, async (req, res) => {
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
        userEmail: users.email,
      }).from(transactionDisputes)
        .leftJoin(users, eq(transactionDisputes.userId, users.id))
        .orderBy(desc(transactionDisputes.createdAt));
      res.json({ disputes });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch disputes" });
    }
  });

  app.patch("/api/admin/disputes/:id", requireAdminAuth, async (req, res) => {
    try {
      const { status, adminNotes } = req.body;
      const updateData: any = { updatedAt: new Date() };
      if (status) updateData.status = status;
      if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
      if (status === 'resolved' || status === 'rejected') updateData.resolvedAt = new Date();

      const [updated] = await db.update(transactionDisputes)
        .set(updateData)
        .where(eq(transactionDisputes.id, req.params.id))
        .returning();

      res.json({ dispute: updated });
    } catch (error) {
      res.status(500).json({ message: "Failed to update dispute" });
    }
  });

  // ============================================================
  // CRYPTO INFRASTRUCTURE
  // ============================================================

  const CRYPTO_NETWORKS: Record<string, string> = {
    BTC: "bitcoin",
    ETH: "ethereum",
    USDT: "tron",
    USDC: "ethereum",
  };

  function generateCryptoAddress(coin: string): string {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const rand = () => chars[Math.floor(Math.random() * chars.length)];
    if (coin === "BTC") return "1" + Array.from({ length: 33 }, rand).join("");
    if (coin === "ETH" || coin === "USDC") return "0x" + Array.from({ length: 40 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
    if (coin === "USDT") return "T" + Array.from({ length: 33 }, rand).join("");
    return Array.from({ length: 34 }, rand).join("");
  }

  async function getOrCreateCryptoWallet(userId: string, coin: string) {
    const normalizedCoin = normalizeCurrency(coin);
    if (!SUPPORTED_CRYPTO_COINS.includes(normalizedCoin as any)) {
      throw new Error(`Unsupported coin: ${normalizedCoin}`);
    }
    const [existing] = await db.select().from(cryptoWallets)
      .where(and(eq(cryptoWallets.userId, userId), eq(cryptoWallets.coin, normalizedCoin)))
      .limit(1);
    if (existing) return existing;
    const [created] = await db.insert(cryptoWallets).values({
      userId,
      coin: normalizedCoin,
      network: CRYPTO_NETWORKS[normalizedCoin] || "unknown",
      address: "",
    }).returning();
    return created;
  }

  async function adjustCryptoWalletBalance(userId: string, coin: string, amount: number) {
    const wallet = await getOrCreateCryptoWallet(userId, coin);
    const [updated] = await db.update(cryptoWallets)
      .set({
        balance: sql`COALESCE(${cryptoWallets.balance}, 0) + ${amount}`,
        updatedAt: new Date(),
      })
      .where(and(
        eq(cryptoWallets.id, wallet.id),
        eq(cryptoWallets.userId, userId),
        eq(cryptoWallets.isActive, true),
        sql`COALESCE(${cryptoWallets.balance}, 0) + ${amount} >= 0`,
      ))
      .returning();
    if (!updated) {
      throw new Error(amount < 0 ? `Insufficient ${normalizeCurrency(coin)} balance` : `${normalizeCurrency(coin)} wallet is unavailable`);
    }
    return updated;
  }

  app.get("/api/crypto/prices", requireAuth, async (_req, res) => {
    try {
      res.json(await getCryptoPrices());
    } catch (error) {
      console.error("Crypto prices error:", error);
      res.status(503).json({ message: "Crypto prices are temporarily unavailable" });
    }
  });

  // GET available admin-configured deposit addresses (public to authed users)
  app.get("/api/crypto/deposit-addresses", requireAuth, async (req, res) => {
    try {
      const priceSnapshot = await getCryptoPrices();
      const addrs = await db.select().from(cryptoDepositAddresses)
        .where(eq(cryptoDepositAddresses.isActive, true))
        .orderBy(cryptoDepositAddresses.coin);
      res.json({ addresses: addrs, ...priceSnapshot });
    } catch (error) {
      console.error("Deposit addresses fetch error:", error);
      res.status(500).json({ message: "Failed to fetch deposit addresses" });
    }
  });

  // GET user's crypto wallets (balances only — addresses come from admin config)
  app.get("/api/crypto/wallets", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const wallets = await db.select().from(cryptoWallets)
        .where(eq(cryptoWallets.userId, userId));

      const supported = [...SUPPORTED_CRYPTO_COINS];
      const priceSnapshot = await getCryptoPrices();
      const existing = wallets.map((w: any) => w.coin);
      const toCreate = supported.filter(c => !existing.includes(c));

      const newWallets: any[] = [];
      for (const coin of toCreate) {
        const [w] = await db.insert(cryptoWallets).values({
          userId,
          coin,
          network: CRYPTO_NETWORKS[coin],
          address: "", // no per-user address; admin master addresses are used
        }).returning();
        newWallets.push(w);
      }

      const allWallets = [...wallets, ...newWallets].map((w: any) => ({
        ...w,
        usdRate: priceSnapshot.prices[w.coin as keyof typeof priceSnapshot.prices] || 1,
        usdBalance: (parseFloat(w.balance || "0") * (priceSnapshot.prices[w.coin as keyof typeof priceSnapshot.prices] || 1)).toFixed(2),
      }));

      res.json({ wallets: allWallets, ...priceSnapshot });
    } catch (error) {
      console.error("Crypto wallets error:", error);
      res.status(500).json({ message: "Failed to fetch crypto wallets" });
    }
  });

  // Move value between a user's fiat wallets, virtual cards, and crypto wallets.
  // Crypto legs are valued using the same live CoinGecko snapshot shown in the UI.
  app.post("/api/crypto/transfer", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const {
        sourceType,
        sourceId,
        sourceCoin,
        destinationType,
        destinationId,
        destinationCoin,
        amount,
      } = req.body;
      const sourceKinds = ["wallet", "card", "crypto"];
      const destinationKinds = ["wallet", "card", "crypto"];
      if (!sourceKinds.includes(sourceType) || !destinationKinds.includes(destinationType)) {
        return res.status(400).json({ message: "Invalid source or destination" });
      }
      if (sourceType === destinationType && sourceId && sourceId === destinationId && sourceCoin === destinationCoin) {
        return res.status(400).json({ message: "Source and destination must be different" });
      }
      const sourceAmount = Number(amount);
      if (!Number.isFinite(sourceAmount) || sourceAmount <= 0) {
        return res.status(400).json({ message: "Enter a valid amount" });
      }

      const sourceCoinCode = sourceType === "crypto" ? normalizeCurrency(sourceCoin) : undefined;
      const destinationCoinCode = destinationType === "crypto" ? normalizeCurrency(destinationCoin) : undefined;
      if (sourceType === "crypto" && !SUPPORTED_CRYPTO_COINS.includes(sourceCoinCode as any)) {
        return res.status(400).json({ message: "Unsupported source coin" });
      }
      if (destinationType === "crypto" && !SUPPORTED_CRYPTO_COINS.includes(destinationCoinCode as any)) {
        return res.status(400).json({ message: "Unsupported destination coin" });
      }

      let sourceWallet: any;
      let sourceCard: any;
      let destinationWallet: any;
      let destinationCard: any;
      if (sourceType === "wallet") {
        [sourceWallet] = await db.select().from(wallets)
          .where(and(eq(wallets.id, String(sourceId)), eq(wallets.userId, userId))).limit(1);
        if (!sourceWallet) return res.status(404).json({ message: "Source wallet not found" });
        if (sourceWallet.isSuspended || !sourceWallet.isActive) return res.status(400).json({ message: "Source wallet is not active" });
      }
      if (sourceType === "card") {
        sourceCard = await storage.getVirtualCardById(String(sourceId));
        if (!sourceCard || sourceCard.userId !== userId) return res.status(404).json({ message: "Source card not found" });
        if (sourceCard.status !== "active") return res.status(400).json({ message: "Source card is not active" });
      }
      if (destinationType === "wallet") {
        [destinationWallet] = await db.select().from(wallets)
          .where(and(eq(wallets.id, String(destinationId)), eq(wallets.userId, userId))).limit(1);
        if (!destinationWallet) return res.status(404).json({ message: "Destination wallet not found" });
        if (destinationWallet.isSuspended || !destinationWallet.isActive) return res.status(400).json({ message: "Destination wallet is not active" });
      }
      if (destinationType === "card") {
        destinationCard = await storage.getVirtualCardById(String(destinationId));
        if (!destinationCard || destinationCard.userId !== userId) return res.status(404).json({ message: "Destination card not found" });
        if (destinationCard.status !== "active") return res.status(400).json({ message: "Destination card is not active" });
      }

      const exchangeRateService = createExchangeRateService(storage);
      const sourceRate = sourceType === "crypto"
        ? await getCryptoPrice(sourceCoinCode!)
        : sourceType === "card"
          ? 1
          : await exchangeRateService.getExchangeRate(sourceWallet.currency, "USD");
      if (!sourceRate || !Number.isFinite(sourceRate)) return res.status(503).json({ message: "Source conversion rate unavailable" });
      const usdValue = sourceType === "crypto" ? sourceAmount * sourceRate : sourceAmount * sourceRate;

      const destinationRate = destinationType === "crypto"
        ? await getCryptoPrice(destinationCoinCode!)
        : destinationType === "card"
          ? 1
          : await exchangeRateService.getExchangeRate("USD", destinationWallet.currency);
      if (!destinationRate || !Number.isFinite(destinationRate)) return res.status(503).json({ message: "Destination conversion rate unavailable" });
      const destinationAmount = destinationType === "crypto"
        ? usdValue / destinationRate
        : destinationType === "card"
          ? usdValue
          : usdValue * destinationRate;

      const reference = `CRYPTO-TRANSFER-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      let sourceDebited = false;
      try {
        if (sourceType === "crypto") {
          await adjustCryptoWalletBalance(userId, sourceCoinCode!, -sourceAmount);
        } else if (sourceType === "wallet") {
          await applyLedgerEntry({
            walletId: sourceWallet.id,
            userId,
            currency: normalizeCurrency(sourceWallet.currency),
            amount: -sourceAmount,
            entryType: "internal_transfer",
            idempotencyKey: `${reference}:source`,
            description: `Transfer from ${sourceWallet.currency} wallet`,
          });
        } else {
          await applyLedgerEntry({
            cardId: sourceCard.id,
            userId,
            currency: "USD",
            amount: -sourceAmount,
            entryType: "internal_transfer",
            idempotencyKey: `${reference}:source`,
            description: "Transfer from virtual card",
          });
        }
        sourceDebited = true;

        if (destinationType === "crypto") {
          await adjustCryptoWalletBalance(userId, destinationCoinCode!, destinationAmount);
        } else if (destinationType === "wallet") {
          await applyLedgerEntry({
            walletId: destinationWallet.id,
            userId,
            currency: normalizeCurrency(destinationWallet.currency),
            amount: destinationAmount,
            entryType: "internal_transfer",
            idempotencyKey: `${reference}:destination`,
            description: `Transfer into ${destinationWallet.currency} wallet`,
          });
        } else {
          await applyLedgerEntry({
            cardId: destinationCard.id,
            userId,
            currency: "USD",
            amount: destinationAmount,
            entryType: "internal_transfer",
            idempotencyKey: `${reference}:destination`,
            description: "Transfer into virtual card",
          });
        }
      } catch (error) {
        if (sourceDebited) {
          try {
            if (sourceType === "crypto") {
              await adjustCryptoWalletBalance(userId, sourceCoinCode!, sourceAmount);
            } else if (sourceType === "wallet") {
              await applyLedgerEntry({
                walletId: sourceWallet.id,
                userId,
                currency: normalizeCurrency(sourceWallet.currency),
                amount: sourceAmount,
                entryType: "internal_transfer_rollback",
                idempotencyKey: `${reference}:rollback`,
                description: "Rollback failed internal transfer",
              });
            } else {
              await applyLedgerEntry({
                cardId: sourceCard.id,
                userId,
                currency: "USD",
                amount: sourceAmount,
                entryType: "internal_transfer_rollback",
                idempotencyKey: `${reference}:rollback`,
                description: "Rollback failed internal transfer",
              });
            }
          } catch (rollbackError) {
            console.error("Internal transfer rollback failed:", rollbackError);
          }
        }
        throw error;
      }

      const transaction = await storage.createTransaction({
        userId,
        type: "transfer",
        amount: sourceAmount.toFixed(8),
        currency: sourceType === "crypto" ? sourceCoinCode! : sourceType === "card" ? "USD" : normalizeCurrency(sourceWallet.currency),
        status: "completed",
        description: `Transfer ${sourceType} → ${destinationType}`,
        reference,
        completedAt: new Date(),
        metadata: {
          sourceType,
          sourceId,
          sourceCoin: sourceCoinCode,
          destinationType,
          destinationId,
          destinationCoin: destinationCoinCode,
          destinationAmount: destinationAmount.toFixed(8),
          usdValue: usdValue.toFixed(2),
        } as any,
      });

      if (sourceType === "crypto" || destinationType === "crypto") {
        await db.insert(cryptoTransactions).values({
          userId,
          type: "internal_transfer",
          coin: sourceCoinCode || destinationCoinCode!,
          network: CRYPTO_NETWORKS[sourceCoinCode || destinationCoinCode!] || "internal",
          amount: (sourceType === "crypto" ? sourceAmount : destinationAmount).toFixed(8),
          usdValue: usdValue.toFixed(2),
          status: "completed",
          completedAt: new Date(),
          adminNotes: `${sourceType} → ${destinationType}`,
        });
      }

      res.json({
        success: true,
        reference,
        transaction,
        sourceAmount,
        sourceCoin: sourceCoinCode,
        destinationAmount,
        destinationCoin: destinationCoinCode,
        usdValue,
      });
    } catch (error: any) {
      console.error("Crypto/internal transfer error:", error);
      res.status(400).json({ message: error?.message || "Transfer failed" });
    }
  });

  // POST initiate crypto deposit (uses admin-configured address by coin + network)
  app.post("/api/crypto/deposit", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { coin, amount, network } = req.body;
      if (!coin || !amount) return res.status(400).json({ message: "coin and amount required" });

      const rate = await getCryptoPrice(String(coin));
      if (!rate) return res.status(400).json({ message: "Unsupported coin" });

      const cryptoAmount = parseFloat(amount);
      const usdValue = cryptoAmount * rate;

      // Pick admin-configured address for this coin (and optional network)
      const candidates = await db.select().from(cryptoDepositAddresses)
        .where(eq(cryptoDepositAddresses.coin, coin));
      const active = candidates.filter((a: any) => a.isActive);
      const chosen = (network ? active.find((a: any) => a.network === network) : active[0]) || active[0];

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
        requiredConfirmations: coin === "BTC" ? 3 : coin === "ETH" || coin === "USDC" ? 12 : 20,
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

  // POST crypto withdrawal
  app.post("/api/crypto/withdraw", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { coin, amount, toAddress } = req.body;
      if (!coin || !amount || !toAddress) return res.status(400).json({ message: "coin, amount, and toAddress required" });

      const rate = await getCryptoPrice(String(coin));
      if (!rate) return res.status(400).json({ message: "Unsupported coin" });

      const cryptoAmount = parseFloat(amount);
      const usdValue = cryptoAmount * rate;

      const [userRow] = await db.select().from(users).where(eq(users.id, userId));
      if (!userRow) return res.status(404).json({ message: "User not found" });
      if (userRow.isSuspended) {
        return res.status(403).json({ message: userRow.suspensionReason || "Your account is suspended. Crypto withdrawals are disabled. Please contact support." });
      }
      const cryptoWallet = await getOrCreateCryptoWallet(userId, coin);
      if (!cryptoWallet.isActive) {
        return res.status(403).json({ message: `${coin} wallet is inactive` });
      }
      await adjustCryptoWalletBalance(userId, coin, -cryptoAmount);

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
        requiredConfirmations: 1,
      }).returning();

      // Record as a transaction
      await db.insert(transactions).values({
        userId,
        type: "withdraw",
        amount: usdValue.toFixed(2),
        currency: coin,
        status: "pending",
        description: `Crypto withdrawal: ${cryptoAmount} ${coin}`,
        reference: cryptoTx.id,
      });

      res.json({ cryptoTransaction: cryptoTx, message: "Withdrawal initiated. Processing may take 30–60 minutes." });
    } catch (error) {
      console.error("Crypto withdrawal error:", error);
      res.status(500).json({ message: "Failed to process withdrawal" });
    }
  });

  // POST buy virtual card with crypto
  app.post("/api/crypto/buy-card", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { coin } = req.body;
      if (!coin) return res.status(400).json({ message: "coin required" });

      const rate = await getCryptoPrice(String(coin));
      if (!rate) return res.status(400).json({ message: "Unsupported coin" });

      // Get card price
      const cardPriceSetting = await storage.getSystemSetting("general", "card_price");
      const cardPriceUSD = parseFloat(cardPriceSetting?.value || "60.00");
      const cryptoAmount = (cardPriceUSD / rate);

      const [cryptoTx] = await db.insert(cryptoTransactions).values({
        userId,
        type: "card_purchase",
        coin,
        network: CRYPTO_NETWORKS[coin] || "unknown",
        amount: cryptoAmount.toFixed(8),
        usdValue: cardPriceUSD.toFixed(2),
        status: "pending",
        requiredConfirmations: coin === "BTC" ? 3 : 12,
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

  // GET user's crypto transaction history
  app.get("/api/crypto/transactions", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const txns = await db.select().from(cryptoTransactions)
        .where(eq(cryptoTransactions.userId, userId))
        .orderBy(desc(cryptoTransactions.createdAt));
      res.json({ transactions: txns });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch crypto transactions" });
    }
  });

  // Admin: get all crypto transactions
  app.get("/api/admin/crypto/transactions", requireAdminAuth, async (req, res) => {
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
        userEmail: users.email,
      }).from(cryptoTransactions)
        .leftJoin(users, eq(cryptoTransactions.userId, users.id))
        .orderBy(desc(cryptoTransactions.createdAt));
      res.json({ transactions: txns });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch crypto transactions" });
    }
  });

  // Admin: update crypto transaction (confirm, complete, fail)
  app.patch("/api/admin/crypto/transactions/:id", requireAdminAuth, async (req, res) => {
    try {
      const { status, txHash, adminNotes, confirmations } = req.body;
      const updateData: any = { updatedAt: new Date() };
      if (status) updateData.status = status;
      if (txHash) updateData.txHash = txHash;
      if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
      if (confirmations !== undefined) updateData.confirmations = confirmations;

      const [cryptoTx] = await db.select().from(cryptoTransactions)
        .where(eq(cryptoTransactions.id, req.params.id));
      if (!cryptoTx) return res.status(404).json({ message: "Crypto transaction not found" });

      // Only settle a crypto transaction once. This prevents repeated admin clicks
      // from crediting a deposit wallet more than once.
      if (status === "completed" && cryptoTx.status !== "completed") {
        updateData.completedAt = new Date();
        if (cryptoTx.type === "deposit") {
          await adjustCryptoWalletBalance(cryptoTx.userId, cryptoTx.coin, parseFloat(cryptoTx.amount));
          await db.insert(transactions).values({
            userId: cryptoTx.userId,
            type: "deposit",
            amount: cryptoTx.amount,
            currency: cryptoTx.coin,
            status: "completed",
            description: `Crypto deposit: ${cryptoTx.amount} ${cryptoTx.coin}`,
            reference: cryptoTx.id,
            completedAt: new Date(),
          });
        }
        if (cryptoTx.type === "card_purchase") {
          await db.insert(transactions).values({
            userId: cryptoTx.userId,
            type: "card_purchase",
            amount: cryptoTx.amount,
            currency: cryptoTx.coin,
            status: "completed",
            description: `Virtual card purchase via ${cryptoTx.coin}`,
            reference: cryptoTx.id,
            completedAt: new Date(),
          });
        }
      } else if (status === "failed" && cryptoTx.status !== "failed") {
        if (cryptoTx.type === "withdrawal") {
          await adjustCryptoWalletBalance(cryptoTx.userId, cryptoTx.coin, parseFloat(cryptoTx.amount));
        }
        await db.update(transactions)
          .set({ status: "failed", updatedAt: new Date() })
          .where(eq(transactions.reference, cryptoTx.id));
      }

      const [updated] = await db.update(cryptoTransactions)
        .set(updateData)
        .where(eq(cryptoTransactions.id, req.params.id))
        .returning();

      res.json({ transaction: updated });
    } catch (error) {
      console.error("Admin crypto update error:", error);
      res.status(500).json({ message: "Failed to update crypto transaction" });
    }
  });

  // ─── Admin: Crypto Deposit Address Management ────────────────────────
  app.get("/api/admin/crypto/addresses", requireAdminAuth, async (req, res) => {
    try {
      const addrs = await db.select().from(cryptoDepositAddresses)
        .orderBy(cryptoDepositAddresses.coin);
      res.json({ addresses: addrs });
    } catch (error) {
      console.error("Admin fetch crypto addresses error:", error);
      res.status(500).json({ message: "Failed to fetch addresses" });
    }
  });

  app.post("/api/admin/crypto/addresses", requireAdminAuth, async (req, res) => {
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
        notes: notes || null,
      }).returning();
      res.json({ address: created });
    } catch (error) {
      console.error("Admin create crypto address error:", error);
      res.status(500).json({ message: "Failed to create address" });
    }
  });

  app.put("/api/admin/crypto/addresses/:id", requireAdminAuth, async (req, res) => {
    try {
      const updates: any = { ...req.body, updatedAt: new Date() };
      if (updates.coin) updates.coin = String(updates.coin).toUpperCase();
      if (updates.minDeposit !== undefined) updates.minDeposit = String(updates.minDeposit);
      const [updated] = await db.update(cryptoDepositAddresses)
        .set(updates)
        .where(eq(cryptoDepositAddresses.id, req.params.id))
        .returning();
      if (!updated) return res.status(404).json({ message: "Address not found" });
      res.json({ address: updated });
    } catch (error) {
      console.error("Admin update crypto address error:", error);
      res.status(500).json({ message: "Failed to update address" });
    }
  });

  app.delete("/api/admin/crypto/addresses/:id", requireAdminAuth, async (req, res) => {
    try {
      await db.delete(cryptoDepositAddresses)
        .where(eq(cryptoDepositAddresses.id, req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Admin delete crypto address error:", error);
      res.status(500).json({ message: "Failed to delete address" });
    }
  });

  // ─── Admin: All cards for a user ─────────────────────────────────────
  app.get("/api/admin/users/:id/cards", async (req, res) => {
    try {
      const cards = await storage.getVirtualCardsByUserId(req.params.id);
      const enriched = await Promise.all(cards.map(async card => {
        const balance = await getLedgerBalance({ cardId: card.id }, Number(card.balance || 0));
        return { ...card, balance: balance.toString(), availableBalance: balance.toString() };
      }));
      res.json({ cards: enriched });
    } catch (error) {
      console.error("Admin fetch user cards error:", error);
      res.status(500).json({ message: "Failed to fetch user cards" });
    }
  });

  // ─── User: Cancel a pending transaction (with balance refund) ──────────
  app.post("/api/transactions/:id/cancel", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const tx = await storage.getTransactionById(req.params.id);
      if (!tx) return res.status(404).json({ message: "Transaction not found" });
      if (tx.userId !== userId) return res.status(403).json({ message: "Not your transaction" });
      if (tx.status !== "pending" && tx.status !== "processing") {
        return res.status(400).json({ message: "Only pending transactions can be cancelled" });
      }

      // Refund balance if this was a deduction type
      const deductionTypes = ["send", "withdraw", "transfer", "exchange", "bills", "airtime", "card_purchase"];
      if (deductionTypes.includes(tx.type)) {
        const user = await storage.getUser(userId);
        if (user) {
          const refundAmount = parseFloat(tx.amount || "0") + parseFloat(tx.fee || "0");
          const refundCurrency = normalizeCurrency(tx.currency || "USD");
          const refundWallet = await getUserWallet(userId, refundCurrency);
          if (refundWallet) {
            if (tx.type === "withdraw") {
              await releaseWalletWithdrawal(refundWallet.id, refundAmount);
            } else {
              await applyLedgerEntry({
                walletId: refundWallet.id,
                userId,
                currency: refundCurrency,
                amount: refundAmount,
                entryType: "transaction_refund",
                idempotencyKey: `refund:${tx.id}`,
                transactionId: tx.id,
                description: "Refund for cancelled transaction",
              });
            }
          }
        }
      }

      const updated = await storage.updateTransaction(tx.id, {
        status: "cancelled",
        description: (tx.description || "") + " (cancelled by user)",
      });

      res.json({ transaction: updated, message: "Transaction cancelled and balance refunded" });
    } catch (error) {
      console.error("Cancel transaction error:", error);
      res.status(500).json({ message: "Failed to cancel transaction" });
    }
  });

  // GET analytics data for the user (spending by category per month)
  app.get("/api/analytics/summary", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const allTxns = await db.select().from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(desc(transactions.createdAt));

      // Build monthly totals for last 6 months
      const now = new Date();
      const months: { label: string; sent: number; received: number; month: number; year: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          label: d.toLocaleString("default", { month: "short" }),
          month: d.getMonth(),
          year: d.getFullYear(),
          sent: 0,
          received: 0,
        });
      }

      const categoryMap: Record<string, number> = {
        "Send Money": 0,
        "Deposits": 0,
        "Withdrawals": 0,
        "Card Purchase": 0,
        "Exchange": 0,
        "Bills": 0,
        "Airtime": 0,
        "Other": 0,
      };

      for (const txn of allTxns as any[]) {
        if (txn.status !== "completed") continue;
        const amt = parseFloat(txn.amount || "0");
        const usdAmt = txn.currency === "KES" ? amt / 130 : amt;
        const txDate = new Date(txn.createdAt);

        // Monthly chart
        const mo = months.find(m => m.month === txDate.getMonth() && m.year === txDate.getFullYear());
        if (mo) {
          if (["send", "withdraw", "card_purchase", "exchange", "airtime", "bill"].includes(txn.type)) mo.sent += usdAmt;
          else if (["receive", "deposit"].includes(txn.type)) mo.received += usdAmt;
        }

        // Category breakdown
        if (txn.type === "send") categoryMap["Send Money"] += usdAmt;
        else if (txn.type === "deposit") categoryMap["Deposits"] += usdAmt;
        else if (txn.type === "withdraw") categoryMap["Withdrawals"] += usdAmt;
        else if (txn.type === "card_purchase") categoryMap["Card Purchase"] += usdAmt;
        else if (txn.type === "exchange") categoryMap["Exchange"] += usdAmt;
        else if (txn.type === "bill") categoryMap["Bills"] += usdAmt;
        else if (txn.type === "airtime") categoryMap["Airtime"] += usdAmt;
        else categoryMap["Other"] += usdAmt;
      }

      const categoryData = Object.entries(categoryMap)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }));

      const totalIn = months.reduce((s, m) => s + m.received, 0);
      const totalOut = months.reduce((s, m) => s + m.sent, 0);
      const txCount = (allTxns as any[]).filter((t: any) => t.status === "completed").length;

      res.json({
        monthlyData: months.map(m => ({ label: m.label, sent: parseFloat(m.sent.toFixed(2)), received: parseFloat(m.received.toFixed(2)) })),
        categoryData,
        summary: {
          totalIn: parseFloat(totalIn.toFixed(2)),
          totalOut: parseFloat(totalOut.toFixed(2)),
          txCount,
          netFlow: parseFloat((totalIn - totalOut).toFixed(2)),
        }
      });
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // ========== MULTI-CURRENCY WALLET ROUTES ==========

  app.get("/api/wallets", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const currencyMeta = Object.fromEntries(NEXUSPAY_CURRENCIES.map(c => [c.code, c]));
      let userWallets = await db.select().from(wallets).where(eq(wallets.userId, userId));

      // Auto-create a default wallet if user has none
      if (userWallets.length === 0) {
        try {
          const userRecord = await db.select().from(users).where(eq(users.id, userId)).limit(1);
          const defCurrencySetting = await pool.query(`SELECT value FROM system_settings WHERE key = 'default_currency' LIMIT 1`);
          const defCurrency = defCurrencySetting.rows[0]?.value?.replace(/['"]/g, '') || userRecord[0]?.defaultCurrency || "USD";
          const [newWallet] = await db.insert(wallets).values({ userId, currency: defCurrency, isDefault: true, isActive: true }).returning();
          userWallets = [newWallet];
        } catch (autoCreateErr) {
          console.error('Wallet auto-create error:', autoCreateErr);
        }
      }

      const enriched = await Promise.all(userWallets.map(async w => {
        const ledgerBalance = await getLedgerBalance({ walletId: w.id }, Number(w.balance || 0));
        return {
          ...w,
          balance: ledgerBalance.toString(),
          availableBalance: walletAvailableBalance({
            ...w,
            balance: ledgerBalance.toString(),
          }),
          currencyMeta: currencyMeta[w.currency] || null,
        };
      }));
      res.json({ wallets: enriched });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/wallets", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { currency } = req.body;
      if (!currency) return res.status(400).json({ message: "currency required" });
      const normalizedCurrency = normalizeCurrency(currency);
      const knownCodes = await getEnabledCurrencyCodes();
      if (!knownCodes.includes(normalizedCurrency)) return res.status(400).json({ message: `${normalizedCurrency} is not an enabled currency` });
      const existing = await db.select().from(wallets).where(eq(wallets.userId, userId));
      if (existing.some(w => normalizeCurrency(w.currency) === normalizedCurrency)) return res.status(400).json({ message: `You already have a ${normalizedCurrency} wallet` });
      const isDefault = existing.length === 0;
      const [newWallet] = await db.insert(wallets).values({ userId, currency: normalizedCurrency, isDefault, isActive: true }).returning();
      res.json({ wallet: newWallet });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.put("/api/wallets/:id/default", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { id } = req.params;
      await db.update(wallets).set({ isDefault: false }).where(eq(wallets.userId, userId));
      await db.update(wallets).set({ isDefault: true, updatedAt: new Date() }).where(eq(wallets.id, id));
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/currencies", async (req, res) => {
    try {
      const enabled = await getEnabledCurrencyCodes();
      const defSetting = await pool.query(`SELECT value FROM system_settings WHERE key = 'default_currency' LIMIT 1`);
      const defaultCurrency = (defSetting.rows[0]?.value || "USD").replace(/['"]/g, '').trim();
      const currencies = NEXUSPAY_CURRENCIES.filter(c => enabled.includes(c.code));
      res.json({ currencies, defaultCurrency, enabled });
    } catch (e: any) {
      res.json({ currencies: NEXUSPAY_CURRENCIES, defaultCurrency: "USD", enabled: NEXUSPAY_CURRENCIES.map(c => c.code) });
    }
  });

  app.post("/api/deposit/nexuspay", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const globalSetting = await storage.getSystemSetting("deposit_methods", "global_enabled");
      if (String(globalSetting?.value || "").toLowerCase() !== "true") {
        return res.status(403).json({ message: "Global deposits are currently disabled" });
      }
      const { walletId, currency, amount, phone, email, correspondent, description } = req.body;
      if (!walletId || !currency || !amount) return res.status(400).json({ message: "walletId, currency, and amount are required" });
      const normalizedCurrency = normalizeCurrency(currency);
      if (!(await getEnabledCurrencyCodes()).includes(normalizedCurrency)) {
        return res.status(400).json({ message: `${normalizedCurrency} is not an enabled currency` });
      }
      if (parseFloat(amount) <= 0) return res.status(400).json({ message: "Amount must be greater than 0" });
      const [wallet_] = await db.select().from(wallets).where(eq(wallets.id, walletId));
      if (!wallet_ || wallet_.userId !== userId) return res.status(403).json({ message: "Wallet not found" });
      if (!wallet_.isActive || wallet_.isSuspended) return res.status(400).json({ message: "This wallet is not active" });
      if (normalizeCurrency(wallet_.currency) !== normalizedCurrency) {
        return res.status(400).json({ message: "Selected wallet and deposit currency do not match" });
      }
      const currencyMeta = NEXUSPAY_CURRENCIES.find(c => c.code === normalizedCurrency);
      const channel = currencyMeta?.channel || "card";
      const result = await nexusPayService.checkout({ amount: parseFloat(amount), currency: normalizedCurrency, channel, phone, email, correspondent, description: description || `Deposit to ${normalizedCurrency} wallet` });
      await db.insert(transactions).values({
        userId, type: "deposit", amount: String(amount), currency: normalizedCurrency, status: "pending",
        reference: result.reference, description: `NexusPay ${currency} deposit`,
        metadata: { walletId, channel, gateway: currencyMeta?.gateway, redirectUrl: result.redirectUrl } as any,
      });
      res.json({ success: true, reference: result.reference, status: result.status, redirectUrl: result.redirectUrl, message: result.redirectUrl ? "Redirecting to payment page..." : "Check your phone for the payment prompt." });
    } catch (e: any) { console.error("Global deposit error:", e); res.status(500).json({ message: e.message || "Deposit failed" }); }
  });

  app.get("/api/deposit/nexuspay/status/:reference", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { reference } = req.params;
      const status = await nexusPayService.getStatus(reference);
      if (status.status === "completed") {
        const [txn] = await db.select().from(transactions).where(eq(transactions.reference, reference));
        if (txn && txn.userId !== userId) {
          return res.status(403).json({ message: "Transaction not found" });
        }
        if (txn && txn.status !== "completed") {
          const meta = txn.metadata as any;
          const walletId = meta?.walletId;
          if (walletId) {
            const [wallet] = await db.select().from(wallets).where(eq(wallets.id, walletId));
            if (!wallet || wallet.userId !== userId) {
              return res.status(403).json({ message: "Wallet not found" });
            }
            await applyLedgerEntry({
              walletId: wallet.id,
              userId,
              currency: normalizeCurrency(wallet.currency),
              amount: parseFloat(status.amount),
              entryType: "deposit",
              idempotencyKey: `deposit:${txn.id}`,
              transactionId: txn.id,
              description: txn.description || "NexusPay deposit",
            });

            // Apply the highest matching configured bonus exactly once.
            const activeBonuses = await db.select().from(depositBonuses)
              .where(eq(depositBonuses.isActive, true));
            const depositAmount = parseFloat(status.amount);
            const eligible = activeBonuses
              .filter((bonus) => (bonus.method === "nexuspay" || bonus.method === "any") &&
                depositAmount >= parseFloat(bonus.minAmount))
              .map((bonus) => ({
                bonus,
                value: bonus.bonusType === "percentage"
                  ? (depositAmount * parseFloat(bonus.bonusAmount)) / 100
                  : parseFloat(bonus.bonusAmount),
              }))
              .filter(({ value }) => value > 0)
              .sort((a, b) => b.value - a.value);
            if (eligible[0]) {
              const { bonus, value } = eligible[0];
              const applied = await applyLedgerEntry({
                walletId: wallet.id,
                userId,
                currency: normalizeCurrency(wallet.currency),
                amount: value,
                entryType: "deposit_bonus",
                idempotencyKey: `deposit-bonus:${txn.id}:${bonus.id}`,
                transactionId: txn.id,
                description: bonus.description || "Deposit bonus",
              });
              if (applied.applied) {
                await db.insert(transactions).values({
                  userId,
                  type: "deposit",
                  amount: value.toFixed(2),
                  currency: normalizeCurrency(wallet.currency),
                  status: "completed",
                  fee: "0.00",
                  description: `Deposit bonus: ${bonus.description || "Global deposit bonus"}`,
                  metadata: { bonusId: bonus.id, triggerMethod: "nexuspay" } as any,
                });
              }
            }
          }
          await db.update(transactions).set({ status: "completed", completedAt: new Date(), updatedAt: new Date() }).where(eq(transactions.reference, reference));
        }
      } else if (status.status === "failed") {
        await db.update(transactions).set({ status: "failed", updatedAt: new Date() }).where(eq(transactions.reference, reference));
      }
      res.json({ status: status.status, reference, amount: status.amount, currency: status.currency });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/exchange/swap", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { fromWalletId, toWalletId, amount } = req.body;
      if (!fromWalletId || !toWalletId || !amount) return res.status(400).json({ message: "fromWalletId, toWalletId, and amount are required" });
      const fromAmt = parseFloat(amount);
      if (fromAmt <= 0) return res.status(400).json({ message: "Amount must be > 0" });
      const userWallets = await db.select().from(wallets).where(eq(wallets.userId, userId));
      const fromWallet = userWallets.find(w => w.id === fromWalletId);
      const toWallet = userWallets.find(w => w.id === toWalletId);
      if (!fromWallet || !toWallet) return res.status(404).json({ message: "Wallet not found" });
      if (fromWallet.isSuspended || toWallet.isSuspended) return res.status(400).json({ message: "One or both wallets are suspended" });
      const fromLedgerBalance = await getLedgerBalance({ walletId: fromWallet.id }, Number(fromWallet.balance || 0));
      const fromBalance = walletAvailableBalance({ ...fromWallet, balance: fromLedgerBalance.toString() });
      if (fromAmt > fromBalance) return res.status(400).json({ message: "Insufficient balance" });
      const exchangeRateSvc = createExchangeRateService(storage);
      const rate = await exchangeRateSvc.getExchangeRate(fromWallet.currency, toWallet.currency);
      const FEE_RATE = 0.015;
      const fee = fromAmt * FEE_RATE;
      const toAmount = (fromAmt - fee) * rate;
      const ref = `EX-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      let fromDebited = false;
      try {
        await applyLedgerEntry({
          walletId: fromWallet.id, userId, currency: normalizeCurrency(fromWallet.currency), amount: -fromAmt,
          entryType: "exchange", idempotencyKey: `exchange:${ref}:debit`,
          description: `Exchange ${fromWallet.currency} to ${toWallet.currency}`,
        });
        fromDebited = true;
        await applyLedgerEntry({
          walletId: toWallet.id, userId, currency: normalizeCurrency(toWallet.currency), amount: toAmount,
          entryType: "exchange", idempotencyKey: `exchange:${ref}:credit`,
          description: `Exchange from ${fromWallet.currency}`,
        });
      } catch (error: any) {
        if (fromDebited) {
          await applyLedgerEntry({
            walletId: fromWallet.id, userId, currency: normalizeCurrency(fromWallet.currency), amount: fromAmt,
            entryType: "exchange_rollback", idempotencyKey: `exchange:${ref}:rollback`,
            description: "Rollback failed exchange",
          }).catch(() => {});
        }
        return res.status(400).json({ message: error?.message || "Insufficient balance" });
      }
      await db.insert(transactions).values({
        userId, type: "exchange", amount: String(fromAmt), currency: fromWallet.currency,
        fee: String(fee.toFixed(4)), exchangeRate: String(rate.toFixed(6)),
        status: "completed", reference: ref, completedAt: new Date(),
        description: `Exchange ${fromWallet.currency} → ${toWallet.currency}`,
        metadata: { fromWalletId, toWalletId, toCurrency: toWallet.currency, toAmount: toAmount.toFixed(4) } as any,
      });
      res.json({ success: true, fromAmount: fromAmt.toFixed(4), fromCurrency: fromWallet.currency, toAmount: toAmount.toFixed(4), toCurrency: toWallet.currency, rate: rate.toFixed(6), fee: fee.toFixed(4), reference: ref });
    } catch (e: any) { console.error("Exchange error:", e); res.status(500).json({ message: e.message || "Exchange failed" }); }
  });

  // ========== ADMIN WALLET ROUTES ==========

  app.get("/api/admin/wallets", requireAdminAuth, async (req, res) => {
    try {
      const search = ((req.query.search as string) || "").toLowerCase();
      const allWallets = await pool.query(`
        SELECT w.*, u.full_name, u.email, u.phone
        FROM wallets w JOIN users u ON w.user_id = u.id
        WHERE ($1 = '' OR LOWER(u.full_name) LIKE '%' || $1 || '%'
           OR LOWER(u.email) LIKE '%' || $1 || '%' OR LOWER(u.phone) LIKE '%' || $1 || '%')
        ORDER BY u.full_name ASC, w.currency ASC
      `, [search]);
      const grouped: Record<string, any[]> = {};
      for (const row of allWallets.rows) {
        const ledgerBalance = await getLedgerBalance({ walletId: row.id }, Number(row.balance || 0));
        const availableBalance = walletAvailableBalance({
          balance: ledgerBalance.toString(),
          holdAmount: row.hold_amount,
          withdrawalHoldAmount: row.withdrawal_hold_amount,
        });
        if (!grouped[row.user_id]) grouped[row.user_id] = [];
        grouped[row.user_id].push({
          id: row.id, userId: row.user_id, currency: row.currency, label: row.label,
          balance: ledgerBalance.toString(), availableBalance, holdAmount: row.hold_amount, withdrawalHoldAmount: row.withdrawal_hold_amount, isDefault: row.is_default,
          isActive: row.is_active, isSuspended: row.is_suspended, suspendReason: row.suspend_reason,
          createdAt: row.created_at, user: { fullName: row.full_name, email: row.email, phone: row.phone },
        });
      }
      const walletsWithLedgerBalances = await Promise.all(allWallets.rows.map(async row => {
        const ledgerBalance = await getLedgerBalance({ walletId: row.id }, Number(row.balance || 0));
        return {
          ...row,
          balance: ledgerBalance.toString(),
          available_balance: walletAvailableBalance({
            balance: ledgerBalance.toString(),
            holdAmount: row.hold_amount,
            withdrawalHoldAmount: row.withdrawal_hold_amount,
          }),
        };
      }));
      res.json({ wallets: walletsWithLedgerBalances, grouped });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/admin/users/:userId/wallets", requireAdminAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const userWallets = await db.select().from(wallets).where(eq(wallets.userId, userId));
      const enriched = await Promise.all(userWallets.map(async wallet => {
        const balance = await getLedgerBalance({ walletId: wallet.id }, Number(wallet.balance || 0));
        return {
          ...wallet,
          balance: balance.toString(),
          availableBalance: walletAvailableBalance({ ...wallet, balance: balance.toString() }),
        };
      }));
      res.json({ wallets: enriched });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/admin/users/:userId/wallets", requireAdminAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const { currency } = req.body;
      if (!currency) return res.status(400).json({ message: "currency required" });
      const existing = await db.select().from(wallets).where(eq(wallets.userId, userId));
      if (existing.some((w: any) => normalizeCurrency(w.currency) === currency)) return res.status(400).json({ message: `User already has a ${currency} wallet` });
      const [newWallet] = await db.insert(wallets).values({ userId, currency, isDefault: existing.length === 0, isActive: true }).returning();
      res.json({ wallet: newWallet });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.put("/api/admin/wallets/:id/suspend", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      await db.update(wallets).set({ isSuspended: true, suspendReason: reason || null, updatedAt: new Date() }).where(eq(wallets.id, id));
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.put("/api/admin/wallets/:id/unsuspend", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await db.update(wallets).set({ isSuspended: false, suspendReason: null, updatedAt: new Date() }).where(eq(wallets.id, id));
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.put("/api/admin/wallets/:id/hold", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { amount } = req.body;
      await db.update(wallets).set({ holdAmount: String(parseFloat(amount || "0")), updatedAt: new Date() }).where(eq(wallets.id, id));
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.put("/api/admin/wallets/:id/balance", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, type } = req.body;
      const adj = parseFloat(amount || "0");
      if (adj <= 0) return res.status(400).json({ message: "Amount must be > 0" });
      if (type !== "credit" && type !== "debit") {
        return res.status(400).json({ message: "type must be 'credit' or 'debit'" });
      }
      const [wallet] = await db.select().from(wallets).where(eq(wallets.id, id));
      if (!wallet) return res.status(404).json({ message: "Wallet not found" });
      try {
        const result = await applyLedgerEntry({
          walletId: wallet.id,
          userId: wallet.userId,
          currency: normalizeCurrency(wallet.currency),
          amount: type === "credit" ? adj : -adj,
          entryType: `admin_wallet_${type}`,
          idempotencyKey: `admin-wallet:${wallet.id}:${Date.now()}:${Math.random()}`,
          description: `Admin ${type} adjustment`,
        });
        res.json({ success: true, balance: result.balance.toFixed(2), availableBalance: result.availableBalance.toFixed(2) });
      } catch (error: any) {
        res.status(400).json({ message: error?.message || "Balance adjustment failed" });
      }
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/admin/wallets/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(wallets).where(eq(wallets.id, id));
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.get("/api/admin/currencies/settings", requireAdminAuth, async (req, res) => {
    try {
      const result = await pool.query(`SELECT key, value FROM system_settings WHERE key IN ('default_currency', 'enabled_currencies', 'nexuspay_api_key')`);
      const map: Record<string, string> = {};
      for (const row of result.rows) map[row.key] = row.value;
      const fallbackResult = await pool.query(`SELECT key, value FROM system_settings WHERE category = 'exchange_rate_fallback'`);
      const fallbackRates: Record<string, string> = {};
      for (const row of fallbackResult.rows) fallbackRates[row.key] = row.value;
      res.json({
        defaultCurrency: map.default_currency || "USD",
        enabledCurrencies: (map.enabled_currencies || "USD,KES").split(","),
        nexusApiKey: map.nexuspay_api_key || "",
        fallbackRates,
      });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.put("/api/admin/currencies/settings", requireAdminAuth, async (req, res) => {
    try {
      const { defaultCurrency, enabledCurrencies, nexusApiKey, fallbackRates } = req.body;
      const upsert = async (key: string, value: string, category: string) => {
        await pool.query(`INSERT INTO system_settings (key, value, category) VALUES ($1, to_json($2::text), $3) ON CONFLICT (key) DO UPDATE SET value = to_json($2::text), updated_at = NOW()`, [key, value, category]);
      };
      if (defaultCurrency) await upsert("default_currency", defaultCurrency, "general");
      if (enabledCurrencies) await upsert("enabled_currencies", Array.isArray(enabledCurrencies) ? enabledCurrencies.join(",") : enabledCurrencies, "general");
      if (nexusApiKey !== undefined) { await upsert("nexuspay_api_key", nexusApiKey, "payment"); if (nexusApiKey) process.env.NEXUSPAY_API_KEY = nexusApiKey; }
      if (fallbackRates && typeof fallbackRates === "object") {
        for (const [code, rate] of Object.entries(fallbackRates)) {
          if (rate) await upsert(code, String(rate), "exchange_rate_fallback");
        }
      }
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  return httpServer;
}
