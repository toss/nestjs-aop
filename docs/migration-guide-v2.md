# Migration Guide: Migrating from @toss/nestjs-aop v1 to v2
This guide provides instructions for migrating `@toss/nestjs-aop` from version 1 to version 2.

## Overview
In version 2, createDecorator function is used to set metadata, replacing the SetMetadata function from @nestjs/common used in version 1.

## Steps
To migrate from v1 to v2, follow these steps:

1. Update your application's dependencies to use @toss/nestjs-aop version 2.
2. Replace all instances of SetMetadata with createDecorator in your code.

For example, suppose you have the following code that uses SetMetadata:

```typescript
import { SetMetadata } from '@nestjs/common';

const Foo = (options: FooOptions) => SetMetadata(FOO, options);

```

To migrate this code to use createDecorator, you would update it as follows:

```typescript
import { createDecorator } from '@toss/nestjs-aop';

const Foo = (options: FooOptions) => createDecorator(FOO, options);
```

## Conclusion
Migrating from @toss/nestjs-aop version 1 to version 2 involves replacing SetMetadata with createDecorator. Following the steps outlined in this guide should allow you to migrate your application successfully.

