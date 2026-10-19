import { Transform } from "class-transformer";
import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsString, MaxLength, Min, MinLength } from "class-validator";
import { IsDateGte, IsDateGtNow, IsValidDiscount } from "src/common/decorator";
import { CouponTypeEnum } from "src/common/enum";
import { ICoupon } from "src/common/interfaces";

export class CreateCouponDto implements Partial <ICoupon>{
    @MaxLength(5000)
    @MinLength(2)
    @IsString()
    @IsNotEmpty()
    name!: string ;
    @IsDateString()
    @IsDateGtNow()
    startDate!: Date ;
    @IsDateString()
    @IsDateGte(['startDate'])
    endDate!: Date ;
    @Transform(({value})=>Number(value))
    @Min(1)
    @IsInt()
    duration!: number ;
    @Transform(({value})=>Number(value))
    @IsEnum(CouponTypeEnum)
    type!: CouponTypeEnum ;
    @Transform(({value})=>Number(value))
    @Min(1)
    @IsNumber()
    @IsValidDiscount()
    discount!: number ;
}
