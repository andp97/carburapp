<!-- BEGIN:nextjs-agent-rules -->
# Note for AI coding assistants

This project uses Next.js 16 with the App Router. This version has breaking changes compared to older releases — APIs, conventions, and file structure may differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

Key project conventions:
- All shared TypeScript types live in `lib/types.ts`
- Utility functions belong in `lib/utils.ts`
- Screen-level components go in `components/screens/`; shared UI components go in `components/`
- Database schema is in `prisma/schema.prisma` — run `npx prisma migrate dev` after any schema change
- Theme colors are defined in `lib/types.ts` as `DARK_THEME` and `LIGHT_THEME`
<!-- END:nextjs-agent-rules -->
