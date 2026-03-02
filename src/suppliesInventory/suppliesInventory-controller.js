import SuppliesInventory from "./suppliesInventory-model.js";
import Product from "../products/products-model.js";

export const createInsumo = async (req, res) => {
    try {
        const insumo = new SuppliesInventory(req.body);
        await insumo.save();
        res.status(201).json({ success: true, message: "Insumo creado", insumo });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getInventoryByRestaurant = async (req, res) => {
    try {
        const { id_restaurante } = req.params;
        const inventory = await SuppliesInventory.find({ id_restaurante, activo: true });
        res.status(200).json({ success: true, inventory });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};


export const adjustStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { cantidad } = req.body;
        const insumo = await SuppliesInventory.findByIdAndUpdate(
            id,
            { $inc: { stock_actual: cantidad } },
            { new: true }
        );
        if (!insumo) return res.status(404).json({ success: false, message: "No encontrado" });
        res.status(200).json({ success: true, message: "Stock actualizado", insumo });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const deleteInsumo = async (req, res) => {
    try {
        const { id } = req.params;
        const insumo = await SuppliesInventory.findByIdAndUpdate(id, { activo: false }, { new: true });
        if (!insumo) return res.status(404).json({ success: false, message: "No encontrado" });
        res.status(200).json({ success: true, message: "Insumo desactivado correctamente" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const reduceStockFromOrder = async (items, id_restaurante) => {
    try {
        for (const item of items) {
            const product = await Product.findById(item.id_producto);
            if (product && product.receta.length > 0) {
                for (const ingrediente of product.receta) {
                    const cantidadADescontar = ingrediente.cantidad_requerida * item.cantidad;
                    await SuppliesInventory.findOneAndUpdate(
                        { id_restaurante, nombre_insumo: ingrediente.nombre_insumo, activo: true },
                        { $inc: { stock_actual: -cantidadADescontar } }
                    );
                }
            }
        }
        return { success: true };
    } catch (error) {
        throw new Error("Error en actualización automática de stock");
    }
};