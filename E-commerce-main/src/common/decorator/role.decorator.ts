import { SetMetadata } from "@nestjs/common"
import { RoleEnum, TokenTypeEnum } from "../enum"


export const roleName = "Roles"
export const Role =(roles:RoleEnum[])=>{
    return SetMetadata(roleName, roles)
}