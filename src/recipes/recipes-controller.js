import Product from "../products/products-model.js";
import SuppliesInventory from "../suppliesInventory/suppliesInventory-model.js";

/**
 * GET - Recetas (ingredientes) de un producto
 */
export const getRecipes = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findById(id).select("receta");

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
           
        });
    }
};

/**
 * POST - Agregar ingrediente a una receta
 */
export const addRecipeItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_insumo, cantidad_requerida } = req.body;

        const insumo = await SuppliesInventory.findOne({ nombre_insumo, activo: true });
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
            (r) => r.nombre_insumo === nombre_insumo
        );
        if (yaExiste) {
            return res.status(400).json({
                success: false,
                message: `El insumo "${nombre_insumo}" ya está en la receta de este producto`
            });
        }

        const product = await Product.findByIdAndUpdate(
            id,
            { $push: { receta: { nombre_insumo, cantidad_requerida } } },
            { new: true, runValidators: true }
        );

        res.status(201).json({
            success: true,
            message: "Ingrediente agregado correctamente",
            receta: product.receta
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al agregar ingrediente",
           
        });
    }
};

/**
 * PUT - Actualizar ingrediente de una receta
 */
export const updateRecipeItem = async (req, res) => {
    try {
        const { productId, recipeId } = req.params;
        const { nombre_insumo, cantidad_requerida } = req.body;

        if (nombre_insumo) {
            const insumo = await SuppliesInventory.findOne({ nombre_insumo, activo: true });
            if (!insumo) {
                return res.status(404).json({
                    success: false,
                    message: "El insumo no existe en el inventario o está inactivo"
                });
            }
        }

        const updateFields = {};
        if (nombre_insumo) updateFields["receta.$.nombre_insumo"] = nombre_insumo;
        if (cantidad_requerida !== undefined) updateFields["receta.$.cantidad_requerida"] = cantidad_requerida;

        const product = await Product.findOneAndUpdate(
            { _id: productId, "receta._id": recipeId },
            { $set: updateFields },
            { new: true }
        );

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
           
        });
    }
};
