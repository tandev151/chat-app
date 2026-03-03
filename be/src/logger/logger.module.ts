import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { LoggerConfig } from './logger.config';
// import { LoggingInterceptor } from './logging.interceptor';

@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: LoggerConfig.getPinoHttpOptions(),
    }),
  ],
  //   providers: [
  //     {
  //       provide: APP_INTERCEPTOR,
  //       useClass: LoggingInterceptor,
  //     },
  //   ],
})
export class LoggerModule {}
