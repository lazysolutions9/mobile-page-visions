import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: notifications, error: fetchError } = await supabaseClient
      .from('notification_logs')
      .select('*')
      .eq('status', 'pending')
      .order('sent_at', { ascending: true })

    if (fetchError) {
      throw new Error(`Error fetching notifications: ${fetchError.message}`)
    }

    if (!notifications || notifications.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending notifications' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let processedCount = 0
    let failedCount = 0

    for (const notification of notifications) {
      try {
        const { data: tokenData, error: tokenError } = await supabaseClient
          .rpc('get_user_push_token', { user_uuid: notification.receiver_id })

        if (tokenError || !tokenData) {
          console.error('Error getting user push token:', tokenError)
          await supabaseClient
            .from('notification_logs')
            .update({ status: 'failed' })
            .eq('id', notification.id)
          failedCount++
          continue
        }

        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: tokenData,
            title: notification.title,
            body: notification.body,
            data: notification.data || {},
            sound: 'default',
            priority: 'high',
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to send notification: ${response.statusText}`)
        }

        await supabaseClient
          .from('notification_logs')
          .update({ status: 'sent' })
          .eq('id', notification.id)

        processedCount++
      } catch (error) {
        console.error('Error processing notification:', error)
        await supabaseClient
          .from('notification_logs')
          .update({ status: 'failed' })
          .eq('id', notification.id)
        failedCount++
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Notifications processed',
        processed: processedCount,
        failed: failedCount,
        total: notifications.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})