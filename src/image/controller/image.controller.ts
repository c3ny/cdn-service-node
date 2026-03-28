import {
  Controller,
  Post,
  Delete,
  Param,
  ParseFilePipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { ImageService } from '../service/image.service.js';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import {
  UploadResponseDto,
  DeleteResponseDto,
  ErrorResponseDto,
} from '../dto/upload-response.dto.js';

@ApiTags('Images')
@Controller('api/v1/images')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image', { storage: undefined }))
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload an image to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: { type: 'string', format: 'binary' },
      },
      required: ['image'],
    },
  })
  @ApiQuery({
    name: 'folder',
    required: false,
    description: 'Cloudinary folder (e.g. donations, avatars)',
    example: 'donations',
  })
  @ApiResponse({ status: 201, type: UploadResponseDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async upload(
    @UploadedFile(new ParseFilePipe({ fileIsRequired: true }))
    file: Express.Multer.File,
    @Query('folder') folder: string = 'general',
  ): Promise<UploadResponseDto> {
    return this.imageService.upload(file, folder);
  }

  @Delete(':publicId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete an image from Cloudinary' })
  @ApiParam({
    name: 'publicId',
    description: 'Cloudinary public ID of the image',
    example: 'sangue-solidario/donations/abc123',
  })
  @ApiResponse({ status: 200, type: DeleteResponseDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async delete(
    @Param('publicId') publicId: string,
  ): Promise<DeleteResponseDto> {
    if (!publicId.startsWith('sangue-solidario/')) {
      throw new BadRequestException('Invalid image identifier');
    }
    await this.imageService.delete(publicId);
    return { message: 'Image deleted successfully' };
  }
}
