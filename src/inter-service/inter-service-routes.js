import { Router } from "express";
import { reduceStockFromOrder, adjustStockFromItemUpdate } from "../suppliesInventory/suppliesInventory-controller.js";

const router = Router();

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
