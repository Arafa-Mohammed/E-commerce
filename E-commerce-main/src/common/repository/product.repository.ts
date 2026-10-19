import { InjectModel } from "@nestjs/mongoose";
import { IProduct } from "../interfaces";
import { DatabaseRepository } from "./base.repository";
import { Model } from "mongoose";
import { Injectable } from "@nestjs/common";
import { Product } from "src/model";

@Injectable()
export class ProductRepository extends DatabaseRepository<IProduct> {
  constructor(@InjectModel(Product.name) protected readonly model: Model<IProduct>) {
    super(model)
  }
}