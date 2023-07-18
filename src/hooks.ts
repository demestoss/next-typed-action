import type { z } from 'zod'
import type {
  ActionInput,
  ActionResponse,
  ActionResponseThrowable,
  ClientServerActionSafe,
  ClientServerAction,
} from './types'
import type {
  HookCallbacks,
  HookOptions,
  UseFormActionReturn,
  UseFormActionReturnSafe,
  UseFormActionReturnThrowable,
} from './hooks.types'
import { useCallback, useRef, useState, useTransition } from 'react'

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
    (
      response:
        | ActionResponse<TSchema, TData>
        | ActionResponseThrowable<TSchema, TData>,
      reset: () => void
    ) => {
      if (response.status === 'success') {
        onSuccessRef.current?.(response.data, reset)
      } else if (response.status === 'validationError') {
        onValidationErrorRef.current?.(response.validation, reset)
      } else {
        onErrorRef.current?.(response.error, reset)
      }
      return response
    },
    []
  )
}

function useActionSubmit<
  TSchema extends z.ZodTypeAny,
  TData,
  TServerAction extends ClientServerAction<TSchema, TData>,
>(serverAction: TServerAction, opts: HookOptions<TSchema, TData>) {
  const serverActionRef = useRef(serverAction)
  serverActionRef.current = serverAction

  const runHooks = useResponseHooks<TSchema, TData>(opts)

  return useCallback(
    async (schema: ActionInput<TSchema>, reset: () => void) =>
      serverActionRef.current(schema).then((r) => runHooks(r, reset)),
    [runHooks]
  )
}

function useFormAction<
  TSchema extends z.ZodTypeAny,
  TData,
  TServerAction extends ClientServerAction<TSchema, TData>,
>(
  serverAction: TServerAction,
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
    (schema: ActionInput<TSchema>) =>
      startTransition(() =>
        // @ts-ignore
        submitAction(schema, reset).then((res) => setResponse(res))
      ),
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
    validation:
      response?.status === 'validationError' ? response.validation : undefined,
    error: response?.status === 'error' ? response.error : undefined,
  } as TServerAction extends ClientServerActionSafe<TSchema, TData>
    ? UseFormActionReturnSafe<TSchema, TData>
    : UseFormActionReturnThrowable<TSchema, TData>
}

export { useFormAction }
