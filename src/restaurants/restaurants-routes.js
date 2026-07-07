import { Router } from "express";
import { param } from "express-validator";
import { checkValidators } from "../../middlewares/check-validators.js";
import {
    getRestaurants,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
    addTable,
    activateRestaurant,
    getSucursales,
    addSucursal,
    updateSucursal,
    deleteSucursal,
    addMesaSucursal,
    updateMesaSucursal,
    deleteMesaSucursal,
    uploadRestaurantPhoto,
} from "./restaurants-controller.js";
import {
    validateRestaurantId,
    validateCreateRestaurant
} from "../../middlewares/restaurants-validator.js";
import { hasRole } from "../../middlewares/validate-roles.js";
import { uploadRestaurantImage } from "../../middlewares/file-uploader.js";

const router = Router();

// Middleware: Admin solo puede modificar su propio restaurante
const checkRestaurantOwnership = (req, res, next) => {
    if (req.user.rol === 'SuperAdmin') return next();
    if (req.user.id_restaurante?.toString() !== req.params.id) {
        return res.status(403).json({ success: false, message: "No tienes permiso para modificar este restaurante" });
    }
    next();
};

router.get("/", getRestaurants);
router.post("/", hasRole('SuperAdmin'), validateCreateRestaurant, createRestaurant);
router.put("/:id", hasRole('SuperAdmin', 'Admin_Restaurante'), validateRestaurantId, checkRestaurantOwnership, updateRestaurant);
router.delete("/:id", hasRole('SuperAdmin'), validateRestaurantId, deleteRestaurant);
router.patch("/:id/activate", hasRole('SuperAdmin'), validateRestaurantId, activateRestaurant);
router.post("/:id/foto", hasRole('SuperAdmin', 'Admin_Restaurante'), validateRestaurantId, checkRestaurantOwnership, (req, res, next) => {
    uploadRestaurantImage.single('foto')(req, res, (err) => {
        if (!err) return next();
        if (err.message && err.message.startsWith('Solo se permiten imágenes')) {
            return res.status(400).json({ success: false, message: "Formato de imagen no permitido. Solo se aceptan: JPEG, JPG, PNG, WEBP o AVIF." });
        }
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ success: false, message: "La imagen excede el tamaño máximo permitido de 10MB." });
        }
        return res.status(400).json({ success: false, message: err.message || "Error al procesar la imagen." });
    });
}, uploadRestaurantPhoto);
router.post("/:id/add-table", hasRole('SuperAdmin', 'Admin_Restaurante'), validateRestaurantId, checkRestaurantOwnership, addTable);

// Sucursales
const sucursalParams = [
    param('id').isMongoId().withMessage('ID de restaurante no válido'),
    param('sucursalId').isMongoId().withMessage('ID de sucursal no válido'),
    checkValidators
];
const mesaSucursalParams = [
    param('id').isMongoId().withMessage('ID de restaurante no válido'),
    param('sucursalId').isMongoId().withMessage('ID de sucursal no válido'),
    param('mesaId').isMongoId().withMessage('ID de mesa no válido'),
    checkValidators
];

router.get("/:id/sucursales", hasRole('SuperAdmin', 'Admin_Restaurante'), validateRestaurantId, checkRestaurantOwnership, getSucursales);
router.post("/:id/sucursales", hasRole('SuperAdmin', 'Admin_Restaurante'), validateRestaurantId, checkRestaurantOwnership, addSucursal);
router.put("/:id/sucursales/:sucursalId", hasRole('SuperAdmin', 'Admin_Restaurante'), sucursalParams, checkRestaurantOwnership, updateSucursal);
router.delete("/:id/sucursales/:sucursalId", hasRole('SuperAdmin', 'Admin_Restaurante'), sucursalParams, checkRestaurantOwnership, deleteSucursal);
router.post("/:id/sucursales/:sucursalId/mesas", hasRole('SuperAdmin', 'Admin_Restaurante'), sucursalParams, checkRestaurantOwnership, addMesaSucursal);
router.put("/:id/sucursales/:sucursalId/mesas/:mesaId", hasRole('SuperAdmin', 'Admin_Restaurante'), mesaSucursalParams, checkRestaurantOwnership, updateMesaSucursal);
router.delete("/:id/sucursales/:sucursalId/mesas/:mesaId", hasRole('SuperAdmin', 'Admin_Restaurante'), mesaSucursalParams, checkRestaurantOwnership, deleteMesaSucursal);

export default router;