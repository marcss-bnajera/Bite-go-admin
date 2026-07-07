import Reservation from "./reservations-model.js";
import Restaurant from "../restaurants/restaurants-model.js";
import User from "../users/users-model.js";

const attachClientNames = async (reservations) => {
    const authIds = [...new Set(reservations.map((r) => r.id_usuario).filter(Boolean))];
    if (authIds.length === 0) return reservations;
    const users = await User.find({ auth_id: { $in: authIds } }).select("auth_id nombre email");
    const map = new Map(users.map((u) => [u.auth_id, { _id: u.auth_id, nombre: u.nombre, email: u.email }]));
    return reservations.map((r) => ({ ...r.toObject(), userId: map.get(r.id_usuario) || null }));
};

// Ventana de tiempo que bloquea una mesa por reserva (en milisegundos)
const RESERVATION_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 horas

const findMesa = (restaurant, id_sucursal, id_mesa) => {
    if (id_sucursal) {
        const sucursal = restaurant.sucursales.id(id_sucursal);
        if (!sucursal) return null;
        return sucursal.mesas.id(id_mesa);
    }
    return restaurant.mesas.id(id_mesa);
};

/**
 * Validar mesa y solapamiento de horario
 */
const validateTableAndOverlap = async ({ id_restaurante, id_mesa, fecha_reserva, cantidad_personas, id_sucursal, excludeReservationId = null }) => {
    const restaurant = await Restaurant.findById(id_restaurante);
    if (!restaurant || !restaurant.activo) {
        throw new Error("El restaurante no existe o está inactivo");
    }

    const mesa = findMesa(restaurant, id_sucursal, id_mesa);
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
    let horarios = restaurant.horarios_atencion;
    if (id_sucursal && restaurant.sucursales?.length) {
        const suc = restaurant.sucursales.id(id_sucursal);
        if (suc?.horarios_atencion) horarios = suc.horarios_atencion;
    }
    if (horarios) {
        const [, cierreStr] = horarios.split(" - ");
        const [cierreH, cierreM] = cierreStr.split(":").map(Number);
        const cierreUTC_h = (cierreH + 6) % 24;
        const cierreDate = new Date(fecha);
        cierreDate.setUTCHours(cierreUTC_h, cierreM, 0, 0);
        if (cierreDate <= fecha) {
            cierreDate.setUTCDate(cierreDate.getUTCDate() + 1);
        }
        cierreDate.setUTCMinutes(cierreDate.getUTCMinutes() - 90);
        if (fecha > cierreDate) {
            throw new Error(`La reserva debe ser al menos 1.5 horas antes del cierre (${cierreStr})`);
        }
    }

    const ventanaInicio = new Date(fecha.getTime() - RESERVATION_WINDOW_MS);
    const ventanaFin = new Date(fecha.getTime() + RESERVATION_WINDOW_MS);

    const query = {
        id_restaurante,
        id_mesa,
        activo: true,
        estado: { $in: ["Confirmada", "Atendida"] },
        fecha_reserva: { $gte: ventanaInicio, $lte: ventanaFin }
    };
    if (id_sucursal) query.id_sucursal = id_sucursal;

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

// GET - Disponibilidad de mesas para una fecha/hora específica
export const getTablesAvailability = async (req, res) => {
    try {
        const { id_restaurante, fecha_reserva, id_sucursal } = req.query;

        if (!id_restaurante || !fecha_reserva) {
            return res.status(400).json({
                success: false,
                message: "Se requieren id_restaurante y fecha_reserva"
            });
        }

        const dateToCheck = new Date(fecha_reserva);
        if (isNaN(dateToCheck.getTime())) {
            return res.status(400).json({ success: false, message: "fecha_reserva no es válida" });
        }

        const restaurant = await Restaurant.findOne({ _id: id_restaurante, activo: true });
        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurante no encontrado" });
        }

        let mesasBase;
        if (id_sucursal) {
            const sucursal = restaurant.sucursales.id(id_sucursal);
            if (!sucursal) {
                return res.status(404).json({ success: false, message: "Sucursal no encontrada" });
            }
            mesasBase = sucursal.mesas;
        } else {
            mesasBase = restaurant.mesas;
        }

        const ventanaInicio = new Date(dateToCheck.getTime() - RESERVATION_WINDOW_MS);
        const ventanaFin = new Date(dateToCheck.getTime() + RESERVATION_WINDOW_MS);

        const querySolapamiento = {
            id_restaurante,
            activo: true,
            estado: { $in: ['Confirmada', 'Atendida'] },
            fecha_reserva: { $gte: ventanaInicio, $lte: ventanaFin }
        };
        if (id_sucursal) querySolapamiento.id_sucursal = id_sucursal;

        const reservasSolapadas = await Reservation.find(querySolapamiento).select('id_mesa');
        const mesasOcupadas = new Set(reservasSolapadas.map(r => String(r.id_mesa)));

        const mesas = mesasBase.map(m => ({
            _id: m._id,
            numero: m.numero,
            capacidad: m.capacidad,
            ubicacion: m.ubicacion,
            estado: m.estado,
            disponible: m.estado !== 'Mantenimiento' && !mesasOcupadas.has(String(m._id))
        }));

        const disponibles = mesas.filter(m => m.disponible).length;

        res.status(200).json({
            success: true,
            total: mesas.length,
            disponibles,
            mesas
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener disponibilidad de mesas" });
    }
};

// GET - Listar reservaciones con paginacion
export const getReservations = async (req, res) => {
    try {
        const { page = 1, limit = 10, id_sucursal } = req.query;
        const safePage = Math.max(1, parseInt(page) || 1);
        const safeLimit = Math.min(Math.max(1, parseInt(limit) || 10), 100);
        const query = {};
        if (id_sucursal) query.id_sucursal = id_sucursal;

        const [reservations, total] = await Promise.all([
            Reservation.find(query)
                .populate("id_restaurante", "nombre direccion mesas")
                .skip((safePage - 1) * safeLimit)
                .limit(safeLimit)
                .sort({ fecha_reserva: 1 }),
            Reservation.countDocuments(query)
        ]);

        const enriched = await attachClientNames(reservations);

        res.status(200).json({
            success: true,
            total,
            totalPages: Math.ceil(total / safeLimit),
            currentPage: safePage,
            reservations: enriched
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener reservaciones" });
    }
};

// POST - Crear reservacion con validacion de capacidad y solapamiento
export const createReservation = async (req, res) => {
    try {
        const { id_restaurante, id_mesa, fecha_reserva, cantidad_personas, id_sucursal } = req.body;

        try {
            await validateTableAndOverlap({ id_restaurante, id_mesa, fecha_reserva, cantidad_personas, id_sucursal });
        } catch (validationError) {
            return res.status(400).json({
                success: false,
                message: validationError.message
            });
        }

        const reservation = await Reservation.create(req.body);

        const updateQuery = id_sucursal
            ? { _id: id_restaurante, "sucursales._id": id_sucursal, "sucursales.mesas._id": id_mesa }
            : { _id: id_restaurante, "mesas._id": id_mesa };
        const updateField = id_sucursal
            ? { $set: { "sucursales.$[s].mesas.$[m].estado": "Reservada" } }
            : { $set: { "mesas.$[m].estado": "Reservada" } };
        const arrayFilters = id_sucursal
            ? [{ "s._id": id_sucursal }, { "m._id": id_mesa }]
            : [{ "m._id": id_mesa }];
        await Restaurant.updateOne(updateQuery, updateField, { arrayFilters });

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
        const rolesPermitidos = ["SuperAdmin", "Admin_Restaurante"];

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
                id_sucursal: reservaActual.id_sucursal || '',
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
        const rolesPermitidos = ["SuperAdmin", "Admin_Restaurante"];

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

        const updateQuery = reservation.id_sucursal
            ? { _id: reservation.id_restaurante, "sucursales._id": reservation.id_sucursal, "sucursales.mesas._id": reservation.id_mesa }
            : { _id: reservation.id_restaurante, "mesas._id": reservation.id_mesa };
        const updateField = reservation.id_sucursal
            ? { $set: { "sucursales.$[s].mesas.$[m].estado": "Disponible" } }
            : { $set: { "mesas.$[m].estado": "Disponible" } };
        const arrayFilters = reservation.id_sucursal
            ? [{ "s._id": reservation.id_sucursal }, { "m._id": reservation.id_mesa }]
            : [{ "m._id": reservation.id_mesa }];
        await Restaurant.updateOne(updateQuery, updateField, { arrayFilters });

        res.status(200).json({
            success: true,
            message: "Reservación cancelada correctamente"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al cancelar" });
    }
};

// PUT - Registrar asistencia (check-in)
export const checkInReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const rolesPermitidos = ["SuperAdmin", "Admin_Restaurante"];

        if (!rolesPermitidos.includes(req.user.rol)) {
            return res.status(403).json({
                success: false,
                message: "No tienes permisos para registrar asistencia"
            });
        }

        const reservation = await Reservation.findById(id);
        if (!reservation) {
            return res.status(404).json({ success: false, message: "Reservación no encontrada" });
        }

        if (reservation.estado !== "Confirmada") {
            return res.status(400).json({
                success: false,
                message: "Solo se puede registrar asistencia en reservaciones confirmadas"
            });
        }

        if (reservation.asistio) {
            return res.status(400).json({
                success: false,
                message: "La asistencia ya fue registrada"
            });
        }

        reservation.asistio = true;
        reservation.estado = 'Atendida';
        await reservation.save();

        const updateQuery = reservation.id_sucursal
            ? { _id: reservation.id_restaurante, "sucursales._id": reservation.id_sucursal, "sucursales.mesas._id": reservation.id_mesa }
            : { _id: reservation.id_restaurante, "mesas._id": reservation.id_mesa };
        const updateField = reservation.id_sucursal
            ? { $set: { "sucursales.$[s].mesas.$[m].estado": "Ocupada" } }
            : { $set: { "mesas.$[m].estado": "Ocupada" } };
        const arrayFilters = reservation.id_sucursal
            ? [{ "s._id": reservation.id_sucursal }, { "m._id": reservation.id_mesa }]
            : [{ "m._id": reservation.id_mesa }];
        await Restaurant.updateOne(updateQuery, updateField, { arrayFilters });

        res.status(200).json({
            success: true,
            message: "Asistencia registrada correctamente",
            reservation
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al registrar asistencia" });
    }
};