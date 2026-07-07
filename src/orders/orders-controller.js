import Order from "./orders-model.js";
import Product from "../products/products-model.js";
import User from "../users/users-model.js";
import { validateOrderAssignments } from '../../middlewares/order-logic-validators.js';
import { reduceStockFromOrder, adjustStockFromItemUpdate } from '../suppliesInventory/suppliesInventory-controller.js';

const attachClientNames = async (orders) => {
    const authIds = [...new Set(orders.map((o) => o.id_usuario_cliente).filter(Boolean))];
    if (authIds.length === 0) return orders;
    const users = await User.find({ auth_id: { $in: authIds } }).select("auth_id nombre");
    const map = new Map(users.map((u) => [u.auth_id, u.nombre]));
    return orders.map((o) => ({ ...o.toObject(), cliente_nombre: map.get(o.id_usuario_cliente) || null }));
};

/**
 * GET - Listar pedidos con paginación
 */
export const getOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, activo, id_sucursal } = req.query;
        const safePage = Math.max(1, parseInt(page) || 1);
        const safeLimit = Math.min(Math.max(1, parseInt(limit) || 10), 100);
        const query = activo !== undefined ? { activo: activo === 'true' } : { activo: true };
        if (id_sucursal) query.id_sucursal = id_sucursal;

        const [orders, total] = await Promise.all([
            Order.find(query)
                .skip((safePage - 1) * safeLimit)
                .limit(safeLimit)
                .sort({ createdAt: -1 })
                .populate('id_restaurante', 'nombre')
                .populate('id_mesero_asignado', 'nombre')
                .populate('id_repartidor_asignado', 'nombre'),
            Order.countDocuments(query)
        ]);

        const enriched = await attachClientNames(orders);

        res.status(200).json({
            success: true,
            total,
            totalPages: Math.ceil(total / safeLimit),
            currentPage: safePage,
            orders: enriched
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al obtener pedidos",
           
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

        const enriched = await attachClientNames([order]);

        res.status(200).json({
            success: true,
            order: enriched[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al obtener pedido",
           
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

        const enriched = await attachClientNames(orders);

        res.status(200).json({
            success: true,
            total,
            totalPages: Math.ceil(total / safeLimit),
            currentPage: safePage,
            orders: enriched
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al obtener pedidos del usuario",
           
        });
    }
};

/**
 * GET - Obtener pedidos por restaurante
 */
export const getOrdersByRestaurant = async (req, res) => {
    try {
        const { id_restaurante } = req.params;
        const { page = 1, limit = 10, id_sucursal } = req.query;
        const safePage = Math.max(1, parseInt(page) || 1);
        const safeLimit = Math.min(Math.max(1, parseInt(limit) || 10), 100);
        const query = { id_restaurante, activo: true };
        if (id_sucursal) query.id_sucursal = id_sucursal;

        const [orders, total] = await Promise.all([
            Order.find(query)
                .skip((safePage - 1) * safeLimit)
                .limit(safeLimit)
                .sort({ createdAt: -1 }),
            Order.countDocuments(query)
        ]);

        const enriched = await attachClientNames(orders);

        res.status(200).json({
            success: true,
            total,
            totalPages: Math.ceil(total / safeLimit),
            currentPage: safePage,
            orders: enriched
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al obtener pedidos del restaurante",
           
        });
    }
};

export const createOrder = async (req, res) => {
    try {
        const {
            id_usuario_cliente, id_restaurante, tipo_servicio,
            id_mesero_asignado, id_repartidor_asignado, notas, items, id_sucursal
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
            id_sucursal: id_sucursal || "",
            tipo_servicio,
            id_mesero_asignado: id_mesero_asignado || null,
            id_repartidor_asignado: id_repartidor_asignado || null,
            notas,
            items: itemsCalculados,
            total
        });

        // Descontar inventario — si falla por stock insuficiente, revertimos la orden
        try {
            await reduceStockFromOrder(itemsCalculados, id_restaurante, id_sucursal || "");
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

        // Solo permitir campos editables (prevenir mass assignment)
        const { estado, tipo_servicio, id_mesero_asignado, id_repartidor_asignado, notas } = req.body;
        const data = { estado, tipo_servicio, id_mesero_asignado, id_repartidor_asignado, notas };
        Object.keys(data).forEach(k => data[k] === undefined && delete data[k]);

        // Verificar ownership para Admin_Restaurante
        if (req.user.rol === 'Admin_Restaurante') {
            const orderActual = await Order.findById(id).select('id_restaurante');
            if (!orderActual) {
                return res.status(404).json({ success: false, message: "Pedido no encontrado" });
            }
            if (orderActual.id_restaurante.toString() !== req.user.id_restaurante.toString()) {
                return res.status(403).json({ success: false, message: "No tienes permiso para modificar pedidos de otro restaurante" });
            }
        }

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

        const order = await Order.findByIdAndUpdate(id, data, { new: true, runValidators: true });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Pedido no encontrado"
            });
        }

        // Si se canceló el pedido, restaurar stock
        if (data.estado === 'Cancelado') {
            try {
                for (const item of order.items) {
                    await adjustStockFromItemUpdate(
                        { id_producto: item.id_producto },
                        order.id_restaurante,
                        -item.cantidad,
                        order.id_sucursal || ""
                    );
                }
            } catch (stockError) {
                console.error("Advertencia: pedido cancelado pero stock no pudo restaurarse:", stockError.message);
            }
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
        });
    }
};

export const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Pedido no encontrado"
            });
        }

        // Restaurar stock si el pedido no estaba ya cancelado o entregado
        if (!['Cancelado', 'Entregado'].includes(order.estado)) {
            try {
                for (const item of order.items) {
                    await adjustStockFromItemUpdate(
                        { id_producto: item.id_producto },
                        order.id_restaurante,
                        -item.cantidad,
                        order.id_sucursal || ""
                    );
                }
            } catch (stockError) {
                console.error("Advertencia: pedido desactivado pero stock no pudo restaurarse:", stockError.message);
            }
        }

        await Order.findByIdAndUpdate(id, { activo: false, estado: 'Cancelado' });

        res.status(200).json({
            success: true,
            message: "Pedido desactivado y stock restaurado correctamente"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al eliminar pedido",
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
        res.status(500).json({ success: false, message: "Error al reactivar" });
    }
};