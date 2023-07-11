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
      error: TStatus extends 'error' ? Error | unknown : undefined
      validationError: TStatus extends 'validationError'
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

type ActionInput<TSchema extends z.ZodTypeAny> = z.input<TSchema> | FormData

type SafeActionWithValidation<TSchema extends z.ZodTypeAny, TData> = (
  input: ActionInput<TSchema>
) => Promise<ActionResponse<TSchema, TData>>

type ActionWithValidation<TSchema extends z.ZodTypeAny, TData> = (
  input: ActionInput<TSchema>
) => Promise<TData>

type ServerAction<TSchema extends z.ZodTypeAny, Context, TData> = (opts: {
  input: z.input<TSchema>
  ctx: Context
}) => Promise<TData>

type ClientServerAction<TSchema extends z.ZodTypeAny, TData> =
  | SafeActionWithValidation<TSchema, TData>
  | ActionWithValidation<TSchema, TData>

export type {
  ActionWithValidation,
  ServerAction,
  FieldsValidationError,
  ActionResponse,
  ActionInput,
  SafeActionWithValidation,
  ClientServerAction,
  StatusToResponseState,
}
