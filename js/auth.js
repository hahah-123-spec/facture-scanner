/* Supabase Auth helpers */

var WS = { id: null, code: null }; // current workspace

var auth = {
  login: async function (email, password) {
    var result = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });
    if (result.error) throw result.error;
    await auth._loadWorkspace();
    return result.data;
  },

  signUp: async function (email, password, inviteCode) {
    var result = await supabaseClient.auth.signUp({
      email: email,
      password: password
    });
    if (result.error) throw result.error;
    // If account created + auto-confirmed, join workspace now
    if (result.data && result.data.session) {
      await auth._loadWorkspace();
      // If invite code provided, join that workspace
      if (inviteCode && result.data.user) {
        try {
          await supabaseClient.rpc('join_workspace', { p_invite_code: inviteCode.toUpperCase() });
          await auth._loadWorkspace();
        } catch (e) {
          console.warn('Join workspace failed:', e.message);
        }
      }
    }
    return result.data;
  },

  logout: async function () {
    var result = await supabaseClient.auth.signOut();
    if (result.error) throw result.error;
    WS = { id: null, code: null };
  },

  getCurrentUser: async function () {
    var result = await supabaseClient.auth.getUser();
    return result.data ? result.data.user : null;
  },

  leaveWorkspace: async function () {
    var result = await supabaseClient.rpc('leave_workspace');
    if (result.error) throw result.error;
    await auth._loadWorkspace();
    return WS;
  },

  joinWorkspace: async function (inviteCode) {
    var result = await supabaseClient.rpc('join_workspace', { p_invite_code: inviteCode.toUpperCase() });
    if (result.error) throw result.error;
    await auth._loadWorkspace();
    return WS;
  },

  onAuthStateChange: function (callback) {
    var subscription = supabaseClient.auth.onAuthStateChange(function (event, session) {
      callback(event, session);
    });
    return subscription;
  },

  /* internal: load workspace after login */
  _loadWorkspace: async function () {
    try {
      var userResult = await supabaseClient.auth.getUser();
      if (!userResult.data || !userResult.data.user) return;
      var result = await supabaseClient
        .from('profiles')
        .select('workspace_id, invite_code')
        .eq('user_id', userResult.data.user.id)
        .single();
      if (result.data) {
        WS.id = result.data.workspace_id;
        WS.code = result.data.invite_code;
      }
    } catch (e) {
      console.warn('Load workspace error:', e.message);
    }
  }
};
