import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

const eslintConfig = defineConfig([
  ...nextVitals,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'prisma/seed.ts',
    'tests/**',
    'docs/**',
  ]),
  {
    rules: {
      // Async data-fetch callbacks called from useEffect are a valid pattern;
      // the rule fires on the intermediate useCallback wrapper, not a direct setState.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]);

export default eslintConfig;
