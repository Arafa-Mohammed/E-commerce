
import { MongooseModule, Prop, Schema, SchemaFactory, Virtual } from "@nestjs/mongoose"
import { HydratedDocument, Types } from "mongoose";
import { IBrand, IUser } from "src/common/interfaces";
import { generateSlug } from "src/common/utils";

export type HBrandDocument = HydratedDocument<IBrand>
@Schema({
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    strict: true,
    strictQuery: true,
})
export class Brand implements IBrand {

    @Prop({ type: String, required: true , unique:true , minLength:2 , maxLength:50 })
    name!: string;
    @Prop({ type: String })
    slug!: string;

    @Prop({ type: String })
    image!: string;
    @Prop({ type: Types.ObjectId, ref:"User", required:true})
    createdBy!: Types.ObjectId | IUser;
    @Prop({ type: Types.ObjectId, ref:"User"})
    updatedBy?: Types.ObjectId | IUser | undefined;
    @Prop({ type: Date })
    deletedAt?: Date;
    @Prop({ type: Date })
    restoredAt?: Date;
    
}
export const BrandSchema = SchemaFactory.createForClass(Brand)
export const BrandModel = MongooseModule.forFeatureAsync([
    {
        name: Brand.name,
        useFactory: () => {

            BrandSchema.pre('save', function () {
                console.log('Hello from pre save');
            });

            BrandSchema.pre(["find", "findOne"], function () {

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

            BrandSchema.pre(["updateOne", "findOneAndUpdate"], function () {

                const update = this.getUpdate() as HydratedDocument<IBrand>

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


            BrandSchema.pre(["deleteOne", "findOneAndDelete"], function () {

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

            BrandSchema.pre("save", async function (this: HydratedDocument<IBrand> & { wasNew: boolean }) {
                
                if (this.isModified("name")) {
                    this.slug =generateSlug(this.name)
                }
            })
            return BrandSchema;
        },
        inject: []
    },
])