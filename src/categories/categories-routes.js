import { Router } from "express";
import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
} from "./categories-controller.js";

const router = Router();

// Obtener categorías (se puede filtrar por ?restaurante=ID)
router.get('/', getCategories);

// Crear categoría
router.post('/', createCategory);

// Actualizar categoría por ID
router.put('/:id', updateCategory);

// Eliminar (desactivar) categoría por ID
router.delete('/:id', deleteCategory);

export default router;