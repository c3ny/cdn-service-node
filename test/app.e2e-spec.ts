import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as jwt from 'jsonwebtoken';
import { AppModule } from './../src/app.module';
import { CloudinaryService } from '../src/cloudinary/cloudinary.service';

const TEST_JWT_SECRET = 'test-secret-for-e2e';

function makeToken(): string {
  return jwt.sign({ sub: '1', email: 'test@test.com' }, TEST_JWT_SECRET);
}

describe('CDN Service (e2e)', () => {
  let app: INestApplication<App>;

  const mockCloudinaryService = {
    uploadImage: jest.fn(),
    deleteImage: jest.fn(),
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = TEST_JWT_SECRET;
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
    process.env.CLOUDINARY_API_KEY = 'test-api-key';
    process.env.CLOUDINARY_API_SECRET = 'test-api-secret';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CloudinaryService)
      .useValue(mockCloudinaryService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/images', () => {
    it('should return 401 when no JWT token is provided', () => {
      return request(app.getHttpServer())
        .post('/api/v1/images')
        .attach('image', Buffer.from('fake-image'), 'test.jpg')
        .expect(401);
    });

    it('should return 400 when no file is attached', () => {
      const token = makeToken();
      return request(app.getHttpServer())
        .post('/api/v1/images')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });

    it('should upload image and return url and publicId', async () => {
      const token = makeToken();
      mockCloudinaryService.uploadImage.mockResolvedValue({
        secure_url:
          'https://res.cloudinary.com/test-cloud/image/upload/sangue-solidario/donations/abc123.jpg',
        public_id: 'sangue-solidario/donations/abc123',
      });

      return request(app.getHttpServer())
        .post('/api/v1/images?folder=donations')
        .set('Authorization', `Bearer ${token}`)
        .attach('image', Buffer.from('fake-image-data'), {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        })
        .expect(201)
        .expect((res) => {
          const body = res.body as { url: string; publicId: string };
          expect(body.url).toBe(
            'https://res.cloudinary.com/test-cloud/image/upload/sangue-solidario/donations/abc123.jpg',
          );
          expect(body.publicId).toBe('sangue-solidario/donations/abc123');
        });
    });

    it('should use default folder "general" when folder query param is omitted', async () => {
      const token = makeToken();
      mockCloudinaryService.uploadImage.mockResolvedValue({
        secure_url:
          'https://res.cloudinary.com/test-cloud/image/upload/sangue-solidario/general/xyz.jpg',
        public_id: 'sangue-solidario/general/xyz',
      });

      await request(app.getHttpServer())
        .post('/api/v1/images')
        .set('Authorization', `Bearer ${token}`)
        .attach('image', Buffer.from('data'), {
          filename: 'photo.png',
          contentType: 'image/png',
        })
        .expect(201);

      expect(mockCloudinaryService.uploadImage).toHaveBeenCalledWith(
        expect.any(Object),
        'general',
      );
    });

    it('should return 500 when Cloudinary upload fails', async () => {
      const token = makeToken();
      mockCloudinaryService.uploadImage.mockRejectedValue(
        new Error('Cloudinary unavailable'),
      );

      return request(app.getHttpServer())
        .post('/api/v1/images?folder=avatars')
        .set('Authorization', `Bearer ${token}`)
        .attach('image', Buffer.from('data'), {
          filename: 'avatar.jpg',
          contentType: 'image/jpeg',
        })
        .expect(500);
    });
  });

  describe('DELETE /api/v1/images/:publicId', () => {
    it('should return 401 when no JWT token is provided', () => {
      return request(app.getHttpServer())
        .delete('/api/v1/images/some-public-id')
        .expect(401);
    });

    it('should delete image and return success message', async () => {
      const token = makeToken();
      mockCloudinaryService.deleteImage.mockResolvedValue({ result: 'ok' });

      return request(app.getHttpServer())
        .delete('/api/v1/images/sangue-solidario%2Fdonations%2Fabc123')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect((res.body as { message: string }).message).toBe(
            'Image deleted successfully',
          );
        });
    });

    it('should return 400 when image is not found in Cloudinary', async () => {
      const token = makeToken();
      mockCloudinaryService.deleteImage.mockResolvedValue({
        result: 'not found',
      });

      return request(app.getHttpServer())
        .delete('/api/v1/images/non-existent-id')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });
  });
});
