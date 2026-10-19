import { Types } from "mongoose";
import { IUser } from "./user.interface";
import { CouponTypeEnum } from "../enum";

export interface ICoupon {

  type:CouponTypeEnum;
  discount:number;

  usedBy:{ userId:Types.ObjectId,orderId:Types.ObjectId, time: Date}[],
  startDate: Date;
  endDate: Date;
  duration: number;
  name: string;
  slug: string;
  image: string;
  deletedAt?: Date;
  restoredAt?: Date;

  createdBy:Types.ObjectId | IUser;
  updatedBy?:Types.ObjectId | IUser;

  createdAt?: Date;
  updatedAt?: Date;
}