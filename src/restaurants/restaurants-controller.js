import Restaurant from "./restaurants-model.js";
import { cloudinary } from "../../middlewares/file-uploader.js";
import SuppliesInventory from "../suppliesInventory/suppliesInventory-model.js";

/**
 * GET 
 */
export const getRestaurants = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const safePage = Math.max(1, parseInt(page) || 1);
        const safeLimit = Math.min(Math.max(1, parseInt(limit) || 10), 100);
        const { activo } = req.query;
        const query = activo !== undefined ? { activo: activo === 'true' } : {};

        const [restaurants, total] = await Promise.all([
            Restaurant.find(query)
                .skip((safePage - 1) * safeLimit)
                .limit(safeLimit)
                .sort({ createdAt: -1 }),
            Restaurant.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            total,
            totalPages: Math.ceil(total / safeLimit),
            currentPage: safePage,
            restaurants
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener" });
    }
};

/**
 * POST Restaurante
 */
export const createRestaurant = async (req, res) => {
    try {
        const { nombre, tiene_sucursales, ...rest } = req.body;

        const existe = await Restaurant.findOne({ nombre });
        if (existe) return res.status(400).json({ success: false, message: "El restaurante ya existe" });

        if (tiene_sucursales && (!rest.direccion?.texto || rest.direccion.texto.trim() === "")) {
            rest.direccion = { texto: "Gestionado por sucursales" };
        }

        const restaurant = new Restaurant({ nombre, tiene_sucursales, ...rest });
        await restaurant.save();

        res.status(201).json({
            success: true,
            message: "Restaurante creado exitosamente",
            restaurant
        });
    } catch (error) {
        console.error("Error al crear restaurante:", error.message);
        res.status(500).json({ success: false, message: "Error al crear" });
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
        res.status(500).json({ success: false, message: "Error interno del servidor" });
    }
};

/**
 * PUT 
 */
