import { Router } from "express";
import {
    getRestaurants,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
    addTable
} from "./restaurants-controller.js";
import {
    validateRestaurantId,
    validateEventoBody,
    validateEventUpdateDelete
} from "../../middlewares/restaurants-validator.js";

const router = Router();

router.get("/", getRestaurants);
router.post("/", validateEventoBody, createRestaurant);
router.put("/:id", validateEventUpdateDelete, updateRestaurant);
router.delete("/:id", validateRestaurantId, deleteRestaurant);

router.post("/:id/add-table", addTable);

export default router;