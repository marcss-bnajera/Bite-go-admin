import Order from "../orders/orders-model.js";
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
        res.status(500).json({ success: false, message: "Error al obtener items", error: error.message });
    }
};

/**
 * POST - Agregar Item a un pedido
 */
export const addItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { precio_historico, cantidad } = req.body;

        const precio = Number(precio_historico);
        const cant = Number(cantidad);

        const montoASumar = precio * cant;

        const order = await Order.findByIdAndUpdate(
            id,
            {
                $push: { items: req.body },
                $inc: { total: montoASumar }
            },
            { new: true, runValidators: true }
        );

        if (!order) return res.status(404).json({ success: false, message: "Pedido no encontrado" });

        res.status(201).json({
            success: true,
            message: "Item agregado correctamente",
            totalActual: order.total, // Verifica este valor en la respuesta
            items: order.items
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al agregar item", error: error.message });
    }
};

/**
 * PUT - Actualizar cantidad o notas de un item y recalcular el TOTAL
 */
export const updateItem = async (req, res) => {
    try {
        const { orderId, itemId } = req.params;
        const { cantidad, notas } = req.body;

        const orderBefore = await Order.findOne(
            { _id: orderId, "items._id": itemId },
            { "items.$": 1, total: 1 }
        );

        if (!orderBefore) return res.status(404).json({ message: "Pedido o Item no encontrado" });

        const itemOriginal = orderBefore.items[0];
        const diferenciaCantidad = cantidad - itemOriginal.cantidad;
        const ajusteDinero = diferenciaCantidad * itemOriginal.precio_historico;

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
            message: "Item actualizado y total recalculado",
            total: orderUpdated.total,
            order: orderUpdated
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * DELETE - Eliminar Item y restar del TOTAL
 */
export const deleteItem = async (req, res) => {
    try {
        const { orderId, itemId } = req.params;

        const orderInfo = await Order.findOne({ _id: orderId, "items._id": itemId }, { "items.$": 1 });

        if (!orderInfo) return res.status(404).json({ success: false, message: "Item no encontrado" });

        const itemARemover = orderInfo.items[0];
        const montoARestar = (itemARemover.precio_historico * itemARemover.cantidad) * -1;

        const order = await Order.findByIdAndUpdate(
            orderId,
            {
                $pull: { items: { _id: itemId } },
                $inc: { total: montoARestar }
            },
            { new: true }
        );

        res.status(200).json({ success: true, message: "Item eliminado", total: order.total });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};