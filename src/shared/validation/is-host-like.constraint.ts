import { isFQDN } from 'validator';
import { isIPv4 } from 'node:net';
import {
  ValidatorConstraint,
  type ValidatorConstraintInterface,
  type ValidationArguments,
} from 'class-validator';

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
