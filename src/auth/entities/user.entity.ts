import { Product } from "src/products/entities";
import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity('users')
export class User {


    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('varchar',
        {
            length: 30,
            unique: true,
            nullable: false
        }
    )
    email: string;


    @Column('varchar',{
        nullable: false,
        select: false
    })
    password: string;

    @Column('varchar',{
        length: 50,
        nullable: false
    })
    fullName: string;

    @Column('bool',{
        default: true
    })
    isActive: boolean;

    @Column('text', {
        array: true,
        default: ['user']
    })
    roles: string[];

    @OneToMany(
        () => Product,
        (product) => product.user
    )
    product:Product;


    @BeforeInsert()
    checkFieldsToCreateUser(){
        this.email = this.email.toLowerCase().trim();
    }

    @BeforeUpdate()
    checkFieldsToUpdateUser(){
        this.checkFieldsToCreateUser();
    }
}
