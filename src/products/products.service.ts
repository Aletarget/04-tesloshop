import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { validate as isUUID } from 'uuid';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { ProductImage } from './entities';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,


    private readonly dataSource: DataSource
  ){}


  async create(createProductDto: CreateProductDto) {

    try {
      const {images = [], ...productDetails} = createProductDto;
      const product = this.productRepository.create({...productDetails,
        images: images.map(image => this.productImageRepository.create({url: image}))
      });

      await this.productRepository.save( product );

      return {productDetails, images};
    } catch (error) {
      this.handleExceptions(error);
    }

  }

  async findAll(paginationDto: PaginationDto){

    const {limit=10, offset=0} = paginationDto;

    try {
      const products: Product[] = await this.productRepository.find({
        take: limit,
        skip: offset,
        relations: {
          images: true,
        }

      });
      return products.map(product => ({
        ...product,
        images: product.images?.map( img => img.url)
      }))

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
    const QueryBuilder = this.productRepository.createQueryBuilder('prod');
    const product = await QueryBuilder.where(
      'UPPER(title) =:title or slug =:slug',{
        title: term.toUpperCase(),
        slug: term.toLowerCase()
      })
      .leftJoinAndSelect('prod.images', 'prodImages')
      .getOne();
    if(!product){
        throw new NotFoundException('The product has not be found');
      }
    return product;
  }


  async findOnePlain(term: string){
    const product = await this.findOne(term);
    return{
      ...product,
      images: product.images?.map(img => img.url)
    }
  }




  async update(id: string, updateProductDto: UpdateProductDto) {
    const {images, ...toUpdate} = updateProductDto;

    // images: images.map(image => this.productImageRepository.preload({url:image}));

    const product = await this.productRepository.preload({id: id,... toUpdate}); //Prepara 
    
    if(!product){
      throw new NotFoundException(`Product with id: ${ id } not found`);
    }

    // Create query Runner

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if(images){
        await queryRunner.manager.delete( ProductImage , { product: {id} })
        product.images = images.map(img => this.productImageRepository.create({url: img}));
      }
      await queryRunner.manager.save(product);
      await queryRunner.commitTransaction();
      await queryRunner.release();


      // await this.productRepository.save(product);
      return this.findOnePlain(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      
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

//Codigo para la eliminacion de todos los registros, esto normalmente solo se realiza 
//en desarrollo o en el primer despliegue de produccion
  async deleteAllProducts(){
    const query = this.productRepository.createQueryBuilder('product');

    try {
      return await query
        .delete()
        .where({})
        .execute();

    } catch (error) {
      this.handleExceptions(error);
    }
  }
}
