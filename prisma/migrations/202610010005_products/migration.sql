-- Additive catalog: existing order lines retain NULL pointers and their original snapshots.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
CREATE TABLE products (
 id UUID PRIMARY KEY,
 name VARCHAR(120) NOT NULL,
 price NUMERIC(14,2) NOT NULL,
 description VARCHAR(2000),
 "archivedAt" TIMESTAMPTZ(6),
 version INTEGER NOT NULL DEFAULT 1,
 "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMPTZ(6) NOT NULL,
 CONSTRAINT products_valid CHECK(version>0 AND price>0 AND price<=999999999999.99 AND length(btrim(name))>0)
);
CREATE INDEX "products_archivedAt_name_id_idx" ON products("archivedAt",name,id);
ALTER TABLE sales_order_lines ADD COLUMN "productId" UUID;
CREATE INDEX "sales_order_lines_productId_idx" ON sales_order_lines("productId");
ALTER TABLE sales_order_lines ADD CONSTRAINT "sales_order_lines_productId_fkey" FOREIGN KEY("productId") REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
ALTER TABLE sales_order_lines VALIDATE CONSTRAINT "sales_order_lines_productId_fkey";
ALTER TABLE audit_events DROP CONSTRAINT audit_valid;
ALTER TABLE audit_events ADD CONSTRAINT audit_valid CHECK ("entityType" IN ('PRODUCT','CUSTOMER','ORDER','EXPENSE') AND action IN ('CREATE','UPDATE','ARCHIVE','RESTORE') AND "resultingVersion">0) NOT VALID;
ALTER TABLE audit_events VALIDATE CONSTRAINT audit_valid;
COMMIT;
