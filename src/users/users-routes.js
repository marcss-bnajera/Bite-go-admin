import { Router } from "express";
import {
    getUsers,
    register,
    updateUser,
    deleteUser
} from "./users-controller.js";

const router = Router();

router.get('/', getUsers);

router.post('/register', register);

router.put('/:id', updateUser);

router.delete('/:id', deleteUser);

export default router;