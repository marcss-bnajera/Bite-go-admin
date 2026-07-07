import SuppliesInventory from "./suppliesInventory-model.js";
import Product from "../products/products-model.js";

/**
 * POST - Crear un nuevo insumo en el inventario
 */
export const createInsumo = async (req, res) => {
    try {
        if (req.user.rol === 'Admin_Restaurante') {
            req.body.id_restaurante = req.user.id_restaurante;
        }

        const { id_restaurante, nombre_insumo, stock_actual, stock_minimo, id_sucursal } = req.body;
        const query = { id_restaurante, nombre_insumo: nombre_insumo.trim() };
        if (id_sucursal) query.id_sucursal = id_sucursal;
        else query.id_sucursal = { $in: [null, ''] };
        const existente = await SuppliesInventory.findOne(query);

        if (existente && !existente.activo) {
            const reactivado = await SuppliesInventory.findByIdAndUpdate(
                existente._id,
                { activo: true, stock_actual, stock_minimo },
                { new: true, runValidators: true }
            );
            return res.status(200).json({
                success: true,
                message: `El insumo "${nombre_insumo}" existía inactivo y fue reactivado con el nuevo stock`,
                insumo: reactivado
            });
        }

        if (existente && existente.activo) {
            return res.status(400).json({
                success: false,
                message: `Ya existe un insumo activo llamado "${nombre_insumo}" en ${id_sucursal ? "esta sucursal" : "este restaurante"}`
            });
        }

        const insumo = await SuppliesInventory.create(req.body);
        res.status(201).json({ success: true, message: "Insumo creado correctamente", insumo });

    } catch (error) {
        res.status(500).json({ success: false, message: "Error al crear insumo" });
    }
};

/**
 * GET - Listar todos los insumos activos de un restaurante
 */
