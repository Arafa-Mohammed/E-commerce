import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto, UpdateCategoryParamsDto } from './dto/update-category.dto';
import { S3Service } from 'src/common/services';
import { BrandRepository } from 'src/common/repository';
import { CategoryRepository } from 'src/common/repository/category.repository';
import { HUserDocument } from 'src/model';
import { ICategory, IFile } from 'src/common/interfaces';
import { generateSlug, toObjectId } from 'src/common/utils';


@Injectable()
export class CategoryService {
  constructor(
    private readonly s3Service:S3Service,
    private readonly brandRepository:BrandRepository,
    private readonly categoryRepository:CategoryRepository,
  ){}

  async create({name, brandIds = []}: CreateCategoryDto, user:HUserDocument, file:IFile):Promise<ICategory> {
    brandIds =brandIds.map((ele)=>{ return toObjectId(ele as string)})
    const checkDuplicated  = await this.categoryRepository.findOne({filter:{name, paranoid:false}});
    if (checkDuplicated) throw new ConflictException("Category Already Exists");

    if (brandIds.length != (await this.brandRepository.find({filter:{_id:{$in: brandIds}}})).length) {
      throw new NotFoundException("Missing some or all of mentioned brands");
    }
    const image= await this.s3Service.uploadAsset({ file , path:`Categorys`});
    const category = await this.categoryRepository.createOne({
      data:{
        name,
        image,
        brandIds,
        createdBy:user._id
      }
    })
    if (!category) {
      await this.s3Service.deleteAsset({ Key: image })
      throw new BadRequestException("Fail to create this Category instance")      
    }
    return category.toJSON();
  }
  async update(
  { categoryId }: UpdateCategoryParamsDto,
  {
  name,
  brandIds = [],
  removeBrandIds = [],
}: UpdateCategoryDto,
  user: HUserDocument,
  file?: IFile,
): Promise<ICategory> {

  const categoryObjectId = toObjectId(categoryId as string);

  const addBrandIds = brandIds.map(id => toObjectId(id as string));
  const removeBrandObjectIds = removeBrandIds.map(id =>
  toObjectId(id as string),
);
  if (name) {
    const duplicated = await this.categoryRepository.findOne({
      filter: {
        name,
        _id: { $ne: categoryObjectId },
        paranoid: false,
      },
    });

    if (duplicated) {
      throw new ConflictException("Category already exists");
    }
  }

  if (addBrandIds.length) {
    const brands = await this.brandRepository.find({
      filter: {
        _id: { $in: addBrandIds },
      },
    });

    if (brands.length !== addBrandIds.length) {
      throw new NotFoundException("Missing some or all mentioned brands");
    }
  }

  let uploadedImage: string | undefined;

  if (file) {
    uploadedImage = await this.s3Service.uploadAsset({
      file,
      path: "Categories",
    });
  }

  const category = await this.categoryRepository.findOneAndUpdate({
    filter: {
      _id: categoryObjectId,
    },
    update: [
      {
        $set: {
          updatedBy: user._id,

          ...(name && {name,slug: generateSlug(name)}),

          ...(uploadedImage && {image: uploadedImage}),

          brandIds: {
            $setUnion: [
              {
                $setDifference: [
                  "$brandIds",
                  removeBrandIds,
                ],
              },
              brandIds,
            ],
          },
        },
      },
    ],
    options: {new: false},
  });

  if (!category) {
    if (uploadedImage) {
      await this.s3Service.deleteAsset({
        Key: uploadedImage,
      });
    }
    throw new BadRequestException("Failed to update category");
  }

  if (uploadedImage && category.image) {
    await this.s3Service.deleteAsset({
      Key: category.image,
    });
    category.image = uploadedImage;
  }
  return category.toJSON();
}

  findAll() {
    return `This action returns all category`;
  }

  findOne(id: number) {
    return `This action returns a #${id} category`;
  }

  remove(id: number) {
    return `This action removes a #${id} category`;
  }
}
