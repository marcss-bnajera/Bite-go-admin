import { body, param, validationResult } from "express-validator";

const validarCampos = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

export const addItemValidator = [
    param("id").isMongoId().withMessage("ID de pedido inválido"),
    body("id_producto").isMongoId().withMessage("ID de producto inválido"),
    body("nombre_producto").notEmpty().withMessage("El nombre del producto es requerido"),
    body("cantidad").isInt({ min: 1 }).withMessage("La cantidad debe ser al menos 1"),
    body("precio_historico").isFloat({ min: 0 }).withMessage("El precio debe ser un número positivo"),
    validarCampos
];

export const updateItemValidator = [
    param("orderId").isMongoId().withMessage("ID de pedido inválido"),
    param("itemId").isMongoId().withMessage("ID de item inválido"),
    body("cantidad").isInt({ min: 1 }).withMessage("La cantidad mínima es 1"),
    validarCampos
];

export const deleteItemValidator = [
    param("orderId").isMongoId().withMessage("ID de pedido inválido"),
    param("itemId").isMongoId().withMessage("ID de item inválido"),
    validarCampos
];