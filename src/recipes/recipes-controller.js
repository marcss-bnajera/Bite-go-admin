import Product from "../products/products-model.js";

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
        const product = await Product.findByIdAndUpdate(
            id,
            { $push: { receta: req.body } },
            { new: true, runValidators: true }
        );

        if (!product) return res.status(404).json({
            success: false,
            message: "Producto no encontrado"
        });

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
        const data = req.body;

        const product = await Product.findOneAndUpdate(
            { _id: productId, "receta._id": recipeId },
            { $set: { "receta.$": { ...data, _id: recipeId } } },
            { new: true }
        );

        if (!product) return res.status(404).json({
            success: false,
            message: "Producto o Ingrediente no encontrados"
        });

        res.status(200).json({
            success: true,
            message: "Ingrediente actualizado",
            product
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
