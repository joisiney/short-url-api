import { plainToInstance } from 'class-transformer';
import { IsString, validateSync } from 'class-validator';
import { flattenValidationErrors } from './flatten-validation-errors';

class SampleDto {
  @IsString()
  foo!: string;
}

describe('flattenValidationErrors', () => {
  it('deve incluir property e mensagens', () => {
    const instance = plainToInstance(SampleDto, { foo: 123 });
    const errors = validateSync(instance);
    const flat = flattenValidationErrors(errors);

    expect(flat.length).toBeGreaterThan(0);
    expect(flat[0]?.field).toBe('foo');
  });
});
