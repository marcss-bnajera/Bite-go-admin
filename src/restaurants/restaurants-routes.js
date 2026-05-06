import { Router } from "express";
import {
    getRestaurants,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
    addTable,
} from "./restaurants-controller.js";
import {
    validateRestaurantId,
    validateCreateRestaurant
} from "../../middlewares/restaurants-validator.js";

const router = Router();

router.get("/", getRestaurants);
router.post("/", validateCreateRestaurant, createRestaurant);
router.put("/:id", validateRestaurantId, updateRestaurant);
router.delete("/:id", validateRestaurantId, deleteRestaurant);

router.post("/:id/add-table", addTable);

export default router;