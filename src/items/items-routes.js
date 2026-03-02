import { Router } from "express";
import {
    addItem,
    getItems,
    updateItem,
    deleteItem
} from "./items-controller.js";

const router = Router();

// GET - Obtener items de un pedido
router.get("/:id", getItems);

// POST - Agregar item a un pedido
router.post("/:id", addItem);

// PUT - Actualizar un item
router.put("/:orderId/:itemId", updateItem);

// DELETE - Eliminar un item
router.delete("/:orderId/:itemId", deleteItem);

export default router;
