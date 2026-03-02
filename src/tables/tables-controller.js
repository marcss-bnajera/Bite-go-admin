import Restaurant from "../restaurants/restaurants-model.js";

/**
 * GET - Mesas de restaurante
 */
export const getMesas = async (req, res) => {
    try {
        const { id } = req.params; // ID del restaurante

        // Buscamos el restaurante pero solo pedimos el campo 'mesas' para eso es select("mesas")
        const restaurant = await Restaurant.findById(id).select("mesas");

        if (!restaurant) return res.status(404).json({
            success: false,
            message: "Restaurante no encontrado"
        });

        res.status(200).json({
            success: true,
            total: restaurant.mesas.length,
            mesas: restaurant.mesas
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al obtener mesas",
            error: error.message
        });
    }
};

/**
 * POST - Mesa
 */
export const addMesa = async (req, res) => {
    try {
        const { id } = req.params;
        const restaurant = await Restaurant.findByIdAndUpdate(
            id,
            //$addToSet agrega un elemento al array si no existe para evitar duplicados
            { $addToSet: { mesas: req.body } },
            { new: true }
        );

        if (!restaurant) return res.status(404).json({
            success: false,
            message: "Restaurante no encontrado"
        });

        res.status(201).json({
            success: true,
            message: "Mesa agregada correctamente",
            mesas: restaurant.mesas
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al agregar mesa",
            error: error.message
        });
    }
};

/**
 * PUT - Mesa
 */
export const updateMesa = async (req, res) => {
    try {
        const { restId, mesaId } = req.params;
        const data = req.body;

        const restaurant = await Restaurant.findOneAndUpdate(
            { _id: restId, "mesas._id": mesaId },
            // El $ mantiene el ID original
            //...data mantiene el resto de los datos
            //_id: mesaId mantiene el ID original
            { $set: { "mesas.$": { ...data, _id: mesaId } } },
            { new: true }
        );

        if (!restaurant) return res.status(404).json({
            success: false,
            message: "Restaurante o Mesa no encontratos"
        });

        res.status(200).json({
            success: true,
            message: "Mesa actualizada",
            restaurant
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al actualizar mesa",
            error: error.message
        });
    }
};

/**
 * DELETE - Mesa
 */
export const deleteMesa = async (req, res) => {
    try {
        const { restId, mesaId } = req.params;
        const restaurant = await Restaurant.findByIdAndUpdate(
            restId,
            //$pull elimina un elemento del array
            { $pull: { mesas: { _id: mesaId } } },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: "Mesa eliminada correctamente"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al eliminar mesa",
            error: error.message
        });
    }
};