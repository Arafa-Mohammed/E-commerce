import { InjectModel } from "@nestjs/mongoose";
import { IOrder } from "../interfaces";
import { DatabaseRepository } from "./base.repository";
import { Model } from "mongoose";
import { Injectable } from "@nestjs/common";
import { Order } from "src/model";

@Injectable()
export class OrderRepository extends DatabaseRepository<IOrder> {
  constructor(@InjectModel(Order.name) protected readonly model: Model<IOrder>) {
    super(model)
  }
}