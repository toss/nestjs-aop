---
'@toss/nestjs-aop': major
---

Ship ESM only and require Node.js 22.12.0 or later. Drop NestJS 8 and 9 support;
NestJS 10, 11 and 12 remain supported. The public decorator runtime API is unchanged.

Consumers must resolve the package through its root export (or its exported
`package.json`); undocumented `dist/*` and `src/*` deep imports are no longer exported.
CommonJS applications can use Node's synchronous `require(esm)` support, but older
CommonJS Jest configurations need migration to Jest ESM mode. See `MIGRATION_V3.md`
for tested Node/Jest combinations and migration instructions.
