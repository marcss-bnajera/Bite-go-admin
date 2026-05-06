import Product from "./products-model.js";
import { cloudinary } from "../../middlewares/file-uploader.js";

export const getProducts = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const query = { activo: true };
        if (search) query.nombre = { $regex: search, $options: "i" };

        const [products, total] = await Promise.all([
            Product.find(query)
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 })
                .populate('id_restaurante', 'nombre categoria_gastronomica')
                .populate('categoria', 'nombre'),
            Product.countDocuments(query)
        ]);

        res.status(200).json({ success: true, total, totalPages: Math.ceil(total / limit), currentPage: parseInt(page), products });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener productos", error: error.message });
    }
};

export const getProductsByRestaurant = async (req, res) => {
    try {
        const { id_restaurante } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const query = { id_restaurante, activo: true };

        const [products, total] = await Promise.all([
            Product.find(query)
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 })
                .populate('categoria', 'nombre'),
            Product.countDocuments(query)
        ]);

        res.status(200).json({ success: true, total, totalPages: Math.ceil(total / limit), currentPage: parseInt(page), products });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener productos", error: error.message });
    }
};

export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findOne({ _id: id, activo: true })
            .populate('id_restaurante', 'nombre direccion')
            .populate('categoria', 'nombre');

        if (!product) return res.status(404).json({ success: false, message: "Producto no encontrado" });
        res.status(200).json({ success: true, product });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error en el servidor", error: error.message });
    }
};

export const createProduct = async (req, res) => {
    try {
        const productData = { ...req.body };

        // Una sola imagen opcional
        if (req.file) {
            productData.foto_url = [req.file.path];
        } else {
            productData.foto_url = [];
        }

        const product = new Product(productData);
        await product.save();

        res.status(201).json({ success: true, message: "Producto creado exitosamente", product });
    } catch (error) {
        res.status(400).json({ success: false, message: "Datos de producto inválidos", error: error.message });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { receta, activo, id_restaurante, ...data } = req.body;

        // Si se sube nueva imagen, eliminar la anterior de Cloudinary
        if (req.file) {
            const currentProduct = await Product.findById(id);
            if (currentProduct?.foto_url?.length > 0) {
                try {
                    const url = currentProduct.foto_url[0];
                    const parts = url.split('/');
                    const filenameWithExt = parts[parts.length - 1];
                    const filename = filenameWithExt.split('.')[0];
                    const folder = parts[parts.length - 2];
                    const publicId = `${folder}/${filename}`;
                    await cloudinary.uploader.destroy(publicId);
                } catch (deleteError) {
                    console.error(`Error al eliminar imagen anterior: ${deleteError.message}`);
                }
            }
            data.foto_url = [req.file.path];
        }

        const product = await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true })
            .populate('categoria', 'nombre');

        if (!product) return res.status(404).json({ success: false, message: "Producto no encontrado" });
        res.status(200).json({ success: true, message: "Información del producto actualizada", product });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al actualizar", error: error.message });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByIdAndUpdate(id, { activo: false }, { new: true });
        if (!product) return res.status(404).json({ success: false, message: "Producto no encontrado" });
        res.status(200).json({ success: true, message: "Producto dado de baja exitosamente" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al eliminar", error: error.message });
    }
};