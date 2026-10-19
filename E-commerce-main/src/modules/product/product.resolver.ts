import { Resolver , Query, Mutation, Args, Int} from '@nestjs/graphql';
import { PaginateProductsResponse, SayHiResponse } from './entities/product.entity';
import { SayHiInputsDto } from './dto/create-product.dto';
import { RoleEnum } from 'src/common/enum/user.enum';
import {Auth , User } from 'src/common/decorator';
import type { HUserDocument } from 'src/model';
import { ProductService } from './product.service';
import { PaginateDto, PaginateGQLDto } from 'src/common/dto';
import { IPaginate, IProduct } from 'src/common/interfaces';
import { UseInterceptors } from '@nestjs/common';
import { CustomCacheInterceptor } from 'src/common/interceptor/cache.interceptor';

@Resolver()
export class ProductResolver {
    constructor( private readonly productService: ProductService) {}
    @UseInterceptors(CustomCacheInterceptor)
    @Query(()=> PaginateProductsResponse)
    async allProducts(
        @Args() args:PaginateGQLDto
    ):Promise<IPaginate<IProduct>>{
        const result = await this.productService.findAll(args)
        return result

    }





    @Auth([RoleEnum.ADMIN])
    @Query(() => [SayHiResponse] , {description:"FIRST API" , name:"Welcome" , nullable:false})
    sayHi(
        @Args({type:()=> SayHiInputsDto , nullable:true}) data:SayHiInputsDto,
        @User() user: HUserDocument
    ): { message: string; age?: number } []{
        console.log( user );
        return [{message: data?.name?? "Hi" , age :data?.age  }] 

    }
}
