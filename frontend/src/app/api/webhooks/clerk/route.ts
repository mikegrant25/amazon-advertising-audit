import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occured', {
      status: 400
    })
  }

  // Handle the webhook
  const eventType = evt.type

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name } = evt.data
    
    const email = email_addresses[0]?.email_address
    if (!email) {
      return new Response('No email found', { status: 400 })
    }

    const supabase = await createClient()
    
    // Upsert user to Supabase
    const { error } = await supabase
      .from('users')
      .upsert({
        clerk_id: id,
        email: email,
        full_name: `${first_name || ''} ${last_name || ''}`.trim() || null,
      }, {
        onConflict: 'clerk_id'
      })

    if (error) {
      console.error('Error syncing user to Supabase:', error)
      return new Response('Error syncing user', { status: 500 })
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data
    
    if (!id) {
      return new Response('Missing user ID', { status: 400 })
    }
    
    const supabase = await createClient()
    
    // Delete user from Supabase
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('clerk_id', id)

    if (error) {
      console.error('Error deleting user from Supabase:', error)
      return new Response('Error deleting user', { status: 500 })
    }
  }

  return new Response('', { status: 200 })
}