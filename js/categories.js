var CATEGORIES = [
  { value: 'productos',  label: 'Compra - Productos',   icon: '📦' },
  { value: 'plantas',    label: 'Compra - Plantas/Flores', icon: '🌿' },
  { value: 'suministros',label: 'Agua/Luz/Internet',    icon: '⚡' },
  { value: 'servicios',  label: 'Servicios',            icon: '📋' },
  { value: 'transporte', label: 'Transporte/Envio',     icon: '🚚' },
  { value: 'otros',      label: 'Otros',                icon: '📌' }
];

function getLabel(value) {
  var cat = CATEGORIES.find(function(c) { return c.value === value; });
  return cat ? cat.label : value;
}
