// api/test.mjs — minimal test endpoint to verify deployment
//
// If this returns JSON on /api/test, then the Vercel functions are working.
// If it returns HTML (index.html), then the functions aren't being picked up.
export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    message: 'Vercel serverless functions are working',
    env_keys: Object.keys(process.env).filter(k => k.includes('RATE') || k.includes('LIMIT')).length,
  });
}
