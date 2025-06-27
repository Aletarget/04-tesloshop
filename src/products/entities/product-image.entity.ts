import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "./product.entity";

@Entity()
export class ProductImage{

    @PrimaryGeneratedColumn()
    id: Number;

    @Column('text')
    url: string;


    @ManyToOne(
        () => Product,
        ( product ) => product.images,
        {onDelete: "CASCADE"}
    )
    @JoinColumn({ name: 'product_id' })
    product: Product;

}