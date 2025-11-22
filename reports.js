// reports.js - Relatórios Pro (vanilla JS, mock data)
(function(){
  // Elements
  const reportsChartEl = document.getElementById('reportsChart');
  const eventsTableBody = document.querySelector('#eventsTable tbody');
  const statTotal = document.getElementById('stat-total');
  const statVisits = document.getElementById('stat-visits');
  const statConversions = document.getElementById('stat-conversions');

  const fromDate = document.getElementById('fromDate');
  const toDate = document.getElementById('toDate');
  const typeFilter = document.getElementById('typeFilter');
  const userFilter = document.getElementById('userFilter');
  const globalSearch = document.getElementById('globalSearch');

  const btnExportCSV = document.getElementById('btn-export-csv');
  const btnExportPDF = document.getElementById('btn-export-pdf');
  const btnReset = document.getElementById('btn-reset-filters');

  // Mock dataset: last 30 days events (date ISO, type, user, value, note)
  const mock = (function genMock(){
    const out = [];
    const users = ['Ana','Bruno','Carlos','Diana','Eduardo'];
    for(let i=29;i>=0;i--){
      const d = new Date(); d.setDate(d.getDate()-i);
      const iso = d.toISOString().slice(0,10);
      // multiple events per day
      const visits = Math.round(100 + Math.random()*150);
      const conv = Math.round(visits * (0.08 + Math.random()*0.15));
      out.push({date:iso,type:'visit',user:users[Math.floor(Math.random()*users.length)],value:visits,note:''});
      out.push({date:iso,type:'conversion',user:users[Math.floor(Math.random()*users.length)],value:conv,note:''});
    }
    return out;
  })();

  // Helpers
  function parseDate(s){ return s ? new Date(s + 'T00:00:00') : null; }

  function filterData(){
    const from = parseDate(fromDate.value);
    const to = parseDate(toDate.value);
    const type = typeFilter.value;
    const userQ = (userFilter.value || '').toLowerCase();
    const q = (globalSearch.value || '').toLowerCase();

    return mock.filter(row => {
      if(from && new Date(row.date) < from) return false;
      if(to && new Date(row.date) > to) return false;
      if(type !== 'all' && row.type !== type) return false;
      if(userQ && !row.user.toLowerCase().includes(userQ)) return false;
      if(q){
        const hay = (row.date + ' ' + row.type + ' ' + row.user + ' ' + row.value + ' ' + row.note).toLowerCase();
        if(!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function renderTable(data){
    eventsTableBody.innerHTML = '';
    data.slice().reverse().forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${r.date}</td><td>${r.type}</td><td>${r.user}</td><td>${r.value}</td><td>${r.note}</td>`;
      eventsTableBody.appendChild(tr);
    });
  }

  // Chart
  let chart = null;
  function renderChart(data){
    // aggregate by date
    const byDate = {};
    data.forEach(r => {
      if(!byDate[r.date]) byDate[r.date]= {visits:0, conversions:0};
      if(r.type==='visit') byDate[r.date].visits += r.value;
      else if(r.type==='conversion') byDate[r.date].conversions += r.value;
    });
    const labels = Object.keys(byDate).sort();
    const visits = labels.map(d => byDate[d].visits);
    const conversions = labels.map(d => byDate[d].conversions);

    const ctx = reportsChartEl.getContext('2d');
    if(chart) chart.destroy();
    chart = new Chart(ctx, {
      type:'line',
      data:{ labels, datasets:[
        { type:'line', label:'Visitas', data:visits, borderColor:'#00e0ff', backgroundColor:createGradient(ctx,'rgba(0,224,255,0.08)','rgba(0,163,255,0.02)'), tension:0.36, fill:true, pointRadius:3 },
        { type:'bar', label:'Conversões', data:conversions, backgroundColor:'#00d2ff', borderRadius:6 }
      ]},
      options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:true}} }
    });
  }

  function createGradient(ctx,c1,c2){ const h=ctx.canvas.height; const g=ctx.createLinearGradient(0,0,0,h); g.addColorStop(0,c1); g.addColorStop(1,c2); return g; }

  function updateStats(filtered){
    const total = filtered.length;
    const visits = filtered.filter(r=>r.type==='visit').reduce((s,r)=>s+r.value,0);
    const conv = filtered.filter(r=>r.type==='conversion').reduce((s,r)=>s+r.value,0);
    statTotal.textContent = total;
    statVisits.textContent = visits;
    statConversions.textContent = conv;
  }

  function redraw(){
    const data = filterData();
    renderTable(data);
    renderChart(data);
    updateStats(data);
  }

  // Event listeners
  [fromDate,toDate,typeFilter,userFilter,globalSearch].forEach(el => el && el.addEventListener('input', redraw));
  btnReset && btnReset.addEventListener('click', ()=>{ fromDate.value=''; toDate.value=''; typeFilter.value='all'; userFilter.value=''; globalSearch.value=''; redraw(); });

  document.getElementById('quick-7').addEventListener('click', ()=>{ const d=new Date(); toDate.value=d.toISOString().slice(0,10); d.setDate(d.getDate()-6); fromDate.value=d.toISOString().slice(0,10); redraw(); });
  document.getElementById('quick-30').addEventListener('click', ()=>{ const d=new Date(); toDate.value=d.toISOString().slice(0,10); d.setDate(d.getDate()-29); fromDate.value=d.toISOString().slice(0,10); redraw(); });
  document.getElementById('quick-all').addEventListener('click', ()=>{ fromDate.value=''; toDate.value=''; redraw(); });

  // Export CSV
  btnExportCSV && btnExportCSV.addEventListener('click', ()=>{
    const rows = [['date','type','user','value','note'], ...filterData().map(r=>[r.date,r.type,r.user,r.value,r.note])];
    const csv = rows.map(r=>r.map(cell=>String(cell).replace(/\n/g,' ')).join(',')).join('\n');
    const blob = new Blob([csv],{type:'text/csv'}); const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='revitarium-reports.csv'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });

  // Export PDF (simple full-page capture of table + top stats)
  btnExportPDF && btnExportPDF.addEventListener('click', async ()=>{
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p','pt','a4');
    pdf.setFontSize(14); pdf.text('Revitarium - Relatórios', 40, 40);
    pdf.setFontSize(10); pdf.text('Período: ' + (fromDate.value || 'início') + ' → ' + (toDate.value || 'hoje'), 40, 60);
    // add a small table sample
    const rows = filterData().slice(-20).map(r=>[r.date,r.type,r.user,String(r.value)]);
    pdf.autoTable({ head:[['Data','Tipo','Usuário','Valor']], body:rows, startY:80 });
    pdf.save('revitarium-reports.pdf');
  });

  // Quick generate sample export
  document.getElementById('exportSample')?.addEventListener('click', ()=>{
    const sample = mock.slice(-10).map(r=>`${r.date} ${r.type} ${r.user} ${r.value}`).join('\n');
    const blob = new Blob([sample],{type:'text/plain'}); const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='sample.txt'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });

  // Logout
  document.getElementById('btn-logout')?.addEventListener('click', ()=>{ localStorage.removeItem('rev_user'); window.location.href='index.html'; });

  // Init
  window.addEventListener('load', ()=>{ redraw(); window.dispatchEvent(new Event('resize')); });

})();
