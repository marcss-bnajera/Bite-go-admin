import { Router } from "express";
import { validateJWT } from "../../middlewares/validate-jwt.js";
import { hasRole } from "../../middlewares/validate-roles.js";
import {
    addRecipeItem,
    getRecipes,
    updateRecipeItem,
    deleteRecipeItem
} from "./recipes-controller.js";

const router = Router();

// GET - Obtener receta de un producto
router.get("/:id", validateJWT, hasRole('Admin_Restaurante', 'Admin_Plataforma'), getRecipes);

// POST - Agregar ingrediente a una receta
router.post("/:id", validateJWT, hasRole('Admin_Restaurante', 'Admin_Plataforma'), addRecipeItem);

// PUT - Actualizar un ingrediente
router.put("/:productId/:recipeId", validateJWT, hasRole('Admin_Restaurante', 'Admin_Plataforma'), updateRecipeItem);

// DELETE - Eliminar un ingrediente
router.delete("/:productId/:recipeId", validateJWT, hasRole('Admin_Restaurante', 'Admin_Plataforma'), deleteRecipeItem);

export default router;
