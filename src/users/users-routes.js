import { Router } from "express";
import {
    getUsers,
    register,
    updateUser,
    deleteUser,
    activateUser
} from "./users-controller.js";
import { hasRole } from "../../middlewares/validate-roles.js";
import { body, param } from "express-validator";
import { checkValidators } from "../../middlewares/check-validators.js";

const router = Router();

router.get('/', hasRole('SuperAdmin'), getUsers);

router.post('/register', hasRole('SuperAdmin'), [
    body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio'),
    body('email').isEmail().withMessage('El correo no es válido'),
    body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
    body('rol').isIn(['SuperAdmin', 'Admin_Restaurante', 'Mesero', 'Repartidor', 'Cocinero', 'Cliente']).withMessage('Rol no válido'),
    checkValidators
], register);

router.put('/:id', hasRole('SuperAdmin'), [
    param('id').isMongoId().withMessage('ID de usuario no válido'),
    checkValidators
], updateUser);

router.delete('/:id', hasRole('SuperAdmin'), [
    param('id').isMongoId().withMessage('ID de usuario no válido'),
    checkValidators
], deleteUser);

router.patch('/:id/activate', hasRole('SuperAdmin'), [
    param('id').isMongoId().withMessage('ID de usuario no válido'),
    checkValidators
], activateUser);

export default router;