import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock del componente StarRating
const StarRating = ({ rating, onRatingChange, readOnly = false }) => {
  return (
    <div data-testid="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          data-testid={`star-${star}`}
          onClick={() => !readOnly && onRatingChange?.(star)}
          aria-label={`${star} estrellas`}
        >
          {star <= rating ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
};

describe("StarRating Component", () => {
  it("debería renderizar 5 estrellas", () => {
    render(<StarRating rating={0} />);

    expect(screen.getByTestId("star-1")).toBeInTheDocument();
    expect(screen.getByTestId("star-5")).toBeInTheDocument();
  });

  it("debería mostrar estrellas llenas según el rating", () => {
    render(<StarRating rating={3} />);

    expect(screen.getByTestId("star-1")).toHaveTextContent("★");
    expect(screen.getByTestId("star-3")).toHaveTextContent("★");
    expect(screen.getByTestId("star-4")).toHaveTextContent("☆");
  });

  it("debería llamar onRatingChange al hacer click", () => {
    const mockOnChange = jest.fn();
    render(<StarRating rating={0} onRatingChange={mockOnChange} />);

    fireEvent.click(screen.getByTestId("star-4"));

    expect(mockOnChange).toHaveBeenCalledWith(4);
  });

  it("no debería llamar onRatingChange si es readOnly", () => {
    const mockOnChange = jest.fn();
    render(<StarRating rating={3} onRatingChange={mockOnChange} readOnly />);

    fireEvent.click(screen.getByTestId("star-5"));

    expect(mockOnChange).not.toHaveBeenCalled();
  });
});

// Mock del componente de botón genérico
const Button = ({
  children,
  onClick,
  disabled = false,
  variant = "primary",
}) => {
  return (
    <button
      data-testid="button"
      onClick={onClick}
      disabled={disabled}
      className={variant}
    >
      {children}
    </button>
  );
};

describe("Button Component", () => {
  it("debería renderizar con el texto correcto", () => {
    render(<Button>Click me</Button>);

    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("debería llamar onClick cuando se hace click", () => {
    const mockOnClick = jest.fn();
    render(<Button onClick={mockOnClick}>Click</Button>);

    fireEvent.click(screen.getByTestId("button"));

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it("no debería llamar onClick si está disabled", () => {
    const mockOnClick = jest.fn();
    render(
      <Button onClick={mockOnClick} disabled>
        Click
      </Button>,
    );

    fireEvent.click(screen.getByTestId("button"));

    expect(mockOnClick).not.toHaveBeenCalled();
  });
});

// Mock de un formulario de login
const LoginForm = ({ onSubmit }) => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} data-testid="login-form">
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        data-testid="email-input"
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        data-testid="password-input"
      />
      <button type="submit" data-testid="submit-button">
        Iniciar Sesión
      </button>
    </form>
  );
};

describe("LoginForm Component", () => {
  it("debería renderizar el formulario", () => {
    render(<LoginForm onSubmit={jest.fn()} />);

    expect(screen.getByTestId("email-input")).toBeInTheDocument();
    expect(screen.getByTestId("password-input")).toBeInTheDocument();
    expect(screen.getByTestId("submit-button")).toBeInTheDocument();
  });

  it("debería actualizar valores de input", () => {
    render(<LoginForm onSubmit={jest.fn()} />);

    const emailInput = screen.getByTestId("email-input");
    const passwordInput = screen.getByTestId("password-input");

    fireEvent.change(emailInput, { target: { value: "test@test.com" } });
    fireEvent.change(passwordInput, { target: { value: "123456" } });

    expect(emailInput.value).toBe("test@test.com");
    expect(passwordInput.value).toBe("123456");
  });

  it("debería llamar onSubmit con los datos correctos", () => {
    const mockSubmit = jest.fn();
    render(<LoginForm onSubmit={mockSubmit} />);

    fireEvent.change(screen.getByTestId("email-input"), {
      target: { value: "user@test.com" },
    });
    fireEvent.change(screen.getByTestId("password-input"), {
      target: { value: "password123" },
    });
    fireEvent.submit(screen.getByTestId("login-form"));

    expect(mockSubmit).toHaveBeenCalledWith({
      email: "user@test.com",
      password: "password123",
    });
  });
});
