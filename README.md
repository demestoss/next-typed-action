<h1 align="center">Next Typed Action</h1>

<div align="center">
  <strong>Type-safety Next.js Server Actions</strong>
</div>

<div align="center">
  The most efficient way to use server action powered by Zod
</div>

<br />

<div align="center">
  <!-- Stability -->
  <a href="https://nodejs.org/api/documentation.html#documentation_stability_index">
    <img src="https://img.shields.io/badge/stability-experimental-orange.svg?style=flat-square"
      alt="API stability" />
  </a>
  <!-- NPM version -->
  <a href="https://www.npmjs.com/package/next-typed-action">
    <img src="https://img.shields.io/npm/v/next-typed-action.svg?style=flat-square"
      alt="NPM version" />
  </a>
  <!-- Bundle size -->
  <a href="https://www.npmjs.com/package/next-typed-action">
    <img src="https://img.shields.io/bundlephobia/minzip/next-typed-action.svg?style=flat-square"
      alt="Bundle size" />
  </a>
</div>

## Table of Contents
- [Key Features](#key-features)
- [Installation](#installation)
- [Setup](#setup)
- [Usage](#usage)
- [API](#api)

## Key Features
- __Easy to use:__ create action, provide Zod schema and use it :tada:
- __Protected actions:__ protect your actions with guards for auth/roles or any other logic
- __Provide context:__ provide the context using middlewares
- __Actions reusability:__ reuse action clients and attach middlewares to it to create new clients
- __Use with hooks:__ integrate with yor client form to show loading/validation error or refetch your data
- __Infer action type:__ infer action context and input type to use it for action handlers in different modules

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

## Setup

```ts
// src/lib/server-actions.ts
import { typedServerActionClient } from 'next-typed-action';
import { cookies } from "next/headers";

export const actionClient = typedServerActionClient()

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
const login = actionClient
  .input(loginDto)
  .action(({ input, ctx }) => {
    // ...
  })

const createItem = authActionClient
  .input(z.string())
  .action(({ input, ctx }) => {
    // ...
  })
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

### Multiple middlewares
```ts
import { typedServerActionClient } from 'next-typed-action';
const actionClient = typedServerActionClient()
const authActionClient = actionClient.use(() => {
  // ...
})
const adminActionClient = authActionClient.use(() => {
  // ...
})
const otherActionClient = adminActionClient
  .use(() => {
   // ...
  })
  .use(() => {
    // ...
  })
  .use()
```

### Reuse action with input declare schema once and reuse
```ts
const itemOperationsActionClient = authActionClient.input(z.string())

const deleteItem = itemOperationsActionClient.action(({ input, ctx }) => {})
const getItem = itemOperationsActionClient.action(({ input, ctx }) => {})
const someActionItem = itemOperationsActionClient.action(({ input, ctx }) => {})
```

### Usage with form

```tsx
'use client'
import { useFormAction } from "next-typed-action";
import { login } from './_actions'

export default LoginForm()
{
  const { validationError, isLoading, error } = useFormAction(login)
  
  return (
    <form action={onSubmit}>
      <input name="username"/>
      // Show validation error type-safety way for each field in form
      {validationError?.username && <div>{validationError.username[0]}</div>

      <input name="password"/>
      {validationError?.password && <div>{validationError.password[0]}</div>
        
      <button type="submit" disabled={isLoading}>Create</button>
      // Show server error
      {error && <div>{error.message}</div>}
    </form>
  )
}
```

### Usage inline without form submit
  
```tsx
import { useFormAction } from "next-typed-action";
import { createItem } from './_actions'

export default CreateItemForm()
{
  return (
    <div>
      <button type="submit" onClick={async () => {
        const { error, data, validationError, status } = await createItem({ name: 'mock-item' })
        // work with returned data
        if (status === 'success') {
          // ...
        } else if (status === 'validationError') {
          // ...
        } else if (status === 'error') {
          // ...
        }
      }}>
        Create
      </button>
    </div>
  )
}
```

### Throw error to Boundary in hook (not stable)
```tsx
'use client'
import { useFormAction } from "next-typed-action";
import { login } from './_actions'

export default LoginForm()
{
  // Throw error to boundary on server error
  // Validation error still will be handled by useFormAction
  const { validationError, isLoading } = useFormAction(login, { throwOnError: true })
  
  return (
    <form action={onSubmit}>
      // ...
    </form>
  )
}
```

### Throw error to Boundary in action client
```ts
import { useFormAction } from "next-typed-action";
import { createItem } from './_actions'

export default CreateItemForm()
{
  return (
    <div>
      <button type="submit" onClick={async () => {
        const { data, validationError, status } = await createItem(
          { name: 'mock-item' }, 
          // Will thrown on error to Error Boundary
          { throwOnError: true }
        )
      }}>
        Create
      </button>
    </div>
  )
}
```

### Infer Action Context and Input
```ts
import { typedServerActionClient, inferContext, inferAction, inferInput } from 'next-typed-action';
const actionClient = typedServerActionClient()

type ActionClientContext = inferContext<typeof actionClient> // {}
type ActionClient = inferAction<typeof actionClient> // { ctx: {} }
```

```ts
const authActionClient = actionClient.use(() => ({
  userId: 'mock-user-id',
}))

type AuthActionClientContext = inferContext<typeof actionClient> // { userId: string }
type AuthActionClient = inferAction<typeof actionClient> // { ctx: { userId: string } }
```

```ts
const loginActionClient = authActionClient.input(z.object({
    username: z.string(),
    password: z.string(),
  }))

type LoginActionClientContext = inferContext<typeof actionClient> // { userId: string }
type LoginActionClientInput = inferInput<typeof actionClient> // { username: string, password: string }
type LoginActionClient = inferAction<typeof actionClient> // { ctx: { userId: string }, input: { username: string, password: string } }
```

## API

### useFormAction hook
```ts
const {
  status: 'error' | 'validationError' | 'success' | 'idle',
  data: TData | undefined,
  error: string | undefined,
  validationError: Record<keyof z.input<TSchema>, string[]> | undefined,
  isLoading: boolean,
  isError: boolean,
  isValidationError: boolean,
  isSuccess: boolean,
  submit: (schema: z.input<TShema> | FormData) => void,
  reset: () => void,
} = useFormAction<TSchema, TData>(
  typedServerAction: ClientServerAction<TShema, TData>, // action created by typedServerActionClient()
  {
    throwOnError?: boolean // @not-stable throw error to error boundary error.tsx if you want to handle it there
  }
)
```

### Other
TODO

## License
[MIT](https://tldrlegal.com/license/mit-license)