import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

export interface StoredObject {
  body: Uint8Array;
  contentType: string;
}

export interface ObjectStorage {
  putObject(params: { key: string; body: Uint8Array; contentType: string }): Promise<void>;
  getObject(key: string): Promise<StoredObject | null>;
  deleteObject(key: string): Promise<void>;
}

export interface CreateS3StorageOptions {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  forcePathStyle?: boolean;
}

function isS3NotFoundError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const name = 'name' in error && typeof error.name === 'string' ? error.name : '';
  if (name === 'NoSuchKey' || name === 'NotFound') {
    return true;
  }
  if (
    '$metadata' in error &&
    typeof error.$metadata === 'object' &&
    error.$metadata !== null &&
    'httpStatusCode' in error.$metadata &&
    error.$metadata.httpStatusCode === 404
  ) {
    return true;
  }
  return false;
}

export function createS3Storage({
  endpoint,
  region,
  accessKeyId,
  secretAccessKey,
  bucket,
  forcePathStyle = true,
}: CreateS3StorageOptions): ObjectStorage {
  const client = new S3Client({
    endpoint,
    region,
    forcePathStyle,
    requestChecksumCalculation: 'WHEN_REQUIRED',
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return {
    async putObject({ key, body, contentType }) {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      );
    },
    async getObject(key) {
      try {
        const result = await client.send(
          new GetObjectCommand({
            Bucket: bucket,
            Key: key,
          }),
        );
        if (!result.Body) {
          return null;
        }
        const bytes = await result.Body.transformToByteArray();
        return {
          body: bytes,
          contentType: result.ContentType ?? 'application/octet-stream',
        };
      } catch (error: unknown) {
        if (isS3NotFoundError(error)) {
          return null;
        }
        throw error;
      }
    },
    async deleteObject(key) {
      await client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        }),
      );
    },
  };
}

export function createMemoryStorage(): ObjectStorage {
  const objects = new Map<string, StoredObject>();

  return {
    async putObject({ key, body, contentType }) {
      objects.set(key, {
        body: new Uint8Array(body),
        contentType,
      });
    },
    async getObject(key) {
      const entry = objects.get(key);
      if (!entry) {
        return null;
      }
      return {
        body: new Uint8Array(entry.body),
        contentType: entry.contentType,
      };
    },
    async deleteObject(key) {
      objects.delete(key);
    },
  };
}
