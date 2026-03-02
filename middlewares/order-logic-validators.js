import User from "../src/users/users-model.js";
import mongoose from 'mongoose';

export const validateOrderAssignments = async function () {
    // Validamos si el ID de mesero tiene un formato válido antes de buscarlo
    if (this.tipo_servicio === 'Comer aquí') {
        if (!this.id_mesero_asignado) {
            throw new Error('Se debe colocar el ID de un mesero para crear este pedido.');
        }

        if (!mongoose.Types.ObjectId.isValid(this.id_mesero_asignado)) {
            throw new Error('El ID de mesero proporcionado no tiene un formato válido.');
        }

        const mesero = await User.findById(this.id_mesero_asignado);
        if (!mesero || mesero.rol !== 'Mesero') {
            throw new Error('El ID debe corresponder a un usuario con rol "Mesero" para pedidos en restaurante.');
        }
        this.id_repartidor_asignado = null;
    }

    // Validación para Domicilio
    if (this.tipo_servicio === 'Domicilio') {
        if (!this.id_repartidor_asignado) {
            throw new Error('Se debe colocar el ID de un repartidor para pedidos a domicilio.');
        }

        if (!mongoose.Types.ObjectId.isValid(this.id_repartidor_asignado)) {
            throw new Error('El ID de repartidor proporcionado no tiene un formato válido.');
        }

        const repartidor = await User.findById(this.id_repartidor_asignado);
        if (!repartidor || repartidor.rol !== 'Repartidor') {
            throw new Error('El ID debe corresponder a un usuario con rol "Repartidor" para pedidos a domicilio.');
        }
        this.id_mesero_asignado = null;
    }

    // Para llevar
    if (this.tipo_servicio === 'Para llevar') {
        this.id_mesero_asignado = null;
        this.id_repartidor_asignado = null;
    }
};