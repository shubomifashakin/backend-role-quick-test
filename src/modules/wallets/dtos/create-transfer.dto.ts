import { IsNumber, IsUUID, Max, Min } from 'class-validator';
import { MAX_ALLOWED_AMMOUNT, MIN_AMOUNT } from '../../../utils/constants';

export class CreateTransferDto {
  @IsUUID('4', { message: 'Invalid idempotencyKey' })
  idempotencyKey: string;

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
