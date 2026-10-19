import { InjectModel } from "@nestjs/mongoose";
import { IBrand } from "../interfaces";
import { DatabaseRepository } from "./base.repository";
import { Model } from "mongoose";
import { Injectable } from "@nestjs/common";
import { Brand } from "src/model";

@Injectable()
export class BrandRepository extends DatabaseRepository<IBrand> {
  constructor(@InjectModel(Brand.name) protected readonly model: Model<IBrand>) {
    super(model)
  }
}