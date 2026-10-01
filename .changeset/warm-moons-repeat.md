---
'@toss/nestjs-aop': minor
---

Support NestJS 12.

`@nestjs/common` and `@nestjs/core` peer ranges now accept `^12`, so installing alongside NestJS 12 no longer fails with `ERESOLVE`. No runtime code changed — the internals this package relies on (`DiscoveryService`, `Reflector`, `InstanceWrapper`) are unchanged in v12, and the existing test suite passes against NestJS 8, 9, 10, 11 and 12.

Note that NestJS 12 is published as ESM only while this package is published as CommonJS, so NestJS 12 users need Node.js `^20.19.0 || >=22.12.0` (versions where `require(esm)` is available). NestJS 8 - 11 users are unaffected.
