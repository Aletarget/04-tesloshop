import { BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Product {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('varchar', {
        unique:true,
        length:100,
    })
    title: string;

    @Column('float',{
        default: 0
    }
    )
    price: number;

    @Column({
        type: 'text',
        nullable: true
    })
    decription: string;

    @Column('text',{
        unique:true,
    })
    slug: string;

    @Column('int',{
        default:0
    })
    stock: number;

    @Column('text',{
        array:true
    })
    sizes: string[]

    @Column('text')
    gender:string;

    @Column('text',{
        array: true,
        default: []
    })
    tags: string[];
    // images



    @BeforeInsert()
    checkSlugInsert(){
        if(!this.slug){
            this.slug = this.title
                .toLowerCase()
                .replace(' ','_')
                .replace("'",'')
        }
        this.slug = this.slug
            .toLowerCase()
            .replace(' ','_')
            .replace("'",'')
    }

    @BeforeUpdate()
    checkSlugUpdate(){
        const slugTemp = this.title.toLowerCase()
                                .replace(' ','_')
                                .replace("'",'')
        if(this.slug != slugTemp){
            this.slug = slugTemp
        }else{
            this.slug = this.slug
                .toLowerCase()
                .replace(' ','_')
                .replace("'",'')
        }
    }
}
