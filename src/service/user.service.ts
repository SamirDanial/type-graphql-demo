import { ApolloError } from "apollo-server";
import bcrypt from 'bcrypt';
import { CreateUserInput, ForgetPasswordInput, LoginInput, UserModel } from "../schema/user.schema";
import Context from "../types/context";
import { signJwt } from "../utils/jwt";
const nodemailer = require('nodemailer');


class UserService {
    async createUser(input: CreateUserInput) {
        return UserModel.create(input);
    }

    async loginUser(input: LoginInput, context: Context) {
        const e = 'Invalid Email or Password'
        const user = await UserModel.find().findByEmail(input.email).lean();

        if(!user) {
            throw new ApolloError(e);
        }

        const passwordIsValid = await bcrypt.compare(input.password, user.password);

        if(!passwordIsValid) {
            throw new ApolloError(e);
        }

        const token = signJwt(user);

        context.res.cookie("accessToken", token, {
            maxAge: 3.154e10,
            httpOnly: true,
            domain: 'localhost',
            path: '/',
            sameSite: "strict",
            secure: process.env.NODE_ENV === 'production'
        });

        return token;
    }

    async forgetPassword(input: ForgetPasswordInput) {
        const user = await UserModel.find().findByEmail(input.email).lean();

        if (!user) {
            return new ApolloError('Email not exit');
        }

        const token = signJwt(user ,{expiresIn: '20m'});
        const mailOptions = {
            from: 'samirdanial77@gmail.com',
            to: input.email,
            subject: 'Password Reset Link',
            html: `
                <h2>Please click on the given link to reset your password</h2>
                <a href="${process.env.CLIENT_URL}/authentication/reset/${token}">Reset Password</a>
            `
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'samirdanial77@gmail.com',
              pass: process.env.EMAIL_PASS
            }
          });

          transporter.sendMail(mailOptions, async function(error: any, info: any){
            if (error) {
              console.log(error);
            } else {
              await UserModel.findOneAndUpdate({email: input.email}, {$set: {resetLink: token}})
              console.log('Email sent: ' + info.response);
            }
          });


        const updatedUser = await UserModel.find().findByEmail(input.email).lean();
        
        return updatedUser;

    }
}

export default UserService;