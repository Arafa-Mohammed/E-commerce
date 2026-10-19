import { GenderEnum, LanguageEnum, ProviderEnum, RoleEnum } from "../enum";
export interface IUser {

  lang:LanguageEnum;
  firstName: string;
  lastName: string;
  username?: string;
  email: string;
  password: string;
  phone?: string;
  profilePicture?: string;
  profileCoverPictures?: string[];

  DOB?: Date,
  deletedAt?: Date,
  restoredAt?: Date,
  confirmEmail?: Date;
  changeCredentialsTime?: Date;

  gender: GenderEnum;
  provider: ProviderEnum;
  role: RoleEnum;

  createdAt?: Date;
  updatedAt?: Date;
}