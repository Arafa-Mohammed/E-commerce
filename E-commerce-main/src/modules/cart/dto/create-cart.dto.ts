import { ICartProduct, IProduct } from "src/common/interfaces";
import { IsInt, IsMongoId } from "class-validator";
import { Types } from "mongoose";

export class CreateCartDto implements ICartProduct{
    @IsMongoId()
    productId!: Types.ObjectId ;
    @IsInt()
    quantity!: number;
}
