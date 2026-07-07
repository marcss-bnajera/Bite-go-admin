import Product from "./products-model.js";
import { cloudinary } from "../../middlewares/file-uploader.js";

export const getProducts = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, activo } = req.query;
        const safePage = Math.max(1, parseInt(page) || 1);
        const safeLimit = Math.min(Math.max(1, parseInt(limit) || 10), 100);
        const query = {};
        if (activo !== undefined) query.activo = activo === 'true';
        if (search) {
            const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            query.nombre = { $regex: escaped, $options: "i" };
        }

        // Admin_Restaurante solo ve su propio restaurante
        if (req.user.rol === 'Admin_Restaurante') {
            query.id_restaurante = req.user.id_restaurante;
        }

        const [products, total] = await Promise.all([
            Product.find(query)
                .skip((safePage - 1) * safeLimit)
                .limit(safeLimit)
                .sort({ createdAt: -1 })
                .populate('id_restaurante', 'nombre categoria_gastronomica')
                .populate('categoria', 'nombre'),
            Product.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            total,
            totalPages: Math.ceil(total / safeLimit),
            currentPage: safePage,
            products
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener productos" });
    }
};

export const getProductsByRestaurant = async (req, res) => {
    try {
        const { id_restaurante } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const safePage = Math.max(1, parseInt(page) || 1);
        const safeLimit = Math.min(Math.max(1, parseInt(limit) || 10), 100);
        const query = { id_restaurante, activo: true };

        const [products, total] = await Promise.all([
            Product.find(query)
                .skip((safePage - 1) * safeLimit)
                .limit(safeLimit)
                .sort({ createdAt: -1 })
                .populate('categoria', 'nombre'),
            Product.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            total,
            totalPages: Math.ceil(total / safeLimit),
            currentPage: safePage,
            products
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al obtener productos" });
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
        res.status(500).json({ success: false, message: "Error en el servidor" });
    }
};

export const createProduct = async (req, res) => {
    try {
        const productData = { ...req.body };

        // Admin_Restaurante solo puede crear en su restaurante
        if (req.user.rol === 'Admin_Restaurante') {
            productData.id_restaurante = req.user.id_restaurante;
        }

        if (req.file) {
            productData.foto_url = [req.file.path];
            productData.foto_public_id = req.file.filename;
        } else {
            productData.foto_url = [];
            productData.foto_public_id = null;
        }

        const product = new Product(productData);
        await product.save();

        res.status(201).json({ success: true, message: "Producto creado exitosamente", product });
    } catch (error) {
        res.status(400).json({ success: false, message: "Datos de producto inválidos" });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { receta, id_restaurante, ...data } = req.body;

        // Verificar que el producto pertenece al restaurante del Admin_Restaurante
        if (req.user.rol === 'Admin_Restaurante') {
            const existing = await Product.findById(id).select('id_restaurante');
            if (!existing) return res.status(404).json({ success: false, message: "Producto no encontrado" });

            if (existing.id_restaurante.toString() !== req.user.id_restaurante.toString()) {
                return res.status(403).json({ success: false, message: "No tienes permiso para editar productos de otro restaurante" });
            }
        }

        if (req.file) {
            const currentProduct = await Product.findById(id);
            if (currentProduct?.foto_public_id) {
                try {
                    await cloudinary.uploader.destroy(currentProduct.foto_public_id);
                } catch (deleteError) {
                    console.error(`Error al eliminar imagen anterior: ${deleteError.message}`);
                }
            }
            data.foto_url = [req.file.path];
            data.foto_public_id = req.file.filename;
        }

        const product = await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true })
            .populate('categoria', 'nombre');

        if (!product) return res.status(404).json({ success: false, message: "Producto no encontrado" });
        res.status(200).json({ success: true, message: "Información del producto actualizada", product });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al actualizar" });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar ownership antes de desactivar
        if (req.user.rol === 'Admin_Restaurante') {
            const existing = await Product.findById(id).select('id_restaurante');
            if (!existing) return res.status(404).json({ success: false, message: "Producto no encontrado" });

            if (existing.id_restaurante.toString() !== req.user.id_restaurante.toString()) {
                return res.status(403).json({ success: false, message: "No tienes permiso para eliminar productos de otro restaurante" });
            }
        }

        const product = await Product.findByIdAndUpdate(id, { activo: false }, { new: true });
        if (!product) return res.status(404).json({ success: false, message: "Producto no encontrado" });
        res.status(200).json({ success: true, message: "Producto dado de baja exitosamente" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al eliminar" });
    }
};

export const activateProduct = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar ownership antes de reactivar
        if (req.user.rol === 'Admin_Restaurante') {
            const existing = await Product.findById(id).select('id_restaurante');
            if (!existing) return res.status(404).json({ success: false, message: "Producto no encontrado" });

            if (existing.id_restaurante.toString() !== req.user.id_restaurante.toString()) {
                return res.status(403).json({ success: false, message: "No tienes permiso para reactivar productos de otro restaurante" });
            }
        }

        const product = await Product.findByIdAndUpdate(id, { activo: true }, { new: true });
        if (!product) return res.status(404).json({ success: false, message: "Producto no encontrado" });
        res.status(200).json({ success: true, message: "Producto reactivado exitosamente" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error al reactivar" });
    }
};