export const updateRestaurant = async (req, res) => {
    try {
        const { id } = req.params;
        const { mesas, eventos, ...data } = req.body;

        const restaurant = await Restaurant.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        if (!restaurant) return res.status(404).json({ success: false, message: "No encontrado" });

        res.status(200).json({ success: true, restaurant });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error interno del servidor" });
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
        res.status(500).json({ success: false, message: "Error interno del servidor" });
    }
};
export const activateRestaurant = async (req, res) => {
    try {
        const { id } = req.params;
        const restaurant = await Restaurant.findByIdAndUpdate(id, { activo: true }, { new: true });
        if (!restaurant) return res.status(404).json({ success: false, message: "No encontrado" });
        res.status(200).json({ success: true, message: "Restaurante reactivado correctamente" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error interno del servidor" });
    }
};

// ================= SUCURSALES =================

export const getSucursales = async (req, res) => {
    try {
        const { id } = req.params;
        const restaurant = await Restaurant.findById(id).select("sucursales");
        if (!restaurant) return res.status(404).json({ success: false, message: "Restaurante no encontrado" });

        res.status(200).json({
            success: true,
            total: restaurant.sucursales.length,
            sucursales: restaurant.sucursales
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener sucursales" });
    }
};

export const addSucursal = async (req, res) => {
    try {
        const { id } = req.params;
        const restaurant = await Restaurant.findById(id);
        if (!restaurant) return res.status(404).json({ success: false, message: "Restaurante no encontrado" });

        restaurant.sucursales.push(req.body);
        await restaurant.save();
        const nuevaSucursal = restaurant.sucursales[restaurant.sucursales.length - 1];
        const sucursalId = nuevaSucursal._id.toString();

        const insumosRaiz = await SuppliesInventory.find({
            id_restaurante: id,
            $or: [{ id_sucursal: { $in: [null, ''] } }, { id_sucursal: undefined }]
        });

        if (insumosRaiz.length > 0) {
            const insumosSucursal = insumosRaiz.map((insumo) => ({
                id_restaurante: id,
                id_sucursal: sucursalId,
                nombre_insumo: insumo.nombre_insumo,
                stock_actual: 0,
                stock_minimo: insumo.stock_minimo,
                activo: true
            }));
            await SuppliesInventory.insertMany(insumosSucursal);
        }

        res.status(201).json({ success: true, message: "Sucursal creada", sucursales: restaurant.sucursales });
    } catch (error) {
        console.error("Error al crear sucursal:", error.message);
        res.status(500).json({ success: false, message: "Error al crear sucursal: " + error.message });
    }
};

export const updateSucursal = async (req, res) => {
    try {
        const { id, sucursalId } = req.params;
        const restaurant = await Restaurant.findById(id);
        if (!restaurant) return res.status(404).json({ success: false, message: "Restaurante no encontrado" });

        const sucursal = restaurant.sucursales.id(sucursalId);
        if (!sucursal) return res.status(404).json({ success: false, message: "Sucursal no encontrada" });

        const { mesas, ...data } = req.body;
        Object.assign(sucursal, data);
        await restaurant.save();

        res.status(200).json({ success: true, message: "Sucursal actualizada", sucursales: restaurant.sucursales });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al actualizar sucursal" });
    }
};

export const deleteSucursal = async (req, res) => {
    try {
        const { id, sucursalId } = req.params;
        const restaurant = await Restaurant.findById(id);
        if (!restaurant) return res.status(404).json({ success: false, message: "Restaurante no encontrado" });

        const sucursal = restaurant.sucursales.id(sucursalId);
        if (!sucursal) return res.status(404).json({ success: false, message: "Sucursal no encontrada" });

        restaurant.sucursales.pull(sucursalId);
        await restaurant.save();

        await SuppliesInventory.updateMany(
            { id_restaurante: id, id_sucursal: sucursalId },
            { activo: false }
        );

        res.status(200).json({ success: true, message: "Sucursal eliminada" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al eliminar sucursal" });
    }
};

export const addMesaSucursal = async (req, res) => {
    try {
        const { id, sucursalId } = req.params;
        const restaurant = await Restaurant.findById(id);
        if (!restaurant) return res.status(404).json({ success: false, message: "Restaurante no encontrado" });

        const sucursal = restaurant.sucursales.id(sucursalId);
        if (!sucursal) return res.status(404).json({ success: false, message: "Sucursal no encontrada" });

        const mesaRepetida = sucursal.mesas.find(m => m.numero === req.body.numero);
        if (mesaRepetida) return res.status(400).json({ success: false, message: "El número de mesa ya existe en esta sucursal" });

        sucursal.mesas.push(req.body);
        await restaurant.save();

        res.status(201).json({ success: true, message: "Mesa agregada", mesas: sucursal.mesas });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al agregar mesa" });
    }
};

export const updateMesaSucursal = async (req, res) => {
    try {
        const { id, sucursalId, mesaId } = req.params;
        const restaurant = await Restaurant.findById(id);
        if (!restaurant) return res.status(404).json({ success: false, message: "Restaurante no encontrado" });

        const sucursal = restaurant.sucursales.id(sucursalId);
        if (!sucursal) return res.status(404).json({ success: false, message: "Sucursal no encontrada" });

        const mesa = sucursal.mesas.id(mesaId);
        if (!mesa) return res.status(404).json({ success: false, message: "Mesa no encontrada" });

        Object.assign(mesa, req.body);
        await restaurant.save();

        res.status(200).json({ success: true, message: "Mesa actualizada", mesas: sucursal.mesas });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al actualizar mesa" });
    }
};

export const deleteMesaSucursal = async (req, res) => {
    try {
        const { id, sucursalId, mesaId } = req.params;
        const restaurant = await Restaurant.findById(id);
        if (!restaurant) return res.status(404).json({ success: false, message: "Restaurante no encontrado" });

        const sucursal = restaurant.sucursales.id(sucursalId);
        if (!sucursal) return res.status(404).json({ success: false, message: "Sucursal no encontrada" });

        sucursal.mesas.pull(mesaId);
        await restaurant.save();

        res.status(200).json({ success: true, message: "Mesa eliminada" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al eliminar mesa" });
    }
};

export const uploadRestaurantPhoto = async (req, res) => {
    try {
        const { id } = req.params;
        const restaurant = await Restaurant.findById(id);
        if (!restaurant) return res.status(404).json({ success: false, message: "Restaurante no encontrado" });

        if (!req.file) return res.status(400).json({ success: false, message: "No se proporcionó una imagen" });

        if (restaurant.foto_public_id) {
            try {
                await cloudinary.uploader.destroy(restaurant.foto_public_id);
            } catch (deleteError) {
                console.error(`Error al eliminar imagen anterior: ${deleteError.message}`);
            }
        }

        restaurant.fotos_url = [req.file.path];
        restaurant.foto_public_id = req.file.filename;
        await restaurant.save();

        res.status(200).json({ success: true, message: "Foto del restaurante actualizada", restaurant });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al subir la imagen" });
    }
};