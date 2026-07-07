import User from "./users-model.js";
import bcrypt from "bcryptjs";

/**
 * GET 
 */
export const getUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, activo } = req.query;
        const safePage = Math.max(1, parseInt(page) || 1);
        const safeLimit = Math.min(Math.max(1, parseInt(limit) || 10), 100);
        const query = activo !== undefined ? { activo: activo === 'true' } : {};

        const [users, total] = await Promise.all([
            User.find(query)
                .skip((safePage - 1) * safeLimit)
                .limit(safeLimit)
                .sort({ createdAt: -1 })
                .populate('id_restaurante', 'nombre'),
            User.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            total,
            totalPages: Math.ceil(total / safeLimit),
            currentPage: safePage,
            users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al obtener usuarios",
           
        });
    }
};

/**
 * POST
 */
export const register = async (req, res) => {
    try {
        const { password, ...data } = req.body;

        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({
            ...data,
            password: hashedPassword
        });

        await user.save();

        res.status(201).json({
            success: true,
            message: "Usuario registrado exitosamente"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al registrar usuario",
           
        });
    }
};

/**
 * PUT 
 */
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { password, email, rol, ...rest } = req.body;

        const { nombre, telefono, direccion, dpi, id_restaurante, activo } = rest;
        const data = { nombre, telefono, direccion, dpi, id_restaurante, activo };
        Object.keys(data).forEach(k => data[k] === undefined && delete data[k]);

        if (password) {
            const salt = await bcrypt.genSalt(10);
            data.password = await bcrypt.hash(password, salt);
        }

        const user = await User.findByIdAndUpdate(id, data, { new: true, runValidators: true });

        if (!user) return res.status(404).json({
            success: false,
            message: "Usuario no encontrado"
        });

        res.status(200).json({
            success: true,
            message: "Usuario actualizado",
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al actualizar",
           
        });
    }
};

/**
 * DELETE 
 */
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByIdAndUpdate(id, { activo: false }, { new: true });

        if (!user) return res.status(404).json({
            success: false,
            message: "Usuario no encontrado"
        });

        res.status(200).json({
            success: true,
            message: "Usuario desactivado correctamente"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al eliminar",
           
        });
    }
};

export const activateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndUpdate(id, { activo: true }, { new: true });

        if (!user) return res.status(404).json({
            success: false,
            message: "Usuario no encontrado"
        });

        res.status(200).json({
            success: true,
            message: "Usuario activado correctamente",
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al activar",
           
        });
    }
};