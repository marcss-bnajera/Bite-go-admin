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
           
        });
    }
};

/**
 * POST - Evento
 */
export const addEvento = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, fechas, servicios } = req.body;

        if (!fechas || !Array.isArray(fechas) || fechas.length === 0) {
            return res.status(400).json({ success: false, message: "Debes agregar al menos una fecha" });
        }

        const ahora = new Date();
        const fechasInvalidas = fechas.filter(f => new Date(f) < ahora);
        if (fechasInvalidas.length > 0) {
            return res.status(400).json({ success: false, message: "Las fechas del evento deben ser en el futuro" });
        }

        const restaurant = await Restaurant.findByIdAndUpdate(
            id,
            { $addToSet: { eventos: { nombre, descripcion, fechas, servicios } } },
            { new: true }
        );

        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurante no encontrado" });
        }

        res.status(201).json({
            success: true,
            message: "Evento agregado",
            eventos: restaurant.eventos
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al agregar evento",
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
        const nuevoRestId = data.id_restaurante; // El nuevo restaurante seleccionado

        // Admin_Restaurante no puede mover un evento a otro restaurante
        if (req.user.rol === 'Admin_Restaurante' && nuevoRestId && nuevoRestId.toString() !== restId.toString()) {
            return res.status(403).json({
                success: false,
                message: "No tienes permiso para mover eventos a otro restaurante"
            });
        }

        const restauranteOrigen = await Restaurant.findById(restId);
        if (!restauranteOrigen) return res.status(404).json({ success: false, message: "Restaurante origen no encontrado" });

        const evento = restauranteOrigen.eventos.id(eventoId);
        if (!evento) return res.status(404).json({ success: false, message: "Evento no encontrado" });

        // Si cambió de restaurante (solo SuperAdmin llega aquí por la validación anterior)
        if (nuevoRestId && nuevoRestId !== restId) {
            // Eliminar del restaurante original
            restauranteOrigen.eventos.pull(eventoId);
            await restauranteOrigen.save();

            // Agregar al nuevo restaurante
            const restauranteDestino = await Restaurant.findById(nuevoRestId);
            if (!restauranteDestino) return res.status(404).json({ success: false, message: "Restaurante destino no encontrado" });

            restauranteDestino.eventos.push({
                nombre: data.nombre,
                descripcion: data.descripcion,
                fechas: data.fechas,
                servicios: data.servicios,
            });
            await restauranteDestino.save();

            return res.status(200).json({
                success: true,
                message: "Evento movido y actualizado",
                restaurant: restauranteDestino
            });
        }

        // Si NO cambió de restaurante, solo actualiza
        evento.nombre = data.nombre;
        evento.descripcion = data.descripcion;
        evento.fechas = data.fechas;
        evento.servicios = data.servicios;
        await restauranteOrigen.save();

        res.status(200).json({
            success: true,
            message: "Evento actualizado",
            restaurant: restauranteOrigen
        });

    } catch (error) {
        res.status(500).json({ success: false, message: "Error al actualizar evento" });
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
           
        });
    }
};