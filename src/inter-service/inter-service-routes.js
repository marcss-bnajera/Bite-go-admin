import { Router } from "express";
import { reduceStockFromOrder, adjustStockFromItemUpdate, checkStockAvailability } from "../suppliesInventory/suppliesInventory-controller.js";
import { validateInterService } from "../../middlewares/validate-inter-service.js";

const router = Router();

// Todas las rutas inter-service requieren X-Internal-Secret
router.use(validateInterService);

/**
 * POST - Verificar stock disponible antes de crear pedido (comunicación inter-servicio)
 * No requiere JWT — solo accesible desde la red interna de Docker
 */
router.post("/check", async (req, res) => {
    try {
        const { items, id_restaurante, id_sucursal } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: "Se requiere un arreglo de items válido" });
        }

        if (!id_restaurante) {
            return res.status(400).json({ success: false, message: "El id_restaurante es obligatorio" });
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

/**
 * POST - Reducir inventario desde user-service (comunicación inter-servicio)
 * No requiere JWT — solo accesible desde la red interna de Docker
 */
router.post("/reduce", async (req, res) => {
    try {
        const { items, id_restaurante, id_sucursal } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Se requiere un arreglo de items válido"
            });
        }

        if (!id_restaurante) {
            return res.status(400).json({
                success: false,
                message: "El id_restaurante es obligatorio"
            });
        }

        await reduceStockFromOrder(items, id_restaurante, id_sucursal || "");

        res.status(200).json({
            success: true,
            message: "Inventario reducido correctamente"
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || "Error al reducir inventario"
        });
    }
});

/**
 * POST - Restaurar inventario al cancelar pedido desde user-service
 */
router.post("/restore", async (req, res) => {
    try {
        const { items, id_restaurante, id_sucursal } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Se requiere un arreglo de items válido"
            });
        }

        if (!id_restaurante) {
            return res.status(400).json({
                success: false,
                message: "El id_restaurante es obligatorio"
            });
        }

        for (const item of items) {
            await adjustStockFromItemUpdate(
                { id_producto: item.id_producto },
                id_restaurante,
                -item.cantidad,
                id_sucursal || ""
            );
        }

        res.status(200).json({
            success: true,
            message: "Inventario restaurado correctamente"
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || "Error al restaurar inventario"
        });
    }
});

export default router;
