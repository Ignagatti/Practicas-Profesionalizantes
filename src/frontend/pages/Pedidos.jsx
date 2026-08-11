import React, { useState } from 'react';
import { PedidosCliente } from './PedidosCliente';
import { PedidosProveedor } from './PedidosProveedor';

export function Pedidos() {
  const [tipoVista, setTipoVista] = useState("cliente");

  return tipoVista === "cliente" ? (
    <PedidosCliente tipoVista={tipoVista} setTipoVista={setTipoVista} />
  ) : (
    <PedidosProveedor tipoVista={tipoVista} setTipoVista={setTipoVista} />
  );
}
