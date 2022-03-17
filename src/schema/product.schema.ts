import { getModelForClass, index, prop, Ref } from "@typegoose/typegoose";
import { IsNumber, Min } from "class-validator";
import { customAlphabet } from "nanoid";
import { Field, InputType, ObjectType } from "type-graphql";
import { User } from "./user.schema";

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz123456789', 10);

@ObjectType()
@index<Product>({productId: 1})
export class Product {
    @Field(() => String)
    _id: string

    @Field(() => String)
    @prop({required: true, ref: () => User})
    user: Ref<User>;

    @Field(() => String)
    @prop({required: true})
    name: string

    @Field(() => String)
    @prop({required: true})
    description: string

    @Field(() => String)
    @prop({required: true})
    price: string

    @Field(() => String)
    @prop({required: true, default: () => `product_${nanoid()}`, unique: true})
    productId: string
}

export const ProductModel = getModelForClass<typeof Product>(Product);

@InputType()
export class CreateProductInput {
    @Field()
    name: string

    @Field()
    description: string

    @IsNumber()
    @Min(1)
    @Field()
    price: number
}

@InputType()
export class GetProductInput {
    @Field()
    productId: string
}