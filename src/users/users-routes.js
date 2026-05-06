import { Router } from "express";
import {
    getUsers,
    register,
    updateUser,
    deleteUser,
    activateUser
} from "./users-controller.js";

const router = Router();

router.get('/', getUsers);

router.post('/register', register);

router.put('/:id', updateUser);

router.delete('/:id', deleteUser);

router.patch('/:id/activate', activateUser);

export default router;