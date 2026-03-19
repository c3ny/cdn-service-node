import { ApiProperty } from '@nestjs/swagger';

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
