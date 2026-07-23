/* Supabase client + Invoices CRUD + OCR + Storage */

var supabaseClient = supabase.createClient(CONFIG.supabaseUrl, CONFIG.anonKey);

var invoices = {
  list: async function (params) {
    params = params || {};
    var query = supabaseClient
      .from('invoices')
      .select('*')
      .order('invoice_date', { ascending: false })
      .limit(100);

    if (params.month) {
      var parts = params.month.split('-');
      var y = parseInt(parts[0], 10);
      var m = parseInt(parts[1], 10);
      var next = new Date(y, m, 1); // month after params.month
      var startDate = params.month + '-01';
      var endYear = next.getFullYear();
      var endMonth = String(next.getMonth() + 1).padStart(2, '0');
      query = query
        .gte('invoice_date', startDate)
        .lt('invoice_date', endYear + '-' + endMonth + '-01');
    }

    if (params.search) {
      query = query.ilike('supplier_name', '%' + params.search + '%');
    }

    var result = await query;
    if (result.error) throw result.error;
    return result.data || [];
  },

  getById: async function (id) {
    var result = await supabaseClient
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();
    if (result.error) throw result.error;
    return result.data;
  },

  create: async function (data) {
    var result = await supabaseClient
      .from('invoices')
      .insert([data])
      .select();
    if (result.error) throw result.error;
    return result.data;
  },

  update: async function (id, data) {
    var result = await supabaseClient
      .from('invoices')
      .update(data)
      .eq('id', id);
    if (result.error) throw result.error;
  },

  delete: async function (id) {
    var result = await supabaseClient
      .from('invoices')
      .delete()
      .eq('id', id);
    if (result.error) throw result.error;
  },

  checkDuplicate: async function (supplier_name, invoice_date, total_amount) {
    var result = await supabaseClient
      .from('invoices')
      .select('*')
      .eq('supplier_name', supplier_name)
      .eq('invoice_date', invoice_date)
      .eq('total_amount', total_amount)
      .limit(1);
    if (result.error) throw result.error;
    return result.data && result.data.length > 0 ? result.data[0] : null;
  },

  monthlySummary: async function (month) {
    var result = await supabaseClient
      .rpc('monthly_summary', { p_month: month });
    if (result.error) throw result.error;
    return result.data;
  }
};

/* --- Storage --- */

async function uploadImage(file, filename) {
  var result = await supabaseClient.storage
    .from('invoices')
    .upload(filename, file, {
      cacheControl: '3600',
      upsert: false
    });
  if (result.error) throw result.error;
  return result.data;
}

function getPublicUrl(filename) {
  var result = supabaseClient.storage
    .from('invoices')
    .getPublicUrl(filename);
  return result.data.publicUrl;
}

/* --- OCR --- */

async function ocrInvoice(imageFilename) {
  var sessionResult = await supabaseClient.auth.getSession();
  var token = (sessionResult.data && sessionResult.data.session)
    ? sessionResult.data.session.access_token
    : CONFIG.anonKey;

  var res = await fetch(CONFIG.supabaseUrl + '/functions/v1/ocr-invoice', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': CONFIG.anonKey,
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ image_url: imageFilename })
  });

  if (!res.ok) {
    var errText = '';
    try { errText = await res.text(); } catch (_) {}
    throw new Error('OCR failed: ' + (errText || res.status));
  }
  return res.json();
}
