import { Router } from "express";
import { hasRole, checkRestaurantOwnership } from "../../middlewares/validate-roles.js";
import {
    addEvento,
    getEventos,
    updateEvento,
    deleteEvento
} from "./gastronomicEvents-controller.js";
import {
    validateRestaurantId,
    validateEventoBody,
    validateEventUpdateDelete
} from "../../middlewares/restaurants-validator.js";

const router = Router();

// GET - SuperAdmin ve cualquier restaurante, Admin_Restaurante solo el suyo
router.get("/:id", hasRole('SuperAdmin', 'Admin_Restaurante'), checkRestaurantOwnership(), validateRestaurantId, getEventos);

// POST - Solo puede agregar eventos a su propio restaurante
router.post("/:id", hasRole('SuperAdmin', 'Admin_Restaurante'), checkRestaurantOwnership(), validateEventoBody, addEvento);

// PUT - restId debe ser su restaurante
router.put("/:restId/:eventoId", hasRole('SuperAdmin', 'Admin_Restaurante'), checkRestaurantOwnership('restId'), validateEventUpdateDelete, updateEvento);

// DELETE - restId debe ser su restaurante
router.delete("/:restId/:eventoId", hasRole('SuperAdmin', 'Admin_Restaurante'), checkRestaurantOwnership('restId'), validateEventUpdateDelete, deleteEvento);

export default router;
