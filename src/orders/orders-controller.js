import Order from "./orders-model.js";
import Product from "../products/products-model.js";
import { validateOrderAssignments } from '../../middlewares/order-logic-validators.js';
import { reduceStockFromOrder } from '../suppliesInventory/suppliesInventory-controller.js';

/**
 * GET - Listar pedidos con paginación
 */
export const getOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, activo } = req.query;
        const safePage = Math.max(1, parseInt(page) || 1);
        const safeLimit = Math.min(Math.max(1, parseInt(limit) || 10), 100);
        const query = activo !== undefined ? { activo: activo === 'true' } : { activo: true };

        const [orders, total] = await Promise.all([
            Order.find(query)
                .skip((safePage - 1) * safeLimit)
                .limit(safeLimit)
                .sort({ createdAt: -1 })
                .populate('id_usuario_cliente', 'nombre')
                .populate('id_restaurante', 'nombre')
                .populate('id_mesero_asignado', 'nombre')
                .populate('id_repartidor_asignado', 'nombre'),
            Order.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            total,
            totalPages: Math.ceil(total / safeLimit),
            currentPage: safePage,
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
        const safePage = Math.max(1, parseInt(page) || 1);
        const safeLimit = Math.min(Math.max(1, parseInt(limit) || 10), 100);
        const query = { id_usuario_cliente: id_user, activo: true };

        const [orders, total] = await Promise.all([
            Order.find(query)
                .skip((safePage - 1) * safeLimit)
                .limit(safeLimit)
                .sort({ createdAt: -1 }),
            Order.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            total,
            totalPages: Math.ceil(total / safeLimit),
            currentPage: safePage,
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
        const safePage = Math.max(1, parseInt(page) || 1);
        const safeLimit = Math.min(Math.max(1, parseInt(limit) || 10), 100);
        const query = { id_restaurante, activo: true };

        const [orders, total] = await Promise.all([
            Order.find(query)
                .skip((safePage - 1) * safeLimit)
                .limit(safeLimit)
                .sort({ createdAt: -1 }),
            Order.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            total,
            totalPages: Math.ceil(total / safeLimit),
            currentPage: safePage,
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

export const createOrder = async (req, res) => {
    try {
        const {
            id_usuario_cliente, id_restaurante, tipo_servicio,
            id_mesero_asignado, id_repartidor_asignado, notas, items
        } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "El pedido debe tener al menos un item"
            });
        }

        // Calcular total en el servidor con precios reales
        // y validar que cada producto tenga receta definida
        const itemsCalculados = [];
        const productosSinReceta = [];
        let total = 0;

        for (const item of items) {
            const producto = await Product.findById(item.id_producto);

            if (!producto || !producto.activo) {
                return res.status(400).json({
                    success: false,
                    message: `Producto no encontrado o inactivo: ${item.id_producto}`
                });
            }

            // Advertencia: producto sin receta definida
            if (!producto.receta || producto.receta.length === 0) {
                productosSinReceta.push(producto.nombre);
            }

            total += producto.precio * item.cantidad;

            itemsCalculados.push({
                id_producto: producto._id,
                nombre_historico: producto.nombre,
                cantidad: item.cantidad,
                precio_historico: producto.precio,
                notas: item.notas || ""
            });
        }

        // Bloquear la orden si algún producto no tiene receta
        if (productosSinReceta.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Los siguientes productos no tienen receta definida y no se puede descontar inventario: ${productosSinReceta.join(", ")}. Por favor define la receta antes de crear el pedido.`
            });
        }

        const order = await Order.create({
            id_usuario_cliente,
            id_restaurante,
            tipo_servicio,
            id_mesero_asignado: id_mesero_asignado || null,
            id_repartidor_asignado: id_repartidor_asignado || null,
            notas,
            items: itemsCalculados,
            total
        });

        // Descontar inventario — si falla por stock insuficiente, revertimos la orden
        try {
            await reduceStockFromOrder(itemsCalculados, id_restaurante);
        } catch (stockError) {
            // Revertir la orden creada para mantener consistencia
            await Order.findByIdAndDelete(order._id);
            return res.status(400).json({
                success: false,
                message: stockError.message
            });
        }

        res.status(201).json({
            success: true,
            message: "Pedido creado y stock descontado correctamente",
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al crear pedido",
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
        const rolesPermitidos = ["SuperAdmin", "Admin_Restaurante", "Mesero", "Repartidor"];

        if (!rolesPermitidos.includes(req.user.rol)) {
            return res.status(403).json({
                success: false,
                message: "No tienes permisos para modificar pedidos"
            });
        }

        const { estado, tipo_servicio, id_mesero_asignado, id_repartidor_asignado, id_restaurante, notas, activo } = req.body;
        const data = { estado, tipo_servicio, id_mesero_asignado, id_repartidor_asignado, id_restaurante, notas, activo };
        Object.keys(data).forEach(k => data[k] === undefined && delete data[k]);

        if (data.tipo_servicio) {
            const orderActual = await Order.findById(id);
            if (!orderActual) {
                return res.status(404).json({ success: false, message: "Pedido no encontrado" });
            }

            const contexto = {
                tipo_servicio: data.tipo_servicio ?? orderActual.tipo_servicio,
                id_mesero_asignado: data.id_mesero_asignado ?? orderActual.id_mesero_asignado,
                id_repartidor_asignado: data.id_repartidor_asignado ?? orderActual.id_repartidor_asignado,
            };

            try {
                await validateOrderAssignments.call(contexto);
                data.id_mesero_asignado = contexto.id_mesero_asignado;
                data.id_repartidor_asignado = contexto.id_repartidor_asignado;
            } catch (validationError) {
                return res.status(400).json({
                    success: false,
                    message: validationError.message
                });
            }
        }

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

export const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findByIdAndUpdate(id, { activo: false }, { new: true });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Pedido no encontrado"
            });
        }

        res.status(200).json({
            success: true,
            message: "Pedido desactivado correctamente"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al eliminar pedido",
            error: error.message
        });
    }
};
export const activateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findByIdAndUpdate(id, { activo: true }, { new: true });
        if (!order) return res.status(404).json({ success: false, message: "Pedido no encontrado" });
        res.status(200).json({ success: true, message: "Pedido reactivado correctamente" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al reactivar", error: error.message });
    }
};