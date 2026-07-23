// supabase/functions/wechat-login/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const { code } = await req.json();
  if (!code) return new Response(JSON.stringify({ error: 'missing code' }), { status: 400 });

  // 1. 用 code 换 openid（调用微信 API）
  const wxRes = await fetch(
    `https://api.weixin.qq.com/sns/jscode2session?appid=${Deno.env.get('WX_APPID')}&secret=${Deno.env.get('WX_SECRET')}&js_code=${code}&grant_type=authorization_code`
  );
  const wxData = await wxRes.json();
  if (!wxData.openid) return new Response(JSON.stringify({ error: 'wechat auth failed' }), { status: 401 });

  // 2. 在 Supabase 创建/查找用户（以 openid 为 email）
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const email = `${wxData.openid}@wechat.user`;
  const password = wxData.openid;

  let { data: existing } = await supabase.auth.admin.listUsers();
  let user = existing?.users?.find(u => u.email === email);

  if (!user) {
    const { data: created } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
    user = created.user;
  }

  // 3. 生成 JWT
  const { data: signIn } = await supabase.auth.signInWithPassword({ email, password });

  return new Response(JSON.stringify({
    access_token: signIn.session.access_token,
    user_id: user.id
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
