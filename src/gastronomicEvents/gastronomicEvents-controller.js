import Restaurant from "../restaurants/restaurants-model.js";

/**
 * GET - Eventos de restaurante
 */
export const getEventos = async (req, res) => {
    try {
        const { id } = req.params;
        // Buscamos solo la seccion de eventos para eso utilizamos select(eventos)
        const restaurant = await Restaurant.findById(id).select("eventos");

        if (!restaurant) return res.status(404).json({
            success: false,
            message: "Restaurante no encontrado"
        });

        res.status(200).json({
            success: true,
            total: restaurant.eventos.length,
            eventos: restaurant.eventos
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al obtener eventos",
            error: error.message
        });
    }
};

/**
 * POST - Evento
 */
export const addEvento = async (req, res) => {
    try {
        const { id } = req.params;
        const restaurant = await Restaurant.findByIdAndUpdate(
            id,
            //$addToSet agrega un elemento al array si no existe para evitar duplicados
            { $addToSet: { eventos: req.body } },
            { new: true }
        );

        res.status(201).json({
            success: true,
            message: "Evento agregado",
            eventos: restaurant.eventos
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al agregar evento",
            error: error.message
        });
    }
};

/**
 * PUT - Evento
 */
export const updateEvento = async (req, res) => {
    try {
        const { restId, eventoId } = req.params;
        const data = req.body;

        const restaurant = await Restaurant.findOneAndUpdate(
            // _id: restId es el ID del restaurante obtenido de la URL
            // "eventos._id": eventoId es el ID del evento obtenido de la URL
            { _id: restId, "eventos._id": eventoId },
            //$set actualiza el valor del campo
            // ...data mantiene el resto de los datos
            // _id: eventoId mantiene el ID original
            { $set: { "eventos.$": { ...data, _id: eventoId } } },
            { new: true }
        );

        if (!restaurant) return res.status(404).json({
            success: false,
            message: "No se encontró el restaurante o el evento"
        });

        res.status(200).json({
            success: true,
            message: "Evento actualizado",
            restaurant
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al actualizar evento",
            error: error.message
        });
    }
};

/**
 * DELETE - Evento
 */
export const deleteEvento = async (req, res) => {
    try {
        const { restId, eventoId } = req.params;
        await Restaurant.findByIdAndUpdate(
            restId,
            //$pull elimina un elemento del array
            { $pull: { eventos: { _id: eventoId } } },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: "Evento eliminado"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al eliminar evento",
            error: error.message
        });
    }
};