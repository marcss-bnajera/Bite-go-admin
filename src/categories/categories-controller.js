import Category from "./categories-model.js";

/**
 * GET - Obtener categorías con paginación
 */
export const getCategories = async (req, res) => {
    try {
        const { page = 1, limit = 10, restaurante } = req.query;
        const query = { activo: true };

        if (restaurante) query.id_restaurante = restaurante;

        const [categories, total] = await Promise.all([
            Category.find(query)
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 })
                .populate('id_restaurante', 'nombre'),
            Category.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            categories
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al obtener categorías",
            error: error.message
        });
    }
};

/**
 * POST - Crear nueva categoría
 */
export const createCategory = async (req, res) => {
    try {
        const data = req.body;

        const category = new Category({
            ...data
        });

        await category.save();

        res.status(201).json({
            success: true,
            message: "Categoría creada exitosamente",
            category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al crear la categoría",
            error: error.message
        });
    }
};

/**
 * PUT - Actualizar categoría
 */
export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const category = await Category.findByIdAndUpdate(id, data, { new: true });

        if (!category) return res.status(404).json({
            success: false,
            message: "Categoría no encontrada"
        });

        res.status(200).json({
            success: true,
            message: "Categoría actualizada correctamente",
            category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al actualizar la categoría",
            error: error.message
        });
    }
};

/**
 * DELETE - Desactivación lógica
 */
export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findByIdAndUpdate(id, { activo: false }, { new: true });

        if (!category) return res.status(404).json({
            success: false,
            message: "Categoría no encontrada"
        });

        res.status(200).json({
            success: true,
            message: "Categoría desactivada correctamente"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al eliminar la categoría",
            error: error.message
        });
    }
};