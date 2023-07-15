import type { z } from 'zod'
import type {
  ServerAction,
  ActionResponse,
  ActionInput,
  ClientServerAction,
} from './types'
import type { Simplify } from './client-builder.utils'
import {
  toErrorResponse,
  toSuccessResponse,
  toValidationErrorResponse,
} from './utils'

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
    ): ClientServerAction<TSchema, TData> =>
    async (
      input: ActionInput<TSchema>,
      opts: { throwError?: boolean } = {}
    ): Promise<ActionResponse<TSchema, TData>> => {
      try {
        const ctx = await this.#context

        const unwrappedInput =
          input instanceof FormData
            ? Object.fromEntries(input.entries())
            : input
        const parsedInput = this.#schema.safeParse(unwrappedInput)

        if (!parsedInput.success) {
          return toValidationErrorResponse(parsedInput.error)
        }

        const data = await serverAction({
          input: parsedInput.data,
          ctx,
        })

        return toSuccessResponse(data)
      } catch (error) {
        console.error(error)

        if (opts.throwError) {
          throw error
        }

        return toErrorResponse(error)
      }
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
