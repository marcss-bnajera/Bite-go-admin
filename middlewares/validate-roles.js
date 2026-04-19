export const hasRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(500).json({ success: false, message: "Se debe validar el token antes que el rol" });
        }

        if (!roles.includes(req.user.rol)) {
            return res.status(403).json({
                success: false,
                message: `Acceso denegado. Se requiere uno de estos roles: ${roles.join(", ")}`
            });
        }
        next();
    };
};