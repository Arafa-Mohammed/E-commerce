import { Body, Controller, HttpCode, HttpStatus, Patch, Post, Req, Res, UseInterceptors, UsePipes, ValidationPipe } from "@nestjs/common";
import { AuthenticationService } from "./authentication.service";
import { ConfirmEmailDto, LoginDto, ResendConfirmEmailDto, SignupDto, SignupWithGmailDto } from "./dto/authentication.dto";
import type { Request , Response } from "express";
import { WatchInterceptor } from "src/common/interceptor";
import { IUser } from "src/common/interfaces";
import { LoginResponse } from "./entites/authentication.entity";
@UsePipes(new ValidationPipe({
    stopAtFirstError: true,
    whitelist: true,
    forbidNonWhitelisted: true,
}))
@Controller("auth")
export class AuthenticationController {
    constructor(
        private readonly authenticationService: AuthenticationService
    ) { }

    @Post("signup")
    async signup(@Body() body: SignupDto):Promise <IUser> {
        console.log(body);
        return await this.authenticationService.signup(body)
        
    }
    @UseInterceptors(WatchInterceptor)
    @HttpCode(HttpStatus.OK)
    @Post("login")
    async login(
        @Req() req: Request,
        @Body() body: LoginDto
    ) :Promise<LoginResponse>{
        return await this.authenticationService.login(body, `${req.protocol}://${req.host}`)
        
    }
    @Patch("confirm-email")
    async confirmEmail(@Body() body: ConfirmEmailDto):Promise<void> {
        return await this.authenticationService.confirmEmail(body)
        
    }
    @Patch("resend-confirm-email")
    async resendConfirmEmail(@Body() body: ResendConfirmEmailDto):Promise<void> {
        return await this.authenticationService.resendConfirmEmail(body)
        
    }
    
    @Post("signup/gmail")
    async signupWithGmail(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
        @Body() body: SignupWithGmailDto) :Promise<LoginResponse>{
        console.log(body);
        const { status, credentials } = await this.authenticationService.signupWithGmail(body.idToken, `${req.protocol}://${req.host}`)
        res.status(status)
        return credentials
    }
}
