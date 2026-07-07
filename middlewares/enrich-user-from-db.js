import User from "../src/users/users-model.js";

/**
 * Enriquece req.user con id_restaurante desde MongoDB.
 * Solo consulta la DB cuando el usuario es Admin_Restaurante (SuperAdmin no lo necesita).
 * Se usa DESPUÉS de validateJWT y ANTES de checkRestaurantOwnership.
 */
export const enrichUserFromDB = async (req, res, next) => {
    if (!req.user || !req.user.uid) {
        return res.status(401).json({ success: false, message: "Token no procesado" });
    }

    if (req.user.rol === 'SuperAdmin') return next();

    try {
        const dbUser = await User.findOne({ auth_id: req.user.uid }).select("id_restaurante").lean();
        if (dbUser) req.user.id_restaurante = dbUser.id_restaurante;
    } catch (error) {
        console.error("[enrichUserFromDB] Error al consultar usuario:", error.message);
    }

    next();
};
