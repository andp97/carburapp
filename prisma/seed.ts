// Run with: npx prisma db seed
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const vehicle = await prisma.vehicle.upsert({
    where: { id: 'seed-vehicle-1' },
    update: {},
    create: {
      id: 'seed-vehicle-1',
      name: 'Fiat Panda',
      plate: 'AB123CD',
      year: 2019,
    },
  });

  // Create 5 sample refuels over the last 3 months
  const now = new Date();
  const refuelData = [
    {
      id: 'seed-refuel-1',
      vehicleId: vehicle.id,
      fuelType: 'benzina',
      liters: 35.5,
      total: 62.5,
      odometer: 48200,
      isFull: true,
      date: new Date(now.getFullYear(), now.getMonth(), 5),
      station: 'ENI Via Roma',
    },
    {
      id: 'seed-refuel-2',
      vehicleId: vehicle.id,
      fuelType: 'benzina',
      liters: 40.0,
      total: 70.4,
      odometer: 47750,
      isFull: true,
      date: new Date(now.getFullYear(), now.getMonth() - 1, 20),
      station: null,
    },
    {
      id: 'seed-refuel-3',
      vehicleId: vehicle.id,
      fuelType: 'benzina',
      liters: 30.0,
      total: 52.8,
      odometer: 47300,
      isFull: false,
      date: new Date(now.getFullYear(), now.getMonth() - 1, 8),
      station: 'IP Autostrada A1',
    },
    {
      id: 'seed-refuel-4',
      vehicleId: vehicle.id,
      fuelType: 'benzina',
      liters: 42.0,
      total: 73.9,
      odometer: 46800,
      isFull: true,
      date: new Date(now.getFullYear(), now.getMonth() - 2, 22),
      station: null,
    },
    {
      id: 'seed-refuel-5',
      vehicleId: vehicle.id,
      fuelType: 'benzina',
      liters: 38.5,
      total: 67.7,
      odometer: 46300,
      isFull: true,
      date: new Date(now.getFullYear(), now.getMonth() - 2, 3),
      station: 'Q8 Piazza Garibaldi',
    },
  ];

  for (const data of refuelData) {
    await prisma.refuel.upsert({
      where: { id: data.id },
      update: {},
      create: data,
    });
  }

  // Create 3 sample deadlines
  const deadlineData = [
    {
      id: 'seed-deadline-1',
      vehicleId: vehicle.id,
      title: 'Bollo auto',
      subtitle: 'Scadenza annuale',
      dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 15),
      kind: 'bollo',
      amount: 120.0,
    },
    {
      id: 'seed-deadline-2',
      vehicleId: vehicle.id,
      title: 'Assicurazione RC Auto',
      subtitle: 'Rinnovo polizza',
      dueDate: new Date(now.getFullYear(), now.getMonth() + 2, 1),
      kind: 'assicurazione',
      amount: 450.0,
    },
    {
      id: 'seed-deadline-3',
      vehicleId: vehicle.id,
      title: 'Tagliando',
      subtitle: '50.000 km o 12 mesi',
      dueDate: new Date(now.getFullYear(), now.getMonth() + 3, 10),
      kind: 'tagliando',
      amount: 200.0,
    },
  ];

  for (const data of deadlineData) {
    await prisma.deadline.upsert({
      where: { id: data.id },
      update: {},
      create: data,
    });
  }

  console.log('Seed completed:', vehicle.name);
}

main().catch(console.error).finally(() => prisma.$disconnect());
