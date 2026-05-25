import Reservation from "./reservations-model.js";
import Restaurant from "../restaurants/restaurants-model.js";

// Ventana de tiempo que bloquea una mesa por reserva (en milisegundos)
const RESERVATION_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 horas

/**
 * Validar mesa y solapamiento de horario
 */
const validateTableAndOverlap = async ({ restaurantId, tableId, reservationDate, peopleCount, excludeReservationId = null }) => {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant || !restaurant.activo) {
        throw new Error("El restaurante no existe o está inactivo");
    }

    const mesa = restaurant.mesas.id(tableId);
    if (!mesa) {
        throw new Error("La mesa seleccionada no existe en este restaurante");
    }

    if (peopleCount > mesa.capacidad) {
        throw new Error(
            `La mesa #${mesa.numero} tiene capacidad para ${mesa.capacidad} persona(s), pero se solicitaron ${peopleCount}`
        );
    }

    if (mesa.estado === "Mantenimiento") {
        throw new Error(`La mesa #${mesa.numero} está en mantenimiento y no puede reservarse`);
    }

    const fechaReserva = new Date(reservationDate);
    const ventanaInicio = new Date(fechaReserva.getTime() - RESERVATION_WINDOW_MS);
    const ventanaFin = new Date(fechaReserva.getTime() + RESERVATION_WINDOW_MS);

    const query = {
        restaurantId,
        tableId,
        active: true,
        status: { $in: ["Confirmed", "Attended"] },
        reservationDate: { $gte: ventanaInicio, $lte: ventanaFin }
    };

    // Al actualizar excluimos la propia reserva del chequeo
    if (excludeReservationId) {
        query._id = { $ne: excludeReservationId };
    }

    const solapamiento = await Reservation.findOne(query);
    if (solapamiento) {
        const horaOcupada = new Date(solapamiento.reservationDate).toLocaleString("es-GT", {
            dateStyle: "short",
            timeStyle: "short"
        });
        throw new Error(
            `La mesa #${mesa.numero} ya tiene una reserva confirmada alrededor de las ${horaOcupada}. La ventana de bloqueo es de 2 horas antes y después de cada reserva.`
        );
    }

    return { mesa };
};

// GET - Listar reservaciones con paginacion
export const getReservations = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const safePage = Math.max(1, parseInt(page) || 1);
        const safeLimit = Math.min(Math.max(1, parseInt(limit) || 10), 100);
        const query = {};

        const [reservations, total] = await Promise.all([
            Reservation.find(query)
                .populate("userId", "nombre email")
                .populate("restaurantId", "nombre direccion mesas")
                .skip((safePage - 1) * safeLimit)
                .limit(safeLimit)
                .sort({ reservationDate: 1 }),
            Reservation.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            total,
            totalPages: Math.ceil(total / safeLimit),
            currentPage: safePage,
            reservations
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener reservaciones", error: error.message });
    }
};

// POST - Crear reservacion con validacion de capacidad y solapamiento
export const createReservation = async (req, res) => {
    try {
        const { restaurantId, tableId, reservationDate, peopleCount } = req.body;

        // Validar mesa y solapamiento
        try {
            await validateTableAndOverlap({ restaurantId, tableId, reservationDate, peopleCount });
        } catch (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError.message
            });
        }

        const reservation = await Reservation.create(req.body);

        res.status(201).json({
            success: true,
            message: "Reservación creada correctamente",
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

// PUT - Actualizar reservacion con validacion de capacidad y solapamiento
export const updateReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const rolesPermitidos = ["SuperAdmin", "Admin_Restaurante", "Mesero"];

        if (!rolesPermitidos.includes(req.user.rol)) {
            return res.status(403).json({
                success: false,
                message: "No tienes permisos para modificar reservaciones"
            });
        }

        const reservaActual = await Reservation.findById(id);
        if (!reservaActual) {
            return res.status(404).json({ success: false, message: "Reservación no encontrada" });
        }

        const data = req.body;

        const necesitaValidacion = data.reservationDate || data.tableId || data.peopleCount || data.restaurantId;

        if (necesitaValidacion) {
            const contexto = {
                restaurantId: data.restaurantId ?? reservaActual.restaurantId,
                tableId: data.tableId ?? reservaActual.tableId,
                reservationDate: data.reservationDate ?? reservaActual.reservationDate,
                peopleCount: data.peopleCount ?? reservaActual.peopleCount,
                excludeReservationId: id
            };

            try {
                await validateTableAndOverlap(contexto);
            } catch (validationError) {
                return res.status(400).json({
                    success: false,
                    message: validationError.message
                });
            }
        }

        const reservation = await Reservation.findByIdAndUpdate(id, data, { new: true });

        res.status(200).json({
            success: true,
            message: "Reservación actualizada correctamente",
            reservation
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al actualizar", error: error.message });
    }
};

// DELETE - Cancelar una reservacion
export const deleteReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const rolesPermitidos = ["SuperAdmin", "Admin_Restaurante", "Mesero"];

        if (!rolesPermitidos.includes(req.user.rol)) {
            return res.status(403).json({
                success: false,
                message: "No tienes permisos para cancelar reservaciones"
            });
        }

        const reservation = await Reservation.findByIdAndUpdate(
            id,
            { active: false, status: "Cancelled" },
            { new: true }
        );

        if (!reservation) return res.status(404).json({ success: false, message: "Reservación no encontrada" });

        res.status(200).json({
            success: true,
            message: "Reservación cancelada correctamente"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al cancelar", error: error.message });
    }
};