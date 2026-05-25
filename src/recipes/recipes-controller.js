import Product from "../products/products-model.js";
import SuppliesInventory from "../suppliesInventory/suppliesInventory-model.js";

/**
 * GET - Recetas (ingredientes) de un producto, con populate del insumo
 */
export const getRecipes = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findById(id)
            .select("receta")
            .populate("receta.id_insumo", "nombre_insumo stock_actual stock_minimo");

        if (!product) return res.status(404).json({
            success: false,
            message: "Producto no encontrado"
        });

        res.status(200).json({
            success: true,
            total: product.receta.length,
            receta: product.receta
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al obtener la receta",
            error: error.message
        });
    }
};

/**
 * POST - Agregar ingrediente a una receta
 */
export const addRecipeItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { id_insumo, cantidad_requerida } = req.body;

        const insumo = await SuppliesInventory.findOne({ _id: id_insumo, activo: true });
        if (!insumo) {
            return res.status(404).json({
                success: false,
                message: "El insumo no existe en el inventario o está inactivo"
            });
        }

        const productExist = await Product.findById(id);
        if (!productExist) {
            return res.status(404).json({ success: false, message: "Producto no encontrado" });
        }

        const yaExiste = productExist.receta.some(
            (r) => r.id_insumo.toString() === id_insumo
        );
        if (yaExiste) {
            return res.status(400).json({
                success: false,
                message: `El insumo "${insumo.nombre_insumo}" ya está en la receta de este producto`
            });
        }

        const product = await Product.findByIdAndUpdate(
            id,
            { $push: { receta: { id_insumo, cantidad_requerida } } },
            { new: true, runValidators: true }
        ).populate("receta.id_insumo", "nombre_insumo stock_actual stock_minimo");

        res.status(201).json({
            success: true,
            message: "Ingrediente agregado correctamente",
            receta: product.receta
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al agregar ingrediente",
            error: error.message
        });
    }
};

/**
 * PUT - Actualizar ingrediente de una receta
 */
export const updateRecipeItem = async (req, res) => {
    try {
        const { productId, recipeId } = req.params;
        const { id_insumo, cantidad_requerida } = req.body;

        // Si se cambia el insumo, verificar que exista
        if (id_insumo) {
            const insumo = await SuppliesInventory.findOne({ _id: id_insumo, activo: true });
            if (!insumo) {
                return res.status(404).json({
                    success: false,
                    message: "El insumo no existe en el inventario o está inactivo"
                });
            }
        }

        const updateFields = {};
        if (id_insumo) updateFields["receta.$.id_insumo"] = id_insumo;
        if (cantidad_requerida !== undefined) updateFields["receta.$.cantidad_requerida"] = cantidad_requerida;

        const product = await Product.findOneAndUpdate(
            { _id: productId, "receta._id": recipeId },
            { $set: updateFields },
            { new: true }
        ).populate("receta.id_insumo", "nombre_insumo stock_actual stock_minimo");

        if (!product) return res.status(404).json({
            success: false,
            message: "Producto o ingrediente no encontrados"
        });

        res.status(200).json({
            success: true,
            message: "Ingrediente actualizado",
            receta: product.receta
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al actualizar ingrediente",
            error: error.message
        });
    }
};

/**
 * DELETE - Eliminar ingrediente de una receta
 */
export const deleteRecipeItem = async (req, res) => {
    try {
        const { productId, recipeId } = req.params;
        const product = await Product.findByIdAndUpdate(
            productId,
            { $pull: { receta: { _id: recipeId } } },
            { new: true }
        );

        if (!product) return res.status(404).json({
            success: false,
            message: "Producto no encontrado"
        });

        res.status(200).json({
            success: true,
            message: "Ingrediente eliminado correctamente"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al eliminar ingrediente",
            error: error.message
        });
    }
};
