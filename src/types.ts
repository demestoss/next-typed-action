import type { z } from 'zod'

type FieldsValidationError<TSchema extends z.ZodTypeAny> = Partial<
  Record<keyof z.input<TSchema>, string[]>
>

type StatusToResponseState<
  TStatus,
  TSchema extends z.ZodTypeAny,
  TData,
> = TStatus extends unknown
  ? {
      status: TStatus
      data: TStatus extends 'success' ? TData : undefined
      error: TStatus extends 'error' ? string : undefined
      validation: TStatus extends 'validationError'
        ? FieldsValidationError<TSchema>
        : undefined
    }
  : never

type ActionResponse<
  TSchema extends z.ZodTypeAny,
  TData,
> = StatusToResponseState<
  'success' | 'error' | 'validationError',
  TSchema,
  TData
>

type StatusToResponseStateThrowable<
  TStatus,
  TSchema extends z.ZodTypeAny,
  TData,
> = TStatus extends unknown
  ? {
      status: TStatus
      data: TStatus extends 'success' ? TData : undefined
      validation: TStatus extends 'validationError'
        ? FieldsValidationError<TSchema>
        : undefined
    }
  : never

type ActionResponseThrowable<
  TSchema extends z.ZodTypeAny,
  TData,
> = StatusToResponseStateThrowable<
  'success' | 'validationError',
  TSchema,
  TData
>

type ActionInput<TSchema extends z.ZodTypeAny> = z.input<TSchema> | FormData

type ClientServerActionSafe<TSchema extends z.ZodTypeAny, TData> = (
  input: ActionInput<TSchema>
) => Promise<ActionResponse<TSchema, TData>>

type ClientServerActionThrowable<TSchema extends z.ZodTypeAny, TData> = (
  input: ActionInput<TSchema>
) => Promise<ActionResponseThrowable<TSchema, TData>>

type ServerAction<TSchema extends z.ZodTypeAny, Context, TData> = (opts: {
  input: z.input<TSchema>
  ctx: Context
}) => Promise<TData>

type ClientServerAction<TSchema extends z.ZodTypeAny, TData> =
  | ClientServerActionSafe<TSchema, TData>
  | ClientServerActionThrowable<TSchema, TData>

export type {
  ClientServerAction,
  ClientServerActionThrowable,
  ActionResponseThrowable,
  ServerAction,
  FieldsValidationError,
  ActionResponse,
  ActionInput,
  ClientServerActionSafe,
  StatusToResponseState,
}
