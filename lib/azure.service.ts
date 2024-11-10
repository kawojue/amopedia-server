import { Prisma } from '@prisma/client';
import { Injectable, NotFoundException } from '@nestjs/common';
import { BlobServiceClient, BlockBlobClient } from '@azure/storage-blob';

@Injectable()
export class AzureService {
  private readonly containerName = process.env.AZURE_CONTAINER_NAME;
  private readonly domain = process.env.AZURE_DOMAIN;
  private readonly blobServiceClient: BlobServiceClient;

  constructor() {
    this.blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING,
    );
  }

  private getBlobClient(path: string): BlockBlobClient {
    return this.blobServiceClient
      .getContainerClient(this.containerName)
      .getBlockBlobClient(path);
  }

  async uploadBlob(file: Express.Multer.File, path: string) {
    const blockBlobClient = this.getBlobClient(path);

    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: { blobContentType: file.mimetype },
    });
  }

  async deleteBlob(path: string) {
    const blockBlobClient = this.getBlobClient(path);
    await blockBlobClient.deleteIfExists();
  }

  getBlobUrl(path: string) {
    return `${this.domain}/${this.containerName}/${path}`;
  }

  async copyBlob(sourcePath: string, destinationPath: string) {
    const sourceBlobClient = this.getBlobClient(sourcePath);

    if (!(await sourceBlobClient.exists())) {
      throw new NotFoundException('Source file not found');
    }

    const destinationBlobClient = this.getBlobClient(destinationPath);
    const copyPoller = await destinationBlobClient.beginCopyFromURL(
      sourceBlobClient.url,
    );
    await copyPoller.pollUntilDone();
  }

  async downloadBlob(path: string): Promise<{
    data: Buffer;
    contentLength: number;
  }> {
    const blobClient = this.getBlobClient(path);

    if (!(await blobClient.exists())) {
      throw new NotFoundException('File not found');
    }

    const downloadResponse = await blobClient.download();
    const chunks: Uint8Array[] = [];
    let contentLength = 0;

    for await (const chunk of downloadResponse.readableStreamBody as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
      contentLength += chunk.length;
    }

    const data = Buffer.concat(chunks);
    return { data, contentLength };
  }

  async removeFiles(files: Prisma.JsonArray) {
    if (files.length > 0) {
      const deletePromises = files.map(async (file) => {
        // @ts-ignore
        if (file?.path) {
          // @ts-ignore
          return this.deleteBlob(file.path);
        }
      });
      await Promise.all(deletePromises);
    }
  }
}
