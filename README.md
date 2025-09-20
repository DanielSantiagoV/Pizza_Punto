# 🍕 Pizza y Punto - Sistema de Gestión

Sistema completo de gestión para pizzerías desarrollado en Node.js con MongoDB, implementando transacciones y consultas con Aggregation Framework.

## 📋 Descripción del Sistema

**Pizza y Punto** es una aplicación de consola que permite gestionar todos los aspectos de una pizzería:

- ✅ **Gestión de Pedidos**: Realización de pedidos con transacciones atómicas
- 🧀 **Control de Inventario**: Monitoreo y actualización de ingredientes
- 🛵 **Asignación de Repartidores**: Sistema automático de asignación
- 📊 **Reportes Avanzados**: Análisis de ventas e ingredientes con Aggregation Framework
- 👥 **Gestión de Clientes**: Registro y búsqueda de clientes
- 🍕 **Menú de Pizzas**: Catálogo completo con categorías

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js (versión 14 o superior)
- MongoDB (versión 4.4 o superior)

### Instalación

1. **Clonar o descargar el proyecto**
```bash
# Si tienes git
git clone <url-del-repositorio>
cd pizza-y-punto

# O simplemente navegar al directorio del proyecto
cd pizza-y-punto
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar MongoDB**
   - Asegúrate de que MongoDB esté ejecutándose en `mongodb://localhost:27017`
   - O configura la variable de entorno `MONGODB_URI` con tu conexión

4. **Ejecutar la aplicación**
```bash
npm start
```

## 🎮 Comandos Disponibles

### Menú Principal

Al ejecutar la aplicación, tendrás acceso a las siguientes opciones:

#### 🍕 Realizar Pedido
- Permite crear un nuevo pedido
- Busca o crea clientes automáticamente
- Verifica disponibilidad de ingredientes
- Asigna repartidores automáticamente
- **Utiliza transacciones** para garantizar consistencia

#### 📋 Ver Menú de Pizzas
- Muestra todas las pizzas disponibles
- Organizadas por categorías
- Incluye precios e ingredientes

#### 👤 Gestionar Clientes
- Ver todos los clientes registrados
- Agregar nuevos clientes
- Buscar clientes por teléfono

#### 🧀 Gestionar Ingredientes
- Ver inventario completo
- Agregar nuevos ingredientes
- Actualizar stock disponible
- Indicadores visuales de stock bajo

#### 🛵 Gestionar Repartidores
- Ver estado de todos los repartidores
- Agregar nuevos repartidores
- Cambiar estado (disponible/ocupado)

#### 📊 Ver Reportes
- **Ingredientes más utilizados** (último mes)
- **Promedio de precios por categoría**
- **Categoría con más ventas históricas**
- **Reporte completo** con todos los análisis

#### 📦 Ver Pedidos
- Listar todos los pedidos
- Buscar pedidos por ID
- Cancelar pedidos (con reversión de transacción)

## 🔄 Estructura de Transacciones

### Función `realizarPedido(clienteId, pizzaIds[])`

La función implementa una transacción completa que garantiza la consistencia de datos:

```javascript
await session.withTransaction(async () => {
    // 1. Verificar cliente existe
    // 2. Verificar pizzas existen
    // 3. Verificar stock de ingredientes
    // 4. Restar ingredientes del inventario
    // 5. Asignar repartidor disponible
    // 6. Crear pedido
});
```

**Características de la transacción:**
- ✅ **Atómica**: Todo se ejecuta o nada se ejecuta
- ✅ **Consistente**: Los datos siempre están en estado válido
- ✅ **Aislada**: No interfiere con otras operaciones
- ✅ **Durable**: Los cambios se persisten correctamente

**Si falla cualquier paso:**
- Se revierten todos los cambios
- Se liberan recursos reservados
- Se mantiene la integridad de los datos

### Función `cancelarPedido(pedidoId)`

Permite cancelar pedidos con reversión completa:

```javascript
await session.withTransaction(async () => {
    // 1. Obtener pedido
    // 2. Devolver ingredientes al inventario
    // 3. Liberar repartidor
    // 4. Marcar pedido como cancelado
});
```

## 📊 Consultas con Aggregation Framework

### 1. Ingredientes Más Utilizados (Último Mes)

```javascript
const pipeline = [
    { $match: { fecha: { $gte: unMesAtras } } },
    { $unwind: '$pizzas' },
    { $lookup: { from: 'pizzas', localField: 'pizzas.pizzaId', foreignField: '_id', as: 'pizzaInfo' } },
    { $unwind: '$pizzaInfo' },
    { $unwind: '$pizzaInfo.ingredientes' },
    { $group: { _id: '$pizzaInfo.ingredientes.ingredienteId', cantidadTotal: { $sum: '$pizzaInfo.ingredientes.cantidad' } } },
    { $lookup: { from: 'ingredientes', localField: '_id', foreignField: '_id', as: 'ingredienteInfo' } },
    { $sort: { cantidadTotal: -1 } },
    { $limit: 10 }
];
```

### 2. Promedio de Precios por Categoría

```javascript
const pipeline = [
    { $group: { _id: '$categoria', precioPromedio: { $avg: '$precio' }, cantidadPizzas: { $sum: 1 } } },
    { $project: { categoria: '$_id', precioPromedio: { $round: ['$precioPromedio', 2] }, cantidadPizzas: 1 } },
    { $sort: { precioPromedio: -1 } }
];
```

