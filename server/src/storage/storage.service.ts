import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private minioClient: Minio.Client | null = null;
  private bucketName: string;
  private useMinio = false;
  private localUploadDir = path.resolve(process.cwd(), 'uploads');

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get<string>('MINIO_BUCKET') || 'store-assets';
  }

  async onModuleInit() {
    const minioEndpoint = this.configService.get<string>('MINIO_ENDPOINT');
    const minioPort = Number(this.configService.get<string>('MINIO_PORT')) || 9000;
    const accessKey = this.configService.get<string>('MINIO_ACCESS_KEY');
    const secretKey = this.configService.get<string>('MINIO_SECRET_KEY');
    const useSSL = this.configService.get<string>('MINIO_USE_SSL') === 'true';

    // Ensure local directory exists
    if (!fs.existsSync(this.localUploadDir)) {
      fs.mkdirSync(this.localUploadDir, { recursive: true });
    }

    if (minioEndpoint && accessKey && secretKey) {
      try {
        this.minioClient = new Minio.Client({
          endPoint: minioEndpoint,
          port: minioPort,
          useSSL,
          accessKey,
          secretKey,
        });

        const exists = await this.minioClient.bucketExists(this.bucketName);
        if (!exists) {
          await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
          // Set bucket policy for public reading of product images
          const policy = {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: { AWS: ['*'] },
                Action: ['s3:GetObject'],
                Resource: [`arn:aws:s3:::${this.bucketName}/*`],
              },
            ],
          };
          await this.minioClient.setBucketPolicy(this.bucketName, JSON.stringify(policy));
        }
        this.useMinio = true;
        this.logger.log(`✅ MinIO connected successfully. Bucket: "${this.bucketName}"`);
      } catch (err) {
        this.logger.warn(`MinIO connection not available (${err.message}). Using local storage fallback in ${this.localUploadDir}`);
        this.useMinio = false;
      }
    } else {
      this.logger.log(`MinIO credentials not provided. Using local file storage fallback in ${this.localUploadDir}`);
      this.useMinio = false;
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

    if (this.useMinio && this.minioClient) {
      try {
        await this.minioClient.putObject(
          this.bucketName,
          filename,
          file.buffer,
          file.size,
          { 'Content-Type': file.mimetype },
        );
        const publicHost = this.configService.get<string>('MINIO_PUBLIC_URL') || `http://localhost:9000/${this.bucketName}`;
        return `${publicHost}/${filename}`;
      } catch (error) {
        this.logger.error(`MinIO upload error: ${error.message}, falling back to local file`);
      }
    }

    // Local file fallback
    const targetPath = path.join(this.localUploadDir, filename);
    await fs.promises.writeFile(targetPath, file.buffer);
    return `/uploads/${filename}`;
  }
}
