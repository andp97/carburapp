-- Rename table (preserves all rows)
ALTER TABLE "Refuel" RENAME TO "Expense";

-- Rename primary key constraint
ALTER TABLE "Expense" RENAME CONSTRAINT "Refuel_pkey" TO "Expense_pkey";

-- Rename foreign key constraint
ALTER TABLE "Expense" RENAME CONSTRAINT "Refuel_vehicleId_fkey" TO "Expense_vehicleId_fkey";

-- Rename indexes added in previous migration
ALTER INDEX "Refuel_vehicleId_date_idx" RENAME TO "Expense_vehicleId_date_idx";
ALTER INDEX "Refuel_vehicleId_expenseType_date_idx" RENAME TO "Expense_vehicleId_expenseType_date_idx";
