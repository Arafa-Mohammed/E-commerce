import { MiddlewareConsumer, Module, RequestMethod } from "@nestjs/common";
import { AuthenticationService } from "./authentication.service";
import { AuthenticationController } from "./authentication.controller";
import { defaultLanguage } from "src/common/middleware";
import { EmailService } from "src/common/services";
import { SecurityService } from "src/common/services/security/security.service";


@Module({
    imports: [],
    exports: [],
    controllers: [AuthenticationController],
    providers: [
        AuthenticationService,
        EmailService,
        SecurityService,
    ]
})
export class AuthenticationModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(defaultLanguage)
            .forRoutes({
                path: 'auth/*' , 
                method: RequestMethod.ALL 
                
            });
    }
}