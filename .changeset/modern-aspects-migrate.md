---
'@toss/nestjs-aop': major
---

Ship ESM only and require Node.js 22.12.0 or later. Drop NestJS 8 and 9 support;
NestJS 10, 11 and 12 remain supported. The public decorator runtime API is unchanged.

Consumers must resolve the package through its root export; undocumented `dist/*` and `src/*` deep imports are no longer exported.
CommonJS applications can use Node's synchronous `require(esm)` support, but older
CommonJS Jest configurations need migration to Jest ESM mode. CommonJS TypeScript
consumers using NodeNext need TypeScript 5.8 or later; node16 does not support
this interop. See the [migration guide](https://github.com/toss/nestjs-aop/blob/main/docs/migrations/v3.md)
for tested Node/Jest combinations and migration instructions.
