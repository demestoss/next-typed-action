import { z } from 'zod'
import type {
  ActionResponse,
  StatusToResponseState,
  FieldsValidationError,
} from './types'

function toSuccessResponse<TData>(data: TData) {
  return {
    status: 'success',
    data,
    error: undefined,
    validationError: undefined,
  } as const
}

function toValidationErrorResponse<TSchema extends z.ZodTypeAny>(
  error: z.ZodError<z.input<TSchema>>
) {
  return {
    status: 'validationError',
    data: undefined,
    error: undefined,
    validationError: error.flatten()
      .fieldErrors as FieldsValidationError<TSchema>,
  } as const
}

function toErrorResponse(error: unknown) {
  return {
    status: 'error',
    data: undefined,
    error: error instanceof Error ? error : error,
    validationError: undefined,
  } as const
}

function isSafeResponse(res: unknown) {
  return (
    typeof res === 'object' &&
    res !== null &&
    'status' in res &&
    'data' in res &&
    'error' in res &&
    'validationError' in res
  )
}

function toSuccessResponseOrAction<
  TSchema extends z.ZodTypeAny,
  TData,
  TResponse extends TData | ActionResponse<TSchema, TData>,
>(data: TResponse): ActionResponse<TSchema, TData> {
  if (isSafeResponse(data)) {
    return data as ActionResponse<TSchema, TData>
  }
  return toSuccessResponse(data as TData)
}

function toUnknownErrorResponse<TSchema extends z.ZodTypeAny, TData>(
  error: unknown
): StatusToResponseState<'error' | 'validationError', TSchema, TData> {
  if (error instanceof z.ZodError) {
    return toValidationErrorResponse(error)
  }
  return toErrorResponse(error)
}

export {
  toSuccessResponseOrAction,
  toUnknownErrorResponse,
  toSuccessResponse,
  toErrorResponse,
  toValidationErrorResponse,
}
