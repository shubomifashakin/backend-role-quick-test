import { IsNumber, IsUUID, Max, Min } from 'class-validator';
import { MAX_ALLOWED_AMMOUNT, MIN_AMOUNT } from '../../../utils/constants';
import { Transform } from 'class-transformer';

export class CreateTransferDto {
  @IsUUID('4', { message: 'Invalid idempotencyKey' })
  idempotencyKey: string;

  @Transform(({ value }) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    typeof value === 'string' ? parseFloat(value) : value,
  )
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message: 'Invalid amount',
    },
  )
  @Min(MIN_AMOUNT, { message: 'Amount must be greater than 0' })
  @Max(MAX_ALLOWED_AMMOUNT, {
    message: `The maximum allowed amount is ${MAX_ALLOWED_AMMOUNT.toLocaleString()}.`,
  })
  amount: number;

  @IsUUID('4', { message: 'Invalid receivingWalletId' })
  receivingWalletId: string;
}
