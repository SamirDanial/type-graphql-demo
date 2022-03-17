import dotenv from 'dotenv';
dotenv.config();
import 'reflect-metadata';
import express from 'express';
import { buildSchema } from 'type-graphql';
import cookieParser from 'cookie-parser';
import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPluginLandingPageGraphQLPlayground, ApolloServerPluginLandingPageProductionDefault } from 'apollo-server-core';
import { resolvers } from './resolvers';
import { connectToDb } from './utils/mongo';
import { verifyJwt } from './utils/jwt';
import { User } from './schema/user.schema';
import Context from './types/context';
import authChecker from './utils/authChecker';
import { UserModel } from './schema/user.schema';
import path from 'path';
import bcrypt from 'bcrypt';


const bootstrap = async () => {
    const schema = await buildSchema({
        resolvers: resolvers,
        authChecker
    });

    const app = express();

    app.use(cookieParser());
    app.use(express.json());
    app.use(express.urlencoded());

    const server = new ApolloServer({
        schema,
        context: (ctx: Context) => {
            const context = ctx;
            if(context.req.cookies.accessToken) {
                const user = verifyJwt<User>(context.req.cookies.accessToken);
                context.user = user;
            }
            return context;
        },
        plugins: [
            process.env.Node_ENV === 'production' ?
             ApolloServerPluginLandingPageProductionDefault():
             ApolloServerPluginLandingPageGraphQLPlayground()
        ]
    })

    await server.start();

    server.applyMiddleware({app});

    app.get('/authentication/reset/:token', async (req, res) => {
        const {token} = req.params;
        const user = await UserModel.findOne({accessToken: token})
        console.log(path.join(__dirname, 'form', 'resetForm.html'));
        if(user) {
            return res.sendFile(path.join(__dirname, 'form', 'resetForm.html'))
        } else {
            return res.send('Not Found')
        }
    })

    app.post('/authentication/reset/:token', async (req, res) => {
        const {token} = req.params;
        const {password, confirmPassword} = req.body;
        const verifyToken = verifyJwt(token);
        if (verifyToken) {
            const user = await UserModel.findOne({accessToken: token})
            if(user) {
                if (password === confirmPassword) {
                    const salt = await bcrypt.genSalt(10);
                    const hash = await bcrypt.hashSync(password, salt);
                    await UserModel.findOneAndUpdate({accessToken: token}, {$set: {accessToken: "", password: hash}})
                }
                return res.send('We recieve new password');
            }
        } else {
            return res.send('Could not recognize the token');
        }
    })

    app.listen({port: "3000"}, () => {
        console.log('App is listening on http://localhost:3000/graphql')
    })

    connectToDb();
}

bootstrap();