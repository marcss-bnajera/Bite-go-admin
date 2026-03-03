import { Router } from "express";
import { validateJWT } from "../../middlewares/validate-jwt.js";
import { hasRole } from "../../middlewares/validate-roles.js";
import {
    addItem,
    getItems,
    updateItem,
    deleteItem,
    getVariationsSummary
} from "./items-controller.js";
import {
    addItemValidator,
    updateItemValidator,
    deleteItemValidator
} from "../../middlewares/items-validators.js";

const router = Router();

// GET - Obtener items de un pedido
router.get("/:id", [validateJWT, hasRole('Admin_Restaurante', 'Admin_Plataforma')], getItems);

// GET - Obtener resumen de variaciones por restaurante
router.get("/summary/:id_restaurante", [validateJWT, hasRole('Admin_Restaurante', 'Admin_Plataforma')], getVariationsSummary);

// POST - Agregar item a un pedido con validación de body
router.post("/:id", [validateJWT, hasRole('Admin_Restaurante', 'Admin_Plataforma'), addItemValidator], addItem);

// PUT - Actualizar un item (Validamos orderId, itemId y la nueva cantidad)
router.put("/:orderId/:itemId", [validateJWT, hasRole('Admin_Restaurante', 'Admin_Plataforma'), updateItemValidator], updateItem);

// DELETE - Eliminar un item (Validamos IDs para el $pull y el recalculo)
router.delete("/:orderId/:itemId", [validateJWT, hasRole('Admin_Restaurante', 'Admin_Plataforma'), deleteItemValidator], deleteItem);

export default router;