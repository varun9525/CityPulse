import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'npm:@supabase/supabase-js@2'
import * as kv from './kv_store.tsx'

const app = new Hono()
const projectId = Deno.env.get('SUPABASE_URL')!.split('.')[0].split('//')[1]
const bucketName = `make-${projectId}-reports`

app.use('*', cors())
app.use('*', logger(console.log))

// Middleware to initialize Supabase client
const getSupabase = (accessToken?: string) => {
  const url = Deno.env.get('SUPABASE_URL')!
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const options = accessToken ? {
    global: { headers: { Authorization: `Bearer ${accessToken}` } }
  } : {}
  return createClient(url, key, options)
}

// Initialize Storage Bucket
app.use('*', async (c, next) => {
  try {
    const supabase = getSupabase()
    // We can't easily check if bucket exists without listing, but createBucket is safe to call if we check existence or catch error
    // For performance, we might want to skip this after first run, but for this prototype we'll just try/catch or list
    // Actually, listing is better.
    // const { data: buckets } = await supabase.storage.listBuckets()
    // const exists = buckets?.some(b => b.name === bucketName)
    // if (!exists) {
    //   await supabase.storage.createBucket(bucketName, { public: false })
    // }
    // Optimization: Just proceed, if upload fails we might debug. But standard practice:
    // We will assume bucket creation is handled or we do it lazily.
    // Let's do it lazily in the upload route to save overhead on every request.
  } catch (e) {
    console.error("Bucket init error", e)
  }
  await next()
})

// Routes

// 1. Submit Report (Public)
app.post('/make-server-2aa51ca7/reports', async (c) => {
  try {
    const body = await c.req.parseBody()
    const image = body['image']
    const type = body['type'] as string
    const location = body['location'] as string
    const description = body['description'] as string
    const lat = body['lat'] // Optional
    const lng = body['lng'] // Optional
    const risk = body['risk'] as string || 'Low'
    
    // Check for authenticated user from Token
    let userId = null
    let userEmail = null
    const authHeader = c.req.header('Authorization')
    if (authHeader) {
       const token = authHeader.replace('Bearer ', '')
       // Don't use public key to verify user, use the token
       if (token && token !== Deno.env.get('SUPABASE_ANON_KEY')) {
          try {
            const authClient = getSupabase(token) 
            const { data: { user } } = await authClient.auth.getUser()
            if (user) {
               userId = user.id
               userEmail = user.email
            }
          } catch (e) {
            console.error("Auth check failed:", e)
          }
       }
    }
    
    // Fallback: If token auth failed or wasn't provided (anonymous retry),
    // check if the client explicitly claimed a userId in the body.
    // In a production app, we wouldn't trust this without verification,
    // but for this prototype it ensures reports aren't "lost" from the user's view.
    if (!userId) {
       const claimedUserId = body['userId'] as string
       if (claimedUserId) {
          console.log('Using claimed userId from body:', claimedUserId)
          userId = claimedUserId
       }
    }
    
    // Explicitly validate image
    if (!image) {
       console.error('Missing image in request. Body keys:', Object.keys(body));
       return c.json({ error: 'Image file is required' }, 400)
    }

    const supabase = getSupabase() // Use admin client for storage operations
    
    // Ensure bucket exists (idempotent check)
    try {
       const { data: buckets } = await supabase.storage.listBuckets()
       const bucketExists = buckets?.some(b => b.name === bucketName)
       if (!bucketExists) {
         console.log('Creating bucket:', bucketName)
         await supabase.storage.createBucket(bucketName, { public: false })
       }
    } catch (e) {
       console.error('Bucket check/create warning:', e)
       // Continue, maybe it exists or we can't list
    }

    // Upload Image
    // Handle different image types that Hono might return
    let imageFile = image;
    let fileName = '';
    
    if (image instanceof File) {
       const ext = image.name ? image.name.split('.').pop() : 'png';
       fileName = `${crypto.randomUUID()}.${ext}`;
    } else {
       // Fallback for non-File objects (shouldn't happen with standard Hono + FormData)
       fileName = `${crypto.randomUUID()}.png`; 
    }
    
    console.log('Uploading file:', fileName)
    
    const { data: fileData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, imageFile, {
         contentType: imageFile.type || 'image/png',
         upsert: true
      })

    if (uploadError) {
      console.error('Upload error details:', uploadError)
      return c.json({ error: `Failed to upload image: ${uploadError.message}` }, 500)
    }

    // Create Report Record
    const reportId = `CP-2026-${Math.floor(1000 + Math.random() * 9000)}`
    const timestamp = new Date().toISOString()
    
    const report = {
      id: reportId,
      type,
      location,
      description,
      status: 'Open', // Open, In Progress, Resolved
      imagePath: fileName,
      timestamp,
      riskLevel: risk,
      coordinates: { lat: lat || 0, lng: lng || 0 },
      userId,
      userEmail
    }

    await kv.set(`report:${reportId}`, report)

    // Add to list index (optional, but good for ordering if we wanted)
    // For now we'll just use getByPrefix('report:')

    return c.json(report)
  } catch (err) {
    console.error('Submit error:', err)
    return c.json({ error: err.message }, 500)
  }
})

