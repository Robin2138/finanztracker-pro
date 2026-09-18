export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname === '/api/create-checkout-session' && request.method === 'POST') {
        return await createCheckout(request, env);
      }
      if (url.pathname === '/api/stripe-webhook' && request.method === 'POST') {
        return await stripeWebhook(request, env);
      }
      return env.ASSETS.fetch(request);
    } catch (err) {
      return new Response(JSON.stringify({ok:false,error:'Serverfehler.'}), {
        status: 500,
        headers: {'content-type':'application/json;charset=UTF-8'}
      });
    }
  }
};

async function createCheckout(request, env) {
  const supaUrl = env.SUPABASE_URL;
  const supaAnon = env.SUPABASE_PUBLISHABLE_KEY;
  const stripePrice = env.STRIPE_PRICE_PRO || 'price_1UH8GFLJtDakz6gRd61fVD9D';
  if (!env.STRIPE_SECRET_KEY || !stripePrice || !supaUrl || !supaAnon) {
    return json({ ok:false, error:'Stripe/Supabase ist noch nicht vollständig konfiguriert.' }, 503);
  }
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) return json({ok:false,error:'Anmeldung erforderlich.'},401);
  const userResp = await fetch(`${supaUrl}/auth/v1/user`, {headers:{apikey:supaAnon, Authorization:auth}});
  const user = await userResp.json().catch(()=>null);
  if (!userResp.ok || !user?.id) return json({ok:false,error:'Sitzung ist ungültig oder abgelaufen.'},401);

  const origin = new URL(request.url).origin;
  const params = new URLSearchParams();
  params.set('mode','subscription');
  params.set('line_items[0][price]',stripePrice);
  params.set('line_items[0][quantity]','1');
  if (user.email) params.set('customer_email',user.email);
  params.set('client_reference_id',user.id);
  params.set('subscription_data[metadata][user_id]',user.id);
  params.set('subscription_data[metadata][product]','finanztracker-pro');
  params.set('metadata[product]','finanztracker-pro');
  params.set('success_url',origin+'/?checkout=success');
  params.set('cancel_url',origin+'/?checkout=cancelled');
  params.set('allow_promotion_codes','true');

  const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method:'POST',
    headers:{Authorization:`Bearer ${env.STRIPE_SECRET_KEY}`,'Content-Type':'application/x-www-form-urlencoded'},
    body:params
  });
  const data = await r.json().catch(()=>({}));
  if (!r.ok) return json({ok:false,error:data?.error?.message||'Stripe-Fehler.'},502);
  return json({ok:true,url:data.url});
}

async function stripeWebhook(request, env) {
  if (!env.STRIPE_WEBHOOK_SECRET || !env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
    return new Response('Webhook not configured',{status:503});
  }
  const signature=request.headers.get('Stripe-Signature')||'';
  const rawBody=await request.text();
  if (!await verifyStripeSignature(rawBody,signature,env.STRIPE_WEBHOOK_SECRET)) {
    return new Response('Invalid signature',{status:400});
  }
  const event=JSON.parse(rawBody);
  const obj=event?.data?.object||{};
  let userId=obj?.metadata?.user_id||obj?.client_reference_id||'';
  if (!userId && obj?.subscription && env.STRIPE_SECRET_KEY) {
    const subResp=await fetch(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(obj.subscription)}`,{headers:{Authorization:`Bearer ${env.STRIPE_SECRET_KEY}`}});
    const sub=await subResp.json().catch(()=>null);
    userId=sub?.metadata?.user_id||'';
  }
  if (!userId) return new Response('ok',{status:200});

  let plan='free', status='inactive';
  let customerId=obj?.customer||null;
  let subscriptionId=obj?.id||obj?.subscription||null;
  if (event.type==='checkout.session.completed') {
    plan='pro'; status='active'; customerId=obj?.customer||customerId; subscriptionId=obj?.subscription||subscriptionId;
  } else if (event.type==='customer.subscription.created' || event.type==='customer.subscription.updated') {
    plan=['active','trialing'].includes(obj?.status)?'pro':'free'; status=obj?.status||'inactive';
    customerId=obj?.customer||customerId; subscriptionId=obj?.id||subscriptionId;
  } else if (event.type==='customer.subscription.deleted') {
    plan='free'; status='canceled';
  } else {
    return new Response('ok',{status:200});
  }

  const upsertUrl=`${env.SUPABASE_URL}/rest/v1/entitlements?on_conflict=user_id`;
  const dbResp=await fetch(upsertUrl,{
    method:'POST',
    headers:{apikey:env.SUPABASE_SECRET_KEY,Authorization:`Bearer ${env.SUPABASE_SECRET_KEY}`,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'},
    body:JSON.stringify([{user_id:userId,plan,status,stripe_customer_id:customerId,stripe_subscription_id:subscriptionId,updated_at:new Date().toISOString()}])
  });
  if (!dbResp.ok) return new Response('Database sync failed',{status:502});
  return new Response('ok',{status:200});
}

async function verifyStripeSignature(payload,header,secret){
  const parts=header.split(',');
  const timestamp=parts.find(p=>p.startsWith('t='))?.slice(2);
  const signatures=parts.filter(p=>p.startsWith('v1=')).map(p=>p.slice(3));
  if(!timestamp||!signatures.length)return false;
  const age=Math.abs(Date.now()/1000-Number(timestamp));
  if(!Number.isFinite(age)||age>300)return false;
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const sigBytes=new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(`${timestamp}.${payload}`)));
  const expected=[...sigBytes].map(b=>b.toString(16).padStart(2,'0')).join('');
  return signatures.some(actual=>constantTimeEqual(actual,expected));
}
function constantTimeEqual(a,b){if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json;charset=UTF-8'}});}
