class ReporteService {
    constructor(db) {
        this.db = db;
    }

    async ingredientesMasUtilizados() {
        console.log('\n🔍 Analizando ingredientes más utilizados del último mes...\n');
        
        const unMesAtras = new Date();
        unMesAtras.setMonth(unMesAtras.getMonth() - 1);

        const pipeline = [
            // Filtrar pedidos del último mes
            {
                $match: {
                    fecha: { $gte: unMesAtras }
                }
            },
            // Descomponer el array de pizzas
            {
                $unwind: '$pizzas'
            },
            // Hacer lookup con la colección de pizzas
            {
                $lookup: {
                    from: 'pizzas',
                    localField: 'pizzas.pizzaId',
                    foreignField: '_id',
                    as: 'pizzaInfo'
                }
            },
            // Descomponer el array de ingredientes de cada pizza
            {
                $unwind: '$pizzaInfo'
            },
            {
                $unwind: '$pizzaInfo.ingredientes'
            },
            // Agrupar por ingrediente y sumar cantidades
            {
                $group: {
                    _id: '$pizzaInfo.ingredientes.ingredienteId',
                    cantidadTotal: { $sum: '$pizzaInfo.ingredientes.cantidad' },
                    vecesUtilizado: { $sum: 1 }
                }
            },
            // Hacer lookup con la colección de ingredientes para obtener nombres
            {
                $lookup: {
                    from: 'ingredientes',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'ingredienteInfo'
                }
            },
            {
                $unwind: '$ingredienteInfo'
            },
            // Proyectar campos finales
            {
                $project: {
                    _id: 1,
                    nombre: '$ingredienteInfo.nombre',
                    tipo: '$ingredienteInfo.tipo',
                    cantidadTotal: 1,
                    vecesUtilizado: 1
                }
            },
            // Ordenar por cantidad total descendente
            {
                $sort: { cantidadTotal: -1 }
            },
            // Limitar a los 10 más utilizados
            {
                $limit: 10
            }
        ];

        const collection = this.db.getCollection('pedidos');
        const resultados = await collection.aggregate(pipeline).toArray();

        console.log('📊 TOP 10 INGREDIENTES MÁS UTILIZADOS (Último mes):');
        console.log('=' .repeat(80));
        console.log('Posición | Ingrediente | Tipo | Cantidad Total | Veces Utilizado');
        console.log('-' .repeat(80));

        resultados.forEach((ingrediente, index) => {
            console.log(
                `${(index + 1).toString().padStart(8)} | ` +
                `${ingrediente.nombre.padEnd(12)} | ` +
                `${ingrediente.tipo.padEnd(6)} | ` +
                `${ingrediente.cantidadTotal.toString().padStart(14)} | ` +
                `${ingrediente.vecesUtilizado.toString().padStart(16)}`
            );
        });

        return resultados;
    }

    async promedioPreciosPorCategoria() {
        console.log('\n🔍 Calculando promedio de precios por categoría de pizza...\n');

        const pipeline = [
            // Agrupar por categoría
            {
                $group: {
                    _id: '$categoria',
                    precioPromedio: { $avg: '$precio' },
                    precioMinimo: { $min: '$precio' },
                    precioMaximo: { $max: '$precio' },
                    cantidadPizzas: { $sum: 1 }
                }
            },
            // Proyectar campos finales
            {
                $project: {
                    _id: 1,
                    categoria: '$_id',
                    precioPromedio: { $round: ['$precioPromedio', 2] },
                    precioMinimo: 1,
                    precioMaximo: 1,
                    cantidadPizzas: 1
                }
            },
            // Ordenar por precio promedio descendente
            {
                $sort: { precioPromedio: -1 }
            }
        ];

        const collection = this.db.getCollection('pizzas');
        const resultados = await collection.aggregate(pipeline).toArray();

        console.log('📊 PROMEDIO DE PRECIOS POR CATEGORÍA:');
        console.log('=' .repeat(90));
        console.log('Categoría | Precio Promedio | Precio Mín | Precio Máx | Cantidad Pizzas');
        console.log('-' .repeat(90));

        resultados.forEach(categoria => {
            console.log(
                `${categoria.categoria.padEnd(10)} | ` +
                `$${categoria.precioPromedio.toString().padStart(13)} | ` +
                `$${categoria.precioMinimo.toString().padStart(9)} | ` +
                `$${categoria.precioMaximo.toString().padStart(9)} | ` +
                `${categoria.cantidadPizzas.toString().padStart(15)}`
            );
        });

        return resultados;
    }

    async categoriaConMasVentas() {
        console.log('\n🔍 Analizando categoría de pizzas con más ventas históricas...\n');

        const pipeline = [
            // Descomponer el array de pizzas
            {
                $unwind: '$pizzas'
            },
            // Hacer lookup con la colección de pizzas
            {
                $lookup: {
                    from: 'pizzas',
                    localField: 'pizzas.pizzaId',
                    foreignField: '_id',
                    as: 'pizzaInfo'
                }
            },
            {
                $unwind: '$pizzaInfo'
            },
            // Agrupar por categoría
            {
                $group: {
                    _id: '$pizzaInfo.categoria',
                    totalVentas: { $sum: '$pizzaInfo.precio' },
                    cantidadPedidos: { $sum: 1 },
                    cantidadPizzas: { $sum: '$pizzas.cantidad' }
                }
            },
            // Proyectar campos finales
            {
                $project: {
                    _id: 1,
                    categoria: '$_id',
                    totalVentas: { $round: ['$totalVentas', 2] },
                    cantidadPedidos: 1,
                    cantidadPizzas: 1
                }
            },
            // Ordenar por total de ventas descendente
            {
                $sort: { totalVentas: -1 }
            }
        ];

        const collection = this.db.getCollection('pedidos');
        const resultados = await collection.aggregate(pipeline).toArray();

        console.log('📊 VENTAS POR CATEGORÍA DE PIZZA:');
        console.log('=' .repeat(85));
        console.log('Categoría | Total Ventas | Cantidad Pedidos | Cantidad Pizzas');
        console.log('-' .repeat(85));

        resultados.forEach(categoria => {
            console.log(
                `${categoria.categoria.padEnd(10)} | ` +
                `$${categoria.totalVentas.toString().padStart(11)} | ` +
                `${categoria.cantidadPedidos.toString().padStart(15)} | ` +
                `${categoria.cantidadPizzas.toString().padStart(15)}`
            );
        });

        if (resultados.length > 0) {
            console.log(`\n🏆 CATEGORÍA CON MÁS VENTAS: ${resultados[0].categoria}`);
            console.log(`💰 Total de ventas: $${resultados[0].totalVentas}`);
        }

        return resultados;
    }

    async reporteCompleto() {
        console.log('\n' + '='.repeat(100));
        console.log('🍕 REPORTE COMPLETO - PIZZA Y PUNTO');
        console.log('='.repeat(100));

        await this.ingredientesMasUtilizados();
        await this.promedioPreciosPorCategoria();
        await this.categoriaConMasVentas();

        console.log('\n' + '='.repeat(100));
        console.log('✅ Reporte completado');
        console.log('='.repeat(100));
    }
}

module.exports = ReporteService;