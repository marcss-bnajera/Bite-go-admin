import { Router } from "express";
import { reduceStockFromOrder } from "../suppliesInventory/suppliesInventory-controller.js";

const router = Router();

/**
 * POST - Reducir inventario desde user-service (comunicación inter-servicio)
 * No requiere JWT — solo accesible desde la red interna de Docker
 */
router.post("/reduce", async (req, res) => {
    try {
        const { items, id_restaurante } = req.body;

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

        await reduceStockFromOrder(items, id_restaurante);

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

export default router;
