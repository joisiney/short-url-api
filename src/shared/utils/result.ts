export type Failure<E> = {
  isSuccess: false;
  isFailure: true;
  error: E;
  value: null;
};

export type Success<V> = {
  isSuccess: true;
  isFailure: false;
  error: null;
  value: V;
};

export type Result<V, E> = Success<V> | Failure<E>;

export class ResultUtils {
  static ok<V, E = never>(value: V): Result<V, E> {
    return {
      isSuccess: true,
      isFailure: false,
      error: null,
      value,
    };
  }

  static fail<E, V = never>(error: E): Result<V, E> {
    return {
      isSuccess: false,
      isFailure: true,
      error,
      value: null as never,
    };
  }
}
