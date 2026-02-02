import Swal from "sweetalert2";

// Alerta de éxito
export const showSuccessAlert = (title, text) => {
  return Swal.fire({
    icon: "success",
    title: title,
    text: text,
    confirmButtonColor: "#3B82F6",
  });
};

// Alerta de error
export const showErrorAlert = (title, text) => {
  return Swal.fire({
    icon: "error",
    title: title,
    text: text,
    confirmButtonColor: "#EF4444",
  });
};

// Alerta de advertencia
export const showWarningAlert = (title, text) => {
  return Swal.fire({
    icon: "warning",
    title: title,
    text: text,
    confirmButtonColor: "#F59E0B",
  });
};

// Alerta de información
export const showInfoAlert = (title, text) => {
  return Swal.fire({
    icon: "info",
    title: title,
    text: text,
    confirmButtonColor: "#3B82F6",
  });
};

// Alerta de confirmación
export const showConfirmAlert = async (title, text) => {
  const result = await Swal.fire({
    icon: "question",
    title: title,
    text: text,
    showCancelButton: true,
    confirmButtonColor: "#3B82F6",
    cancelButtonColor: "#6B7280",
    confirmButtonText: "Sí, confirmar",
    cancelButtonText: "Cancelar",
  });
  return result.isConfirmed;
};

// Toast notification
export const showToast = (icon, title) => {
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });

  return Toast.fire({
    icon: icon,
    title: title,
  });
};

// Alerta de carga
export const showLoadingAlert = (title = "Cargando...") => {
  return Swal.fire({
    title: title,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

// Cerrar alerta
export const closeAlert = () => {
  Swal.close();
};
