import { Router } from "express";
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
const adminRoles = hasRole('Admin_Restaurante', 'SuperAdmin');

// GET - Obtener items de un pedido
router.get("/:id", adminRoles, getItems);

// GET - Obtener resumen de variaciones por restaurante
router.get("/summary/:id_restaurante", adminRoles, getVariationsSummary);

// POST - Agregar item a un pedido con validación de body
router.post("/:id", adminRoles, addItemValidator, addItem);

// PUT - Actualizar un item (Validamos orderId, itemId y la nueva cantidad)
router.put("/:orderId/:itemId", adminRoles, updateItemValidator, updateItem);

// DELETE - Eliminar un item (Validamos IDs para el $pull y el recalculo)
router.delete("/:orderId/:itemId", adminRoles, deleteItemValidator, deleteItem);

export default router;