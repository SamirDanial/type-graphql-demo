import { getModelForClass, prop, pre, ReturnModelType, queryMethod, index } from "@typegoose/typegoose";
import { AsQueryMethod } from "@typegoose/typegoose/lib/types";
import bcrypt from 'bcrypt';
import { IsEmail, MaxLength, MinLength } from "class-validator";
import { Field, InputType, ObjectType } from "type-graphql";

function findByEmail(this: ReturnModelType<typeof User, QueryHelpers>, email: User['email']){
    return this.findOne({email});
}

interface QueryHelpers {
    findByEmail: AsQueryMethod<typeof findByEmail>
}

@pre<User>('save', async function () {
    if (!this.isModified('password')){
        return;
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hashSync(this.password, salt);

    this.password = hash;
})

@index({email: 1})
@queryMethod(findByEmail)
@ObjectType()
export class User {
    @Field(() => String)
    _id: string

    @Field(() => String)
    @prop({required: true})
    name: string

    @Field(() => String)
    @prop({required: true})
    email: string

    @prop({required: true})
    password: string

    @prop({ type: String, default: '' })
    resetLink: string
}

export const UserModel = getModelForClass<typeof User, QueryHelpers>(User);

@InputType()
export class CreateUserInput {
    @Field(() => String)
    name: string

    @IsEmail()
    @Field(() => String)
    email: string

    @MinLength(6, {
        message: "Password length is too short"
    })
    @MaxLength(50, {
        message: "Password length is too long"
    })
    @Field(() => String)
    password: string
}

@InputType()
export class LoginInput {

    @Field(() => String)
    email: string

    @Field(() => String)
    password: string

}

@InputType()
export class ForgetPasswordInput {
    @Field(() => String)
    email: string
}