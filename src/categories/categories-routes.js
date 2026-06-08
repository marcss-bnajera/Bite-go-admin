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

// Obtener categorías (se puede filtrar por ?restaurante=ID)
router.get('/', hasRole('Admin_Restaurante'), getCategories);

// Crear categoría
router.post('/', hasRole('Admin_Restaurante'), validateCreateCategory, createCategory);

// Actualizar categoría por ID
router.put('/:id', hasRole('Admin_Restaurante'), validateUpdateCategory, updateCategory);

// Eliminar (desactivar) categoría por ID
router.delete('/:id', hasRole('Admin_Restaurante'), deleteCategory);

router.patch('/:id/activate', hasRole('Admin_Restaurante'), activateCategory);

export default router;