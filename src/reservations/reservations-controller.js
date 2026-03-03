// Importacion del modelo
import Reservation from "./reservations-model.js";

// GET - Listar reservaciones con paginacion
export const getReservations = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const query = { active: true };

        const [reservations, total] = await Promise.all([
            Reservation.find(query)
                .populate('userId', 'nombre email')
                .populate('restaurantId', 'nombre direccion')
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .sort({ reservationDate: 1 }),
            Reservation.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            reservations
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener reservaciones", error: error.message });
    }
};

// PUT - Actualizar datos de una reservacion
export const updateReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const reservation = await Reservation.findByIdAndUpdate(id, data, { new: true });

        if (!reservation) return res.status(404).json({ success: false, message: "Reservación no encontrada" });

        res.status(200).json({
            success: true,
            message: "Reservación actualizada",
            reservation
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al actualizar", error: error.message });
    }
};
export const createReservation = async (req, res) => {
    try {
        const data = req.body;

        const reservation = await Reservation.create(data);

        res.status(201).json({
            success: true,
            message: "Reservación creada",
            reservation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al crear reservación",
            error: error.message
        });
    }
};
// DELETE - Desactivar (cancelar) una reservacion
export const deleteReservation = async (req, res) => {
    try {
        const { id } = req.params;

        const reservation = await Reservation.findByIdAndUpdate(id, { active: false, status: 'Cancelled' }, { new: true });

        if (!reservation) return res.status(404).json({ success: false, message: "Reservación no encontrada" });

        res.status(200).json({
            success: true,
            message: "Reservación cancelada correctamente"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al eliminar", error: error.message });
    }
};