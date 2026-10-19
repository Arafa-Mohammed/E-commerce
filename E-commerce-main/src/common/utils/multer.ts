import { BadRequestException } from "@nestjs/common";
import { randomUUID } from "crypto";
import multer, { diskStorage, memoryStorage } from "multer";
import type {Request} from 'express'
import { resolve } from "path";
import { existsSync, mkdir, mkdirSync } from "fs";
import { IFile } from './../interfaces/multer.interface';
import { StorageApproachEnum } from "../enum";
import { tmpdir } from "os";

export const fileFieldValidation = {
    image: ["image/jpeg", "image/jpg", "image/png"],
    video: ["video/mp4"],
};

export const cloudMulter = (
    {
        storageApproach = StorageApproachEnum.MEMORY,
        validation =[],
        folder ="public",
        fileSize = 2
    }:{
        storageApproach?: StorageApproachEnum;
        validation?:string[],
        folder?:string
        fileSize?:number
    }
)=>{
    return {
        storage: storageApproach == StorageApproachEnum.MEMORY? memoryStorage(): diskStorage({
            destination: function (
                req: Request,
                file: Express.Multer.File,
                callback: (error: Error | null, destination: string) => void,) {
                callback(null, tmpdir());
            },
            filename: function (
            req: Request,
            file: Express.Multer.File,
            callback: (error: Error | null, destination: string) => void,) {
            callback(null, `${randomUUID()}__${file.originalname}`);
            },
        }),
            fileFilter(req:Request, file:IFile, callback:Function) {
                if (!validation.includes(file.mimetype)) {
                    return callback(new BadRequestException("Invalid file format"))
                }
                return callback(null, true)
            },
            limits:{fileSize :fileSize*1024*1024 }
        }        
}

export const localMulter = (
    {
        validation =[],
        folder ="public",
        fileSize = 2
    }:{
        validation?:string[],
        folder?:string
        fileSize?:number
    }
)=>{
    return {
        storage:diskStorage({
                destination(req:Request, file:IFile, callback:Function) {
                    const fullPath = resolve(`./uploads/${folder}`)
                    if (!existsSync(fullPath)) {
                        mkdirSync(fullPath,{recursive: true})
                    }
                    return callback(null, fullPath)
                },
                filename(req:Request, file:IFile, callback:Function) {
                    const uniqueFileName = randomUUID()+"_"+file.originalname;
                    file.finalPath =`uploads/${folder}`
                    callback(null ,uniqueFileName)
                },
            }),
            fileFilter(req:Request, file:IFile, callback:Function) {
                if (!['image/jpeg'].includes(file.mimetype)) {
                    return callback(new BadRequestException("Invalid file format"))
                }
                return callback(null, true)
            },
            limits:{fileSize :2*1024*1024}
        }        
}