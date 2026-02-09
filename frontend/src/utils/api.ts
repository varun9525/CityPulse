import { supabase } from './supabaseClient';

// Backend URL used ONLY for ML predictions.
const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = {
  submitReport: async (formData: FormData): Promise<any> => {
    try {
      // 1. Upload Image
      const imageFile = formData.get('image') as File;
      if (!imageFile) throw new Error("No image provided");

      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('issues')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('issues')
        .getPublicUrl(filePath);

      // 3. Insert Record
      const { data, error } = await supabase
        .from('issues')
        .insert([
          {
            type: formData.get('type'),
            description: formData.get('description'),
            lat: parseFloat(formData.get('lat') as string) || 0,
            lng: parseFloat(formData.get('lng') as string) || 0,
            location: formData.get('location'),
            priority: formData.get('priority'),
            risk: formData.get('risk'),
            image_url: publicUrl,
            user_id: formData.get('userId') || null, // Optional if we attach user
            status: 'PENDING'
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err: any) {
      console.error('Submit report failed:', err);
      throw new Error(err.message || 'Network error occurred');
    }
  },

  getReports: async (userId?: string) => {
    let query = supabase
      .from('issues')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  getReport: async (id: string) => {
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  updateStatus: async (id: string, status: string) => {
    const { data, error } = await supabase
      .from('issues')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  resolveIssue: async (id: string, file: File) => {
    // 1. Upload Resolved Image
    const fileExt = file.name.split('.').pop();
    const fileName = `resolved_${id}_${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('issues')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('issues')
      .getPublicUrl(filePath);

    // 2. Update Issue
    const { data, error } = await supabase
      .from('issues')
      .update({
        status: 'RESOLVED',
        resolved_image_url: publicUrl
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  approveIssue: async (id: string) => {
    const { data, error } = await supabase
      .from('issues')
      .update({ status: 'APPROVED' })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  verifyResolution: async (file: File, issueType: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('issue_type', issueType);

    const resp = await fetch(`${BACKEND_URL}/verify-resolution`, {
      method: 'POST',
      body: formData,
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Verification request failed (${resp.status}): ${text}`);
    }

    return resp.json();
  },

  // Auth is handled directly by supabase.auth in components
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
