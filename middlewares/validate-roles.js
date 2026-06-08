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
 * Se usa cuando el id del restaurante viene en req.params (paramName, por defecto "id").
 *
 * Uso en rutas:
 *   router.post("/:id", validateJWT, hasRole('SuperAdmin','Admin_Restaurante'), checkRestaurantOwnership(), addEvento);
 *   router.put("/:restId/:eventoId", validateJWT, hasRole('SuperAdmin','Admin_Restaurante'), checkRestaurantOwnership('restId'), updateEvento);
 */
export const checkRestaurantOwnership = (paramName = "id") => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(500).json({ success: false, message: "Se debe validar el token antes que el ownership" });
        }

        // SuperAdmin pasa siempre
        if (req.user.rol === 'SuperAdmin') return next();

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