export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '919999999999'
const money = (n) => `Rs ${Number(n).toLocaleString('en-IN')}`

export function orderLink(order) {
  const lines = [
    `New order: ${order.number}`, '',
    `Name: ${order.name}`, `Phone: ${order.phone}`,
    `Address: ${order.address}${order.details ? ', ' + order.details : ''}`, '', 'Items:',
    ...order.items.map((i) => `- ${i.name} x${i.qty} @ ${money(i.price)} = ${money(i.price * i.qty)}`),
    '', `Total: ${money(order.total)}`, '', 'Payment will be arranged in this chat.',
  ]
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`
}
