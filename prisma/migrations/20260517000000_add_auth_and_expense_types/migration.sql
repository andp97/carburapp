-- CreateTable: User
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: User.email unique
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AlterTable: Vehicle — add userId (nullable first so existing rows survive)
ALTER TABLE "Vehicle" ADD COLUMN "userId" TEXT;

-- Remove vehicles with no owner — they are inaccessible without auth anyway
DELETE FROM "Vehicle" WHERE "userId" IS NULL;

-- Make userId NOT NULL now that orphan rows are gone
ALTER TABLE "Vehicle" ALTER COLUMN "userId" SET NOT NULL;

-- AddForeignKey: Vehicle.userId → User.id
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: Refuel — add expenseType with default
ALTER TABLE "Refuel" ADD COLUMN "expenseType" TEXT NOT NULL DEFAULT 'carburante';

-- AlterTable: Refuel — make fuel-specific columns nullable (manutenzione/altro don't use them)
ALTER TABLE "Refuel" ALTER COLUMN "fuelType" DROP NOT NULL;
ALTER TABLE "Refuel" ALTER COLUMN "liters" DROP NOT NULL;
ALTER TABLE "Refuel" ALTER COLUMN "odometer" DROP NOT NULL;
