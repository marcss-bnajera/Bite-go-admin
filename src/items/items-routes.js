import { Router } from "express";
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

// GET - Obtener items de un pedido (Solo validamos el ID del pedido)
router.get("/:id", getItems);

router.get("/summary/:id_restaurante", getVariationsSummary);

// POST - Agregar item a un pedido con validación de body
router.post("/:id", addItemValidator, addItem);

// PUT - Actualizar un item (Validamos orderId, itemId y la nueva cantidad)
router.put("/:orderId/:itemId", updateItemValidator, updateItem);

// DELETE - Eliminar un item (Validamos IDs para el $pull y el recalculo)
router.delete("/:orderId/:itemId", deleteItemValidator, deleteItem);

export default router;