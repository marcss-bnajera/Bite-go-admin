import { Router } from "express";
import {
    getUsers,
    register,
    updateUser,
    deleteUser,
    activateUser
} from "./users-controller.js";
import { hasRole } from "../../middlewares/validate-roles.js";

const router = Router();

router.get('/', hasRole('SuperAdmin'), getUsers);

router.post('/register', hasRole('SuperAdmin'), register);

router.put('/:id', hasRole('SuperAdmin'), updateUser);

router.delete('/:id', hasRole('SuperAdmin'), deleteUser);

router.patch('/:id/activate', hasRole('SuperAdmin'), activateUser);

export default router;