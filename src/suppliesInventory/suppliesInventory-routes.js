import { Router } from "express";
import { hasRole } from "../../middlewares/validate-roles.js";
import {
    createInsumo,
    getInventoryByRestaurant,
    adjustStock,
    updateInsumo,
    deleteInsumo,
    getLowStockAlerts,
    activateInsumo
} from "./suppliesInventory-controller.js";
import {
    createInsumoValidator,
    adjustStockValidator,
    deleteInsumoValidator
} from "../../middlewares/suppliesInventory-validators.js";

const router = Router();
const auth = [hasRole('SuperAdmin', 'Admin_Restaurante')];

// Listar inventario por restaurante (No requiere body, solo param)
router.get("/restaurant/:id_restaurante", auth, getInventoryByRestaurant);

router.get("/alerts/:id_restaurante", auth, getLowStockAlerts);

// Crear insumo con validaciones de campos obligatorios
router.post("/", auth, createInsumoValidator, createInsumo);

// Ajustar stock con validación de ID y cantidad numérica
router.put("/adjust/:id", auth, adjustStockValidator, adjustStock);

// Editar stock_minimo y stock_actual directo
router.put("/:id", auth, updateInsumo);

// Desactivar insumo con validación de ID
router.delete("/:id", auth, deleteInsumoValidator, deleteInsumo);
router.patch("/:id/activate", auth, activateInsumo);

export default router;