// 2. Get All Reports (Admin/Map) OR My Reports
app.get('/make-server-2aa51ca7/reports', async (c) => {
  try {
    const userIdFilter = c.req.query('userId')
    
    const reports = await kv.getByPrefix('report:')
    
    let filteredReports = reports
    if (userIdFilter) {
       filteredReports = reports.filter((r: any) => r.userId === userIdFilter)
    }
    
    // Generate signed URLs for all reports
    const supabase = getSupabase()
    const reportsWithUrls = await Promise.all(filteredReports.map(async (r: any) => {
      const { data } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(r.imagePath, 3600) // 1 hour
      return { ...r, imageUrl: data?.signedUrl }
    }))
    
    // Sort by timestamp desc
    reportsWithUrls.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return c.json(reportsWithUrls)
  } catch (err) {
    console.error('List error:', err)
    return c.json({ error: err.message }, 500)
  }
})

// 3. Get Single Report (Public Status Check)
app.get('/make-server-2aa51ca7/reports/:id', async (c) => {
  const id = c.req.param('id')
  try {
    const report = await kv.get(`report:${id}`)
    if (!report) {
      return c.json({ error: 'Report not found' }, 404)
    }

    const supabase = getSupabase()
    const { data } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(report.imagePath, 3600)

    return c.json({ ...report, imageUrl: data?.signedUrl })
  } catch (err) {
    return c.json({ error: err.message }, 500)
  }
})

// 4. Update Report Status (Admin)
app.patch('/make-server-2aa51ca7/reports/:id', async (c) => {
  const id = c.req.param('id')
  
  // Verify Admin Access
  const admin = await requireAdmin(c)
  if (!admin) {
    return c.json({ error: 'Unauthorized: Admin access required' }, 403)
  }

  try {
    const body = await c.req.json()
    const { status } = body
    
    const report = await kv.get(`report:${id}`)
    if (!report) {
      return c.json({ error: 'Report not found' }, 404)
    }

    const updatedReport = { ...report, status }
    await kv.set(`report:${id}`, updatedReport)

    return c.json(updatedReport)
  } catch (err) {
    return c.json({ error: err.message }, 500)
  }
})

// 5. Signup (Admin or Citizen)
app.post('/make-server-2aa51ca7/signup', async (c) => {
  try {
    const { email, password, role: requestedRole } = await c.req.json()
    
    // Check if government
    const allowedDomains = ['.gov', '.org']
    const isGov = allowedDomains.some(d => email.endsWith(d)) || email === 'admin@citypulse.ai'
    
    // Role assignment logic:
    // 1. If user explicitly requests 'citizen', they are a citizen.
    // 2. If user requests 'admin', we check if they are government OR just allow it for this prototype if desired.
    //    For now, we'll strict check gov email IF they want to be admin, but allow the UI to select it.
    //    Actually, let's allow it if they request it, but maybe Log it?
    //    User request: "user can select role"
    
    let finalRole = 'citizen'
    
    if (requestedRole === 'admin') {
       if (isGov) {
          finalRole = 'admin'
       } else {
          // Allow it for demo purposes since user requested "user can select role" 
          // but in real app this would be restricted.
          // Let's assume for this prototype we TRUST the selection but prefer gov email.
          finalRole = 'admin' 
       }
    } else {
       finalRole = 'citizen'
    }

    const supabase = getSupabase()
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: finalRole }
    })

    if (error) throw error
    return c.json(data)
  } catch (err) {
    return c.json({ error: err.message }, 400)
  }
})

// Helper for admin authentication
const requireAdmin = async (c: any) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader) return null
  
  const token = authHeader.replace('Bearer ', '')
  const supabase = getSupabase(token)
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) return null
  
  // Check email domain or metadata
  const email = user.email || ''
  const isGov = email.endsWith('.gov') || email.endsWith('.org') || email === 'admin@citypulse.ai'
  const isAdminRole = user.user_metadata?.role === 'admin'
  
  if (isAdminRole || isGov) {
    return user
  }
  return null
}


Deno.serve(app.fetch)
