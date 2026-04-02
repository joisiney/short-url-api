import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  Validate,
} from 'class-validator';
import { IsHostLikeConstraint } from '@shared/validation/is-host-like.constraint';
import { envScalarToString } from '@shared/validation/env-scalar-to-string';

export class PgConnectionEnvDto {
  @Validate(IsHostLikeConstraint)
  PG_HOST!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1024)
  @Max(65535)
  PG_PORT!: number;

  @Transform(({ value }: { value: unknown }): string =>
    envScalarToString(value).trim(),
  )
  @IsString()
  @MinLength(1)
  @MaxLength(63, { message: 'PG_NAME não pode exceder 63 caracteres' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'PG_NAME deve conter apenas letras, números, hífens e underscores',
  })
  PG_NAME!: string;

  @Transform(({ value }: { value: unknown }): string =>
    envScalarToString(value).trim(),
  )
  @IsString()
  @MinLength(1)
  @MaxLength(63, { message: 'PG_USER não pode exceder 63 caracteres' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'PG_USER deve conter apenas letras, números, hífens e underscores',
  })
  PG_USER!: string;

  @IsString()
  @MinLength(8, { message: 'PG_PWD deve ter no mínimo 8 caracteres' })
  @MaxLength(128, { message: 'PG_PWD não pode exceder 128 caracteres' })
  @Matches(/[A-Z]/, {
    message: 'PG_PWD deve conter ao menos uma letra maiúscula',
  })
  @Matches(/[a-z]/, {
    message: 'PG_PWD deve conter ao menos uma letra minúscula',
  })
  @Matches(/\d/, { message: 'PG_PWD deve conter ao menos um número' })
  @Matches(/[^A-Za-z0-9]/, {
    message: 'PG_PWD deve conter ao menos um caractere especial',
  })
  PG_PWD!: string;

  @Transform(({ value }: { value: unknown }): unknown => {
    if (value === 'true' || value === true) {
      return true;
    }
    if (value === 'false' || value === false) {
      return false;
    }
    return value;
  })
  @IsBoolean()
  PG_SSL!: boolean;
}
