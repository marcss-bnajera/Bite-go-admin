export const validateJWT = (req, res, next) => {
    // SIMULANDO UN ADMINISTRADOR DE RESTAURANTE
    req.user = {
        // Colocar el ID real de un usuario
        uid: "ID_DE_UN_ADMIN_EN_TU_DB",
        rol: "Admin_Restaurante",
        // Colocar el ID real del restaurante
        id_restaurante: "ID_DEL_RESTAURANTE_ASOCIADO"
    };

    console.log(`MOCK JWT: Simulando sesión como ${req.user.rol}`);
    next();
};