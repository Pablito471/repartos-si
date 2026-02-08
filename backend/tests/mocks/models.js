// Mocks de modelos para tests unitarios
const bcrypt = require("bcryptjs");

// Mock de Usuario
const mockUsuarios = [
  {
    id: 1,
    email: "cliente@test.com",
    password: bcrypt.hashSync("123456", 10),
    tipoUsuario: "cliente",
    nombre: "Cliente Test",
    telefono: "123456789",
    direccion: "Test Address",
    activo: true,
    empleadorId: null,
    tipoEmpleador: null,
    validarPassword: async function (pass) {
      return bcrypt.compareSync(pass, this.password);
    },
    toJSON: function () {
      const { password, ...rest } = this;
      return rest;
    },
  },
  {
    id: 2,
    email: "deposito@test.com",
    password: bcrypt.hashSync("123456", 10),
    tipoUsuario: "deposito",
    nombre: "Depósito Test",
    telefono: "987654321",
    direccion: "Warehouse Address",
    activo: true,
    empleadorId: null,
    tipoEmpleador: null,
    validarPassword: async function (pass) {
      return bcrypt.compareSync(pass, this.password);
    },
    toJSON: function () {
      const { password, ...rest } = this;
      return rest;
    },
  },
  {
    id: 3,
    email: "empleado@test.com",
    password: bcrypt.hashSync("123456", 10),
    tipoUsuario: "empleado",
    nombre: "Empleado Test",
    telefono: "555555555",
    direccion: "Employee Address",
    activo: true,
    empleadorId: 2,
    tipoEmpleador: "deposito",
    validarPassword: async function (pass) {
      return bcrypt.compareSync(pass, this.password);
    },
    toJSON: function () {
      const { password, ...rest } = this;
      return rest;
    },
  },
  {
    id: 4,
    email: "desactivado@test.com",
    password: bcrypt.hashSync("123456", 10),
    tipoUsuario: "cliente",
    nombre: "Usuario Desactivado",
    activo: false,
    validarPassword: async function (pass) {
      return bcrypt.compareSync(pass, this.password);
    },
    toJSON: function () {
      const { password, ...rest } = this;
      return rest;
    },
  },
];

// Mock de Producto
const mockProductos = [
  {
    id: 1,
    codigo: "123456789012",
    nombre: "Producto Test 1",
    categoria: "Categoría Test",
    precio: 100,
    precioVenta: 150,
    stock: 50,
    depositoId: 2,
    toJSON: function () {
      return { ...this };
    },
  },
  {
    id: 2,
    codigo: "987654321098",
    nombre: "Producto Test 2",
    categoria: "Categoría Test",
    precio: 200,
    precioVenta: 300,
    stock: 30,
    depositoId: 2,
    toJSON: function () {
      return { ...this };
    },
  },
];

// Mock de Movimiento
const mockMovimientos = [
  {
    id: 1,
    tipo: "venta",
    cantidad: 5,
    productoId: 1,
    depositoId: 2,
    clienteId: 1,
    empleadoId: 3,
    monto: 750,
    createdAt: new Date(),
    toJSON: function () {
      return { ...this };
    },
  },
];

// Funciones de mock
const Usuario = {
  findOne: jest.fn(({ where }) => {
    const user = mockUsuarios.find(
      (u) =>
        (where.email && u.email === where.email) ||
        (where.id && u.id === where.id),
    );
    return Promise.resolve(user || null);
  }),
  findByPk: jest.fn((id, options = {}) => {
    const user = mockUsuarios.find((u) => u.id === id);
    return Promise.resolve(user || null);
  }),
  findAll: jest.fn((options = {}) => {
    let result = [...mockUsuarios];
    if (options.where) {
      if (options.where.tipoUsuario) {
        result = result.filter(
          (u) => u.tipoUsuario === options.where.tipoUsuario,
        );
      }
      if (options.where.empleadorId) {
        result = result.filter(
          (u) => u.empleadorId === options.where.empleadorId,
        );
      }
    }
    return Promise.resolve(result);
  }),
  create: jest.fn((data) => {
    const newUser = {
      id: mockUsuarios.length + 1,
      ...data,
      password: bcrypt.hashSync(data.password, 10),
      activo: true,
      validarPassword: async function (pass) {
        return bcrypt.compareSync(pass, this.password);
      },
      toJSON: function () {
        const { password, ...rest } = this;
        return rest;
      },
    };
    mockUsuarios.push(newUser);
    return Promise.resolve(newUser);
  }),
  validarFortalezaPassword: jest.fn((password) => {
    if (password.length < 6) {
      return {
        valido: false,
        errores: ["La contraseña debe tener al menos 6 caracteres"],
      };
    }
    return { valido: true, errores: [] };
  }),
};

