const { getLabel } = require('../../utils/categories');

Component({
  properties: {
    invoice: { type: Object, value: {} }
  },
  observers: {
    'invoice.category': function(category) {
      this.setData({ categoryLabel: getLabel(category) });
    }
  },
  methods: {
    onTap() {
      this.triggerEvent('tap', { id: this.data.invoice.id });
    }
  }
});
