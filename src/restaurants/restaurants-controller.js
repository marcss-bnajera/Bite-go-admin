import Restaurant from "./restaurants-model.js";

/**
 * GET - Listar con paginación
 */
export const getRestaurants = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const query = { activo: true };

        const [restaurants, total] = await Promise.all([
            Restaurant.find(query)
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 }),
            Restaurant.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            restaurants
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener restaurantes", error: error.message });
    }
};

/**
 * POST - Restaurante
 */
export const createRestaurant = async (req, res) => {
    try {
        const restaurant = new Restaurant(req.body);
        await restaurant.save();

        res.status(201).json({
            success: true,
            message: "Restaurante creado exitosamente",
            restaurant
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al crear restaurante",
            error: error.message
        });
    }
};

/**
 * PUT - Restaurante
 */
export const updateRestaurant = async (req, res) => {
    try {
        // obtenemos el id de la URL
        const { id } = req.params;
        // Al poner ...data, estamos excluyendo los campos mesas y eventos
        // Porque no se van a actualizar
        // Por eso ponemos mesas y eventos antes de data
        const { mesas, eventos, ...data } = req.body;

        const restaurant = await Restaurant.findByIdAndUpdate(
            id,
            data,
            { new: true }
        );

        if (!restaurant) return res.status(404).json({
            success: false,
            message: "Restaurante no encontrado"
        });

        res.status(200).json({
            success: true,
            message: "Restaurante actualizado",
            restaurant
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al actualizar restaurante",
            error: error.message
        });
    }
};

/**
 * DELETE - Restaurante
 */
export const deleteRestaurant = async (req, res) => {
    try {
        const { id } = req.params;

        // Buscamos y actualizamos el estado a false
        const restaurant = await Restaurant.findByIdAndUpdate(
            id,
            // Actualizamos el estado a false
            // No eliminamos el restaurante
            { activo: false },
            { new: true }
        );

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: "Restaurante no encontrado"
            });
        }

        res.status(200).json({
            success: true,
            message: "Restaurante desactivado correctamente"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al desactivar",
            error: error.message
        });
    }
};