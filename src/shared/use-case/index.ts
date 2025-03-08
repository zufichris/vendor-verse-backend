import { TRolePermission } from "../../data/entity/role";
import { TUser } from "../../data/entity/user";
import { EStatusCodes } from "../enum";
export type UseCaseResult<T> = | {
  success: true;
  data: T;
  status?: number
}
  | {
    success: false;
    error: string;
    status?: number
  };

export function handleUseCaseError({ title, error = "An unexpected Error Occurred", status = EStatusCodes.enum.badGateway }: {
  title: string
  error?: string,
  status?: number,
}): { success: false, error: string } {
  return ({
    error: `${title}-Error: ${error}`,
    success: false
  })
}
export interface AuthContext extends Partial<TUser> {
  userId: string,
  adminId?: string,
  vendorId?: string;
  permissions:TRolePermission[]
}

/**
 * BaseUseCase<TInput, TOutput, TError, TContext>
 * 
 * Defines the structure for all use cases.
 * @typeParam TInput - The type of the input data required for the use case. Defaults to `void` if no input is needed.
 * @typeParam TOutput - The type of the output data returned by the use case. Defaults to `void` if no output is expected.
 * @typeParam TError - The type of the error that the use case might produce. Defaults to `Error`.
 * @typeParam TContext - The type of optional context that can be passed to the use case, such as user metadata or request-related information. Defaults to `void` if no context is needed.
 */
export interface BaseUseCase<TInput = void, TOutput = void, TContext = void> {
  /**
   * Optional method executed before the main business logic in the `execute` method.
   * Can be used for validation, logging, or setup tasks.
   * 
   * @param input - The input data for the use case.
   * @param context - Optional context for the use case execution.
   * @returns A Promise that resolves when the pre-execution step is completed.
   */
  beforeExecute?(input: TInput, context?: TContext): Promise<void>;

  /**
   * The core business logic of the use case.
   * This is the only required method that all use cases must implement.
   * 
   * @param input - The input data for the use case.
   * @param context - Optional context for the use case execution.
   * @returns A Promise that resolves to a `Result` object, which indicates either success (`value`) or failure (`error`).
   */
  execute(input: TInput, context?: TContext): Promise<UseCaseResult<TOutput>>;

  /**
   * Optional method executed after the main business logic in the `execute` method.
   * Can be used for post-processing, such as logging results, triggering side effects, or cleanup.
   * 
   * @param output - The result of the `execute` method, including success or failure details.
   * @param context - Optional context for the use case execution.
   * @returns A Promise that resolves when the post-execution step is completed.
   */
  afterExecute?(output: UseCaseResult<TOutput>, context?: TContext): Promise<void>;
}