const Producto = {
  findOne: jest.fn(({ where }) => {
    const producto = mockProductos.find(
      (p) =>
        (where.codigo && p.codigo === where.codigo) ||
        (where.id && p.id === where.id),
    );
    return Promise.resolve(producto || null);
  }),
  findByPk: jest.fn((id) => {
    return Promise.resolve(mockProductos.find((p) => p.id === id) || null);
  }),
  findAll: jest.fn((options = {}) => {
    let result = [...mockProductos];
    if (options.where?.depositoId) {
      result = result.filter((p) => p.depositoId === options.where.depositoId);
    }
    return Promise.resolve(result);
  }),
  create: jest.fn((data) => {
    const newProduct = {
      id: mockProductos.length + 1,
      ...data,
      toJSON: function () {
        return { ...this };
      },
    };
    mockProductos.push(newProduct);
    return Promise.resolve(newProduct);
  }),
};

const Movimiento = {
  findOne: jest.fn((options = {}) => {
    const mov = mockMovimientos.find((m) => m.id === options.where?.id);
    return Promise.resolve(mov || null);
  }),
  findAll: jest.fn((options = {}) => {
    let result = [...mockMovimientos];
    if (options.where?.empleadoId) {
      result = result.filter((m) => m.empleadoId === options.where.empleadoId);
    }
    return Promise.resolve(result);
  }),
  create: jest.fn((data) => {
    const newMov = {
      id: mockMovimientos.length + 1,
      ...data,
      createdAt: new Date(),
      toJSON: function () {
        return { ...this };
      },
    };
    mockMovimientos.push(newMov);
    return Promise.resolve(newMov);
  }),
  sum: jest.fn(() => Promise.resolve(750)),
  count: jest.fn(() => Promise.resolve(1)),
};

const StockCliente = {
  findOne: jest.fn(() => Promise.resolve(null)),
  findAll: jest.fn(() => Promise.resolve([])),
  create: jest.fn((data) => Promise.resolve({ id: 1, ...data })),
};

// Mock de Pedido
const mockPedidos = [
  {
    id: "ped-1",
    numero: "PED-001",
    clienteId: 1,
    depositoId: 2,
    estado: "pendiente",
    total: 5000.0,
    direccion: "Calle Test 123",
    productos: [],
    createdAt: new Date(),
    toJSON: function () {
      return { ...this };
    },
  },
];

const Pedido = {
  findOne: jest.fn((options = {}) => {
    const pedido = mockPedidos.find((p) => p.id === options.where?.id);
    return Promise.resolve(pedido || null);
  }),
  findByPk: jest.fn((id) => {
    return Promise.resolve(mockPedidos.find((p) => p.id === id) || null);
  }),
  findAll: jest.fn((options = {}) => {
    return Promise.resolve([...mockPedidos]);
  }),
  create: jest.fn((data) => {
    const newPedido = {
      id: `ped-${mockPedidos.length + 1}`,
      numero: `PED-${String(mockPedidos.length + 1).padStart(3, "0")}`,
      ...data,
      createdAt: new Date(),
      toJSON: function () {
        return { ...this };
      },
    };
    mockPedidos.push(newPedido);
    return Promise.resolve(newPedido);
  }),
};

// Mock de Envio
const mockEnvios = [
  {
    id: "env-1",
    pedidoId: "ped-1",
    fleteId: 3,
    estado: "pendiente",
    fechaEstimada: new Date(),
    createdAt: new Date(),
    toJSON: function () {
      return { ...this };
    },
  },
];

const Envio = {
  findOne: jest.fn((options = {}) => {
    const envio = mockEnvios.find((e) => e.id === options.where?.id);
    return Promise.resolve(envio || null);
  }),
  findByPk: jest.fn((id) => {
    return Promise.resolve(mockEnvios.find((e) => e.id === id) || null);
  }),
  findAll: jest.fn((options = {}) => {
    return Promise.resolve([...mockEnvios]);
  }),
  create: jest.fn((data) => {
    const newEnvio = {
      id: `env-${mockEnvios.length + 1}`,
      ...data,
      createdAt: new Date(),
      toJSON: function () {
        return { ...this };
      },
    };
    mockEnvios.push(newEnvio);
    return Promise.resolve(newEnvio);
  }),
};

const sequelize = {
  authenticate: jest.fn(() => Promise.resolve()),
  sync: jest.fn(() => Promise.resolve()),
  transaction: jest.fn(() =>
    Promise.resolve({
      commit: jest.fn(),
      rollback: jest.fn(),
    }),
  ),
};

module.exports = {
  Usuario,
  Producto,
  Movimiento,
  StockCliente,
  Pedido,
  Envio,
  sequelize,
  mockUsuarios,
  mockProductos,
  mockMovimientos,
  mockPedidos,
  mockEnvios,
};
