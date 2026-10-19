import { Transform } from "class-transformer";
import { IsArray, IsInt, IsMongoId, IsNotEmpty, IsOptional, IsPositive, IsSemVer, IsString, Max, MaxLength, Min, MinLength } from "class-validator";
import { IProduct } from "src/common/interfaces";
import { Types } from "mongoose";
import { IsGte } from "src/common/decorator";
import { ArgsType, Field, Int } from "@nestjs/graphql";

export class CreateProductDto implements Partial<IProduct>{
    @MaxLength(50)
    @MinLength(2)
    @IsString()
    @IsNotEmpty()
    name!: string;

    @MaxLength(50000)
    @MinLength(2)
    @IsString()
    @IsNotEmpty()
    description!: string;
    
    @Transform(({ value })=> Number(value))
    @IsPositive()
    @Min(0)
    stock!:number;
    
    @Transform(({ value })=> Number(value))
    @IsPositive()
    @Min(0)
    originalPrice!:number;
    @Transform(({ value })=> Number(value))
    @IsPositive()
    @Min(0)
    @IsGte(['originalPrice'])
    salePrice!:number;
    @Transform(({ value })=> Number(value))
    @IsPositive()
    @Min(0)
    @Max(100)
    @IsOptional()
    discountPercent?:number;
    
    @IsMongoId()
    categoryId!:Types.ObjectId;
    @IsMongoId()
    brandId!:Types.ObjectId ;
    
    @IsOptional()
    @IsArray()
    removeGallery?:string[];
}

@ArgsType()
export class SayHiInputsDto{
    @Field(()=> String , {nullable:true} )
    @IsString()
    @IsOptional()
    name?: string;

    @Field(() => Int, { nullable: true })
    @IsInt()
    @IsOptional()
    age?: number;
}