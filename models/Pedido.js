const { ObjectId } = require('mongodb');

class Pedido {
    constructor(clienteId, pizzas, total, repartidorAsignado) {
        this.clienteId = clienteId;
        this.pizzas = pizzas; // array de objetos con pizzaId y cantidad
        this.total = total;
        this.fecha = new Date();
        this.repartidorAsignado = repartidorAsignado;
        this.estado = 'pendiente'; // pendiente, en_proceso, entregado, cancelado
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    static async create(db, pedidoData) {
        const collection = db.getCollection('pedidos');
        const pedido = new Pedido(
            pedidoData.clienteId,
            pedidoData.pizzas,
            pedidoData.total,
            pedidoData.repartidorAsignado
        );
        const result = await collection.insertOne(pedido);
        return { ...pedido, _id: result.insertedId };
    }

    static async getAll(db) {
        const collection = db.getCollection('pedidos');
        return await collection.find({}).toArray();
    }

    static async getById(db, id) {
        const collection = db.getCollection('pedidos');
        return await collection.findOne({ _id: new ObjectId(id) });
    }

    static async getByCliente(db, clienteId) {
        const collection = db.getCollection('pedidos');
        return await collection.find({ clienteId: new ObjectId(clienteId) }).toArray();
    }

    static async getByRepartidor(db, repartidorId) {
        const collection = db.getCollection('pedidos');
        return await collection.find({ repartidorAsignado: new ObjectId(repartidorId) }).toArray();
    }

    static async updateEstado(db, id, nuevoEstado) {
        const collection = db.getCollection('pedidos');
        return await collection.updateOne(
            { _id: new ObjectId(id) },
            { 
                $set: { 
                    estado: nuevoEstado,
                    updatedAt: new Date()
                }
            }
        );
    }

    static async getPedidosDelUltimoMes(db) {
        const collection = db.getCollection('pedidos');
        const unMesAtras = new Date();
        unMesAtras.setMonth(unMesAtras.getMonth() - 1);
        
        return await collection.find({
            fecha: { $gte: unMesAtras }
        }).toArray();
    }
}

module.exports = Pedido;