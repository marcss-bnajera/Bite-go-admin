import Restaurant from "../restaurants/restaurants-model.js";

/**
 * GET - Mesas de restaurante
 */
export const getMesas = async (req, res) => {
    try {
        const { id } = req.params;
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
 * Se mantiene la lógica de número único porque mesas NO pueden
 * duplicarse por número (regla de negocio que eventos no tiene)
 */
export const addMesa = async (req, res) => {
    try {
        const { id } = req.params;
        const mesaData = req.body;

        const restaurant = await Restaurant.findOne({
            _id: id,
            "mesas.numero": { $ne: mesaData.numero }
        });

        if (!restaurant) {
            const existe = await Restaurant.exists({ _id: id });
            if (!existe) return res.status(404).json({
                success: false,
                message: "Restaurante no encontrado"
            });

            return res.status(400).json({
                success: false,
                message: "El número de mesa ya está ocupado"
            });
        }

        restaurant.mesas.push(mesaData);
        await restaurant.save();

        res.status(201).json({
            success: true,
            message: "Mesa creada",
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
 * Espeja el patrón de updateEvento: soporta cambio de restaurante
 */
export const updateMesa = async (req, res) => {
    try {
        const { restId, mesaId } = req.params;
        const data = req.body;
        const nuevoRestId = data.id_restaurante;

        const restauranteOrigen = await Restaurant.findById(restId);
        if (!restauranteOrigen) return res.status(404).json({
            success: false,
            message: "Restaurante origen no encontrado"
        });

        const mesa = restauranteOrigen.mesas.id(mesaId);
        if (!mesa) return res.status(404).json({
            success: false,
            message: "Mesa no encontrada"
        });

        // Si cambió de restaurante
        if (nuevoRestId && nuevoRestId !== restId) {
            restauranteOrigen.mesas.pull(mesaId);
            await restauranteOrigen.save();

            const restauranteDestino = await Restaurant.findById(nuevoRestId);
            if (!restauranteDestino) return res.status(404).json({
                success: false,
                message: "Restaurante destino no encontrado"
            });

            restauranteDestino.mesas.push({
                numero: data.numero,
                capacidad: data.capacidad,
                ubicacion: data.ubicacion,
                estado: data.estado,
            });
            await restauranteDestino.save();

            return res.status(200).json({
                success: true,
                message: "Mesa movida y actualizada",
                restaurant: restauranteDestino
            });
        }

        mesa.numero = data.numero;
        mesa.capacidad = data.capacidad;
        mesa.ubicacion = data.ubicacion;
        mesa.estado = data.estado;
        await restauranteOrigen.save();

        res.status(200).json({
            success: true,
            message: "Mesa actualizada",
            restaurant: restauranteOrigen
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
        await Restaurant.findByIdAndUpdate(
            restId,
            { $pull: { mesas: { _id: mesaId } } },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: "Mesa eliminada"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al eliminar mesa",
            error: error.message
        });
    }
};