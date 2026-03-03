import Restaurant from "./restaurants-model.js";

/**
 * GET 
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
        res.status(500).json({ success: false, message: "Error al obtener", error: error.message });
    }
};

/**
 * POST Restaurante
 */
export const createRestaurant = async (req, res) => {
    try {
        const { nombre } = req.body;

        // Validar 
        const existe = await Restaurant.findOne({ nombre });
        if (existe) return res.status(400).json({ success: false, message: "El restaurante ya existe" });

        const restaurant = new Restaurant(req.body);
        await restaurant.save();

        res.status(201).json({
            success: true,
            message: "Restaurante creado exitosamente",
            restaurant
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al crear", error: error.message });
    }
};

/**
 * POST
 */
export const addTable = async (req, res) => {
    try {
        const { id } = req.params;
        const nuevaMesa = req.body;

        const restaurant = await Restaurant.findById(id);
        if (!restaurant) return res.status(404).json({ success: false, message: "Restaurante no encontrado" });

        // Evitar números de mesa duplicados en el mismo restaurante
        const mesaRepetida = restaurant.mesas.find(m => m.numero === nuevaMesa.numero);
        if (mesaRepetida) return res.status(400).json({ success: false, message: "El número de mesa ya está registrado" });

        restaurant.mesas.push(nuevaMesa);
        await restaurant.save();

        res.status(200).json({ success: true, message: "Mesa agregada", restaurant });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * PUT 
 */
export const updateRestaurant = async (req, res) => {
    try {
        const { id } = req.params;
        const { mesas, eventos, ...data } = req.body;

        const restaurant = await Restaurant.findByIdAndUpdate(id, data, { new: true });
        if (!restaurant) return res.status(404).json({ success: false, message: "No encontrado" });

        res.status(200).json({ success: true, restaurant });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * DELETE 
 */
export const deleteRestaurant = async (req, res) => {
    try {
        const { id } = req.params;
        const restaurant = await Restaurant.findByIdAndUpdate(id, { activo: false }, { new: true });

        if (!restaurant) return res.status(404).json({ success: false, message: "No encontrado" });

        res.status(200).json({ success: true, message: "Desactivado correctamente" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};