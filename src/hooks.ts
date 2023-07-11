import type { z } from 'zod'
import type { ActionInput, ActionResponse } from './types'
import type {
  HookCallbacks,
  HookOptions,
  UseFormActionReturn,
} from './hooks.types'
import { useCallback, useRef, useState, useTransition } from 'react'
import type { ClientServerAction } from './types'
import {
  toErrorResponse,
  toSuccessResponseOrAction,
  toUnknownErrorResponse,
} from './utils'

function useResponseHooks<TSchema extends z.ZodTypeAny, TData>({
  onError,
  onSuccess,
  onValidationError,
}: HookCallbacks<TSchema, TData> = {}) {
  const onSuccessRef = useRef(onSuccess)
  onSuccessRef.current = onSuccess
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError
  const onValidationErrorRef = useRef(onValidationError)
  onValidationErrorRef.current = onValidationError

  return useCallback(
    (response: ActionResponse<TSchema, TData>, reset: () => void) => {
      if (response.status === 'success') {
        onSuccessRef.current?.(response.data, reset)
      } else if (response.status === 'validationError') {
        onValidationErrorRef.current?.(response.validationError, reset)
      } else {
        onErrorRef.current?.(response.error, reset)
      }
      return response
    },
    []
  )
}

function useActionSubmit<TSchema extends z.ZodTypeAny, TData>(
  serverAction: ClientServerAction<TSchema, TData>,
  opts: HookOptions<TSchema, TData>
) {
  const serverActionRef = useRef(serverAction)
  serverActionRef.current = serverAction

  const runHooks = useResponseHooks<TSchema, TData>(opts)

  return useCallback(
    async (
      schema: ActionInput<TSchema>,
      reset: () => void
    ): Promise<ActionResponse<TSchema, TData>> =>
      serverActionRef
        .current(schema)
        .then((r) => runHooks(toSuccessResponseOrAction(r), reset))
        .catch((e: unknown) => runHooks(toUnknownErrorResponse(e), reset)),
    [runHooks]
  )
}

function useFormAction<TSchema extends z.ZodTypeAny, TData>(
  serverAction: ClientServerAction<TSchema, TData>,
  opts: HookOptions<TSchema, TData> = {}
): UseFormActionReturn<TSchema, TData> {
  const [isPending, startTransition] = useTransition()
  const [response, setResponse] = useState<
    ActionResponse<TSchema, TData> | undefined
  >()

  const submitAction = useActionSubmit(serverAction, opts)

  const reset = useCallback(() => {
    setResponse(undefined)
  }, [])

  const submit = useCallback(
    (schema: ActionInput<TSchema>) => {
      startTransition(() => {
        submitAction(schema, reset)
          .then((res) => setResponse(res))
          .catch((e: unknown) => setResponse(toErrorResponse(e)))
      })
    },
    [reset, submitAction]
  )

  const status = response?.status
    ? response.status
    : isPending
    ? 'loading'
    : 'idle'

  return {
    submit,
    reset,
    status,
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
    isValidationError: response?.status === 'validationError',
    data: response?.status === 'success' ? response.data : undefined,
    validationError:
      response?.status === 'validationError'
        ? response.validationError
        : undefined,
    error: response?.status === 'error' ? response.error : undefined,
  } as UseFormActionReturn<TSchema, TData>
}

export { useFormAction }
