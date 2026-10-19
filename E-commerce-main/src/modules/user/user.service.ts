import { Injectable } from "@nestjs/common";
import { IFile, IUser } from "src/common/interfaces";
import { HUserDocument } from "src/model";
import { S3Service } from "src/common/services/s3.service";
import { StorageApproachEnum } from "src/common/enum";

@Injectable()
export class UserService {

    constructor(private readonly s3Service:S3Service) { }
    profile() {
        return { id: 1, username: "reo ", age: 21 }
    }

    async profileImage(file: IFile,user: HUserDocument,): Promise<IUser> {
    const oldImage = user.profilePicture;
    user.profilePicture = await this.s3Service.uploadAsset({
    storageApproach: StorageApproachEnum.MEMORY,file,path: `Users/${user._id.toString()}`,});
    await user.save();
    if (oldImage) {
    await this.s3Service.deleteAsset({Key: oldImage,});
    }
    return user;
    }
}