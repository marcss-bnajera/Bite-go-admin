import SuppliesInventory from "./suppliesInventory-model.js";
import Product from "../products/products-model.js";

/**
 * POST - Crear un nuevo insumo en el inventario
 */
export const createInsumo = async (req, res) => {
    try {
        const insumo = new SuppliesInventory(req.body);
        await insumo.save();
        res.status(201).json({
            success: true,
            message: "Insumo creado exitosamente",
            insumo
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Este insumo ya existe para este restaurante"
            });
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * GET - Listar todos los insumos activos de un restaurante
 */
export const getInventoryByRestaurant = async (req, res) => {
    try {
        const { id_restaurante } = req.params;
        const inventory = await SuppliesInventory.find({ id_restaurante, activo: true });

        res.status(200).json({
            success: true,
            count: inventory.length,
            inventory
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * GET - Obtener insumos con stock bajo (Alertas)
 */
export const getLowStockAlerts = async (req, res) => {
    try {
        const { id_restaurante } = req.params;

        // Buscamos donde stock_actual <= stock_minimo
        const lowStock = await SuppliesInventory.find({
            id_restaurante,
            activo: true,
            $expr: { $lte: ["$stock_actual", "$stock_minimo"] }
        });

        res.status(200).json({
            success: true,
            message: "Reporte de existencias críticas",
            count: lowStock.length,
            alerts: lowStock
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * PUT - Ajustar el stock (Suma o resta manual)
 */
export const adjustStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { cantidad } = req.body; // Puede ser positivo (compra) o negativo (merma)

        const insumo = await SuppliesInventory.findByIdAndUpdate(
            id,
            { $inc: { stock_actual: cantidad } },
            { new: true, runValidators: true }
        );

        if (!insumo) {
            return res.status(404).json({ success: false, message: "Insumo no encontrado" });
        }

        res.status(200).json({
            success: true,
            message: "Stock actualizado correctamente",
            insumo
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * DELETE - Desactivación lógica (Soft Delete)
 */
export const deleteInsumo = async (req, res) => {
    try {
        const { id } = req.params;
        const insumo = await SuppliesInventory.findByIdAndUpdate(
            id,
            { activo: false },
            { new: true }
        );

        if (!insumo) {
            return res.status(404).json({ success: false, message: "Insumo no encontrado" });
        }

        res.status(200).json({
            success: true,
            message: "Insumo desactivado correctamente"
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};


/**
 * FUNCIÓN INTERNA - Reducir stock automáticamente desde una orden
 */
export const reduceStockFromOrder = async (items, id_restaurante) => {
    try {
        for (const item of items) {
            const product = await Product.findById(item.id_producto);

            if (product) {
                if (product.receta && product.receta.length > 0) {
                    for (const ingrediente of product.receta) {
                        const cantidadADescontar = ingrediente.cantidad_requerida * item.cantidad;
                        await SuppliesInventory.findOneAndUpdate(
                            { id_restaurante, nombre_insumo: ingrediente.nombre_insumo, activo: true },
                            { $inc: { stock_actual: -cantidadADescontar } }
                        );
                    }
                }

                if (item.variaciones_elegidas && item.variaciones_elegidas.length > 0) {
                    for (const vaf of item.variaciones_elegidas) {
                        if (vaf.afecta_inventario && vaf.insumo_relacionado) {
                            const extraADescontar = (vaf.cantidad_insumo || 1) * item.cantidad;

                            await SuppliesInventory.findOneAndUpdate(
                                {
                                    id_restaurante,
                                    nombre_insumo: vaf.insumo_relacionado,
                                    activo: true
                                },
                                { $inc: { stock_actual: -extraADescontar } }
                            );
                        }
                    }
                }
            }
        }
        return { success: true };
    } catch (error) {
        console.error("Error actualizando stock:", error.message);
        throw new Error("Error en actualización automática de stock");
    }
};