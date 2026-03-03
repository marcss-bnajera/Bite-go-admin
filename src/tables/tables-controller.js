import Restaurant from "../restaurants/restaurants-model.js";

// 1. CREATE 
export const addMesa = async (req, res) => {
    try {
        const { id } = req.params;
        const mesaData = req.body;

        const restaurant = await Restaurant.findById(id);
        if (!restaurant) return res.status(404).json({ success: false, message: "Restaurante no existe" });

        // No repetir número de mesa 
        const existe = restaurant.mesas.find(m => m.numero === mesaData.numero);
        if (existe) return res.status(400).json({ success: false, message: "El número de mesa ya está ocupado" });

        restaurant.mesas.push(mesaData);
        await restaurant.save();

        res.status(201).json({ success: true, message: "Mesa creada", mesas: restaurant.mesas });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getMesas = async (req, res) => {
    try {
        const { id } = req.params;
        const restaurant = await Restaurant.findById(id).select("mesas");
        res.status(200).json({ success: true, mesas: restaurant.mesas });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 3. UPDATE
export const updateMesa = async (req, res) => {
    try {
        const { restId, mesaId } = req.params;
        const data = req.body;

        const restaurant = await Restaurant.findOneAndUpdate(
            { _id: restId, "mesas._id": mesaId },
            { $set: { "mesas.$": { ...data, _id: mesaId } } },
            { new: true }
        );

        if (!restaurant) return res.status(404).json({ success: false, message: "Mesa no encontrada" });
        res.status(200).json({ success: true, message: "Mesa actualizada", mesas: restaurant.mesas });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 4. DELETE
export const deleteMesa = async (req, res) => {
    try {
        const { restId, mesaId } = req.params;
        const restaurant = await Restaurant.findByIdAndUpdate(
            restId,
            { $pull: { mesas: { _id: mesaId } } },
            { new: true }
        );

        res.status(200).json({ success: true, message: "Mesa eliminada" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};