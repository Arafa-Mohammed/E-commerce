import { Socket } from "socket.io";
import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";
import { HUserDocument } from "src/model";


export interface IAuthReq extends Request{
    credentials:{ user:HUserDocument, decoded:JwtPayload}

}

export interface IAuthSocket extends Socket{
    credentials:{ user:HUserDocument, decoded:JwtPayload}

}
export type CxtType = "http" | "ws" | "rpc" | "graphql" ;
