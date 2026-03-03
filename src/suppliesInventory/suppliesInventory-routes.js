import { Router } from "express";
import {
    createInsumo,
    getInventoryByRestaurant,
    adjustStock,
    deleteInsumo,
    getLowStockAlerts
} from "./suppliesInventory-controller.js";
import {
    createInsumoValidator,
    adjustStockValidator,
    deleteInsumoValidator
} from "../../middlewares/suppliesInventory-validators.js";

const router = Router();

// Listar inventario por restaurante (No requiere body, solo param)
router.get("/restaurant/:id_restaurante", getInventoryByRestaurant);

router.get("/alerts/:id_restaurante", getLowStockAlerts);

// Crear insumo con validaciones de campos obligatorios
router.post("/", createInsumoValidator, createInsumo);

// Ajustar stock con validación de ID y cantidad numérica
router.put("/adjust/:id", adjustStockValidator, adjustStock);

// Desactivar insumo con validación de ID
router.delete("/:id", deleteInsumoValidator, deleteInsumo);

export default router;