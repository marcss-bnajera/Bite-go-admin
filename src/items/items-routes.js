import { Router } from "express";
import { validateJWT } from "../../middlewares/validate-jwt.js";
import { hasRole } from "../../middlewares/validate-roles.js";
import {
    addItem,
    getItems,
    updateItem,
    deleteItem
} from "./items-controller.js";

const router = Router();

// GET - Obtener items de un pedido
router.get("/:id", validateJWT, hasRole('Admin_Restaurante', 'Admin_Plataforma'), getItems);

// POST - Agregar item a un pedido
router.post("/:id", validateJWT, hasRole('Admin_Restaurante', 'Admin_Plataforma'), addItem);

// PUT - Actualizar un item
router.put("/:orderId/:itemId", validateJWT, hasRole('Admin_Restaurante', 'Admin_Plataforma'), updateItem);

// DELETE - Eliminar un item
router.delete("/:orderId/:itemId", validateJWT, hasRole('Admin_Restaurante', 'Admin_Plataforma'), deleteItem);

export default router;
