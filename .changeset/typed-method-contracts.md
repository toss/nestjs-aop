---
'@toss/nestjs-aop': minor
---

Add an opt-in generic overload to `createDecorator<T>` and export `TypedMethodDecorator<T>` for checking legacy method decorators against shared or inferred aspect function types. Existing calls without a type argument and runtime wrapping behavior are unchanged.
