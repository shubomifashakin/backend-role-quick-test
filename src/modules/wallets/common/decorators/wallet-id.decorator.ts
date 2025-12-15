import { BadRequestException, Param, ParseUUIDPipe } from '@nestjs/common';

export const WalletIdParam = (property = 'walletId') => {
  return Param(
    property,
    new ParseUUIDPipe({
      exceptionFactory: () => new BadRequestException('Invalid walletId'),
    }),
  );
};
