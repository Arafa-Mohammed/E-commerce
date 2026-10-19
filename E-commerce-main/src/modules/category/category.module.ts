import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { BrandModel, CategoryModel } from 'src/model';
import { CategoryRepository } from 'src/common/repository/category.repository';
import { S3Service } from 'src/common/services';
import { BrandRepository } from 'src/common/repository';

@Module({
  imports:[CategoryModel, BrandModel],
  controllers: [CategoryController],
  providers: [CategoryService, CategoryRepository, S3Service , BrandRepository],
})
export class CategoryModule {}
