/**
 * Configuración centralizada de la URL de la API del backend.
 * Permite cambiar el puerto o entorno de forma global mediante variables de entorno Vite.
 */
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
