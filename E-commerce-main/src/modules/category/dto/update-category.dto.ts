import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-category.dto';
import { ArrayUnique, IsArray, IsMongoId, IsOptional } from 'class-validator';
import { Types } from 'mongoose';
import { IBrand } from 'src/common/interfaces';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
    @IsOptional()
    @IsArray()
    @ArrayUnique()
    @IsMongoId({ each: true })
    removeBrandIds?: string[];
}
export class UpdateCategoryParamsDto {
    
    @IsMongoId()
    categoryId!:Types.ObjectId | string
}