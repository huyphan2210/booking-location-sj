import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AppController } from './app.controller';
import { LocationModule } from './location/location.module';
import { BookingModule } from './booking/booking.module';
import { SnakeNamingStrategy } from './database/snake-naming.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),
        autoLoadEntities: true,
        synchronize: true,
        namingStrategy: new SnakeNamingStrategy(),
      }),
    }),
    LocationModule,
    BookingModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
