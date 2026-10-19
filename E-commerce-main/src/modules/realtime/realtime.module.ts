import { Module } from "@nestjs/common";
import { RealtimeGateway } from "./realtime.gateway";
import { CacheService, TokenService } from "src/common/services";

@Module({
    providers:[RealtimeGateway ,CacheService, TokenService],
})
export class RealtimeModule {}