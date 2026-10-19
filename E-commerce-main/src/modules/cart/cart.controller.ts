import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { RemoveItemsFromCart, UpdateCartDto } from './dto/update-cart.dto';
import { CustomCacheInterceptor } from 'src/common/interceptor/cache.interceptor';
import { AuthenticationGuard } from 'src/common/guard/authentication.guard';
import { PersonalCache, ttl, User } from 'src/common/decorator';
import { type HUserDocument } from 'src/model';
import { ICart } from 'src/common/interfaces';

@UseGuards(AuthenticationGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}
  
  @Post()
  async create(@Body() createCartDto: CreateCartDto, @User() user:HUserDocument) :Promise<ICart>{
    return await this.cartService.create(createCartDto, user);
  }
  
  @UseGuards(AuthenticationGuard)
  @PersonalCache(true)
  @ttl(60)
  @UseInterceptors(CustomCacheInterceptor)
  @Get()
  async findOne(@User() user:HUserDocument) {
    return await this.cartService.findOne(user);
  }

  @Patch()
  update(@User() user:HUserDocument, @Body() removeItemsFromCart: RemoveItemsFromCart) {
    return this.cartService.update( user , removeItemsFromCart);
  }

  @Delete(':id')
  async remove(@User() user:HUserDocument) {
    return await this.cartService.remove(user);
  }

  @Get()
  findAll() {
    return this.cartService;
  }
}
