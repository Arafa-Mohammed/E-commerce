import { Controller,Inject, Req, Res, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service'
import type {Request ,Response } from 'express';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { S3Service } from './common/services';
import { Get } from '@nestjs/common';
import { CustomCacheInterceptor } from './common/interceptor/cache.interceptor';
import { ttl } from './common/decorator';

@Controller()
export class AppController {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly appService: AppService,
    private readonly s3Service: S3Service,
  ) {}
  
  @ttl(30)
  @UseInterceptors(CustomCacheInterceptor)
  @Get()
  async getHello() {
    const data = Date.now();
    return data;
  }

  @Get("/sayHi")
  async welcome() {
    await this.cacheManager.del("LOL")
    return { message: "Hello world" };
  }

  @Get("uploads/*path")
  async getFile(@Req() req: Request, @Res() res: Response) {
    const { path } = req.params as { path: string[] };

    const { download, fileName } = req.query as {
      download?: string;
      fileName?: string;
    };

    const Key = path.join("/");

    const { Body, ContentType } =
      await this.s3Service.getAsset({ Key });

    res.setHeader(
      "Content-Type",
      ContentType || "application/octet-stream",
    );

    res.setHeader(
      "Cross-Origin-Resource-Policy",
      "cross-origin",
    );

    if (download === "true") {
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${
          fileName || Key.split("/").pop()
        }"`,
      );
    }

    (Body as NodeJS.ReadableStream).pipe(res);
  }

  @Get("pre-signed/*path")
  async getFileLink(@Req() req: Request) {
    const { download, fileName } = req.query as {
      download?: string;
      fileName?: string;
    };

    const { path } = req.params as {
      path: string[];
    };

    const Key = path.join("/");

    return await this.s3Service.createPreSignedFetchLink({
      Key,
      download,
      fileName,
    });
  }
}

