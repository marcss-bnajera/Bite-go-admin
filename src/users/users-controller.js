import User from "./users-model.js";
import bcrypt from "bcryptjs";

/**
 * GET 
 */
export const getUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const query = { activo: true }; // Solo traemos usuarios no "eliminados"

        const [users, total] = await Promise.all([
            User.find(query)
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 }),
            User.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al obtener usuarios",
            error: error.message
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
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

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
            error: error.message
        });
    }
};

/**
 * PUT 
 */
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { password, email, ...data } = req.body;

        const user = await User.findByIdAndUpdate(id, data, { new: true });

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
            error: error.message
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
            error: error.message
        });
    }
};