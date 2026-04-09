import { Injectable, BadRequestException } from '@nestjs/common';
import { CloudinaryService } from '../../cloudinary/cloudinary.service.js';
import { AppLoggerService } from '../../shared/logger/app-logger.service.js';

export interface UploadResult {
  url: string;
  publicId: string;
}

@Injectable()
export class ImageService {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly logger: AppLoggerService,
  ) {}

  async upload(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadResult> {
    let result;
    try {
      result = await this.cloudinaryService.uploadImage(file, folder);
    } catch (error: unknown) {
      this.logger.error('Image upload failed', {
        folder,
        mimetype: file.mimetype,
        bytes: file.size,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }

    this.logger.info('Image uploaded', {
      folder,
      publicId: result.public_id,
      url: result.secure_url,
      bytes: result.bytes,
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  }

  async delete(publicId: string): Promise<void> {
    const result = await this.cloudinaryService.deleteImage(publicId);

    if (result.result !== 'ok') {
      this.logger.warn('Failed to delete image', { publicId, result: result.result });
      throw new BadRequestException(`Failed to delete image: ${result.result}`);
    }

    this.logger.info('Image deleted', { publicId });
  }
}
