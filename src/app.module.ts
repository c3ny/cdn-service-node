import { Module } from '@nestjs/common';
import { ImageModule } from './image/image.module.js';
import { CloudinaryModule } from './cloudinary/cloudinary.module.js';

@Module({
  imports: [CloudinaryModule, ImageModule],
})
export class AppModule {}
