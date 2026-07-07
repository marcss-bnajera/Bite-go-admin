import { Router } from "express";
import { hasRole } from "../../middlewares/validate-roles.js";
import {
    addRecipeItem,
    getRecipes,
    updateRecipeItem,
    deleteRecipeItem
} from "./recipes-controller.js";
import {
    validateRecipeIdParam,
    validateRecipeItemBody,
    validateRecipeUpdateDelete
} from "../../middlewares/recipes-validator.js";

const router = Router();
const adminRoles = hasRole('Admin_Restaurante', 'SuperAdmin');

// GET - Obtener receta de un producto
router.get("/:id", adminRoles, validateRecipeIdParam, getRecipes);

// POST - Agregar ingrediente a una receta
router.post("/:id", adminRoles, validateRecipeItemBody, addRecipeItem);

// PUT - Actualizar un ingrediente
router.put("/:productId/:recipeId", adminRoles, validateRecipeUpdateDelete, updateRecipeItem);

// DELETE - Eliminar un ingrediente
router.delete("/:productId/:recipeId", adminRoles, validateRecipeUpdateDelete, deleteRecipeItem);

export default router;
