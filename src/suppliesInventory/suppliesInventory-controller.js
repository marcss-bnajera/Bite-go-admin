import SuppliesInventory from "./suppliesInventory-model.js";
import Product from "../products/products-model.js";

/**
 * POST - Crear un nuevo insumo en el inventario
 */
export const createInsumo = async (req, res) => {
    try {
        const { id_restaurante, nombre_insumo, stock_actual, stock_minimo } = req.body;
        const existente = await SuppliesInventory.findOne({
            id_restaurante,
            nombre_insumo: nombre_insumo.trim()
        });

        if (existente && !existente.activo) {
            const reactivado = await SuppliesInventory.findByIdAndUpdate(
                existente._id,
                { activo: true, stock_actual, stock_minimo },
                { new: true }
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
                message: `Ya existe un insumo activo llamado "${nombre_insumo}" en este restaurante`
            });
        }

        const insumo = await SuppliesInventory.create(req.body);
        res.status(201).json({ success: true, message: "Insumo creado correctamente", insumo });

    } catch (error) {
        res.status(500).json({ success: false, message: "Error al crear insumo", error: error.message });
    }
};

/**
 * GET - Listar todos los insumos activos de un restaurante
 */
export const getInventoryByRestaurant = async (req, res) => {
    try {
        const { id_restaurante } = req.params;
        const { activo } = req.query;
        const query = { id_restaurante };
        if (activo === 'true') query.activo = true;
        else if (activo === 'false') query.activo = false;
        const inventory = await SuppliesInventory.find(query);

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
 * PUT - Editar stock_minimo (y opcionalmente stock_actual) directo
 */
export const updateInsumo = async (req, res) => {
    try {
        const { id } = req.params;
        const { stock_actual, stock_minimo } = req.body;

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
 * Verificar si hay stock suficiente para todos los ingredientes
 */
export const checkStockAvailability = async (items, id_restaurante) => {
    const faltantes = [];

    for (const item of items) {
        const product = await Product.findById(item.id_producto).populate("receta.id_insumo");
        if (!product) continue;

        if (product.receta && product.receta.length > 0) {
            for (const ingrediente of product.receta) {
                const cantidadNecesaria = ingrediente.cantidad_requerida * item.cantidad;
                const insumoRef = ingrediente.id_insumo;

                const insumo = await SuppliesInventory.findOne({
                    _id: insumoRef._id,
                    id_restaurante,
                    activo: true
                });

                if (!insumo) {
                    faltantes.push(
                        `"${insumoRef.nombre_insumo}" (requerido para "${product.nombre}"): insumo no existe en el inventario de este restaurante`
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

                    const insumo = await SuppliesInventory.findOne({
                        id_restaurante,
                        nombre_insumo: vaf.insumo_relacionado,
                        activo: true
                    });

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
 * Reducir stock automáticamente desde una orden.
 */
export const reduceStockFromOrder = async (items, id_restaurante) => {
    const faltantes = await checkStockAvailability(items, id_restaurante);

    if (faltantes.length > 0) {
        throw new Error(
            `Stock insuficiente para completar el pedido. Ingredientes con problema:\n• ${faltantes.join("\n• ")}`
        );
    }

    try {
        for (const item of items) {
            const product = await Product.findById(item.id_producto).populate("receta.id_insumo");
            if (!product) continue;

            if (product.receta && product.receta.length > 0) {
                for (const ingrediente of product.receta) {
                    const cantidadADescontar = ingrediente.cantidad_requerida * item.cantidad;
                    await SuppliesInventory.findOneAndUpdate(
                        { _id: ingrediente.id_insumo._id, id_restaurante, activo: true },
                        { $inc: { stock_actual: -cantidadADescontar } }
                    );
                }
            }

            if (item.variaciones_elegidas && item.variaciones_elegidas.length > 0) {
                for (const vaf of item.variaciones_elegidas) {
                    if (vaf.afecta_inventario && vaf.insumo_relacionado) {
                        const extraADescontar = (vaf.cantidad_insumo || 1) * item.cantidad;
                        await SuppliesInventory.findOneAndUpdate(
                            { id_restaurante, nombre_insumo: vaf.insumo_relacionado, activo: true },
                            { $inc: { stock_actual: -extraADescontar } }
                        );
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
/**
 * Ajustar stock cuando se modifica la cantidad de un item ya existente.
 */
export const adjustStockFromItemUpdate = async (item, id_restaurante, diferenciaCantidad) => {
    if (diferenciaCantidad === 0) return { success: true };

    const product = await Product.findById(item.id_producto).populate("receta.id_insumo");
    if (!product || !product.receta || product.receta.length === 0) return { success: true };

    if (diferenciaCantidad > 0) {
        const faltantes = [];

        for (const ingrediente of product.receta) {
            const cantidadNecesaria = ingrediente.cantidad_requerida * diferenciaCantidad;
            const insumoRef = ingrediente.id_insumo;

            const insumo = await SuppliesInventory.findOne({
                _id: insumoRef._id,
                id_restaurante,
                activo: true
            });

            if (!insumo) {
                faltantes.push(
                    `"${insumoRef.nombre_insumo}" (para "${product.nombre}"): insumo no existe en el inventario de este restaurante`
                );
            } else if (insumo.stock_actual < cantidadNecesaria) {
                faltantes.push(
                    `"${insumoRef.nombre_insumo}" (para "${product.nombre}"): necesitas ${cantidadNecesaria} adicionales pero solo hay ${insumo.stock_actual}`
                );
            }
        }

        if (faltantes.length > 0) {
            throw new Error(
                `Stock insuficiente para aumentar la cantidad. Ingredientes con problema:\n• ${faltantes.join("\n• ")}`
            );
        }
    }

    // Aplicar el ajuste (negativo descuenta, positivo devuelve)
    for (const ingrediente of product.receta) {
        const ajuste = ingrediente.cantidad_requerida * diferenciaCantidad;
        await SuppliesInventory.findOneAndUpdate(
            { _id: ingrediente.id_insumo._id, id_restaurante, activo: true },
            { $inc: { stock_actual: -ajuste } }
        );
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
        res.status(500).json({ success: false, error: error.message });
    }
};