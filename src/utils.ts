import type { z } from 'zod'
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
    error:
      error instanceof Error
        ? error
        : typeof error === 'string'
        ? new Error(error)
        : new Error('Unknown error'),
    validationError: undefined,
  } as const
}

export { toSuccessResponse, toErrorResponse, toValidationErrorResponse }
