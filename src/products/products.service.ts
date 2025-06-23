import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { validate as isUUID } from 'uuid';
import { PaginationDto } from 'src/common/dtos/pagination.dto';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

  ){}


  async create(createProductDto: CreateProductDto) {

    try {

      const product = this.productRepository.create(createProductDto);

      await this.productRepository.save( product );

      return {product};
    } catch (error) {
      this.handleExceptions(error);
    }

  }

  async findAll(paginationDto: PaginationDto){

    const {limit=10, offset=0} = paginationDto;

    try {
      const products: Product[] = await this.productRepository.find({
        take: limit,
        skip: offset

        //TO DO: RELACIONES
      });
      return products;

    } catch (error) {
      this.handleExceptions(error);
      throw new InternalServerErrorException(`Has been an error: ${error.code}`);
    }
  }

  async findOne(term: string): Promise<Product> {
    if(isUUID(term)){
      const product = await this.productRepository.findOneBy({id: term});
      if(!product){
        throw new NotFoundException('The product has not be found');
      }
      return product;
    }
    const QueryBuilder = this.productRepository.createQueryBuilder();
    const product = await QueryBuilder.where(
      'UPPER(title) =:title or slug =:slug',{
        title: term.toUpperCase(),
        slug: term.toLowerCase()
      }).getOne();
    if(!product){
        throw new NotFoundException('The product has not be found');
      }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {

    const product = await this.productRepository.preload({
      id: id,
    ... updateProductDto
    }); //Prepara 
    
    if(!product){
      throw new NotFoundException(`Product with id: ${ id } not found`);
    }
    try {
      await this.productRepository.save(product);
      return product;
    } catch (error) {
      this.handleExceptions(error);
    }

  }

  async remove(id: string) {

    if(!isUUID(id)){
      throw new BadRequestException(`The id: ${id} is not a UUID`);
    }
    const product = await this.findOne(id);

    await this.productRepository.remove(product);
    return `Has been deleted the product with id:${id}`;
  }


  private handleExceptions( error: any){
      if(error.code === '23505'){
        throw new BadRequestException(error.detail)
      }
      this.logger.error(error.message)
      throw new BadRequestException(`Code error: ${error.code} watch logs`)
  }
}
