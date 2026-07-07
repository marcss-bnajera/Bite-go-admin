import Order from "../orders/orders-model.js";
import { reduceStockFromOrder, adjustStockFromItemUpdate } from "../suppliesInventory/suppliesInventory-controller.js";

/**
 * GET - Obtener items de un pedido
 */
export const getItems = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id).select("items");

        if (!order) return res.status(404).json({
            success: false,
            message: "Pedido no encontrado"
        });

        res.status(200).json({
            success: true,
            total: order.items.length,
            items: order.items
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener items" });
    }
};

/**
 * GET - Resumen de variaciones solicitadas en órdenes pendientes
 */
export const getVariationsSummary = async (req, res) => {
    try {
        const { id_restaurante } = req.params;

        const orders = await Order.find({
            id_restaurante,
            estado: { $in: ['Pendiente', 'Preparacion'] }
        }).select("items.variaciones_elegidas items.nombre_historico");

        const resumen = orders.flatMap(order =>
            order.items.flatMap(item =>
                item.variaciones_elegidas.map(v => ({
                    producto: item.nombre_historico,
                    variacion: v.nombre,
                    notas: item.notas
                }))
            )
        );

        res.status(200).json({ success: true, data: resumen });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error interno del servidor" });
    }
};

/**
 * POST - Agregar Item a un pedido
 */
export const addItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { precio_historico, cantidad, variaciones_elegidas } = req.body;

        const precioBase = Number(precio_historico);
        const cant = Number(cantidad);

        let precioExtra = 0;
        if (variaciones_elegidas && Array.isArray(variaciones_elegidas)) {
            precioExtra = variaciones_elegidas.reduce((acc, vario) => {
                return acc + (Number(vario.precio_adicional) || 0);
            }, 0);
        }

        const montoASumar = (precioBase + precioExtra) * cant;

        const order = await Order.findByIdAndUpdate(
            id,
            {
                $push: { items: req.body },
                $inc: { total: montoASumar }
            },
            { new: true, runValidators: true }
        );

        if (!order) return res.status(404).json({ success: false, message: "Pedido no encontrado" });

        await reduceStockFromOrder([req.body], order.id_restaurante);

        res.status(201).json({
            success: true,
            message: "Item agregado e inventario descontado",
            totalActual: order.total,
            items: order.items
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al agregar item" });
    }
};

/**
 * PUT - Actualizar cantidad o notas de un item
 */
export const updateItem = async (req, res) => {
    try {
        const { orderId, itemId } = req.params;
        const { cantidad, notas } = req.body;

        const orderBefore = await Order.findOne(
            { _id: orderId, "items._id": itemId },
            { "items.$": 1, total: 1, id_restaurante: 1 }
        );

        if (!orderBefore) return res.status(404).json({ success: false, message: "Pedido o Item no encontrado" });

        const itemOriginal = orderBefore.items[0];
        const diferenciaCantidad = cantidad - itemOriginal.cantidad;

        try {
            await adjustStockFromItemUpdate(
                { id_producto: itemOriginal.id_producto },
                orderBefore.id_restaurante,
                diferenciaCantidad
            );
        } catch (stockError) {
            return res.status(400).json({
                success: false,
                message: stockError.message
            });
        }

        let precioExtra = 0;
        if (itemOriginal.variaciones_elegidas && Array.isArray(itemOriginal.variaciones_elegidas)) {
            precioExtra = itemOriginal.variaciones_elegidas.reduce((acc, vario) => {
                return acc + (Number(vario.precio_adicional) || 0);
            }, 0);
        }

        const ajusteDinero = diferenciaCantidad * (itemOriginal.precio_historico + precioExtra);

        const orderUpdated = await Order.findOneAndUpdate(
            { _id: orderId, "items._id": itemId },
            {
                $set: {
                    "items.$.cantidad": cantidad,
                    "items.$.notas": notas
                },
                $inc: { total: ajusteDinero }
            },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: diferenciaCantidad === 0
                ? "Notas del item actualizadas"
                : `Item actualizado, total e inventario ajustados`,
            total: orderUpdated.total,
            order: orderUpdated
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error interno del servidor" });
    }
};

/**
 * DELETE - Eliminar Item
 */
export const deleteItem = async (req, res) => {
    try {
        const { orderId, itemId } = req.params;

        const orderInfo = await Order.findOne(
            { _id: orderId, "items._id": itemId },
            { "items.$": 1, id_restaurante: 1 }
        );

        if (!orderInfo) return res.status(404).json({ success: false, message: "Item no encontrado" });

        const itemARemover = orderInfo.items[0];

        try {
            await adjustStockFromItemUpdate(
                { id_producto: itemARemover.id_producto },
                orderInfo.id_restaurante,
                -itemARemover.cantidad
            );
        } catch (stockError) {
            console.error("Advertencia: item eliminado pero stock no pudo devolverse:", stockError.message);
        }

        // Calcular monto a restar del total
        let precioExtra = 0;
        if (itemARemover.variaciones_elegidas && Array.isArray(itemARemover.variaciones_elegidas)) {
            precioExtra = itemARemover.variaciones_elegidas.reduce((acc, vario) => {
                return acc + (Number(vario.precio_adicional) || 0);
            }, 0);
        }

        const montoARestar = ((itemARemover.precio_historico + precioExtra) * itemARemover.cantidad) * -1;

        const order = await Order.findByIdAndUpdate(
            orderId,
            {
                $pull: { items: { _id: itemId } },
                $inc: { total: montoARestar }
            },
            { new: true }
        );

        if (!order) return res.status(404).json({ success: false, message: "Pedido no encontrado" });

        res.status(200).json({
            success: true,
            message: "Item eliminado e ingredientes devueltos al inventario",
            total: order.total
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error interno del servidor" });
    }
};