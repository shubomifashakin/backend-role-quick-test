import { Transform } from 'class-transformer';
import { IsNumber, IsPositive, IsUUID, Max } from 'class-validator';
import { MAX_ALLOWED_AMMOUNT } from '../../../utils/constants';

export class CreateDepositDto {
  @IsUUID('4', { message: 'Invalid idempotencyKey' })
  idempotencyKey: string;

  @Transform(({ value }) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    typeof value === 'string' ? parseFloat(value) : value,
  )
  @IsPositive({ message: 'Amount must be greater than 0' })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message: 'Invalid amount',
    },
  )
  @Max(MAX_ALLOWED_AMMOUNT, {
    message: `The maximum allowed amount is ${MAX_ALLOWED_AMMOUNT.toLocaleString()}.`,
  })
  amount: number;
}
