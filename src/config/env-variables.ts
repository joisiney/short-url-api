import { Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  Validate,
  ValidateIf,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  IsUrl,
} from 'class-validator';
import { isFQDN, isURL } from 'validator';
import { isIPv4 } from 'node:net';

function envScalarToString(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '';
}

@ValidatorConstraint({ name: 'isHostLike', async: false })
export class IsHostLikeConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string' || value.length === 0) {
      return false;
    }
    if (value === 'localhost') {
      return true;
    }
    if (isIPv4(value)) {
      return true;
    }
    return isFQDN(value, { require_tld: false, allow_underscores: true });
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} deve ser localhost, um IPv4 ou um hostname válido`;
  }
}

@ValidatorConstraint({ name: 'isCorsOriginList', async: false })
export class IsCorsOriginListConstraint implements ValidatorConstraintInterface {
  validate(origins: unknown): boolean {
    if (!Array.isArray(origins) || origins.length === 0) {
      return false;
    }
    return origins.every((o) => {
      if (typeof o !== 'string') {
        return false;
      }
      if (o === '*') {
        return true;
      }
      return isURL(o, { protocols: ['http', 'https'], require_protocol: true });
    });
  }

  defaultMessage(): string {
    return 'APP_CORS_ORIGIN deve conter URLs http/https válidas ou "*"';
  }
}

export class EnvVariables {
  @IsIn(['development', 'test', 'production'])
  NODE_ENV!: 'development' | 'test' | 'production';

  @Type(() => Number)
  @IsInt()
  @Min(1024)
  @Max(65535)
  APP_PORT!: number;

  @Validate(IsHostLikeConstraint)
  APP_HOST!: string;

  @Transform(({ value }: { value: unknown }): string =>
    envScalarToString(value).trim(),
  )
  @IsString()
  @MinLength(1)
  @Matches(/^[a-z0-9-/]+$/, {
    message:
      'APP_GLOBAL_PREFIX deve conter apenas letras minúsculas, números, hífens e barras',
  })
  APP_GLOBAL_PREFIX!: string;

  @Transform(({ value }: { value: unknown }): unknown => {
    if (typeof value !== 'string') {
      return value;
    }
    return value.split(',').map((v) => v.trim());
  })
  @IsArray()
  @ArrayNotEmpty()
  @Validate(IsCorsOriginListConstraint)
  APP_CORS_ORIGIN!: string[];

  @Transform(({ value }: { value: unknown }): string =>
    envScalarToString(value).trim(),
  )
  @IsString()
  @Matches(/^\d+(\.\d+)?(b|kb|mb|gb)$/i, {
    message: 'APP_BODY_LIMIT deve estar no formato: 100b, 1.5kb, 10mb, 1gb',
  })
  APP_BODY_LIMIT!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(86_400_000, {
    message: 'Timeout não pode exceder 24 horas (86400000ms)',
  })
  APP_HTTP_TIMEOUT_MS!: number;

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
  APP_ENABLE_SWAGGER!: boolean;

  @Validate(IsHostLikeConstraint)
  DB_HOST!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1024)
  @Max(65535)
  DB_PORT!: number;

  @Transform(({ value }: { value: unknown }): string =>
    envScalarToString(value).trim(),
  )
  @IsString()
  @MinLength(1)
  @MaxLength(63, { message: 'DB_NAME não pode exceder 63 caracteres' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'DB_NAME deve conter apenas letras, números, hífens e underscores',
  })
  DB_NAME!: string;

  @Transform(({ value }: { value: unknown }): string =>
    envScalarToString(value).trim(),
  )
  @IsString()
  @MinLength(1)
  @MaxLength(63, { message: 'DB_USER não pode exceder 63 caracteres' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'DB_USER deve conter apenas letras, números, hífens e underscores',
  })
  DB_USER!: string;

  @IsString()
  @MinLength(8, { message: 'DB_PASSWORD deve ter no mínimo 8 caracteres' })
  @MaxLength(128, { message: 'DB_PASSWORD não pode exceder 128 caracteres' })
  @Matches(/[A-Z]/, {
    message: 'DB_PASSWORD deve conter ao menos uma letra maiúscula',
  })
  @Matches(/[a-z]/, {
    message: 'DB_PASSWORD deve conter ao menos uma letra minúscula',
  })
  @Matches(/\d/, { message: 'DB_PASSWORD deve conter ao menos um número' })
  @Matches(/[^A-Za-z0-9]/, {
    message: 'DB_PASSWORD deve conter ao menos um caractere especial',
  })
  DB_PASSWORD!: string;

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
  DB_SSL!: boolean;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  DB_POOL_MIN!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  DB_POOL_MAX!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(86_400_000, {
    message: 'Timeout não pode exceder 24 horas (86400000ms)',
  })
  DB_IDLE_TIMEOUT_MS!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(86_400_000, {
    message: 'Timeout não pode exceder 24 horas (86400000ms)',
  })
  DB_CONNECTION_TIMEOUT_MS!: number;

  @Validate(IsHostLikeConstraint)
  REDIS_HOST!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1024)
  @Max(65535)
  REDIS_PORT!: number;

  @IsString()
  @MinLength(8, { message: 'REDIS_PASSWORD deve ter no mínimo 8 caracteres' })
  @MaxLength(128, {
    message: 'REDIS_PASSWORD não pode exceder 128 caracteres',
  })
  REDIS_PASSWORD!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(15, { message: 'REDIS_DB deve estar entre 0 e 15' })
  REDIS_DB!: number;

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
  REDIS_TLS_ENABLED!: boolean;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(86_400_000, {
    message: 'Timeout não pode exceder 24 horas (86400000ms)',
  })
  REDIS_CONNECT_TIMEOUT_MS!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(86_400)
  CACHE_TTL_SECONDS!: number;

  @IsIn(['debug', 'log', 'warn', 'error'])
  LOG_LEVEL!: 'debug' | 'log' | 'warn' | 'error';

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
  LOG_PRETTY!: boolean;

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
  LOG_REDACT_SENSITIVE!: boolean;

  @IsOptional()
  @Transform(({ value }: { value: unknown }): string | undefined => {
    if (value === undefined || value === null) {
      return undefined;
    }
    const s = envScalarToString(value).trim();
    return s === '' ? undefined : s;
  })
  @ValidateIf((_: unknown, v: unknown) => v !== undefined)
  @IsString()
  OTEL_SERVICE_NAME?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }): string | undefined => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    return envScalarToString(value);
  })
  @ValidateIf((_: unknown, v: unknown) => v !== undefined && v !== '')
  @IsUrl({ require_protocol: true, protocols: ['http', 'https'] })
  OTEL_EXPORTER_OTLP_ENDPOINT?: string;

  @IsOptional()
  @IsIn(['otlp', 'none'])
  OTEL_TRACES_EXPORTER?: 'otlp' | 'none';

  @Transform(({ value }: { value: unknown }): string =>
    envScalarToString(value).trim(),
  )
  @IsString()
  @MinLength(32, {
    message:
      'SHORT_CODE_FEISTEL_SECRET deve ter no minimo 32 caracteres (entropia suficiente)',
  })
  @MaxLength(256, {
    message: 'SHORT_CODE_FEISTEL_SECRET nao pode exceder 256 caracteres',
  })
  @Matches(/^[-A-Za-z0-9+/=_]+$/, {
    message:
      'SHORT_CODE_FEISTEL_SECRET deve usar caracteres seguros (base64 ou similar)',
  })
  SHORT_CODE_FEISTEL_SECRET!: string;
}

export type Env = EnvVariables;
