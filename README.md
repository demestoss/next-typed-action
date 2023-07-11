<h1 align="center">Next Typed Action</h1>

<div align="center">
  <strong>Type-safety Next.js Server Actions</strong>
</div>

<div align="center">
  The most efficient way to use server action powered by Zod
</div>

## Table of Contents
- [Key Features](#key-features)
- [Example](#example)
- [Installation](#installation)
- [Usage](#usage)
- [API](#api)

## Key Features
- __Easy to use:__ create action, provide Zod schema and use it :tada:
- __Protected actions:__ protect your actions with guards for auth/roles or any other logic
- __Provide context:__ provide the context using middlewares
- __Actions reusability:__ reuse action clients and attach middlewares to it to create new clients
- __Use with hooks:__ integrate with yor client form to show loading/validation error or refetch your data
- __Infer action type:__ infer action context and input type to use it for action handlers in different modules

## Example

```ts
// src/lib/server-actions.ts
import { createServerAction } from 'next-typed-action';
import { cookies } from "next/headers";

export const actionClient = createServerAction()

export const authActionClient = actionClient.use((ctx) => {
  const userId = cookies().get('userId') // can access previous context value
  if (!userId) {
    throw new Error('Unauthorized') // protect action guard
  }
  return {
    userId, // context will be merged with previous context automatically
  }
})
```

```ts
// src/app/_actions.ts
'use server'

import { z } from 'zod';
import { authActionClient, actionClient } from '@/lib/serverActions'

const loginDto = z.object({
  username: z.string(),
  password: z.string(),
})
const loginAction = actionClient
  .input(loginDto)
  .action(({ input, ctx }) => {
    // ...
  })

const createItemAction = authActionClient
  .input(z.string())
  .action(({ input, ctx }) => {
    // ...
  })
```

## Installation

### Requirements
- Next.js >= 12.4.x
- TypeScript >= 5.x.x

### Config next.config.js
```js
module.exports = {
  experimental: {
    serverActions: true,
    // ...
  },
}
```

### Run command
```
npm install next-typed-action zod
```
or
```
yard add next-typed-action zod
```
or
```
pnpm add next-typed-action zod
```

## Usage
TODO

## API
TODO

## License
[MIT](https://tldrlegal.com/license/mit-license)