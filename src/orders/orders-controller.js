
import Order from "./orders-model.js";

/**
 * GET - Listar pedidos con paginación
 */
export const getOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const query = { activo: true };

        const [orders, total] = await Promise.all([
            Order.find(query)
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 }),
            Order.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al obtener pedidos",
            error: error.message
        });
    }
};

/**
 * GET - Obtener pedido por ID
 */
export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id);

        if (!order || !order.activo) {
            return res.status(404).json({
                success: false,
                message: "Pedido no encontrado"
            });
        }

        res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al obtener pedido",
            error: error.message
        });
    }
};

/**
 * GET - Obtener pedidos por usuario
 */
export const getOrdersByUser = async (req, res) => {
    try {
        const { id_user } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const query = { id_usuario_cliente: id_user, activo: true };

        const [orders, total] = await Promise.all([
            Order.find(query)
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 }),
            Order.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al obtener pedidos del usuario",
            error: error.message
        });
    }
};

/**
 * GET - Obtener pedidos por restaurante
 */
export const getOrdersByRestaurant = async (req, res) => {
    try {
        const { id_restaurante } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const query = { id_restaurante, activo: true };

        const [orders, total] = await Promise.all([
            Order.find(query)
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 }),
            Order.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            orders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al obtener pedidos del restaurante",
            error: error.message
        });
    }
};

/**
 * PUT - Actualizar un pedido 
 */
export const updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const order = await Order.findByIdAndUpdate(id, data, { new: true });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Pedido no encontrado"
            });
        }

        res.status(200).json({
            success: true,
            message: "Pedido actualizado",
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al actualizar pedido",
            error: error.message
        });
    }
};
