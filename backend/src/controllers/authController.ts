import { User } from "../models/User.js";
import { Request, Response } from "express";
import { generateToken } from "../utils/tokenUtils.js";
import logger from "../config/logger.js"; 

export async function registerUser(req:Request, res:Response){
    const {username, email, password} = req.body;
    try{
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });    
        if(existingUser) {
            logger.info(`User registration failed: User with username ${username} or email ${email} already exists.`);
            // console.log("user already exists")
            res.status(409).json({msg: "user already exists"});
        }
        else{
            const dBResponse = await User.create({username, email, password});
            logger.info(`User registered successfully: ${username} with email ${email}`);
            // console.log("user created", dBResponse)
            // const token = generateToken({ id: dBResponse._id, username: dBResponse.username });
            // res
            // .status(201)
            // .cookie("SessionCookie", token, {
            //     httpOnly: true,
            //     secure: process.env.NODE_ENV === "production",
            //     sameSite: "lax",
            //     maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            // });
            const {id, createdAt} = dBResponse;
            res.status(201).json({id, username, email, createdAt});
        }
    }catch(error){
        logger.error(`Login attempt failed: ${error.message}`);
        res.status(500).json({error});
    }
}

export async function loginUser(req:Request, res:Response) : Promise<void>{
    const { username, email, password } = req.body;

    if (!password || (!username && !email)) {
        logger.warn("Login attempt failed: Username/email and password are required.");
        res.status(400).json({ msg: "Username/email and password are required." });
        return;
    }
    try {
        const user = await User.findOne({
        $or: [{ username }, { email }],
        }).select("+password"); // password is excluded by default in schema
        logger.info(`Login attempt for user: ${username} with email: ${email}`);
        if (!user) {
            logger.warn(`Login attempt failed: No user found with username ${username} or email ${email}.`);
            // console.log("no user found")
            res.status(401).json({ msg: "Invalid credentials" });
            return;
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            logger.warn(`Login attempt failed: Password mismatch for user ${username} or email ${email}.`);
            // console.log("password didnt match")
            res.status(401).json({ msg: "Invalid credentials" });
            return;
        }
        logger.info(`User logged in successfully: ${username} with email ${email}`);
        const token = generateToken({ id: user._id, username: user.username });

        res
        .status(200)
        .cookie("SessionCookie", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        })
        .json({ msg: "Login successful" });

    } catch (error) {
        logger.error(`Login attempt failed: ${error.message}`);
        // console.log({error})
        res.status(500).json({ error});
    }
}
export function getMe(){

}