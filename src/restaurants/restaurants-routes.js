import { Router } from "express";
import {
    getRestaurants,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
    addTable,
    activateRestaurant,
} from "./restaurants-controller.js";
import {
    validateRestaurantId,
    validateCreateRestaurant
} from "../../middlewares/restaurants-validator.js";
import { hasRole } from "../../middlewares/validate-roles.js";

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
router.post("/:id/add-table", hasRole('SuperAdmin', 'Admin_Restaurante'), validateRestaurantId, checkRestaurantOwnership, addTable);

export default router;