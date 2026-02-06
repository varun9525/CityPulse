import { projectId, publicAnonKey } from './supabase/info'

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-2aa51ca7`

// Backend URL used for ML predictions. Can be overridden with Vite env var `VITE_BACKEND_URL`.
const BACKEND_URL = (import.meta && import.meta.env && import.meta.env.VITE_BACKEND_URL) || 'http://localhost:8000'

export const api = {
  submitReport: async (formData: FormData, token?: string) => {
    // If no token provided, use anon key. 
    // If token IS provided, use it.
    const effectiveToken = token || publicAnonKey;
    
    const headers: HeadersInit = {
       'Authorization': `Bearer ${effectiveToken}`
    };
    
    try {
      const response = await fetch(`${BASE_URL}/reports`, {
        method: 'POST',
        headers,
        body: formData
      })
      
      if (!response.ok) {
         // Auto-retry with Anon Key if 401 (Invalid JWT) and we were using a user token
         if (response.status === 401 && token && token !== publicAnonKey) {
             console.log('User token invalid (401). Automatically retrying with public access...');
             // Recursive call without token -> will use publicAnonKey
             return api.submitReport(formData, undefined);
         }

         let errorMessage = `Failed to submit report (${response.status})`;
         try {
            const text = await response.text();
            try {
               const json = JSON.parse(text);
               if (json.error) errorMessage = json.error;
               else errorMessage += `: ${text}`;
            } catch {
               errorMessage += `: ${text.slice(0, 200)}`;
            }
         } catch (e) {
            // ignore
         }
         console.error('Submit report failed:', errorMessage);
         throw new Error(errorMessage);
      }
      return response.json()
    } catch (err: any) {
      console.error('Network or Parse Error:', err);
      throw new Error(err.message || 'Network error occurred');
    }
  },

  getReports: async (userId?: string) => {
    let url = `${BASE_URL}/reports`;
    if (userId) {
       url += `?userId=${userId}`;
    }
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`
      }
    })
    if (!response.ok) throw new Error('Failed to fetch reports')
    return response.json()
  },

  getReport: async (id: string) => {
    const response = await fetch(`${BASE_URL}/reports/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`
      }
    })
    if (!response.ok) throw new Error('Failed to fetch report')
    return response.json()
  },

  updateStatus: async (id: string, status: string) => {
    const response = await fetch(`${BASE_URL}/reports/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    })
    if (!response.ok) throw new Error('Failed to update status')
    return response.json()
  },
  
  signupAdmin: async (email, password, role) => {
    const response = await fetch(`${BASE_URL}/signup`, {
       method: 'POST',
       headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
       },
       body: JSON.stringify({ email, password, role })
    })
    if (!response.ok) {
       const err = await response.json()
       throw new Error(err.error || 'Failed to signup')
    }
    return response.json()
  }
}

// Call the local backend prediction endpoint. Expects a multipart form with the file field named `file`.
export const predictImage = async (file: File) => {
  const formData = new FormData()
  // backend expects the upload field named `file`
  formData.append('file', file)

  const resp = await fetch(`${BACKEND_URL}/predict`, {
    method: 'POST',
    body: formData,
  })

  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    throw new Error(`Prediction failed (${resp.status}): ${text}`)
  }

  return resp.json()
}
