import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto, UpdateProductParamsDto } from './dto/update-product.dto';
import { S3Service } from 'src/common/services';
import { BrandRepository, CategoryRepository, ProductRepository } from 'src/common/repository';
import { HUserDocument } from 'src/model';
import { IFile, IPaginate, IProduct } from 'src/common/interfaces';
import { generateSlug, toObjectId } from 'src/common/utils';
import { Category } from './../category/entities/category.entity';
import { randomUUID } from 'crypto';
import { Product } from 'src/model';
import { PaginateDto } from 'src/common/dto/paginate.dto';

@Injectable()
export class ProductService {
  constructor(
      private readonly s3Service:S3Service,
      private readonly brandRepository:BrandRepository,
      private readonly categoryRepository:CategoryRepository,
      private readonly productRepository:ProductRepository,
    ){}
  async create(
    {brandId, categoryId, description , name , originalPrice , salePrice , discountPercent= 0 ,stock ,}: CreateProductDto,
    user:HUserDocument,
    files:{ image:IFile[], gallery?:IFile[]}):Promise<IProduct> {
    brandId = toObjectId(brandId as unknown as string);
    categoryId = toObjectId(categoryId as unknown as string);
    const category  = await this.categoryRepository.findOne({filter:{_id:categoryId}});
        if (!category) throw new NotFoundException("Category not Exists");

    const brand  = await this.brandRepository.findOne({filter:{_id:brandId}});
        if (!brand) throw new NotFoundException("Brand not Exists");

    const finalPrice : number = Number((salePrice -(salePrice*(discountPercent/100))).toFixed(2))
    const productId: string = randomUUID().slice(0,6)
    const image = await this.s3Service.uploadAsset({file:files.image[0], path :`Products/${productId}`})
    let gallery!: string[]
    if (files.gallery?.length) {
      gallery = await this.s3Service.uploadAssets({files:files.gallery,  path :`Products/${productId}/gallery`})
    }

    const product = await this.productRepository.createOne({
      data:{
        brandId, categoryId, description , name , 
        originalPrice , salePrice , discountPercent ,
        stock , productId, image, gallery, createdBy:user._id
      }
    })

    if (!product) {
      await this.s3Service.deleteFolderByPrefix({ prefix: `Products/${productId}`})
      throw new BadRequestException("Fail to create this product ")
    } 
    return product.toJSON();
  }
  private async daleteAttachments( gallery: string[]=[] , image?:string | undefined){
    let Keys:{ Key: string }[] = []
      if (image){
        Keys.push({Key: image})
      }
      if( gallery.length){
        Keys.push(...gallery.map((ele) => ({ Key: ele })))
      }
      await this.s3Service.deleteAssets({ Keys })
  }

  async update(
    { productId }:UpdateProductParamsDto,
    { removeGallery =[] ,brandId, categoryId, description , name , originalPrice , salePrice , discountPercent ,stock }: UpdateProductDto,
    user:HUserDocument,
    files?:{ image?:IFile[], gallery?:IFile[]}):Promise<IProduct> {
    brandId = toObjectId(brandId as unknown as string);
    categoryId = toObjectId(categoryId as unknown as string);
    const product = await this.productRepository.findOne({filter:{_id:productId}});
    if (!product) throw new NotFoundException("Product not Exists");
    if(brandId){
      const brand  = await this.brandRepository.findOne({filter:{_id:brandId}});
        if (!brand) throw new NotFoundException("Brand not Exists");
    }
    if(categoryId){
      const category  = await this.categoryRepository.findOne({filter:{_id:categoryId}});
        if (!category) throw new NotFoundException("Category not Exists");
    }
    let finalPrice : number = product.finalPrice;
    if(originalPrice||salePrice||discountPercent){
      originalPrice ??= product.originalPrice
      salePrice ??= product.salePrice
      discountPercent ??= product.discountPercent

    if (salePrice > originalPrice) {
    throw new BadRequestException(
      "Sale price cannot be greater than original price"
    );
  }
    finalPrice = Number((salePrice -(salePrice*(discountPercent/100))).toFixed(2))
  } 
  let image: string = product.image;
  if (files?.image?.length) {
    image = await this.s3Service.uploadAsset({file:files.image[0], path :`Products/${product.productId}`})
  }
    
  let gallery: string[] = product.gallery || [];
  if (files?.gallery?.length) {
      gallery = await this.s3Service.uploadAssets({files:files.gallery,  path :`Products/${product.productId}/gallery`})
    }

    const uProduct = await this.productRepository.findOneAndUpdate({
      filter:{_id:productId},
      update:[
        {
          $set:{
            ...(name?{name , slug:generateSlug(name)}:{}),
            ...(description?{description}:{}),
            ...(brandId?{brandId}:{}),
            ...(categoryId?{categoryId}:{}),
            ...(stock?{stock}:{}),

            originalPrice,
            salePrice,
            discountPercent,
            finalPrice,
            image,
            gallery:{
              $setUnion:[
                {
                  $setDifference:["$gallery" , removeGallery]
                }
              ]
            },

            updateBy:user._id
          }
        }  
      ]
    })

    if (!uProduct) { 
      this.daleteAttachments(gallery , files?.image?.length? image:undefined)
      throw new BadRequestException("Fail to update this product ")
    } 
    this.daleteAttachments(removeGallery, files?.image?.length? image:undefined)
    return uProduct.toJSON();
  }

  async findAll({page , size, search }:PaginateDto):Promise<IPaginate<IProduct>> {
    const result = await this.productRepository.paginate({
      page,
      size,
      filter:{
        ...(search?{
          $or:[
            {name:{$regex:search , $options:"i"}},
            {slug:{$regex:search , $options:"i"}},
            {description:{$regex:search , $options:"i"}}
          ]
        }:{})
      },
      options:{
        populate:[{ path: "createdBy"}]
      }
    })
    return result;
  }

  findOne(id: number) {
    return `This action returns a #${id} product`;
  }


  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}
