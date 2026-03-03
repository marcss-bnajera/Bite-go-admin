import { Router } from "express";
import { validateJWT } from "../../middlewares/validate-jwt.js";
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

// GET - Obtener receta de un producto
router.get("/:id", validateJWT, hasRole('Admin_Restaurante', 'Admin_Plataforma'), validateRecipeIdParam, getRecipes);

// POST - Agregar ingrediente a una receta
router.post("/:id", validateJWT, hasRole('Admin_Restaurante', 'Admin_Plataforma'), validateRecipeItemBody, addRecipeItem);

// PUT - Actualizar un ingrediente
router.put("/:productId/:recipeId", validateJWT, hasRole('Admin_Restaurante', 'Admin_Plataforma'), validateRecipeUpdateDelete, updateRecipeItem);

// DELETE - Eliminar un ingrediente
router.delete("/:productId/:recipeId", validateJWT, hasRole('Admin_Restaurante', 'Admin_Plataforma'), validateRecipeUpdateDelete, deleteRecipeItem);

export default router;
