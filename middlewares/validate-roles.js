import User from "../src/users/users-model.js";

export const hasRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(500).json({ success: false, message: "Se debe validar el token antes que el rol" });
        }

        if (req.user.rol === 'SuperAdmin') return next();

        if (!roles.includes(req.user.rol)) {
            return res.status(403).json({
                success: false,
                message: `Acceso denegado. Se requiere uno de estos roles: ${roles.join(", ")}`
            });
        }
        next();
    };
};

/**
 * Verifica que el Admin_Restaurante solo opere sobre su propio restaurante.
 * Si req.user.id_restaurante no existe (validateJWT ya no consulta DB), lo obtiene aquí.
 */
export const checkRestaurantOwnership = (paramName = "id") => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(500).json({ success: false, message: "Se debe validar el token antes que el ownership" });
        }

        if (req.user.rol === 'SuperAdmin') return next();

        if (!req.user.id_restaurante) {
            try {
                const dbUser = await User.findOne({ auth_id: req.user.uid }).select("id_restaurante").lean();
                if (dbUser) req.user.id_restaurante = dbUser.id_restaurante;
            } catch (error) {
                console.error("[checkRestaurantOwnership] Error al consultar usuario:", error.message);
            }
        }

        const restaurantIdFromParam = req.params[paramName];

        if (!restaurantIdFromParam) {
            return res.status(400).json({ success: false, message: `Parámetro de restaurante '${paramName}' no encontrado en la ruta` });
        }

        if (!req.user.id_restaurante) {
            return res.status(403).json({ success: false, message: "Tu usuario no tiene un restaurante asignado" });
        }

        if (restaurantIdFromParam.toString() !== req.user.id_restaurante.toString()) {
            return res.status(403).json({ success: false, message: "No tienes permiso para operar sobre este restaurante" });
        }

        next();
    };
};
