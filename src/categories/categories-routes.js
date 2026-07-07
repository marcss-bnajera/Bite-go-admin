import { Router } from "express";
import { hasRole } from "../../middlewares/validate-roles.js";
import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    activateCategory
} from "./categories-controller.js";
import {
    validateCreateCategory,
    validateUpdateCategory,
} from "../../middlewares/categories-validator.js";

const router = Router();
const adminRoles = hasRole('SuperAdmin', 'Admin_Restaurante');

// Obtener categorías (se puede filtrar por ?restaurante=ID)
router.get('/', adminRoles, getCategories);

// Crear categoría
router.post('/', adminRoles, validateCreateCategory, createCategory);

// Actualizar categoría por ID
router.put('/:id', adminRoles, validateUpdateCategory, updateCategory);

// Eliminar (desactivar) categoría por ID
router.delete('/:id', adminRoles, deleteCategory);

router.patch('/:id/activate', adminRoles, activateCategory);

export default router;