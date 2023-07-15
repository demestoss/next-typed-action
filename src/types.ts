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
      error: TStatus extends 'error' ? Error : undefined
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

type ActionWithValidation<TSchema extends z.ZodTypeAny, TData> = (
  input: ActionInput<TSchema>
) => Promise<ActionResponse<TSchema, TData>>

type ServerAction<TSchema extends z.ZodTypeAny, Context, TData> = (opts: {
  input: z.input<TSchema>
  ctx: Context
}) => Promise<TData>

type ClientServerAction<
  TSchema extends z.ZodTypeAny,
  TData,
> = ActionWithValidation<TSchema, TData>

export type {
  ActionWithValidation,
  ServerAction,
  FieldsValidationError,
  ActionResponse,
  ActionInput,
  ClientServerAction,
  StatusToResponseState,
}
