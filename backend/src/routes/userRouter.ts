import { Router } from "express";

const userRouter = Router();

userRouter.get("/users", (_req, res) => {
    res.send("all users");
});

userRouter.get("/users/:id", (req, res) => {
    const id = req.params.id;
    res.send("user "+id);
});

export default userRouter;