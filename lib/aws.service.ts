import {
    GetObjectAclCommandInput, GetObjectCommand,
    DeleteObjectCommand, DeleteObjectCommandInput,
    S3Client, PutObjectCommand, PutObjectCommandInput,
} from '@aws-sdk/client-s3'
import { Injectable, NotFoundException } from '@nestjs/common'

@Injectable()
export class AwsService {
    private s3: S3Client
    private readonly bucketName = process.env.BUCKET_NAME
    private readonly domain = process.env.DISTRIBUTION_DOMAIN

    constructor() {
        this.s3 = new S3Client({
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY,
                secretAccessKey: process.env.AWS_SECRET_KEY,
            },
            region: process.env.BUCKET_REGION
        })
    }

    async uploadS3(file: Express.Multer.File, path: string) {
        const params: PutObjectCommandInput = {
            Key: path,
            Body: file.buffer,
            Bucket: this.bucketName,
            ContentType: file.mimetype,
        }
        const command: PutObjectCommand = new PutObjectCommand(params)
        await this.s3.send(command)
    }

    async deleteS3(path: string) {
        const params: DeleteObjectCommandInput = {
            Key: path,
            Bucket: this.bucketName,
        }
        const command: DeleteObjectCommand = new DeleteObjectCommand(params)
        await this.s3.send(command)
    }

    getS3(path: string) {
        return `${this.domain}/${path}`
    }

    async downloadS3(path: string): Promise<Buffer> {
        const params: GetObjectAclCommandInput = {
            Key: path,
            Bucket: this.bucketName,
        }

        try {
            const { Body } = await this.s3.send(new GetObjectCommand(params))
            if (!Body) {
                throw new NotFoundException('File not found')
            }

            const chunks: Uint8Array[] = []
            if (typeof Body[Symbol.asyncIterator] === 'function') {
                for await (const chunk of Body as AsyncIterable<Uint8Array>) {
                    chunks.push(chunk)
                }
            } else {
                throw new Error('Body does not have an async iterator')
            }

            return Buffer.concat(chunks)
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error
            } else {
                throw new Error('Failed to download file from S3')
            }
        }
    }
}