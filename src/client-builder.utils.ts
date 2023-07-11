import type {
  TypedServerAction,
  TypedServerActionWithValidation,
} from './client-builder'
import type { z } from 'zod'

type Simplify<T> = { [KeyType in keyof T]: T[KeyType] } & {}

type inferContext<T> = T extends TypedServerAction<infer Context>
  ? Context
  : T extends TypedServerActionWithValidation<infer Context, infer Input>
  ? Context
  : never

type inferInput<T> = T extends TypedServerActionWithValidation<
  infer Context,
  infer Input
>
  ? z.infer<Input>
  : never

type inferAction<T> = T extends TypedServerAction<infer Context>
  ? { ctx: Context }
  : T extends TypedServerActionWithValidation<infer Context, infer Input>
  ? { input: z.infer<Input>; ctx: Context }
  : never

export type { inferContext, inferInput, inferAction, Simplify }
