import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, ParseFilePipe } from '@nestjs/common';
import { BrandService } from './brand.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto, UpdateBrandParamsDto } from './dto/update-brand.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { cloudMulter, fileFieldValidation } from 'src/common/utils';
import { RoleEnum } from 'src/common/enum';
import { Auth, User } from 'src/common/decorator';
import type{ HUserDocument } from 'src/model';
import type{ IBrand, IFile } from 'src/common/interfaces';

@Controller('brand')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}
  @UseInterceptors(FileInterceptor("attachment", cloudMulter({validation:fileFieldValidation.image})))
  @Auth([RoleEnum.ADMIN])
  @Post()
  async create(
    @Body() createBrandDto: CreateBrandDto,
    @User() user:HUserDocument,
    @UploadedFile(ParseFilePipe) file:IFile
  ) :Promise<IBrand> {
    return await this.brandService.create(createBrandDto, user, file);
  }
  @UseInterceptors(FileInterceptor("attachment", cloudMulter({validation:fileFieldValidation.image})))
  @Auth([RoleEnum.ADMIN])
  @Patch(':brandId')
  async update(
    @Param() params:UpdateBrandParamsDto, 
    @Body() updateBrandDto: UpdateBrandDto,
    @User() user:HUserDocument,
    @UploadedFile(new ParseFilePipe({fileIsRequired: false })) file:IFile
  ):Promise<IBrand> {
    return await this.brandService.update(params, updateBrandDto, user , file);
  }

  @Get()
  findAll() {
    return this.brandService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.brandService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.brandService.remove(+id);
  }
}
