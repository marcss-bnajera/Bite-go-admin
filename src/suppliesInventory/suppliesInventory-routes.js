import { Router } from "express";
import { hasRole } from "../../middlewares/validate-roles.js";
import {
    createInsumo,
    getInventoryByRestaurant,
    adjustStock,
    updateInsumo,
    deleteInsumo,
    getLowStockAlerts,
    activateInsumo,
    checkStockAvailability
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

// Verificar stock disponible (uso interno)
router.post("/check", async (req, res) => {
    try {
        const { items, id_restaurante, id_sucursal } = req.body;
        if (!items || !id_restaurante) {
            return res.status(400).json({ success: false, message: "Faltan items o id_restaurante" });
        }
        const faltantes = await checkStockAvailability(items, id_restaurante, id_sucursal || '');
        if (faltantes.length > 0) {
            return res.status(400).json({ success: false, message: "Stock insuficiente", faltantes });
        }
        res.status(200).json({ success: true, message: "Stock disponible" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al verificar stock" });
    }
});

// Ajustar stock con validación de ID y cantidad numérica
router.put("/adjust/:id", auth, adjustStockValidator, adjustStock);

// Editar stock_minimo y stock_actual directo
router.put("/:id", auth, updateInsumo);

// Desactivar insumo con validación de ID
router.delete("/:id", auth, deleteInsumoValidator, deleteInsumo);
router.patch("/:id/activate", auth, activateInsumo);

export default router;
