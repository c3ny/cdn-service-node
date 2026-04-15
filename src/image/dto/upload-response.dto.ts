import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const FOLDER_REGEX = /^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+){0,1}$/;
const PUBLIC_ID_REGEX = /^[a-zA-Z0-9/_-]+$/;

export function isSafeFolder(value: string): boolean {
  if (!value || value.length > 64) return false;
  if (value.includes('..') || value.includes('./')) return false;
  if (value.startsWith('/') || value.endsWith('/')) return false;
  return FOLDER_REGEX.test(value);
}

export function isSafePublicId(value: string): boolean {
  if (!value || value.length > 256) return false;
  if (value.includes('..') || value.startsWith('/') || value.endsWith('/')) {
    return false;
  }
  return PUBLIC_ID_REGEX.test(value);
}

export class UploadQueryDto {
  @ApiPropertyOptional({
    description: 'Cloudinary folder (e.g. donations, avatars)',
    example: 'donations',
    maxLength: 64,
    pattern: FOLDER_REGEX.source,
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Matches(FOLDER_REGEX, {
    message:
      'folder must match [a-zA-Z0-9_-] with at most one / separator (e.g. "avatars" or "users/avatars")',
  })
  folder?: string;
}

export class UploadResponseDto {
  @ApiProperty({
    description: 'Public URL of the uploaded image',
    example:
      'https://res.cloudinary.com/your-cloud/image/upload/v1/sangue-solidario/donations/abc123.jpg',
  })
  url: string;

  @ApiProperty({
    description: 'Cloudinary public ID (used for deletion)',
    example: 'sangue-solidario/donations/abc123',
  })
  publicId: string;
}

export class DeleteResponseDto {
  @ApiProperty({
    description: 'Deletion result message',
    example: 'Image deleted successfully',
  })
  message: string;
}

export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Only JPEG, PNG and WebP images are allowed' })
  message: string;
}
