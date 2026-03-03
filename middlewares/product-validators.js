import { body, param, validationResult } from "express-validator";

const validarCampos = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

export const createProductValidator = [
    body("id_restaurante").isMongoId().withMessage("El ID del restaurante no es válido"),
    body("nombre").notEmpty().withMessage("El nombre del producto es obligatorio").trim(),
    body("precio").isFloat({ min: 0 }).withMessage("El precio debe ser un número positivo"),
    body("categoria")
        .isIn(['Entradas', 'Platos', 'Bebidas', 'Postres', 'Otros'])
        .withMessage("La categoría debe ser: Entradas, Platos, Bebidas, Postres u Otros"),
    body("receta").optional().isArray().withMessage("La receta debe ser un arreglo de insumos"),
    body("receta.*.nombre_insumo").notEmpty().withMessage("Cada insumo debe tener un nombre"),
    body("receta.*.cantidad_requerida").isFloat({ min: 0 }).withMessage("La cantidad del insumo debe ser positiva"),


    body("variaciones").optional().isArray().withMessage("Las variaciones deben ser un arreglo"),
    body("variaciones.*.nombre").notEmpty().withMessage("El nombre de la variación es obligatorio"),
    body("variaciones.*.precio_adicional").optional().isFloat({ min: 0 }).withMessage("El precio adicional no puede ser negativo"),
    body("variaciones.*.afecta_inventario").optional().isBoolean().withMessage("Afecta inventario debe ser booleano"),
    body("variaciones.*.cantidad_insumo").optional().isFloat({ min: 0 }).withMessage("La cantidad de insumo debe ser positiva"),

    validarCampos
];

export const updateProductValidator = [
    param("id").isMongoId().withMessage("ID de producto no válido"),
    body("precio").optional().isFloat({ min: 0 }).withMessage("El precio debe ser positivo"),
    body("categoria").optional().isIn(['Entradas', 'Platos', 'Bebidas', 'Postres', 'Otros']),

    // También permitimos actualizar variaciones en el PUT
    body("variaciones").optional().isArray().withMessage("Las variaciones deben ser un arreglo"),

    validarCampos
];