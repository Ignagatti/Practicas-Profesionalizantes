import { useEffect, useState } from 'react';
import {
    obtenerClientes,
    crearCliente,
    actualizarCliente,
    bloquearCliente,
    desbloquearCliente
} from '../services/clientesService';

const clienteInicial = {
    Nombre: '',
    Apellido: '',
    Telefono: '',
    CUIT_CUIL: '',
    Email: '',
    Razon_Social: ''
};

function Clientes() {
    const [clientes, setClientes] = useState([]);
    const [formulario, setFormulario] = useState(clienteInicial);
    const [clienteEditando, setClienteEditando] = useState(null);
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');
    const [busqueda, setBusqueda] = useState('');

    const cargarClientes = async () => {
        try {
            const data = await obtenerClientes();
            setClientes(data);
        } catch (error) {
            setError('Error al cargar clientes');
        }
    };

    useEffect(() => {
        cargarClientes();
    }, []);

    const manejarCambio = (e) => {
        setFormulario({
            ...formulario,
            [e.target.name]: e.target.value
        });
    };

    const limpiarFormulario = () => {
        setFormulario(clienteInicial);
        setClienteEditando(null);
    };

    const guardarCliente = async (e) => {
        e.preventDefault();
        setMensaje('');
        setError('');

        try {
            if (clienteEditando) {
                await actualizarCliente(clienteEditando.Id_Cliente, formulario);
                setMensaje('Cliente actualizado correctamente');
            } else {
                await crearCliente(formulario);
                setMensaje('Cliente creado correctamente');
            }

            limpiarFormulario();
            cargarClientes();
        } catch (error) {
            setError(error.message);
        }
    };

    const editarCliente = (cliente) => {
        setClienteEditando(cliente);
        setFormulario({
            Nombre: cliente.Nombre || '',
            Apellido: cliente.Apellido || '',
            Telefono: cliente.Telefono || '',
            CUIT_CUIL: cliente.CUIT_CUIL || '',
            Email: cliente.Email || '',
            Razon_Social: cliente.Razon_Social || ''
        });
    };

    const bloquear = async (id) => {
        try {
            await bloquearCliente(id);
            setMensaje('Cliente bloqueado correctamente');
            cargarClientes();
        } catch (error) {
            setError(error.message);
        }
    };

    const desbloquear = async (id) => {
        try {
            await desbloquearCliente(id);
            setMensaje('Cliente desbloqueado correctamente');
            cargarClientes();
        } catch (error) {
            setError(error.message);
        }
    };

    const clientesFiltrados = clientes.filter((cliente) => {
        const texto = `${cliente.Nombre} ${cliente.Apellido} ${cliente.Email} ${cliente.CUIT_CUIL}`.toLowerCase();
        return texto.includes(busqueda.toLowerCase());
    });

    return (
        <div className="contenedor">
            <h1>Gestión de Clientes</h1>

            {mensaje && <p className="mensaje-exito">{mensaje}</p>}
            {error && <p className="mensaje-error">{error}</p>}

            <form onSubmit={guardarCliente} className="formulario">
                <h2>{clienteEditando ? 'Editar cliente' : 'Agregar cliente'}</h2>

                <input
                    type="text"
                    name="Nombre"
                    placeholder="Nombre"
                    value={formulario.Nombre}
                    onChange={manejarCambio}
                />

                <input
                    type="text"
                    name="Apellido"
                    placeholder="Apellido"
                    value={formulario.Apellido}
                    onChange={manejarCambio}
                />

                <input
                    type="text"
                    name="Telefono"
                    placeholder="Teléfono"
                    value={formulario.Telefono}
                    onChange={manejarCambio}
                />

                <input
                    type="text"
                    name="CUIT_CUIL"
                    placeholder="CUIT/CUIL"
                    value={formulario.CUIT_CUIL}
                    onChange={manejarCambio}
                />

                <input
                    type="email"
                    name="Email"
                    placeholder="Email"
                    value={formulario.Email}
                    onChange={manejarCambio}
                />

                <input
                    type="text"
                    name="Razon_Social"
                    placeholder="Razón social"
                    value={formulario.Razon_Social}
                    onChange={manejarCambio}
                />

                <button type="submit">
                    {clienteEditando ? 'Actualizar cliente' : 'Guardar cliente'}
                </button>

                {clienteEditando && (
                    <button type="button" onClick={limpiarFormulario}>
                        Cancelar edición
                    </button>
                )}
            </form>

            <div className="buscador">
                <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Teléfono</th>
                        <th>Email</th>
                        <th>CUIT/CUIL</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>

                <tbody>
                    {clientesFiltrados.map((cliente) => (
                        <tr key={cliente.Id_Cliente}>
                            <td>{cliente.Nombre} {cliente.Apellido}</td>
                            <td>{cliente.Telefono}</td>
                            <td>{cliente.Email}</td>
                            <td>{cliente.CUIT_CUIL}</td>
                            <td>{cliente.Estado}</td>
                            <td>
                                <button onClick={() => editarCliente(cliente)}>
                                    Editar
                                </button>

                                {cliente.Estado === 'activo' ? (
                                    <button onClick={() => bloquear(cliente.Id_Cliente)}>
                                        Bloquear
                                    </button>
                                ) : (
                                    <button onClick={() => desbloquear(cliente.Id_Cliente)}>
                                        Desbloquear
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default Clientes;