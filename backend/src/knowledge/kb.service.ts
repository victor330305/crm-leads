// Servicio de Knowledge Base
// Carga el contexto del negocio desde la DB (productos) y lo formatea
// para inyectarlo en el system prompt de OpenAI
import { prisma } from '../prisma/client';

/**
 * Construye el bloque de texto con la knowledge base del tenant.
 * Se inyecta en el system prompt en cada conversación.
 */
export async function buildKnowledgeBase(tenantId: string): Promise<string> {
  // Traer productos activos del tenant
  const products = await prisma.product.findMany({
    where: { tenantId, isActive: true },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });

  if (products.length === 0) {
    return 'No hay productos cargados en el sistema todavía.';
  }

  // Agrupar productos por categoría
  const byCategory = products.reduce<Record<string, typeof products>>(
    (acc, product) => {
      const cat = product.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(product);
      return acc;
    },
    {}
  );

  // Construir texto legible para el modelo
  const lines: string[] = ['=== CATÁLOGO DE PRODUCTOS ===', ''];

  for (const [category, items] of Object.entries(byCategory)) {
    lines.push(`## ${category}`);
    for (const p of items) {
      lines.push(`- [${p.code}] ${p.name}`);
      if (p.subcategory) lines.push(`  Subcategoría: ${p.subcategory}`);
      if (p.description) lines.push(`  Descripción: ${p.description}`);
      if (p.dimensions) lines.push(`  Dimensiones: ${p.dimensions}`);
      if (p.materials) lines.push(`  Materiales: ${p.materials}`);
      if (p.use) lines.push(`  Uso: ${p.use}`);
    }
    lines.push('');
  }

  lines.push('=== INFORMACIÓN IMPORTANTE ===');
  lines.push('- NO hay precios publicados. Todos los productos requieren presupuesto personalizado.');
  lines.push('- La empresa tiene 30 años de trayectoria (fundada en 1995).');
  lines.push('- Fábrica, oficina y showroom físico en Floresta, CABA.');
  lines.push('- Dirección: Remedios de Escalada de San Martín 4541, C1407EVY, Floresta, CABA.');
  lines.push('- Teléfonos: (54.11) 2137-1686 y (54.11) 2087-1544.');
  lines.push('- Alcance nacional: proyectos en Buenos Aires, Mendoza, Misiones y más.');
  lines.push('- Clientes de referencia: Arcor, Coto, Tecnópolis, Mostaza.');
  lines.push('- Fabricación propia (no revendedor), productos a medida disponibles.');

  return lines.join('\n');
}

/**
 * Formatea el historial de mensajes de una conversación
 * como texto para incluir en el prompt.
 */
export function formatConversationHistory(
  messages: Array<{ role: string; content: string }>
): string {
  if (messages.length === 0) return 'Sin historial previo.';

  return messages
    .map((m) => {
      const label = m.role === 'USER' ? 'Cliente' : 'Asistente';
      return `${label}: ${m.content}`;
    })
    .join('\n');
}
