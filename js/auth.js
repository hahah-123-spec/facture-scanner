/* Supabase Auth helpers */

var auth = {
  login: async function (email, password) {
    var result = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });
    if (result.error) throw result.error;
    return result.data;
  },

  signUp: async function (email, password) {
    var result = await supabaseClient.auth.signUp({
      email: email,
      password: password
    });
    if (result.error) throw result.error;
    return result.data;
  },

  logout: async function () {
    var result = await supabaseClient.auth.signOut();
    if (result.error) throw result.error;
  },

  getCurrentUser: async function () {
    var result = await supabaseClient.auth.getUser();
    return result.data ? result.data.user : null;
  },

  onAuthStateChange: function (callback) {
    var subscription = supabaseClient.auth.onAuthStateChange(function (event, session) {
      callback(event, session);
    });
    return subscription;
  }
};
