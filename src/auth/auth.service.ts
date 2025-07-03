import { BadRequestException, Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { User } from './entities/user.entity';
import { LoginUserDto, CreateUserDto } from './dto';
import { JwtPayload } from './interfaces/jwt-payload';

@Injectable()
export class AuthService {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    

    private readonly jwtService: JwtService,
  ){}



  async create(createUserDto: CreateUserDto) {

    try {
      const {password ,...userData} = createUserDto; 
      const user = this.userRepository.create( {
        ...userData,
        password: bcrypt.hashSync(password,10)
      } );
      await this.userRepository.save(user);

      return {...userData, token: this.getJwtToken({id : user.id})};
    } catch (error) {
      this.handleDBErrors(error);
    }

  }

  async login(loginUserDto: LoginUserDto){
    const {password, email } = loginUserDto;

    const user = await this.userRepository.findOne(
      {
        select: { email:true, password: true, id:true},
        where: { email: email.toLowerCase() },
      }
    );

    if(!user)
      throw new UnauthorizedException(`Credential are not valid (email)`);
    
    if ( !bcrypt.compareSync(password, user.password))
      throw new UnauthorizedException(`Credential are not valid (password)`);
    
    
    return {user, token: this.getJwtToken({id : user.id})};

  }


  private getJwtToken(payload: JwtPayload){

    const token = this.jwtService.sign(payload);
    return token;
  }


  private handleDBErrors(error:any): never{
    const logger = new Logger('auth')
    if(error.code === '23505'){
      throw new BadRequestException(error.detail);
    }
    logger.error(error);

    throw new InternalServerErrorException('Please check server logs')
  }
}
