const { execSync, spawnSync } = require('child_process');

const result = spawnSync('prisma', ['migrate', 'deploy'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  encoding: 'utf8',
});

process.stdout.write(result.stdout ?? '');
process.stderr.write(result.stderr ?? '');

if (result.status !== 0) {
  const output = (result.stdout ?? '') + (result.stderr ?? '');
  if (output.includes('P3005')) {
    execSync('prisma migrate resolve --applied 20240101000000_init', { stdio: 'inherit' });
    execSync('prisma migrate deploy', { stdio: 'inherit' });
  } else {
    process.exit(result.status ?? 1);
  }
}
