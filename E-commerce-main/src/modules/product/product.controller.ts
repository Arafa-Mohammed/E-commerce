import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFiles, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto, UpdateProductParamsDto } from './dto/update-product.dto';
import { RoleEnum } from 'src/common/enum';
import { Auth, User } from 'src/common/decorator';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { cloudMulter, fileFieldValidation } from 'src/common/utils';
import type { HUserDocument } from 'src/model';
import type { IFile, IPaginate, IProduct } from 'src/common/interfaces';
import { PaginateDto } from 'src/common/dto/paginate.dto';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}
  @UseInterceptors(FileFieldsInterceptor([
    {name:"image", maxCount:1}, 
    {name:"gallery", maxCount:3 }], 
    cloudMulter({validation: fileFieldValidation.image})
  ))
  @Auth([RoleEnum.ADMIN])
  @Post()
  create(
    @Body() createProductDto: CreateProductDto,
    @User() user:HUserDocument,
    @UploadedFiles() files:{ image:IFile[], gallery?:IFile[]}
  ) {
    return this.productService.create(createProductDto, user , files );
  }

  @UseInterceptors(FileFieldsInterceptor([
    {name:"image", maxCount:1}, 
    {name:"gallery", maxCount:3 }], 
    cloudMulter({validation: fileFieldValidation.image})
  ))
  @Auth([RoleEnum.ADMIN])
  @Patch(':productId')
  update(
    @Param() params:UpdateProductParamsDto, 
    @Body() updateProductDto: UpdateProductDto ,@User() user:HUserDocument,
    @UploadedFiles() files?:{ image?:IFile[], gallery?:IFile[]}) {
    return this.productService.update(params, updateProductDto , user , files );
  }

  @UseInterceptors()
  @Get()
  async findAll(@Query() query:PaginateDto):Promise<IPaginate<IProduct>> {
    return await this.productService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productService.remove(+id);
  }
}
