import {
    GetObjectAclCommandInput, GetObjectCommand,
    DeleteObjectCommand, DeleteObjectCommandInput,
    S3Client, PutObjectCommand, PutObjectCommandInput,
} from '@aws-sdk/client-s3'
import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'

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

    async copyS3(sourceKey: string, destinationKey: string) {
        const getObjectParams: GetObjectAclCommandInput = {
            Key: sourceKey,
            Bucket: this.bucketName,
        }

        const getObjectCommand: GetObjectCommand = new GetObjectCommand(getObjectParams)
        const { Body } = await this.s3.send(getObjectCommand)

        if (!Body) {
            throw new NotFoundException('Source file not found')
        }

        const putObjectParams: PutObjectCommandInput = {
            Key: destinationKey,
            Body: Body,
            Bucket: this.bucketName,
        }

        const putObjectCommand: PutObjectCommand = new PutObjectCommand(putObjectParams)
        await this.s3.send(putObjectCommand)
    }

    async downloadS3(path: string): Promise<{
        data: Buffer
        contentLength: number
    }> {
        const params: GetObjectAclCommandInput = {
            Key: path,
            Bucket: this.bucketName,
        }

        try {
            const response = await this.s3.send(new GetObjectCommand(params))
            const body = response.Body

            if (!body) {
                throw new NotFoundException('File not found')
            }

            const chunks: Uint8Array[] = []
            let contentLength = 0

            if (typeof body[Symbol.asyncIterator] === 'function') {
                for await (const chunk of body as AsyncIterable<Uint8Array>) {
                    chunks.push(chunk)
                    contentLength += chunk.length
                }
            } else {
                throw new Error('Body does not have an async iterator')
            }

            const data = Buffer.concat(chunks)

            return { data, contentLength }
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error
            } else {
                throw new Error('Failed to download file from S3')
            }
        }
    }

    async removeFiles(files: Prisma.JsonArray) {
        if (files.length > 0) {
            for (const file of files) {
                // @ts-ignore
                if (file?.path) {
                    // @ts-ignore
                    await this.deleteS3(file.path)
                }
            }
        }
    }
}