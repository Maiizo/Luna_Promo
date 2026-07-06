import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
async function testStatus() {
  const { data: voucher, error } = await supabase.from('vouchers').select('*').limit(1).single();
  if (voucher) {
    console.log('Testing claimed...');
    const { error: updateError } = await supabase.from('vouchers').update({ status: 'claimed' }).eq('id', voucher.id);
    console.log('claimed error:', updateError);
    console.log('Testing redeemed...');
    const { error: updateError2 } = await supabase.from('vouchers').update({ status: 'redeemed' }).eq('id', voucher.id);
    console.log('redeemed error:', updateError2);
  }
}
testStatus();
