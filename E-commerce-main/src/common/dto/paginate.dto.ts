import { ArgsType, Field, Int } from "@nestjs/graphql";
import { Transform } from "class-transformer";
import { IsInt, IsOptional, IsString, Min } from "class-validator";
import { nullable } from "zod";

export class PaginateDto {
    @Transform(({ value }) => Number(value))
    @IsInt()
    @Min(1)
    page?: number;
    @Transform(({ value }) => Number(value))
    @IsInt()
    @Min(1)
    size?: number;
    @IsString()
    @IsOptional()
    search?: string;
}

@ArgsType()
export class PaginateGQLDto {
    @Field(()=> Int , { nullable: true } )
    @IsInt()
    @Min(1)
    page?: number;
    @Field(()=> Int , { nullable: true } )
    @IsInt()
    @Min(1)
    size?: number;

    @Field(()=> String , { nullable:true })
    @IsString()
    @IsOptional()
    search?: string;
}