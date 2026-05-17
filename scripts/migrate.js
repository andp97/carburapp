const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const result = spawnSync('prisma', ['migrate', 'deploy'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  encoding: 'utf8',
});

process.stdout.write(result.stdout ?? '');
process.stderr.write(result.stderr ?? '');

if (result.status !== 0) {
  const output = (result.stdout ?? '') + (result.stderr ?? '');
  if (output.includes('P3005')) {
    // DB was set up via `prisma db push` — schema exists but no migrations table.
    // Baseline every migration as applied, then deploy any that are genuinely new.
    const migrationsDir = path.join(__dirname, '../prisma/migrations');
    const migrations = fs.readdirSync(migrationsDir)
      .filter((name) => fs.statSync(path.join(migrationsDir, name)).isDirectory())
      .sort();
    for (const migration of migrations) {
      execSync(`prisma migrate resolve --applied ${migration}`, { stdio: 'inherit' });
    }
    execSync('prisma migrate deploy', { stdio: 'inherit' });
  } else {
    process.exit(result.status ?? 1);
  }
}
