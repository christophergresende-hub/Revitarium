// reports.js
const API_BASE = window.__API_BASE__ || location.origin;
const token = localStorage.getItem('rev_token') || '';

async function fetchReports(range=7, metric='visits'){
  try {
    const r = await fetch(`${API_BASE}/api/reports?range=${range}&metric=${metric}`, { headers: { Authorization: 'Bearer ' + token }});
    if(!r.ok) throw new Error('no reports');
    return await r.json();
  } catch(e){
    return {data: []};
  }
}

// Use fetchReports in reports page
