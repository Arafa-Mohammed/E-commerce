import { InjectModel } from "@nestjs/mongoose";
import { ICategory } from "../interfaces";
import { DatabaseRepository } from "./base.repository";
import { Model } from "mongoose";
import { Injectable } from "@nestjs/common";
import { Category } from "src/model";

@Injectable()
export class CategoryRepository extends DatabaseRepository<ICategory> {
  constructor(@InjectModel(Category.name) protected readonly model: Model<ICategory>) {
    super(model)
  }
}