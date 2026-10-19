import { Module } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CouponController } from './coupon.controller';
import { CartModel, CouponModel, OrderModel, ProductModel } from 'src/model';
import { CouponRepository } from 'src/common/repository';
import { S3Service } from 'src/common/services';

@Module({
  imports:[CouponModel, OrderModel,CartModel,ProductModel ],
  controllers: [CouponController],
  providers: [CouponService , CouponRepository,S3Service],
})
export class CouponModule {}
