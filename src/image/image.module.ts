import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ImageController } from './controller/image.controller.js';
import { ImageService } from './service/image.service.js';
import { JwtStrategy } from './guards/jwt.strategy.js';
import { CloudinaryModule } from '../cloudinary/cloudinary.module.js';
import { AppLoggerService } from '../shared/logger/app-logger.service.js';

@Module({
  imports: [
    CloudinaryModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],
  controllers: [ImageController],
  providers: [
    { provide: AppLoggerService, useFactory: () => new AppLoggerService('cdn-service') },
    ImageService,
    JwtStrategy,
  ],
})
export class ImageModule {}
