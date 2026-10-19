import {
  CompleteMultipartUploadCommandOutput,
  DeleteObjectCommand,
  DeleteObjectCommandOutput,
  DeleteObjectsCommand,
  DeleteObjectsCommandOutput,
  GetObjectCommand,
  GetObjectCommandOutput,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
  ObjectCannedACL,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StorageApproachEnum } from "src/common/enum";
import { BadRequestException, Injectable } from "@nestjs/common";

@Injectable()
export class S3Service {
private APPLICATION_NAME: string ;
private AWS_ACCESS_KEY_ID: string ;
private AWS_BUCKET_NAME: string ;
private AWS_EXPIRES_IN: number ;
private AWS_REGION: string ;
private AWS_SECRET_ACCESS_KEY: string ;
  private client: S3Client;
  constructor(private configService:ConfigService) {
    this. APPLICATION_NAME= this.configService.get<string>("APPLICATION_NAME") as string
    this. AWS_ACCESS_KEY_ID= this.configService.get<string>("AWS_ACCESS_KEY_ID") as string
    this. AWS_BUCKET_NAME= this.configService.get<string>("AWS_BUCKET_NAME") as string
    this. AWS_EXPIRES_IN=  Number(this.configService.get<string>("AWS_EXPIRES_IN") )
    this. AWS_REGION= this.configService.get<string>("AWS_REGION") as string
    this. AWS_SECRET_ACCESS_KEY= this.configService.get<string>("AWS_SECRET_ACCESS_KEY") as string
    this.client = new S3Client({
      region: this.AWS_REGION,
      credentials: {
        accessKeyId: this.AWS_ACCESS_KEY_ID,
        secretAccessKey:this. AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  async uploadAsset({
    storageApproach = StorageApproachEnum.MEMORY,
    Bucket =this. AWS_BUCKET_NAME,
    path = "general",
    file,
    ACL = ObjectCannedACL.private,
    ContentType,
  }: {
    storageApproach?: StorageApproachEnum;
    Bucket?: string;
    path?: string;
    file: Express.Multer.File;
    ACL?: ObjectCannedACL;
    ContentType?: string | undefined;
  }): Promise<string> {
    const command = new PutObjectCommand({
      Bucket,
      Key: `${this.APPLICATION_NAME}/${path}/${randomUUID()}__${file.originalname}`,
      ACL,
      Body:
        storageApproach === StorageApproachEnum.MEMORY
          ? file.buffer || createReadStream(file.path)
          : createReadStream(file.path),
      ContentType: file.mimetype || ContentType,
    });
    if (!command.input?.Key) {
      throw new BadRequestException("fail to upload this asset");
    }
    await this.client.send(command);
    return command.input?.Key;
  }
  async uploadLargeAsset({
    storageApproach = StorageApproachEnum.DISK,
    Bucket = this.AWS_BUCKET_NAME,
    path = "general",
    file,
    ACL = ObjectCannedACL.private,
    ContentType,
    partSize = 5,
  }: {
    storageApproach?: StorageApproachEnum;
    Bucket?: string;
    path?: string;
    file: Express.Multer.File;
    ACL?: ObjectCannedACL;
    ContentType?: string | undefined;
    partSize?: number;
  }): Promise<CompleteMultipartUploadCommandOutput> {
    const uploadFile = new Upload({
      client: this.client,
      params: {
        Bucket,
        Key: `${this.APPLICATION_NAME}/${path}/${randomUUID()}__${file.originalname}`,
        ACL,
        Body:
          storageApproach === StorageApproachEnum.MEMORY
            ? file.buffer || createReadStream(file.path)
            : createReadStream(file.path),
        ContentType: file.mimetype || ContentType,
      },
    });
    uploadFile.on("httpUploadProgress", (progress) => {
      console.log(progress);
      console.log(
        `File Upload is ${((progress.loaded as number) / (progress.total as number)) * 100} %`,
      );
      partSize: partSize * 1024 * 1024;
    });
    return await uploadFile.done();
  }
  async uploadAssets({
    Bucket = this.AWS_BUCKET_NAME,
    path = "general",
    files,
    ACL = ObjectCannedACL.private,
    ContentType,
  }: {
    Bucket?: string;
    path?: string;
    files: Express.Multer.File[];
    ACL?: ObjectCannedACL;
    ContentType?: string;
  }): Promise<string[]> {
    const FILE_SIZE_THRESHOLD = 5 * 1024 * 1024;
    return Promise.all(
      files.map(async (file) => {
        if (file.size > FILE_SIZE_THRESHOLD) {
          console.log(
            `[S3 Upload] Large file (${(file.size / 1024 / 1024).toFixed(2)} MB) → DISK`,
          );
          const result = await this.uploadLargeAsset({
            file,
            path,
            Bucket,
            ACL,
            ContentType,
            storageApproach: StorageApproachEnum.DISK,
          });
          return result.Key!;
        }
        console.log(
          `[S3 Upload] Small file (${(file.size / 1024 / 1024).toFixed(2)} MB) → MEMORY`,
        );
        return this.uploadAsset({
          file,
          path,
          Bucket,
          ACL,
          ContentType,
          storageApproach: StorageApproachEnum.MEMORY,
        });
      }),
    );
  }
  async createPreSignedUploadLink({
    Bucket = this.AWS_BUCKET_NAME,
    path = "general",
    expiresIn = this.AWS_EXPIRES_IN,
    ContentType,
    Originalname,
  }: {
    Bucket?: string;
    path?: string;
    expiresIn?: number;
    ContentType: string;
    Originalname: string;
  }): Promise<{ url: string; key: string }> {
    const command = new PutObjectCommand({
      Bucket,
      Key: `${this.APPLICATION_NAME}/${path}/${randomUUID()}__${Originalname}`,
      ContentType,
    });
    if (!command.input?.Key) {
      throw new BadRequestException("fail to upload this asset");
    }
    const url = await getSignedUrl(this.client, command, { expiresIn });
    return { url, key: command.input?.Key };
  }
  async createPreSignedFetchLink({
    Bucket = this.AWS_BUCKET_NAME,
    Key,
    expiresIn = this.AWS_EXPIRES_IN,
    fileName,
    download,
  }: {
    Bucket?: string;
    Key: string;
    expiresIn?: number;
    fileName?: string;
    download?: string;
  }): Promise<string> {
    const command = new GetObjectCommand({
      Bucket,
      Key,
      ResponseContentDisposition:
        download === "true"
          ? `attachment; filename="${fileName || Key.split("/").pop()}"`
          : undefined,
    });
    const url = await getSignedUrl(this.client, command, { expiresIn });
    return url;
  }
  async getAsset({
    Bucket = this.AWS_BUCKET_NAME,
    Key,
  }: {
    Bucket?: string;
    Key: string;
  }): Promise<GetObjectCommandOutput> {
    const command = new GetObjectCommand({
      Bucket,
      Key,
    });
    return await this.client.send(command);
  }
  // DELETE
  async deleteAsset({
    Bucket = this.AWS_BUCKET_NAME,
    Key,
  }: {
    Bucket?: string;
    Key: string;
  }): Promise<DeleteObjectCommandOutput> {
    const command = new DeleteObjectCommand({
      Bucket,
      Key,
    });
    return await this.client.send(command);
  }
  async deleteAssets({
    Bucket = this.AWS_BUCKET_NAME,
    Keys,
  }: {
    Bucket?: string;
    Keys: { Key: string }[];
  }): Promise<DeleteObjectsCommandOutput> {
    const command = new DeleteObjectsCommand({
      Bucket,
      Delete: {
        Objects: Keys,
        Quiet: false,
      },
    });

    return await this.client.send(command);
  }
  async listFolderDir({
    Bucket = this.AWS_BUCKET_NAME,
    prefix,
  }: {
    Bucket?: string;
    prefix: string;
  }): Promise<ListObjectsV2CommandOutput> {
    const command = new ListObjectsV2Command({
      Bucket,
      Prefix: `${this.APPLICATION_NAME}/${prefix}`,
    });

    return await this.client.send(command);
  }
  async deleteFolderByPrefix({
    Bucket = this.AWS_BUCKET_NAME,
    prefix,
  }: {
    Bucket?: string;
    prefix: string;
  }): Promise<DeleteObjectsCommandOutput> {
    const result = await this.listFolderDir({ Bucket, prefix });
    const Keys = result.Contents?.map((ele) => {
      return { Key: ele.Key };
    }) as { Key: string }[];
    return await this.deleteAssets({ Bucket, Keys });
  }
}