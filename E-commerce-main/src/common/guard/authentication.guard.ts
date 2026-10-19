import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TokenTypeEnum } from '../enum';
import { CxtType, IAuthReq, IAuthSocket } from '../interfaces';
import { tokenTypeName } from '../decorator';
import { TokenService } from '../services';
import { GqlExecutionContext } from '@nestjs/graphql';
import { getAuthSocket } from '../utils';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenService: TokenService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    try{
      const tokenType =this.reflector.getAllAndOverride<TokenTypeEnum>(
        tokenTypeName,
        [context.getHandler(),context.getClass()],
      )?? TokenTypeEnum.ACCESS;

    console.log({ tokenType });

    let req!: IAuthReq | IAuthSocket;
    let authorization!: string;

    switch (context.getType<CxtType>()) {
      case 'http':
        req = context.switchToHttp().getRequest() as IAuthReq;
        authorization = req.headers['authorization'] as string;
        break;
      case 'graphql':
        req = GqlExecutionContext.create(context).getContext().req as IAuthReq;
        authorization = req.headers['authorization'] as string;
        break;

      case 'ws':
        req = context.switchToWs().getClient() as IAuthSocket
        authorization = "Bearer" +getAuthSocket(req)
        break; 

      default:
        break;
    }


    if(!authorization){
      return false;
    }
    const [key, credential] = authorization?.split(' ') || [];
    if (!key || !credential) {
      throw new UnauthorizedException(
        'Missing authorization',
      );
    }

    switch (key) {
      case 'Basic': {
        const [username, password] = Buffer.from(
          credential,
          'base64',
        )
          .toString()
          .split(':');

        //console.log({ username, password });
        break;
      }

      case 'Bearer':
      default: {
        req.credentials =
          await this.tokenService.decodeToken({
            token: credential,tokenType
          });

        console.log({
          decoded: req.credentials,
        });
        break;
      }
    }
    return true;
  } catch (error:any){
      throw new BadRequestException(error.message || "fail in authentication")
    }
  }
}

