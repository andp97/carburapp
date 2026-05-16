-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plate" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refuel" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fuelType" TEXT NOT NULL,
    "liters" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "odometer" INTEGER NOT NULL,
    "station" TEXT,
    "notes" TEXT,
    "isFull" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Refuel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deadline" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "kind" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Deadline_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Refuel" ADD CONSTRAINT "Refuel_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deadline" ADD CONSTRAINT "Deadline_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
