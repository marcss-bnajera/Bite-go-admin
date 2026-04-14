import { Router } from "express";
import {
    getUsers,
    register,
    updateUser,
    deleteUser
} from "./users-controller.js";

const router = Router();

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Obtener la lista de usuarios
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Éxito
 * /users/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Users]
 *     responses:
 *       201:
 *         description: Usuario creado con éxito
 *       400:
 *         description: Error en los datos enviados
 * /users/{id}:
 *   put:
 *     summary: Actualizar un usuario existente
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           description: ID del usuario a actualizar
 *     responses:
 *       200:
 *         description: Usuario actualizado correctamente
 *       404:
 *         description: Usuario no encontrado
 *   delete:
 *     summary: Eliminar un usuario
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario a eliminar
 *     responses:
 *       200:
 *         description: Usuario eliminado correctamente
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/', getUsers);

router.post('/register', register);

router.put('/:id', updateUser);

router.delete('/:id', deleteUser);

export default router;