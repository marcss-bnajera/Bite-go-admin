import Reservation from "./reservations-model.js";
import Restaurant from "../restaurants/restaurants-model.js";

// Ventana de tiempo que bloquea una mesa por reserva (en milisegundos)
const RESERVATION_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 horas

/**
 * Validar mesa y solapamiento de horario
 */
const validateTableAndOverlap = async ({ id_restaurante, id_mesa, fecha_reserva, cantidad_personas, excludeReservationId = null }) => {
    const restaurant = await Restaurant.findById(id_restaurante);
    if (!restaurant || !restaurant.activo) {
        throw new Error("El restaurante no existe o está inactivo");
    }

    const mesa = restaurant.mesas.id(id_mesa);
    if (!mesa) {
        throw new Error("La mesa seleccionada no existe en este restaurante");
    }

    if (cantidad_personas > mesa.capacidad) {
        throw new Error(
            `La mesa #${mesa.numero} tiene capacidad para ${mesa.capacidad} persona(s), pero se solicitaron ${cantidad_personas}`
        );
    }

    if (mesa.estado === "Mantenimiento") {
        throw new Error(`La mesa #${mesa.numero} está en mantenimiento y no puede reservarse`);
    }

    const fecha = new Date(fecha_reserva);
    const ventanaInicio = new Date(fecha.getTime() - RESERVATION_WINDOW_MS);
    const ventanaFin = new Date(fecha.getTime() + RESERVATION_WINDOW_MS);

    const query = {
        id_restaurante,
        id_mesa,
        activo: true,
        estado: { $in: ["Confirmada", "Atendida"] },
        fecha_reserva: { $gte: ventanaInicio, $lte: ventanaFin }
    };

    if (excludeReservationId) {
        query._id = { $ne: excludeReservationId };
    }

    const solapamiento = await Reservation.findOne(query);
    if (solapamiento) {
        const horaOcupada = new Date(solapamiento.fecha_reserva).toLocaleString("es-GT", {
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
                .populate("id_usuario", "nombre email")
                .populate("id_restaurante", "nombre direccion mesas")
                .skip((safePage - 1) * safeLimit)
                .limit(safeLimit)
                .sort({ fecha_reserva: 1 }),
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
        res.status(500).json({ success: false, message: "Error al obtener reservaciones" });
    }
};

// POST - Crear reservacion con validacion de capacidad y solapamiento
export const createReservation = async (req, res) => {
    try {
        const { id_restaurante, id_mesa, fecha_reserva, cantidad_personas } = req.body;

        try {
            await validateTableAndOverlap({ id_restaurante, id_mesa, fecha_reserva, cantidad_personas });
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

        // Verificar ownership para Admin_Restaurante
        if (req.user.rol === 'Admin_Restaurante') {
            if (reservaActual.id_restaurante.toString() !== req.user.id_restaurante.toString()) {
                return res.status(403).json({ success: false, message: "No tienes permiso para modificar reservaciones de otro restaurante" });
            }
        }

        // Solo permitir campos editables (prevenir mass assignment)
        const { fecha_reserva, cantidad_personas, estado } = req.body;
        const data = { fecha_reserva, cantidad_personas, estado };
        Object.keys(data).forEach(k => data[k] === undefined && delete data[k]);

        const necesitaValidacion = data.fecha_reserva || data.cantidad_personas;

        if (necesitaValidacion) {
            const contexto = {
                id_restaurante: reservaActual.id_restaurante,
                id_mesa: reservaActual.id_mesa,
                fecha_reserva: data.fecha_reserva ?? reservaActual.fecha_reserva,
                cantidad_personas: data.cantidad_personas ?? reservaActual.cantidad_personas,
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

        const reservation = await Reservation.findByIdAndUpdate(id, data, { new: true, runValidators: true });

        res.status(200).json({
            success: true,
            message: "Reservación actualizada correctamente",
            reservation
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al actualizar" });
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
            { activo: false, estado: "Cancelada" },
            { new: true }
        );

        if (!reservation) return res.status(404).json({ success: false, message: "Reservación no encontrada" });

        res.status(200).json({
            success: true,
            message: "Reservación cancelada correctamente"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al cancelar" });
    }
};