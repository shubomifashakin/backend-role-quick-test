import { Module } from '@nestjs/common';
import { WalletsModule } from './modules/wallets/wallets.module';
import { DatabaseModule } from './core/database/database.module';

@Module({
  imports: [DatabaseModule, WalletsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
