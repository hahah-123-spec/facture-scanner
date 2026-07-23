const CATEGORIES = [
  { value: 'productos', label: 'Productos' },
  { value: 'plantas', label: 'Plantas' },
  { value: 'suministros', label: 'Suministros' },
  { value: 'servicios', label: 'Servicios' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'otros', label: 'Otros' }
];

function getLabel(value) {
  const category = CATEGORIES.find(c => c.value === value);
  return category ? category.label : value;
}

module.exports = { CATEGORIES, getLabel };
