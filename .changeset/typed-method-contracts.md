---
'@toss/nestjs-aop': minor
---

Add an opt-in generic overload to `createDecorator<T>` and export `TypedMethodDecorator<T>` for checking legacy method decorators against shared or inferred aspect function types. Existing calls without a type argument and runtime wrapping behavior are unchanged.

Explicit shared contracts work with TypeScript 4.7 and later. Contextual inference of the original method's type through a generic decorator factory requires TypeScript 5.0 or later; older compilers can use an explicit method type instead.
