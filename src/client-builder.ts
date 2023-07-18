import { z } from 'zod'
import type {
  ServerAction,
  ActionResponse,
  ActionInput,
  ClientServerActionSafe,
  ClientServerActionThrowable,
  ActionResponseThrowable,
  FieldsValidationError,
} from './types'
import type { Simplify } from './client-builder.utils'

type ContextType = Record<string, unknown>

class TypedServerAction<TContext extends object = ContextType> {
  readonly #context: Promise<TContext>

  constructor(context: Promise<TContext>) {
    this.#context = context
  }

  use<TNewContext extends object = {}>(
    cb: (prevCtx: TContext) => TNewContext
  ): TypedServerAction<Simplify<TContext & TNewContext>> {
    const newContext = this.#context.then((v) => ({ ...v, ...cb(v) }))
    return new TypedServerAction(newContext)
  }

  input<TSchema extends z.ZodTypeAny>(schema: TSchema) {
    return new TypedServerActionWithValidation<TContext, TSchema>(
      this.#context,
      schema
    )
  }

  action = <TData>(
    serverAction: ServerAction<z.ZodVoid, TContext, TData>
  ): ClientServerActionSafe<z.ZodVoid, TData> => {
    return new TypedServerActionWithValidation<TContext, z.ZodVoid>(
      this.#context,
      z.void()
    ).action(serverAction)
  }

  actionThrowable = <TData>(
    serverAction: ServerAction<z.ZodVoid, TContext, TData>
  ): ClientServerActionThrowable<z.ZodVoid, TData> => {
    return new TypedServerActionWithValidation<TContext, z.ZodVoid>(
      this.#context,
      z.void()
    ).actionThrowable(serverAction)
  }
}

class TypedServerActionWithValidation<
  TContext extends object,
  TSchema extends z.ZodTypeAny,
> {
  readonly #context: Promise<TContext>
  readonly #schema: TSchema

  constructor(context: Promise<TContext>, schema: TSchema) {
    this.#context = context
    this.#schema = schema
  }

  action =
    <TData>(
      serverAction: ServerAction<TSchema, TContext, TData>
    ): ClientServerActionSafe<TSchema, TData> =>
    async (
      input: ActionInput<TSchema>
    ): Promise<ActionResponse<TSchema, TData>> => {
      try {
        const ctx = await this.#context
        const parsedInput = this.#parseInput(input)

        if (!parsedInput.success) {
          return {
            status: 'validationError',
            data: undefined,
            validation: parsedInput.error.flatten()
              .fieldErrors as FieldsValidationError<TSchema>,
            error: undefined,
          }
        }

        const data = await serverAction({
          input: parsedInput.data,
          ctx,
        })
        return {
          status: 'success',
          data,
          validation: undefined,
          error: undefined,
        }
      } catch (error) {
        console.error(error)
        return {
          status: 'error',
          data: undefined,
          validation: undefined,
          error:
            error instanceof Error
              ? error?.message
              : typeof error === 'string'
              ? error
              : error?.toString() ?? 'Unknown error',
        }
      }
    }

  actionThrowable =
    <TData>(
      serverAction: ServerAction<TSchema, TContext, TData>
    ): ClientServerActionThrowable<TSchema, TData> =>
    async (
      input: ActionInput<TSchema>
    ): Promise<ActionResponseThrowable<TSchema, TData>> => {
      try {
        const ctx = await this.#context
        const parsedInput = this.#parseInput(input)

        if (!parsedInput.success) {
          return {
            status: 'validationError',
            data: undefined,
            validation: parsedInput.error.flatten()
              .fieldErrors as FieldsValidationError<TSchema>,
          }
        }

        const data = await serverAction({
          input: parsedInput.data,
          ctx,
        })
        return {
          status: 'success',
          data,
          validation: undefined,
        }
      } catch (error) {
        console.error(error)
        throw error
      }
    }

  #parseInput = (input: ActionInput<TSchema>) => {
    const unwrappedInput =
      input instanceof FormData ? Object.fromEntries(input.entries()) : input
    const parsedInput = this.#schema.safeParse(unwrappedInput)

    return parsedInput
  }
}

function typedServerActionClient() {
  return new TypedServerAction(Promise.resolve({}))
}

export {
  typedServerActionClient,
  TypedServerAction,
  TypedServerActionWithValidation,
}
