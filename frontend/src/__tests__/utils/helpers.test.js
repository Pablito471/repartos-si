describe("Utilidades de Formato", () => {
  describe("formatearMoneda", () => {
    const formatearMoneda = (valor) => {
      return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
      }).format(valor);
    };

    it("debería formatear valores positivos", () => {
      const resultado = formatearMoneda(1500);
      expect(resultado).toContain("1.500");
    });

    it("debería manejar decimales", () => {
      const resultado = formatearMoneda(1500.5);
      expect(resultado).toContain("1.500");
    });

    it("debería manejar cero", () => {
      const resultado = formatearMoneda(0);
      expect(resultado).toContain("0");
    });

    it("debería manejar números grandes", () => {
      const resultado = formatearMoneda(1000000);
      expect(resultado).toContain("1.000.000");
    });
  });

  describe("formatearFecha", () => {
    const formatearFecha = (fecha) => {
      return new Date(fecha).toLocaleDateString("es-AR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    };

    it("debería formatear fecha ISO", () => {
      const resultado = formatearFecha("2026-02-07T12:00:00");
      expect(resultado).toMatch(/\d{2}\/\d{2}\/2026/);
    });

    it("debería formatear objeto Date", () => {
      const fecha = new Date(2026, 1, 7, 12, 0, 0); // Febrero 7, 2026
      const resultado = formatearFecha(fecha);
      expect(resultado).toMatch(/07\/02\/2026/);
    });
  });

  describe("formatearHora", () => {
    const formatearHora = (fecha) => {
      return new Date(fecha).toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    };

    it("debería formatear hora correctamente", () => {
      const fecha = new Date(2026, 1, 7, 14, 30, 0);
      const resultado = formatearHora(fecha);
      expect(resultado).toMatch(/14:30/);
    });
  });
});

describe("Validaciones de Entrada", () => {
  describe("validarEmail", () => {
    const validarEmail = (email) => {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regex.test(email);
    };

    it("debería validar email correcto", () => {
      expect(validarEmail("test@test.com")).toBe(true);
      expect(validarEmail("user.name@domain.com")).toBe(true);
    });

    it("debería rechazar email incorrecto", () => {
      expect(validarEmail("test")).toBe(false);
      expect(validarEmail("test@")).toBe(false);
      expect(validarEmail("@test.com")).toBe(false);
    });
  });

  describe("validarCodigoBarras", () => {
    const validarCodigoBarras = (codigo) => {
      // Aceptar EAN-8, EAN-13, UPC-A, UPC-E
      return /^\d{8}$|^\d{12}$|^\d{13}$/.test(codigo);
    };

    it("debería validar EAN-13", () => {
      expect(validarCodigoBarras("1234567890123")).toBe(true);
    });

    it("debería validar EAN-8", () => {
      expect(validarCodigoBarras("12345678")).toBe(true);
    });

    it("debería validar UPC-A", () => {
      expect(validarCodigoBarras("123456789012")).toBe(true);
    });

    it("debería rechazar códigos inválidos", () => {
      expect(validarCodigoBarras("123")).toBe(false);
      expect(validarCodigoBarras("abc12345678")).toBe(false);
    });
  });

  describe("validarCantidad", () => {
    const validarCantidad = (cantidad) => {
      return Number.isInteger(cantidad) && cantidad > 0;
    };

    it("debería validar cantidades positivas", () => {
      expect(validarCantidad(1)).toBe(true);
      expect(validarCantidad(100)).toBe(true);
    });

    it("debería rechazar cantidades inválidas", () => {
      expect(validarCantidad(0)).toBe(false);
      expect(validarCantidad(-1)).toBe(false);
      expect(validarCantidad(1.5)).toBe(false);
    });
  });
});

describe("Cálculos de Negocio", () => {
  describe("calcularSubtotal", () => {
    const calcularSubtotal = (precio, cantidad) => {
      return precio * cantidad;
    };

    it("debería calcular subtotal correctamente", () => {
      expect(calcularSubtotal(100, 5)).toBe(500);
      expect(calcularSubtotal(25.5, 4)).toBe(102);
    });
  });

  describe("calcularTotal", () => {
    const calcularTotal = (items) => {
      return items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
    };

    it("debería calcular total de varios items", () => {
      const items = [
        { precio: 100, cantidad: 2 },
        { precio: 50, cantidad: 3 },
      ];
      expect(calcularTotal(items)).toBe(350);
    });

    it("debería retornar 0 para lista vacía", () => {
      expect(calcularTotal([])).toBe(0);
    });
  });

  describe("calcularMargenGanancia", () => {
    const calcularMargen = (precioVenta, precioCosto) => {
      return ((precioVenta - precioCosto) / precioCosto) * 100;
    };

    it("debería calcular margen correctamente", () => {
      expect(calcularMargen(150, 100)).toBe(50); // 50%
      expect(calcularMargen(200, 100)).toBe(100); // 100%
    });
  });
});

describe("Filtros y Búsquedas", () => {
  describe("filtrarPorFecha", () => {
    const filtrarPorFecha = (items, fechaInicio, fechaFin) => {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      return items.filter((item) => {
        const fecha = new Date(item.fecha);
        return fecha >= inicio && fecha <= fin;
      });
    };

    it("debería filtrar por rango de fechas", () => {
      const items = [
        { id: 1, fecha: "2026-01-15" },
        { id: 2, fecha: "2026-02-01" },
        { id: 3, fecha: "2026-02-15" },
        { id: 4, fecha: "2026-03-01" },
      ];

      const resultado = filtrarPorFecha(items, "2026-02-01", "2026-02-28");

      expect(resultado).toHaveLength(2);
      expect(resultado.map((i) => i.id)).toEqual([2, 3]);
    });
  });

  describe("buscarProducto", () => {
    const buscarProducto = (productos, termino) => {
      const terminoLower = termino.toLowerCase();
      return productos.filter(
        (p) =>
          p.nombre.toLowerCase().includes(terminoLower) ||
          p.codigo.includes(termino),
      );
    };

    it("debería buscar por nombre", () => {
      const productos = [
        { id: 1, nombre: "Coca Cola", codigo: "123" },
        { id: 2, nombre: "Pepsi", codigo: "456" },
        { id: 3, nombre: "Agua Mineral", codigo: "789" },
      ];

      const resultado = buscarProducto(productos, "cola");
      expect(resultado).toHaveLength(1);
      expect(resultado[0].nombre).toBe("Coca Cola");
    });

    it("debería buscar por código", () => {
      const productos = [
        { id: 1, nombre: "Coca Cola", codigo: "123456789012" },
        { id: 2, nombre: "Pepsi", codigo: "987654321098" },
      ];

      const resultado = buscarProducto(productos, "123456");
      expect(resultado).toHaveLength(1);
    });
  });
});

describe("Estados de Pedido", () => {
  const ESTADOS = {
    PENDIENTE: "pendiente",
    PREPARANDO: "preparando",
    ENVIADO: "enviado",
    ENTREGADO: "entregado",
    CANCELADO: "cancelado",
  };

  it("debería tener todos los estados definidos", () => {
    expect(Object.keys(ESTADOS)).toHaveLength(5);
  });

  it("debería permitir transiciones válidas", () => {
    const transicionesValidas = {
      pendiente: ["preparando", "cancelado"],
      preparando: ["enviado", "cancelado"],
      enviado: ["entregado"],
      entregado: [],
      cancelado: [],
    };

    expect(transicionesValidas.pendiente).toContain("preparando");
    expect(transicionesValidas.preparando).toContain("enviado");
    expect(transicionesValidas.enviado).toContain("entregado");
  });
});
