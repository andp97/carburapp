-- CreateIndex
CREATE INDEX "Deadline_vehicleId_dueDate_idx" ON "Deadline"("vehicleId", "dueDate");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_usedAt_idx" ON "PasswordResetToken"("userId", "usedAt");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE INDEX "Refuel_vehicleId_date_idx" ON "Refuel"("vehicleId", "date");

-- CreateIndex
CREATE INDEX "Refuel_vehicleId_expenseType_date_idx" ON "Refuel"("vehicleId", "expenseType", "date");

-- CreateIndex
CREATE INDEX "Vehicle_userId_createdAt_idx" ON "Vehicle"("userId", "createdAt");
