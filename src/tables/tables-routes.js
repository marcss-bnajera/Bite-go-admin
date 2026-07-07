import { Router } from "express";
import { hasRole, checkRestaurantOwnership } from "../../middlewares/validate-roles.js";
import {
    addMesa,
    getMesas,
    updateMesa,
    deleteMesa
} from "./tables-controller.js";

const router = Router();

// GET - Admin_Restaurante solo puede ver las mesas de su restaurante
router.get("/:id", hasRole('SuperAdmin', 'Admin_Restaurante'), checkRestaurantOwnership(), getMesas);

// POST - Solo puede agregar mesas a su restaurante
router.post("/:id", hasRole('SuperAdmin', 'Admin_Restaurante'), checkRestaurantOwnership(), addMesa);

// PUT - restId debe ser su restaurante
router.put("/:restId/:mesaId", hasRole('SuperAdmin', 'Admin_Restaurante'), checkRestaurantOwnership('restId'), updateMesa);

// DELETE - restId debe ser su restaurante
router.delete("/:restId/:mesaId", hasRole('SuperAdmin', 'Admin_Restaurante'), checkRestaurantOwnership('restId'), deleteMesa);

export default router;
