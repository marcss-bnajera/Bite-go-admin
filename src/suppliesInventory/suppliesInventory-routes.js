import { Router } from "express";
import {
    createInsumo,
    getInventoryByRestaurant,
    adjustStock,
    deleteInsumo
} from "./suppliesInventory-controller.js";

const router = Router();

router.get("/restaurant/:id_restaurante", getInventoryByRestaurant);
router.post("/", createInsumo);
router.put("/adjust/:id", adjustStock);
router.delete("/:id", deleteInsumo);

export default router;