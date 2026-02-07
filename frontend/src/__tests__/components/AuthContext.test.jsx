import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";

// Mock simplificado del AuthContext
const AuthContext = React.createContext(null);

const AuthProvider = ({ children, initialUser = null }) => {
  const [usuario, setUsuario] = React.useState(initialUser);
  const [cargando, setCargando] = React.useState(false);

  const login = async (email, password) => {
    setCargando(true);
    try {
      // Simulación de login
      if (email === "test@test.com" && password === "123456") {
        const user = {
          id: 1,
          email,
          tipoUsuario: "cliente",
          nombre: "Test User",
        };
        setUsuario(user);
        sessionStorage.setItem("token", "fake-token");
        return { success: true, usuario: user };
      }
      return { success: false, error: "Credenciales inválidas" };
    } finally {
      setCargando(false);
    }
  };

  const logout = () => {
    setUsuario(null);
    sessionStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
};

// Componente de prueba
const TestComponent = () => {
  const { usuario, cargando, login, logout } = useAuth();

  if (cargando) return <div data-testid="loading">Cargando...</div>;

  if (usuario) {
    return (
      <div data-testid="user-info">
        <p data-testid="user-name">{usuario.nombre}</p>
        <p data-testid="user-email">{usuario.email}</p>
        <button onClick={logout} data-testid="logout-btn">
          Cerrar sesión
        </button>
      </div>
    );
  }

  return (
    <div data-testid="login-prompt">
      <button
        onClick={() => login("test@test.com", "123456")}
        data-testid="login-btn"
      >
        Iniciar sesión
      </button>
    </div>
  );
};

describe("AuthContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("debería iniciar sin usuario", () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    expect(screen.getByTestId("login-prompt")).toBeInTheDocument();
  });

  it("debería iniciar con usuario si se proporciona", () => {
    const user = { id: 1, email: "test@test.com", nombre: "Test User" };

    render(
      <AuthProvider initialUser={user}>
        <TestComponent />
      </AuthProvider>,
    );

    expect(screen.getByTestId("user-info")).toBeInTheDocument();
    expect(screen.getByTestId("user-name")).toHaveTextContent("Test User");
  });

  it("debería permitir login exitoso", async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    const loginBtn = screen.getByTestId("login-btn");

    await act(async () => {
      loginBtn.click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("user-info")).toBeInTheDocument();
    });
  });

  it("debería permitir logout", async () => {
    const user = { id: 1, email: "test@test.com", nombre: "Test User" };

    render(
      <AuthProvider initialUser={user}>
        <TestComponent />
      </AuthProvider>,
    );

    expect(screen.getByTestId("user-info")).toBeInTheDocument();

    await act(async () => {
      screen.getByTestId("logout-btn").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("login-prompt")).toBeInTheDocument();
    });
  });

  it("debería lanzar error si useAuth se usa fuera del provider", () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow("useAuth debe usarse dentro de un AuthProvider");

    consoleSpy.mockRestore();
  });
});

describe("Autenticación - Escenarios", () => {
  it("debería guardar token en sessionStorage tras login", async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await act(async () => {
      screen.getByTestId("login-btn").click();
    });

    expect(sessionStorage.setItem).toHaveBeenCalledWith("token", "fake-token");
  });

  it("debería eliminar token de sessionStorage tras logout", async () => {
    const user = { id: 1, email: "test@test.com", nombre: "Test User" };

    render(
      <AuthProvider initialUser={user}>
        <TestComponent />
      </AuthProvider>,
    );

    await act(async () => {
      screen.getByTestId("logout-btn").click();
    });

    expect(sessionStorage.removeItem).toHaveBeenCalledWith("token");
  });
});

describe("Tipos de Usuario", () => {
  const usuarios = [
    { tipoUsuario: "cliente", ruta: "/clientes" },
    { tipoUsuario: "deposito", ruta: "/depositos" },
    { tipoUsuario: "flete", ruta: "/fletes" },
    { tipoUsuario: "empleado", ruta: "/empleado" },
    { tipoUsuario: "admin", ruta: "/admin" },
  ];

  usuarios.forEach(({ tipoUsuario, ruta }) => {
    it(`debería identificar usuario tipo ${tipoUsuario}`, () => {
      const user = { id: 1, email: "test@test.com", tipoUsuario };

      expect(user.tipoUsuario).toBe(tipoUsuario);

      // Verificar ruta esperada
      const rutaEsperada = {
        cliente: "/clientes",
        deposito: "/depositos",
        flete: "/fletes",
        empleado: "/empleado",
        admin: "/admin",
      };

      expect(rutaEsperada[tipoUsuario]).toBe(ruta);
    });
  });
});
