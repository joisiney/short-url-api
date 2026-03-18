import { HttpException } from '@nestjs/common';

export function throwHttpError(
  code: string,
  message: string,
  status: number,
): never {
  throw new HttpException({ code, message }, status);
}
