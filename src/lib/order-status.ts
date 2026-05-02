/**
 * Order status mapping — DB enum → Spanish label (Salvadoran-neutral).
 *
 * Drop 003 — CRITICAL — fixes raw English values shown to customers.
 *
 * Usage:
 *   import { orderStatusLabel, orderStatusColor } from '@/lib/order-status';
 *   const label = orderStatusLabel(order.status);
 */

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'failed';

const LABELS: Record<OrderStatus, string> = {
  pending: 'Pedido recibido',
  confirmed: 'Confirmado',
  in_progress: 'En preparación',
  preparing: 'En preparación',
  ready: 'Listo para entrega',
  out_for_delivery: 'En camino',
  delivered: 'Entregado',
  completed: 'Completado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
  failed: 'Falló el pago',
};

const DESCRIPTIONS: Record<OrderStatus, string> = {
  pending: 'Tu pedido fue recibido y está esperando confirmación.',
  confirmed: 'Confirmamos tu pedido. Pronto empezaremos a prepararlo.',
  in_progress: 'Estamos preparando tu pedido en este momento.',
  preparing: 'Estamos preparando tu pedido en este momento.',
  ready: 'Tu pedido está listo. Pronto saldrá para entrega.',
  out_for_delivery: 'El repartidor va en camino a tu dirección.',
  delivered: '¡Tu pedido fue entregado! Esperamos que lo disfrutes.',
  completed: 'Pedido completado. ¡Gracias por tu preferencia!',
  cancelled: 'Este pedido fue cancelado.',
  refunded: 'El monto fue reembolsado a tu método de pago.',
  failed: 'Hubo un problema con el pago. Contáctanos para ayudarte.',
};

// Tailwind classes — adjust to your design system if needed.
const COLORS: Record<OrderStatus, { bg: string; text: string; dot: string }> = {
  pending:          { bg: 'bg-amber-500/10',  text: 'text-amber-400',  dot: 'bg-amber-500' },
  confirmed:        { bg: 'bg-blue-500/10',   text: 'text-blue-400',   dot: 'bg-blue-500' },
  in_progress:      { bg: 'bg-orange-500/10', text: 'text-orange-400', dot: 'bg-orange-500' },
  preparing:        { bg: 'bg-orange-500/10', text: 'text-orange-400', dot: 'bg-orange-500' },
  ready:            { bg: 'bg-cyan-500/10',   text: 'text-cyan-400',   dot: 'bg-cyan-500' },
  out_for_delivery: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', dot: 'bg-indigo-500' },
  delivered:        { bg: 'bg-green-500/10',  text: 'text-green-400',  dot: 'bg-green-500' },
  completed:        { bg: 'bg-green-500/10',  text: 'text-green-400',  dot: 'bg-green-500' },
  cancelled:        { bg: 'bg-neutral-500/10', text: 'text-neutral-400', dot: 'bg-neutral-500' },
  refunded:         { bg: 'bg-purple-500/10', text: 'text-purple-400', dot: 'bg-purple-500' },
  failed:           { bg: 'bg-red-500/10',    text: 'text-red-400',    dot: 'bg-red-500' },
};

// Progress order for timeline UI (0 = start, 5 = done)
const PROGRESS: Record<OrderStatus, number> = {
  pending: 1,
  confirmed: 2,
  in_progress: 3,
  preparing: 3,
  ready: 4,
  out_for_delivery: 5,
  delivered: 6,
  completed: 6,
  cancelled: 0,
  refunded: 0,
  failed: 0,
};

export function orderStatusLabel(status: string): string {
  return LABELS[status as OrderStatus] ?? 'Estado desconocido';
}

export function orderStatusDescription(status: string): string {
  return DESCRIPTIONS[status as OrderStatus] ?? 'Consulta con el restaurante para más detalles.';
}

export function orderStatusColor(status: string) {
  return COLORS[status as OrderStatus] ?? COLORS.pending;
}

export function orderStatusProgress(status: string): number {
  return PROGRESS[status as OrderStatus] ?? 0;
}

export function isTerminalStatus(status: string): boolean {
  return ['delivered', 'completed', 'cancelled', 'refunded', 'failed'].includes(
    status
  );
}