### 3. Categoría con Más Ventas Históricas

```javascript
const pipeline = [
    { $unwind: '$pizzas' },
    { $lookup: { from: 'pizzas', localField: 'pizzas.pizzaId', foreignField: '_id', as: 'pizzaInfo' } },
    { $unwind: '$pizzaInfo' },
    { $group: { _id: '$pizzaInfo.categoria', totalVentas: { $sum: '$pizzaInfo.precio' }, cantidadPedidos: { $sum: 1 } } },
    { $sort: { totalVentas: -1 } }
];
```

## 🗂️ Estructura del Proyecto

```
pizza-y-punto/
├── config/
│   └── database.js          # Configuración de MongoDB
├── models/
│   ├── Ingrediente.js       # Modelo de ingredientes
│   ├── Pizza.js            # Modelo de pizzas
│   ├── Cliente.js          # Modelo de clientes
│   ├── Repartidor.js       # Modelo de repartidores
│   └── Pedido.js           # Modelo de pedidos
├── services/
│   ├── PedidoService.js    # Lógica de transacciones
│   └── ReporteService.js   # Consultas con Aggregation
├── cli/
│   └── menu.js             # Interfaz de usuario CLI
├── data/
│   └── seedData.js         # Datos de ejemplo
├── index.js                # Punto de entrada
├── package.json            # Dependencias y scripts
├── .gitignore             # Archivos a ignorar
└── README.md              # Documentación
```

## 🗄️ Modelo de Datos

### Colecciones MongoDB

#### `ingredientes`
```javascript
{
    _id: ObjectId,
    nombre: String,
    tipo: String, // queso, salsa, topping, etc.
    stock: Number,
    createdAt: Date,
    updatedAt: Date
}
```

#### `pizzas`
```javascript
{
    _id: ObjectId,
    nombre: String,
    categoria: String, // tradicional, especial, vegana
    precio: Number,
    ingredientes: [{
        ingredienteId: ObjectId,
        cantidad: Number
    }],
    createdAt: Date,
    updatedAt: Date
}
```

#### `clientes`
```javascript
{
    _id: ObjectId,
    nombre: String,
    telefono: String,
    direccion: String,
    createdAt: Date,
    updatedAt: Date
}
```

#### `repartidores`
```javascript
{
    _id: ObjectId,
    nombre: String,
    zona: String,
    estado: String, // disponible, ocupado
    createdAt: Date,
    updatedAt: Date
}
```

#### `pedidos`
```javascript
{
    _id: ObjectId,
    clienteId: ObjectId,
    pizzas: [{
        pizzaId: ObjectId,
        cantidad: Number
    }],
    total: Number,
    fecha: Date,
    repartidorAsignado: ObjectId,
    estado: String, // pendiente, en_proceso, entregado, cancelado
    createdAt: Date,
    updatedAt: Date
}
```

## 🎯 Ejemplos de Uso

### Realizar un Pedido
1. Ejecuta `npm start`
2. Selecciona "🍕 Realizar Pedido"
3. Busca o crea un cliente
4. Selecciona las pizzas deseadas
5. El sistema automáticamente:
   - Verifica ingredientes disponibles
   - Asigna un repartidor
   - Crea el pedido con transacción

### Ver Reportes
1. Selecciona "📊 Ver Reportes"
2. Elige el tipo de reporte:
   - **Ingredientes más utilizados**: Top 10 del último mes
   - **Promedio de precios**: Por categoría de pizza
   - **Categoría con más ventas**: Análisis histórico
   - **Reporte completo**: Todos los análisis

### Gestionar Inventario
1. Selecciona "🧀 Gestionar Ingredientes"
2. Opciones disponibles:
   - Ver inventario con indicadores de stock
   - Agregar nuevos ingredientes
   - Actualizar cantidades disponibles

## 🔧 Configuración Avanzada

### Variables de Entorno

```bash
# MongoDB connection string
MONGODB_URI=mongodb://localhost:27017

# Database name
DB_NAME=pizza_y_punto
```

### Scripts Disponibles

```bash
# Ejecutar aplicación
npm start

# Modo desarrollo
npm run dev
```

## 🐛 Solución de Problemas

### Error de Conexión a MongoDB
- Verifica que MongoDB esté ejecutándose
- Comprueba la URI de conexión
- Asegúrate de que el puerto 27017 esté disponible

### Error de Transacciones
- Verifica que MongoDB soporte transacciones (versión 4.0+)
- Asegúrate de usar un replica set para transacciones distribuidas

### Datos de Ejemplo
- La aplicación incluye datos de ejemplo que se cargan automáticamente
- Incluye 8 pizzas, 25+ ingredientes, 8 clientes y 6 repartidores

## 📝 Características Técnicas

- ✅ **Node.js** con estructura modular
- ✅ **MongoDB** nativo (sin Mongoose)
- ✅ **Transacciones** atómicas
- ✅ **Aggregation Framework** para reportes
- ✅ **Interfaz CLI** con inquirer
- ✅ **Manejo de errores** robusto
- ✅ **Datos de ejemplo** incluidos

## 🤝 Contribuciones

Este proyecto fue desarrollado como parte de un taller académico. Para contribuir:

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

MIT License - Ver archivo LICENSE para más detalles.

---

**¡Disfruta gestionando tu pizzería con Pizza y Punto! 🍕**