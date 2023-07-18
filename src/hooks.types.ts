import type { z } from 'zod'
import type { ActionInput, FieldsValidationError } from './types'

type HookCallbacks<TSchema extends z.ZodTypeAny, TData> = {
  onSuccess?: (data: TData, reset: () => void) => void
  onError?: (error: string, reset: () => void) => void
  onValidationError?: (
    error: FieldsValidationError<TSchema>,
    reset: () => void
  ) => void
}

type HookOptions<TSchema extends z.ZodTypeAny, TData> = HookCallbacks<
  TSchema,
  TData
>

type ToSafeStates<
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
      isLoading: TStatus extends 'loading' ? true : false
      isError: TStatus extends 'error' ? true : false
      isValidationError: TStatus extends 'validationError' ? true : false
      isSuccess: TStatus extends 'success' ? true : false
    }
  : never

type UseFormActionReturnSafe<TSchema extends z.ZodTypeAny, TData> = {
  submit: (schema: ActionInput<TSchema>) => void
  reset: () => void
} & ToSafeStates<
  'idle' | 'loading' | 'error' | 'validationError' | 'success',
  TSchema,
  TData
>

type ToThrowableStates<
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
      isLoading: TStatus extends 'loading' ? true : false
      isValidationError: TStatus extends 'validationError' ? true : false
      isSuccess: TStatus extends 'success' ? true : false
    }
  : never

type UseFormActionReturnThrowable<TSchema extends z.ZodTypeAny, TData> = {
  submit: (schema: ActionInput<TSchema>) => void
  reset: () => void
} & ToThrowableStates<
  'idle' | 'loading' | 'validationError' | 'success',
  TSchema,
  TData
>

type UseFormActionReturn<TSchema extends z.ZodTypeAny, TData> =
  | UseFormActionReturnSafe<TSchema, TData>
  | UseFormActionReturnThrowable<TSchema, TData>

export type {
  HookCallbacks,
  HookOptions,
  UseFormActionReturn,
  UseFormActionReturnThrowable,
  UseFormActionReturnSafe,
}
