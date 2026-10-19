import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDto, OrderParamsDto } from './dto/create-order.dto';
import { CheckoutOrderDto, CheckoutOrderParamsDto, UpdateOrderDto } from './dto/update-order.dto';
import { HCouponDocument, HProductDocument, HUserDocument } from 'src/model';
import { OrderRepository } from './../../common/repository/order.repository';
import { ProductRepository } from './../../common/repository/product.repository';
import { CartRepository, CouponRepository } from 'src/common/repository';
import { IOrder, IOrderProduct } from 'src/common/interfaces';
import { CouponTypeEnum, OrderStatusEnum, PaymentTypeEnum } from 'src/common/enum';
import { randomUUID } from 'crypto';
import { CartService } from '../cart/cart.service';
import { Types } from 'mongoose';
import { IV_LENGTH } from './../../config/config';
import { toObjectId } from 'src/common/utils';
import { PaymentService } from './../../common/services/payment.service';
import { Request } from 'express';
import { RealtimeGateway } from './../realtime/realtime.gateway';

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository:OrderRepository,
    private readonly productRepository:ProductRepository,
    private readonly cartRepository:CartRepository,
    private readonly couponRepository:CouponRepository,
    private readonly cartService:CartService,
    private readonly paymentService:PaymentService,
    private readonly realtimeGateway:RealtimeGateway
  ){}
  async create({paymentType,address, currency, phone, couponName ,note}: CreateOrderDto , user:HUserDocument):Promise<IOrder> {
    const cart = await this.cartRepository.findOne({ filter:{createdBy:user._id}});
    if (!cart?.products?.length) {
      throw new NotFoundException(`Cart is empty`)
    }
    let coupon!:HCouponDocument
    if (couponName) {
      coupon = await this.couponRepository.findOne({
        filter:{
          name:couponName ,
          startDate:{$lt:new Date(Date.now())},
          endDate:{$gt:new Date(Date.now())},
        }
      }) as HCouponDocument;
      if(!coupon) throw new NotFoundException("Invalid coupon")
        const trails = coupon.usedBy.filter(ele=> ele.userId.toString() == user._id.toString()).length;
      if (trails >= coupon.duration) {
        throw new BadRequestException("User exceeded maximum trails per this coupon")
      }
    }

    let orderProducts:IOrderProduct[]=[]
    let total:number = 0
    for (const product of cart.products) {
      const matchProduct = await this.productRepository.findOne({
        filter:{ _id:product.productId, stock: { $gte: product.quantity}}
      })
      if (!matchProduct) {
        throw new NotFoundException(`Invalid product or out of stock`)
      }
      const sum = product.quantity * matchProduct.finalPrice
      orderProducts.push({
        productId: product.productId,
        quantity:product.quantity,
        unitAmount: matchProduct.finalPrice,
        total: sum
      })
      total +=sum;
    }
    let subtotal :number= total;
    let discountPercent :number=0;

    if (coupon) {
      discountPercent = coupon.type == CouponTypeEnum.PERCENTAGE? coupon.discount : (Number((coupon.discount/total).toFixed(2))*100)
      subtotal = subtotal - (subtotal * Number((discountPercent/100).toFixed(2)))
    }
    const order = await this.orderRepository.createOne({
      data:{
        address,
        currency, 
        phone, 
        note,
        total ,
        subtotal,
        discountPercent,
        ...(coupon ? { couponId : coupon._id }: {}),
        orderId:randomUUID().slice(0, 6),
        createdBy:user._id,
        products: orderProducts,
        paymentType
      }
    })
    if (!order) {
      throw new BadRequestException("Fail to create this order")
    }
    
    const modifiedProducts:{productId:Types.ObjectId, stock: number}[] = [];
    for (const product of cart.products) {
      const matchProduct = await this.productRepository.findOneAndUpdate({
        filter:{ _id:product.productId},
        update: {
          $inc:{stock:-product.quantity}
        }
      }) as HProductDocument;
      modifiedProducts.push({productId: matchProduct._id, stock:matchProduct.stock})
    }
    if (coupon) {
      coupon.usedBy.push({ userId:user._id , orderId:order._id ,time: new Date(Date.now()) })
      await coupon.save()
    }
    await this.cartService.remove(user)
    this.realtimeGateway.changeStock(modifiedProducts)
    return order.toJSON() ;
  }

  async confirm({orderId}: OrderParamsDto , user:HUserDocument):Promise<IOrder> {
    const order = await this.orderRepository.findOneAndUpdate({
      filter: {
        id: toObjectId(orderId as unknown as string),
        status:OrderStatusEnum.PENDING
      },
      update:{
        status: OrderStatusEnum.PLACED,
        updatedBy:user._id
      }
    })

    if (!order) {
      throw new NotFoundException("Fail to find this order")
    }
    
    return order.toJSON() ;
  }

  async cancel({orderId}: OrderParamsDto , user:HUserDocument):Promise<IOrder> {
    const order = await this.orderRepository.findOneAndUpdate({
      filter: {
        id: toObjectId(orderId as unknown as string),
        status:{$lt:OrderStatusEnum.CANCELED}
      },
      update:{
        status: OrderStatusEnum.CANCELED,
        updatedBy:user._id
      }
    })

    if (!order) {
      throw new NotFoundException("Fail to find this order")
    }
    if(order.paymentType ==PaymentTypeEnum.CARD && order.intentId && order.paidAt && !order.refundedAt){
      await this.paymentService.refund(order.intentId);
      order.status = OrderStatusEnum.REFUNDED;
      order.refundedAt = new Date(Date.now())
      await order.save()
    }
    //reverse
    //update product stock
    // re generate cart
    //remove user from coupon
    return order.toJSON() ;
  }

  async checkout({orderId}: CheckoutOrderParamsDto ,{token}:CheckoutOrderDto, user:HUserDocument):Promise<any> {
    const order = await this.orderRepository.findOne({
      filter: {
        _id: toObjectId(orderId as unknown as string),
        status:OrderStatusEnum.PENDING,
        paidAt:{$exists: false},
        createdBy:user._id,
        paymentType:PaymentTypeEnum.CARD
      },
      options:{
        populate:[{path: "products.productId"}]
      }
    })

    if (!order) throw new NotFoundException("Fail to find this order")
      let discounts: any[] =[];
    if(order.discountPercent){
      const coupon = await this.paymentService.createCoupon({percent_off:order.discountPercent , duration:"once" , currency:order.currency})
      console.log({coupon});
      discounts.push({coupon :coupon.id})
    }
    const session = await this.paymentService.checkout({
    customer_email:user.email,
    metadata:{orderId:order._id.toString()},
    mode:"payment",
    line_items:order.products.map(product =>{
      return{
        quantity:product.quantity,
        price_data:{
          currency:order.currency,
          product_data:{
            name:(product.productId as unknown as HProductDocument).name
          },
          unit_amount:product.unitAmount*100
        }
      }
    }),
    discounts,
  
  })
    const method = await this.paymentService.createPaymentMethod(token);
    const intent = await this.paymentService.createPaymentIntent({
      amount: order.subtotal*100,
      currency: order.currency,
      automatic_payment_methods:{
        enabled: true,
        allow_redirects:'never'
      },
      payment_method: method.id

    })
    console.log({ intent , method });
    order.intentId = intent.id
    await order.save()
    return session;
  }

  async webhook(req: Request): Promise<void>{
    const event = await this.paymentService.webhook(req)
    const { orderId } = event.data.object.metadata as { orderId:string }
    const order = await this.orderRepository.findOneAndUpdate({
      filter: {
        _id: toObjectId(orderId as unknown as string),
        status:OrderStatusEnum.PENDING,
        paymentType:PaymentTypeEnum.CARD,
        paidAt:{$exists: false},
      },
      update:{
        paidAt:new Date(Date.now()),
      },
    })
    console.log({order});
    

    if (!order) throw new NotFoundException("Fail to find this order")
    const c = await this.paymentService.confirmPaymentIntent(order.intentId as string)
    console.log({c});
    
    return;
  }

  findAll() {
    return `This action returns all order`;
  }

  findOne(id: number) {
    return `This action returns a #${id} order`;
  }

  update(id: number, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }
}
