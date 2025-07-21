import User from "../models/User.js";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
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
        const refreshToken = jwt.sign({ id: user._id, username: user.username }, process.env.REFRESH_SECRET, {expiresIn: '7d'});
        const accessToken = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, {expiresIn: '15m'});

        res.cookie('refreshToken', refreshToken, { 
            httpOnly: true,
            secure: true,
            sameSite: 'strict'
        })
        .status(200)
        .json({ accessToken });

    } catch (error) {
        logger.error(`Login attempt failed: ${error.message}`);
        // console.log({error})
        res.status(500).json({ error});
    }
}

export async function refreshToken(req: Request, res: Response) {
    if (!process.env.JWT_SECRET || !process.env.REFRESH_SECRET) {
        logger.error("JWT secret is not configured");
        return res.status(500).json({ msg: "Server error" });
    }
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        logger.warn("Refresh token not found, forcing login.");
        return res.status(401).json({ msg: "Unauthorized access" });
    }
    try {
        const user = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
        if (typeof user === 'object' && user?.id && user?.username) {
            // If the user is an object, ensure it has the necessary properties
            logger.info(`Refreshing token for user: ${user.username}`);
            // Assuming user is an object with id and username properties
            const newAccessToken = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '15m' });
            res.status(200).json({ accessToken: newAccessToken });
        }
        else if(typeof user === 'string' && user !== "") {
            // If the user is a string, parse it as JSON
            try {
                const parsedUser = JSON.parse(user);
                if (!parsedUser.id || !parsedUser.username) {
                    logger.warn("Parsed user from refresh token is invalid, forcing login.");
                    return res.clearCookie('refreshToken').status(401).json({ msg: "Unauthorized access" });
                }
                logger.info(`Refreshing token for user: ${parsedUser.username}`);
                // Generate new access token
                const newAccessToken = jwt.sign({ id: parsedUser.id, username: parsedUser.username }, process.env.JWT_SECRET, { expiresIn: '15m' });
                // Send the new access token in the response
                res.status(200).json({ accessToken: newAccessToken });
            } catch (error) {
                logger.error(`Failed to parse user from refresh token: ${error.message}`);
                return res.clearCookie('refreshToken').status(401).json({ msg: "Unauthorized access" });
            }
        }
        else {
            logger.warn("Invalid user data in refresh token, forcing login.");
            return res.clearCookie('refreshToken').status(401).json({ msg: "Unauthorized access" });
        }
    } catch (err) {
        if(err.name === 'TokenExpiredError') {
            logger.warn("Refresh token expired, forcing login.");
        }
        logger.error(`Failed to refresh token: ${err.message}`);
        res.clearCookie('refreshToken').sendStatus(401); // Force login
    }
}