export const getInventoryByRestaurant = async (req, res) => {
    try {
        const { id_restaurante } = req.params;
        const { activo, id_sucursal } = req.query;
        const query = { id_restaurante };
        if (activo === 'true') query.activo = true;
        else if (activo === 'false') query.activo = false;
        if (id_sucursal) query.id_sucursal = id_sucursal;
        const inventory = await SuppliesInventory.find(query);

        res.status(200).json({
            success: true,
            count: inventory.length,
            inventory
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error interno del servidor" });
    }
};

/**
 * GET - Obtener insumos con stock bajo (Alertas)
 */
export const getLowStockAlerts = async (req, res) => {
    try {
        const { id_restaurante } = req.params;
        const { id_sucursal } = req.query;

        const query = {
            id_restaurante,
            activo: true,
            $expr: { $lte: ["$stock_actual", "$stock_minimo"] }
        };
        if (id_sucursal) query.id_sucursal = id_sucursal;

        const lowStock = await SuppliesInventory.find(query);

        res.status(200).json({
            success: true,
            message: "Reporte de existencias críticas",
            count: lowStock.length,
            alerts: lowStock
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error interno del servidor" });
    }
};

/**
 * PUT - Ajustar el stock (Suma o resta manual)
 */
export const adjustStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { cantidad, motivo } = req.body;

        if (typeof cantidad !== 'number' || isNaN(cantidad)) {
            return res.status(400).json({ success: false, message: "La cantidad debe ser un número válido" });
        }

        if (cantidad < 0) {
            const insumoActual = await SuppliesInventory.findById(id).select('stock_actual');
            if (!insumoActual) return res.status(404).json({ success: false, message: "Insumo no encontrado" });
            if (insumoActual.stock_actual + cantidad < 0) {
                return res.status(400).json({
                    success: false,
                    message: `Stock insuficiente. Stock actual: ${insumoActual.stock_actual}, intento restar: ${Math.abs(cantidad)}`
                });
            }
        }

        const insumo = await SuppliesInventory.findByIdAndUpdate(
            id,
            {
                $inc: { stock_actual: cantidad },
                $push: { historial_ajustes: { cantidad, motivo: motivo || '' } }
            },
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
        res.status(500).json({ success: false, message: "Error interno del servidor" });
    }
};

/**
 * PUT - Editar stock_minimo (y opcionalmente stock_actual) directo
 */
export const updateInsumo = async (req, res) => {
    try {
        const { id } = req.params;
        const { stock_actual, stock_minimo } = req.body;

        // Verificar ownership para Admin_Restaurante
        if (req.user.rol === 'Admin_Restaurante') {
            const insumoActual = await SuppliesInventory.findById(id).select('id_restaurante');
            if (!insumoActual) return res.status(404).json({ success: false, message: "Insumo no encontrado" });
            if (insumoActual.id_restaurante.toString() !== req.user.id_restaurante.toString()) {
                return res.status(403).json({ success: false, message: "No tienes permiso para editar insumos de otro restaurante" });
            }
        }

        const insumo = await SuppliesInventory.findByIdAndUpdate(
            id,
            { stock_actual, stock_minimo },
            { new: true, runValidators: true }
        );

        if (!insumo) {
            return res.status(404).json({ success: false, message: "Insumo no encontrado" });
        }

        res.status(200).json({ success: true, message: "Insumo actualizado", insumo });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error interno del servidor" });
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
        res.status(500).json({ success: false, message: "Error interno del servidor" });
    }
};


/**
 * Verificar si hay stock suficiente para todos los ingredientes
 */
export const checkStockAvailability = async (items, id_restaurante, id_sucursal) => {
    const faltantes = [];

    for (const item of items) {
        const product = await Product.findById(item.id_producto);
        if (!product) continue;

        if (product.receta && product.receta.length > 0) {
            for (const ingrediente of product.receta) {
                const cantidadNecesaria = ingrediente.cantidad_requerida * item.cantidad;

                const insumoQuery = {
                    nombre_insumo: ingrediente.nombre_insumo,
                    id_restaurante,
                    activo: true
                };
                if (id_sucursal) insumoQuery.id_sucursal = id_sucursal;

                const insumo = await SuppliesInventory.findOne(insumoQuery);

                if (!insumo) {
                    faltantes.push(
                        `"${ingrediente.nombre_insumo}" (requerido para "${product.nombre}"): insumo no existe en el inventario${id_sucursal ? " de esta sucursal" : ""}`
                    );
                } else if (insumo.stock_actual < cantidadNecesaria) {
                    faltantes.push(
                        `"${insumo.nombre_insumo}" (para "${product.nombre}"): necesitas ${cantidadNecesaria} pero solo hay ${insumo.stock_actual}`
                    );
                }
            }
        }

        if (item.variaciones_elegidas && item.variaciones_elegidas.length > 0) {
            for (const vaf of item.variaciones_elegidas) {
                if (vaf.afecta_inventario && vaf.insumo_relacionado) {
                    const cantidadNecesaria = (vaf.cantidad_insumo || 1) * item.cantidad;

                    const insumoQuery = {
                        id_restaurante,
                        nombre_insumo: vaf.insumo_relacionado,
                        activo: true
                    };
                    if (id_sucursal) insumoQuery.id_sucursal = id_sucursal;

                    const insumo = await SuppliesInventory.findOne(insumoQuery);

                    if (!insumo) {
                        faltantes.push(
                            `"${vaf.insumo_relacionado}" (variación "${vaf.nombre}"): insumo no existe en el inventario`
                        );
                    } else if (insumo.stock_actual < cantidadNecesaria) {
                        faltantes.push(
                            `"${vaf.insumo_relacionado}" (variación "${vaf.nombre}"): necesitas ${cantidadNecesaria} pero solo hay ${insumo.stock_actual}`
                        );
                    }
                }
            }
        }
    }

    return faltantes;
};

/**
 * Reducir stock automáticamente desde una orden (atómico).
 * Usa findOneAndUpdate con condición de stock para evitar race conditions.
 */
export const reduceStockFromOrder = async (items, id_restaurante, id_sucursal) => {
    const deducidos = [];
    const faltantes = [];

    try {
        for (const item of items) {
            const product = await Product.findById(item.id_producto);
            if (!product) continue;

            if (product.receta && product.receta.length > 0) {
                for (const ingrediente of product.receta) {
                    const cantidadADescontar = ingrediente.cantidad_requerida * item.cantidad;

                    const atomicQuery = {
                        nombre_insumo: ingrediente.nombre_insumo,
                        id_restaurante,
                        activo: true,
                        stock_actual: { $gte: cantidadADescontar }
                    };
                    if (id_sucursal) atomicQuery.id_sucursal = id_sucursal;

                    let resultado = await SuppliesInventory.findOneAndUpdate(
                        atomicQuery,
                        { $inc: { stock_actual: -cantidadADescontar } },
                        { new: true }
                    );

                    if (!resultado && id_sucursal) {
                        const rootQuery = {
                            nombre_insumo: ingrediente.nombre_insumo,
                            id_restaurante,
                            activo: true,
                            stock_actual: { $gte: cantidadADescontar }
                        };
                        resultado = await SuppliesInventory.findOneAndUpdate(
                            rootQuery,
                            { $inc: { stock_actual: -cantidadADescontar } },
                            { new: true }
                        );
                    }

                    if (!resultado) {
                        const fallbackQuery = { nombre_insumo: ingrediente.nombre_insumo, id_restaurante, activo: true };
                        const insumo = await SuppliesInventory.findOne(fallbackQuery);
                        const nombre = insumo ? insumo.nombre_insumo : ingrediente.nombre_insumo;
                        const disponible = insumo ? insumo.stock_actual : 0;
                        faltantes.push(
                            `"${nombre}" (para "${product.nombre}"): necesitas ${cantidadADescontar} pero solo hay ${disponible}`
                        );
                    } else {
                        deducidos.push({ nombre: ingrediente.nombre_insumo, id_restaurante, id_sucursal: resultado.id_sucursal, cantidad: cantidadADescontar });
                    }
                }
            }

            if (item.variaciones_elegidas && item.variaciones_elegidas.length > 0) {
                for (const vaf of item.variaciones_elegidas) {
                    if (vaf.afecta_inventario && vaf.insumo_relacionado) {
                        const extraADescontar = (vaf.cantidad_insumo || 1) * item.cantidad;

                        const atomicQuery = {
                            id_restaurante,
                            nombre_insumo: vaf.insumo_relacionado,
                            activo: true,
                            stock_actual: { $gte: extraADescontar }
                        };
                        if (id_sucursal) atomicQuery.id_sucursal = id_sucursal;

                        const resultado = await SuppliesInventory.findOneAndUpdate(
                            atomicQuery,
                            { $inc: { stock_actual: -extraADescontar } },
                            { new: true }
                        );

                        if (!resultado) {
                            faltantes.push(
                                `"${vaf.insumo_relacionado}" (variación "${vaf.nombre}"): necesitas ${extraADescontar} pero no hay stock suficiente`
                            );
                        } else {
                            deducidos.push({ nombre: vaf.insumo_relacionado, id_restaurante, id_sucursal: resultado.id_sucursal, cantidad: extraADescontar });
                        }
                    }
                }
            }
        }

        if (faltantes.length > 0) {
            for (const deduccion of deducidos) {
                const restoreQuery = { nombre_insumo: deduccion.nombre, id_restaurante: deduccion.id_restaurante, activo: true };
                if (deduccion.id_sucursal) restoreQuery.id_sucursal = deduccion.id_sucursal;
                await SuppliesInventory.findOneAndUpdate(
                    restoreQuery,
                    { $inc: { stock_actual: deduccion.cantidad } }
                );
            }
            throw new Error(
                `Stock insuficiente para completar el pedido. Ingredientes con problema:\n• ${faltantes.join("\n• ")}`
            );
        }

        return { success: true };
    } catch (error) {
        if (error.message.startsWith("Stock insuficiente")) throw error;
        console.error("Error actualizando stock:", error.message);
        throw new Error("Error en actualización automática de stock");
    }
};
/**
 * Ajustar stock cuando se modifica la cantidad de un item ya existente (atómico).
 */
export const adjustStockFromItemUpdate = async (item, id_restaurante, diferenciaCantidad, id_sucursal) => {
    if (diferenciaCantidad === 0) return { success: true };

    const product = await Product.findById(item.id_producto);
    if (!product || !product.receta || product.receta.length === 0) return { success: true };

    if (diferenciaCantidad > 0) {
        const deducidos = [];
        const faltantes = [];

        for (const ingrediente of product.receta) {
            const cantidadNecesaria = ingrediente.cantidad_requerida * diferenciaCantidad;
            const atomicQuery = {
                nombre_insumo: ingrediente.nombre_insumo,
                id_restaurante,
                activo: true,
                stock_actual: { $gte: cantidadNecesaria }
            };
            if (id_sucursal) atomicQuery.id_sucursal = id_sucursal;

            const resultado = await SuppliesInventory.findOneAndUpdate(
                atomicQuery,
                { $inc: { stock_actual: -cantidadNecesaria } },
                { new: true }
            );

            if (resultado) {
                deducidos.push({ nombre: ingrediente.nombre_insumo, id_restaurante, id_sucursal: resultado.id_sucursal, cantidad: cantidadNecesaria });
            } else {
                const fallbackQuery = { nombre_insumo: ingrediente.nombre_insumo, id_restaurante, activo: true };
                const insumo = await SuppliesInventory.findOne(fallbackQuery);
                faltantes.push(
                    `"${ingrediente.nombre_insumo}" (para "${product.nombre}"): necesitas ${cantidadNecesaria} adicionales${insumo ? ` pero solo hay ${insumo.stock_actual}` : " — insumo no encontrado"}`
                );
            }
        }

        if (faltantes.length > 0) {
            for (const d of deducidos) {
                const restoreQuery = { nombre_insumo: d.nombre, id_restaurante: d.id_restaurante, activo: true };
                if (d.id_sucursal) restoreQuery.id_sucursal = d.id_sucursal;
                await SuppliesInventory.findOneAndUpdate(
                    restoreQuery,
                    { $inc: { stock_actual: d.cantidad } }
                );
            }
            throw new Error(
                `Stock insuficiente para aumentar la cantidad. Ingredientes con problema:\n• ${faltantes.join("\n• ")}`
            );
        }
    } else {
        for (const ingrediente of product.receta) {
            const cantidadDevolver = ingrediente.cantidad_requerida * Math.abs(diferenciaCantidad);
            const restoreQuery = { nombre_insumo: ingrediente.nombre_insumo, id_restaurante, activo: true };
            if (id_sucursal) restoreQuery.id_sucursal = id_sucursal;
            await SuppliesInventory.findOneAndUpdate(
                restoreQuery,
                { $inc: { stock_actual: cantidadDevolver } }
            );
        }
    }

    return { success: true };
};

export const activateInsumo = async (req, res) => {
    try {
        const { id } = req.params;
        const insumo = await SuppliesInventory.findByIdAndUpdate(id, { activo: true }, { new: true });
        if (!insumo) return res.status(404).json({ success: false, message: "Insumo no encontrado" });
        res.status(200).json({ success: true, message: "Insumo reactivado correctamente", insumo });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error interno del servidor" });
    }
};