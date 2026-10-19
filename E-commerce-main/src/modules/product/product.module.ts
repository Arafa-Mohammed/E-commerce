import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductModel } from 'src/model/product.model';
import { BrandModel, CategoryModel } from 'src/model';
import { CategoryRepository } from 'src/common/repository/category.repository';
import { BrandRepository, ProductRepository } from 'src/common/repository';
import { S3Service } from 'src/common/services';
import { ProductResolver } from './product.resolver';

@Module({
  imports:[ProductModel, CategoryModel, BrandModel],
  controllers: [ProductController],
  providers: [ProductService, CategoryRepository,BrandRepository, ProductRepository, S3Service ,ProductResolver],
})
export class ProductModule {}
