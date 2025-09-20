const { ObjectId } = require('mongodb');

class Repartidor {
    constructor(nombre, zona, estado = 'disponible') {
        this.nombre = nombre;
        this.zona = zona;
        this.estado = estado; // disponible / ocupado
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    static async create(db, repartidorData) {
        const collection = db.getCollection('repartidores');
        const repartidor = new Repartidor(
            repartidorData.nombre,
            repartidorData.zona,
            repartidorData.estado || 'disponible'
        );
        const result = await collection.insertOne(repartidor);
        return { ...repartidor, _id: result.insertedId };
    }

    static async getAll(db) {
        const collection = db.getCollection('repartidores');
        return await collection.find({}).toArray();
    }

    static async getById(db, id) {
        const collection = db.getCollection('repartidores');
        return await collection.findOne({ _id: new ObjectId(id) });
    }

    static async getDisponibles(db) {
        const collection = db.getCollection('repartidores');
        return await collection.find({ estado: 'disponible' }).toArray();
    }

    static async updateEstado(db, id, nuevoEstado) {
        const collection = db.getCollection('repartidores');
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

    static async asignarRepartidor(db) {
        const collection = db.getCollection('repartidores');
        const repartidor = await collection.findOneAndUpdate(
            { estado: 'disponible' },
            { 
                $set: { 
                    estado: 'ocupado',
                    updatedAt: new Date()
                }
            },
            { returnDocument: 'after' }
        );
        return repartidor;
    }
}

module.exports = Repartidor;