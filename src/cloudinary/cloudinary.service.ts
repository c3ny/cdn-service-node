import { Injectable, BadRequestException } from '@nestjs/common';
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary';
import fileTypeChecker from 'file-type-checker';
import { isSafeFolder } from '../image/dto/upload-response.dto.js';

type DetectedFileInfo = { extension?: string; mimeType?: string };

@Injectable()
export class CloudinaryService {
  private readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  private readonly ALLOWED_EXTENSIONS = ['jpeg', 'jpg', 'png', 'webp'];

  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB (same as Kotlin version)

  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'general',
  ): Promise<UploadApiResponse> {
    if (!file || !file.buffer) {
      throw new BadRequestException('Cannot save an empty file');
    }

    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Only JPEG, PNG and WebP images are allowed',
      );
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    const detected = fileTypeChecker.detectFile(
      file.buffer,
    ) as DetectedFileInfo | undefined;
    const extension = detected?.extension?.toLowerCase();
    if (!extension || !this.ALLOWED_EXTENSIONS.includes(extension)) {
      throw new BadRequestException(
        'Unsupported image content (magic bytes mismatch)',
      );
    }

    if (!isSafeFolder(folder)) {
      throw new BadRequestException('Invalid folder parameter');
    }

    return new Promise<UploadApiResponse>((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: `sangue-solidario/${folder}`,
          resource_type: 'image',
        },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error) return reject(new BadRequestException(error.message));
          if (!result) return reject(new BadRequestException('Upload failed'));
          resolve(result);
        },
      );

      upload.end(file.buffer);
    });
  }

  async deleteImage(publicId: string): Promise<{ result: string }> {
    return new Promise((resolve, reject) => {
      void cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error)
          return reject(new BadRequestException((error as Error).message));
        resolve(result as { result: string });
      });
    });
  }
}
