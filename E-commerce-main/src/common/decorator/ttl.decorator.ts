import { SetMetadata } from "@nestjs/common"
import { RoleEnum, TokenTypeEnum } from "../enum"


export const ttlName = "ttlName"
export const ttl =(value: number =10 )=>{
    return SetMetadata(ttlName, value)
}
export const personalCacheName = "personalCacheName"
export const  PersonalCache =(value: boolean = false )=>{
    return SetMetadata(personalCacheName, value)
}