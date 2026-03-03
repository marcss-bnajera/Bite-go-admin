import { Router } from "express";
import { validateJWT } from "../../middlewares/validate-jwt.js";
import { hasRole } from "../../middlewares/validate-roles.js";
import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
} from "./categories-controller.js";
import {
    validateCreateCategory,
    validateUpdateCategory,
} from "../../middlewares/categories-validator.js";

const router = Router();

// Obtener categorías (se puede filtrar por ?restaurante=ID)
router.get('/', validateJWT, hasRole('Admin_Restaurante', 'Admin_Plataforma'), getCategories);

// Crear categoría
router.post('/', validateJWT, hasRole('Admin_Restaurante', 'Admin_Plataforma'), validateCreateCategory, createCategory);

// Actualizar categoría por ID
router.put('/:id', validateJWT, hasRole('Admin_Restaurante', 'Admin_Plataforma'), validateUpdateCategory, updateCategory);

// Eliminar (desactivar) categoría por ID
router.delete('/:id', validateJWT, hasRole('Admin_Restaurante', 'Admin_Plataforma'), deleteCategory);

export default router;