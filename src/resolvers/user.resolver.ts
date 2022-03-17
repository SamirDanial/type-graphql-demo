import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";
import { CreateUserInput, ForgetPasswordInput, LoginInput, User } from "../schema/user.schema";
import UserService from "../service/user.service";
import Context from "../types/context";

@Resolver()
export default class UserResolver {

    constructor(private userService: UserService){
        this.userService = new UserService();
    }

    @Mutation(() => User)
    createUser(@Arg('input') input: CreateUserInput) {
        return this.userService.createUser(input);
    }

    @Mutation(() => String)
    login(@Arg('input') input: LoginInput, @Ctx() context: Context ) {
        return this.userService.loginUser(input, context);
    }

    @Mutation(() => User)
    forgetPassword(@Arg('input') input: ForgetPasswordInput) {
        return this.userService.forgetPassword(input);
    }

    @Query(() => User, {nullable: true})
    me(@Ctx() context: Context) {
        console.log(context.user);
        return context.user;
    }
}