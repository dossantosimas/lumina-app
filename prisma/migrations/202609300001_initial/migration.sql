SET lock_timeout='5s';
SET statement_timeout='30s';
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "contact" VARCHAR(120),
    "notes" VARCHAR(2000),
    "archivedAt" TIMESTAMPTZ(6),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_orders" (
    "id" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "customerNameSnapshot" VARCHAR(120) NOT NULL,
    "orderDate" DATE NOT NULL,
    "notes" VARCHAR(2000),
    "total" DECIMAL(14,2) NOT NULL,
    "archivedAt" TIMESTAMPTZ(6),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sales_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_order_lines" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "description" VARCHAR(200) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "sales_order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL,
    "expenseDate" DATE NOT NULL,
    "concept" VARCHAR(300) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "supplier" VARCHAR(120),
    "invoiceReference" VARCHAR(120),
    "archivedAt" TIMESTAMPTZ(6),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorNameSnapshot" TEXT NOT NULL,
    "occurredAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entityType" TEXT NOT NULL,
    "entityId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB NOT NULL,
    "resultingVersion" INTEGER NOT NULL,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_records" (
    "id" UUID NOT NULL,
    "ownerId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "requestKey" UUID NOT NULL,
    "payloadHash" CHAR(64) NOT NULL,
    "response" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idempotency_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "activeAccess" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rateLimit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "lastRequest" BIGINT NOT NULL,

    CONSTRAINT "rateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customers_archivedAt_name_id_idx" ON "customers"("archivedAt", "name", "id");

-- CreateIndex
CREATE INDEX "sales_orders_archivedAt_orderDate_id_idx" ON "sales_orders"("archivedAt", "orderDate", "id");

-- CreateIndex
CREATE INDEX "sales_orders_customerId_orderDate_id_idx" ON "sales_orders"("customerId", "orderDate", "id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_order_lines_orderId_position_key" ON "sales_order_lines"("orderId", "position");

-- CreateIndex
CREATE INDEX "expenses_archivedAt_expenseDate_id_idx" ON "expenses"("archivedAt", "expenseDate", "id");

-- CreateIndex
CREATE INDEX "audit_events_entityType_entityId_occurredAt_id_idx" ON "audit_events"("entityType", "entityId", "occurredAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_records_ownerId_scope_requestKey_key" ON "idempotency_records"("ownerId", "scope", "requestKey");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "rateLimit_key_key" ON "rateLimit"("key");

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_order_lines" ADD CONSTRAINT "sales_order_lines_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idempotency_records" ADD CONSTRAINT "idempotency_records_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE customers ADD CONSTRAINT customers_valid CHECK (version > 0 AND length(btrim(name))>0);
ALTER TABLE sales_orders ADD CONSTRAINT orders_valid CHECK (version > 0 AND total>0 AND total<=999999999999.99 AND length(btrim("customerNameSnapshot"))>0);
ALTER TABLE sales_order_lines ADD CONSTRAINT lines_valid CHECK (position BETWEEN 1 AND 100 AND quantity BETWEEN 1 AND 10000 AND "unitPrice">=0 AND "unitPrice"<=999999999999.99 AND length(btrim(description))>0);
ALTER TABLE expenses ADD CONSTRAINT expenses_valid CHECK (version>0 AND amount>0 AND amount<=999999999999.99 AND length(btrim(concept))>0);
ALTER TABLE audit_events ADD CONSTRAINT audit_valid CHECK ("entityType" IN ('CUSTOMER','ORDER','EXPENSE') AND action IN ('CREATE','UPDATE','ARCHIVE','RESTORE') AND "resultingVersion">0);
ALTER TABLE idempotency_records ADD CONSTRAINT idempotency_hash_valid CHECK ("payloadHash" ~ '^[a-f0-9]{64}$');
CREATE FUNCTION public.lock_active_owner(actor_id text) RETURNS TABLE(id text,name text,"activeAccess" boolean)
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path=pg_catalog,public
AS 'SELECT u.id,u.name,u."activeAccess" FROM public."user" u WHERE u.id=actor_id FOR SHARE';
REVOKE ALL ON FUNCTION public.lock_active_owner(text) FROM PUBLIC;
