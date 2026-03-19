import { Injectable, BadRequestException } from '@nestjs/common';
import { CloudinaryService } from '../../cloudinary/cloudinary.service.js';

export interface UploadResult {
  url: string;
  publicId: string;
}

@Injectable()
export class ImageService {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  async upload(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadResult> {
    const result = await this.cloudinaryService.uploadImage(file, folder);

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  }

  async delete(publicId: string): Promise<void> {
    const result = await this.cloudinaryService.deleteImage(publicId);

    if (result.result !== 'ok') {
      throw new BadRequestException(
        `Failed to delete image: ${result.result}`,
      );
    }
  }
}
