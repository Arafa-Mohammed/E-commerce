
import { MongooseModule, Prop, raw, Schema, SchemaFactory, Virtual } from "@nestjs/mongoose"
import { min } from "class-validator";
import { HydratedDocument, Types } from "mongoose";
import { CurrencyTypeEnum, OrderStatusEnum, PaymentTypeEnum } from "src/common/enum";
import { ICoupon, IOrder, IOrderProduct, IUser } from "src/common/interfaces";

export type HOrderDocument = HydratedDocument<IOrder>
@Schema({
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strict: true,
    strictQuery: true,
})
export class Order implements IOrder {
    @Prop({ type: String,unique: true, required:true})
    orderId!: string;
    @Prop({ type: String, required:true})
    address!: string;
    @Prop({ type: String, required:true})
    phone!: string;
    
    @Prop({ type: String,min:0, required:true})
    total!: number;
    @Prop({ type: String,unique: true, default:0})
    discountPercent!: number;
    @Prop({ type: String,min:0, required:true})
    subtotal!: number;

    @Prop({ type: Types.ObjectId, ref:"Coupon"})
    couponId?: Types.ObjectId | ICoupon;
    @Prop({ type: Date })
    paidAt?: Date | undefined;
    @Prop({ type: Date })
    refundedAt?: Date | undefined;

    @Prop({
        type:raw({
        userId:{type:Types.ObjectId , ref:"User" , required: true},
        time:{type:Date , required:true },
        note:{type:String, required:true },
    }),
    required:false
    })
    cancel?: { userId: Types.ObjectId; time: Date; note: String; } | undefined;
    @Prop({type:String , enum:CurrencyTypeEnum , default:CurrencyTypeEnum.EGP})
    currency!: CurrencyTypeEnum;
    @Prop({type:Number , enum:PaymentTypeEnum , default:PaymentTypeEnum.CASH})
    paymentType!: PaymentTypeEnum;
    @Prop({type:Number , enum:OrderStatusEnum , default:OrderStatusEnum.PENDING})
    status!: OrderStatusEnum;

    @Prop([
        raw({
            productId:{type:Types.ObjectId , ref:"Product" , required: true},
            quantity:{type:Number , required:true ,min:0 },
            unitAmount:{type:Number , required:true ,min:0 },
            total:{type:Number , required:true ,min:0 },
        })
    ])
    products!: IOrderProduct[];

    @Prop({ type: String})
    note?: string | undefined;
    @Prop({ type: String})
    intentId?: string | undefined;
    
    @Prop({ type: Types.ObjectId, ref:"User", required:true})
    createdBy!: Types.ObjectId | IUser;
    @Prop({ type: Types.ObjectId, ref:"User"})
    updatedBy?: Types.ObjectId | IUser | undefined;
    @Prop({ type: Date })
    deletedAt?: Date;
    @Prop({ type: Date })
    restoredAt?: Date;
    
}
export const OrderSchema = SchemaFactory.createForClass(Order)
export const OrderModel = MongooseModule.forFeatureAsync([
    {
        name: Order.name,
        useFactory: () => {

            OrderSchema.pre('save', function () {
                console.log('Hello from pre save');
            });

            OrderSchema.pre(["find", "findOne"], function () {

                if (this.getQuery().paranoid == false) {
                    this.setQuery({
                        ...this.getQuery(),
                    })
                } else {
                    this.setQuery({
                        ...this.getQuery(),
                        deletedAt: { $exists: false }
                    })
                }
            })

            OrderSchema.pre(["updateOne", "findOneAndUpdate"], function () {

                const update = this.getUpdate() as HydratedDocument<IOrder>

                if (update.deletedAt) {
                    this.getQuery().paranoId = true
                    this.setUpdate({
                        ...this.getUpdate(),
                        $unset: { restoredAt: 1 }
                    })
                }

                if (update.restoredAt) {
                    this.setQuery({
                        ...this.getQuery(),
                        paranoid: false,
                        deletedAt: { $exists: true }
                    })
                    this.setUpdate({
                        ...this.getUpdate(),
                        $unset: { deletedAt: 1 }
                    })
                }
                if (this.getQuery().paranoid == false) {
                    this.setQuery({
                        ...this.getQuery(),
                    })
                } else {
                    this.setQuery({
                        ...this.getQuery(),
                        deletedAt: { $exists: false }
                    })
                }
                console.log(this.getQuery());

            })


            OrderSchema.pre(["deleteOne", "findOneAndDelete"], function () {

                if (this.getQuery().force == true) {
                    this.setQuery({
                        ...this.getQuery(),
                    })
                } else {
                    this.setQuery({
                        ...this.getQuery(),
                        deletedAt: { $exists: true }
                    })
                }
            })
            return OrderSchema;
        },
        inject: []
    },
]);