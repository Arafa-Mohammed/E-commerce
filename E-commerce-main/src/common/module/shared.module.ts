import { Global, Module } from "@nestjs/common";
import { UserModel } from "src/model";
import { UserRepository } from "../repository";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { createClient } from "redis";
import { CacheService, S3Service, TokenService } from "../services";



@Global()
@Module({
    imports: [UserModel],
    exports: [
        "REDIS_CLIENT",
        UserRepository,
        CacheService,
        JwtService,
        TokenService,
        S3Service,
    ],
    providers: [
        {
            provide: 'REDIS_CLIENT',
            useFactory: async (configService: ConfigService) => {
                const client = createClient({
                    url: configService.get<string>("REDIS_URI"),
                });
                client.on('error', (err) => console.error('Redis Client Error ❌', err));
                await client.connect();
                console.log('Redis connected ✨');
                return client;
            },
            inject: [ConfigService]
        },
        UserRepository,
        CacheService,
        JwtService,
        TokenService,
        S3Service,
    ]
})
export class SharedAuthenticationModule {}