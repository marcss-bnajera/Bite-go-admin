import Category from "./categories-model.js";

/**
 * GET - Obtener categorías con paginación
 */
export const getCategories = async (req, res) => {
    try {
        const { page = 1, limit = 10, restaurante, activo } = req.query;
        const safePage = Math.max(1, parseInt(page) || 1);
        const safeLimit = Math.min(Math.max(1, parseInt(limit) || 10), 100);
        const query = {};
        if (activo !== undefined) query.activo = activo === 'true';

        // Admin_Restaurante solo ve su propio restaurante
        if (req.user.rol === 'Admin_Restaurante') {
            query.id_restaurante = req.user.id_restaurante;
        } else if (restaurante) {
            query.id_restaurante = restaurante;
        }

        const [categories, total] = await Promise.all([
            Category.find(query)
                .skip((safePage - 1) * safeLimit)
                .limit(safeLimit)
                .sort({ createdAt: -1 })
                .populate('id_restaurante', 'nombre'),
            Category.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            total,
            totalPages: Math.ceil(total / safeLimit),
            currentPage: safePage,
            categories
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al obtener categorías",
           
        });
    }
};

/**
 * POST - Crear nueva categoría
 */
export const createCategory = async (req, res) => {
    try {
        const data = req.body;

        // Admin_Restaurante solo puede crear en su restaurante
        if (req.user.rol === 'Admin_Restaurante') {
            data.id_restaurante = req.user.id_restaurante;
        }

        const category = new Category({ ...data });
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

        // Verificar ownership antes de actualizar
        if (req.user.rol === 'Admin_Restaurante') {
            const existing = await Category.findById(id).select('id_restaurante');
            if (!existing) return res.status(404).json({ success: false, message: "Categoría no encontrada" });

            if (existing.id_restaurante.toString() !== req.user.id_restaurante.toString()) {
                return res.status(403).json({ success: false, message: "No tienes permiso para editar categorías de otro restaurante" });
            }
        }

        const category = await Category.findByIdAndUpdate(id, data, { new: true, runValidators: true });

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
           
        });
    }
};

/**
 * DELETE - Desactivación lógica
 */
export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar ownership antes de desactivar
        if (req.user.rol === 'Admin_Restaurante') {
            const existing = await Category.findById(id).select('id_restaurante');
            if (!existing) return res.status(404).json({ success: false, message: "Categoría no encontrada" });

            if (existing.id_restaurante.toString() !== req.user.id_restaurante.toString()) {
                return res.status(403).json({ success: false, message: "No tienes permiso para eliminar categorías de otro restaurante" });
            }
        }

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
           
        });
    }
};

export const activateCategory = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar ownership antes de activar
        if (req.user.rol === 'Admin_Restaurante') {
            const existing = await Category.findById(id).select('id_restaurante');
            if (!existing) return res.status(404).json({ success: false, message: "Categoría no encontrada" });

            if (existing.id_restaurante.toString() !== req.user.id_restaurante.toString()) {
                return res.status(403).json({ success: false, message: "No tienes permiso para activar categorías de otro restaurante" });
            }
        }

        const category = await Category.findByIdAndUpdate(id, { activo: true }, { new: true });

        if (!category) return res.status(404).json({
            success: false,
            message: "Categoría no encontrada"
        });

        res.status(200).json({
            success: true,
            message: "Categoría activada correctamente",
            category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al activar la categoría",
           
        });
    }
};