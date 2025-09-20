
const fs = require('fs').promises;
const path = require('path');

class JsonStorage {
    constructor() {
        this.dataDir = path.join(__dirname, '..', 'data');
        this.collections = {
            ingredientes: 'ingredientes.json',
            pizzas: 'pizzas.json',
            clientes: 'clientes.json',
            repartidores: 'repartidores.json',
            pedidos: 'pedidos.json'
        };
    }

    async init() {
        try {
            // Crear directorio de datos si no existe
            await fs.mkdir(this.dataDir, { recursive: true });
            
            // Crear archivos JSON si no existen
            for (const [collection, filename] of Object.entries(this.collections)) {
                const filePath = path.join(this.dataDir, filename);
                try {
                    await fs.access(filePath);
                } catch {
                    // Archivo no existe, crear con array vacío
                    await fs.writeFile(filePath, JSON.stringify([], null, 2));
                }
            }
            
            console.log('✅ Sistema de almacenamiento JSON inicializado');
        } catch (error) {
            console.error('❌ Error inicializando almacenamiento JSON:', error);
            throw error;
        }
    }

    async readCollection(collectionName) {
        try {
            const filename = this.collections[collectionName];
            if (!filename) {
                throw new Error(`Colección ${collectionName} no encontrada`);
            }
            
            const filePath = path.join(this.dataDir, filename);
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`❌ Error leyendo colección ${collectionName}:`, error);
            return [];
        }
    }

    async writeCollection(collectionName, data) {
        try {
            const filename = this.collections[collectionName];
            if (!filename) {
                throw new Error(`Colección ${collectionName} no encontrada`);
            }
            
            const filePath = path.join(this.dataDir, filename);
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error(`❌ Error escribiendo colección ${collectionName}:`, error);
            throw error;
        }
    }

    async insert(collectionName, document) {
        try {
            const data = await this.readCollection(collectionName);
            
            // Generar ID único
            const id = this.generateId();
            const newDocument = { ...document, _id: id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
            
            data.push(newDocument);
            await this.writeCollection(collectionName, data);
            
            return newDocument;
        } catch (error) {
            console.error(`❌ Error insertando en ${collectionName}:`, error);
            throw error;
        }
    }

    async find(collectionName, query = {}) {
        try {
            const data = await this.readCollection(collectionName);
            
            if (Object.keys(query).length === 0) {
                return data;
            }
            
            return data.filter(doc => {
                return Object.keys(query).every(key => {
                    if (key === '_id') {
                        return doc[key] === query[key];
                    }
                    return doc[key] === query[key];
                });
            });
        } catch (error) {
            console.error(`❌ Error buscando en ${collectionName}:`, error);
            return [];
        }
    }

    async findOne(collectionName, query) {
        try {
            const results = await this.find(collectionName, query);
            return results.length > 0 ? results[0] : null;
        } catch (error) {
            console.error(`❌ Error buscando uno en ${collectionName}:`, error);
            return null;
        }
    }

    async update(collectionName, query, update) {
        try {
            const data = await this.readCollection(collectionName);
            let updated = false;
            
            for (let i = 0; i < data.length; i++) {
                const doc = data[i];
                const matches = Object.keys(query).every(key => {
                    if (key === '_id') {
                        return doc[key] === query[key];
                    }
                    return doc[key] === query[key];
                });
                
                if (matches) {
                    data[i] = { ...doc, ...update, updatedAt: new Date().toISOString() };
                    updated = true;
                    break;
                }
            }
            
            if (updated) {
                await this.writeCollection(collectionName, data);
            }
            
            return updated;
        } catch (error) {
            console.error(`❌ Error actualizando en ${collectionName}:`, error);
            throw error;
        }
    }

    async delete(collectionName, query) {
        try {
            const data = await this.readCollection(collectionName);
            const originalLength = data.length;
            
            const filteredData = data.filter(doc => {
                return !Object.keys(query).every(key => {
                    if (key === '_id') {
                        return doc[key] === query[key];
                    }
                    return doc[key] === query[key];
                });
            });
            
            if (filteredData.length < originalLength) {
                await this.writeCollection(collectionName, filteredData);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error(`❌ Error eliminando en ${collectionName}:`, error);
            throw error;
        }
    }

    async count(collectionName, query = {}) {
        try {
            const results = await this.find(collectionName, query);
            return results.length;
        } catch (error) {
            console.error(`❌ Error contando en ${collectionName}:`, error);
            return 0;
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Método para simular transacciones con archivos JSON
    async withTransaction(operations) {
        const backup = {};
        
        try {
            // Crear backup de todas las colecciones que se van a modificar
            for (const operation of operations) {
                if (!backup[operation.collection]) {
                    backup[operation.collection] = await this.readCollection(operation.collection);
                }
            }
            
            // Ejecutar todas las operaciones
            const results = [];
            for (const operation of operations) {
                let result;
                switch (operation.type) {
                    case 'insert':
                        result = await this.insert(operation.collection, operation.document);
                        break;
                    case 'update':
                        result = await this.update(operation.collection, operation.query, operation.update);
                        break;
                    case 'delete':
                        result = await this.delete(operation.collection, operation.query);
                        break;
                    default:
                        throw new Error(`Tipo de operación no soportado: ${operation.type}`);
                }
                results.push(result);
            }
            
            return results;
        } catch (error) {
            // Revertir cambios usando backup
            for (const [collection, data] of Object.entries(backup)) {
                await this.writeCollection(collection, data);
            }
            throw error;
        }
    }
}

module.exports = new JsonStorage();
