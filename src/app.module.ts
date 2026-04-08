import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ImageModule } from './image/image.module.js';
import { CloudinaryModule } from './cloudinary/cloudinary.module.js';
import { AppLoggerService } from './shared/logger/app-logger.service.js';
import { HttpLoggingInterceptor } from './shared/interceptors/http-logging.interceptor.js';
import { AllExceptionsFilter } from './shared/filters/all-exceptions.filter.js';

@Module({
  imports: [CloudinaryModule, ImageModule],
  providers: [
    {
      provide: AppLoggerService,
      useFactory: () => new AppLoggerService('cdn-service'),
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
