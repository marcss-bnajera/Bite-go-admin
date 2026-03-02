import { Router } from "express";
import {
    addRecipeItem,
    getRecipes,
    updateRecipeItem,
    deleteRecipeItem
} from "./recipes-controller.js";

const router = Router();

// GET - Obtener receta de un producto
router.get("/:id", getRecipes);

// POST - Agregar ingrediente a una receta
router.post("/:id", addRecipeItem);

// PUT - Actualizar un ingrediente
router.put("/:productId/:recipeId", updateRecipeItem);

// DELETE - Eliminar un ingrediente
router.delete("/:productId/:recipeId", deleteRecipeItem);

export default router;
