import { Module } from '@nestjs/common';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';
import { BrandModel } from 'src/model';
import { BrandRepository } from 'src/common/repository';

@Module({
  imports:[BrandModel],
  controllers: [BrandController],
  providers: [BrandService, BrandRepository],
})
export class BrandModule {}
