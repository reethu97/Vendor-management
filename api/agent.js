// api/agent.js — Vercel serverless function for all /api/agent/* endpoints
// No database — data is hardcoded. Returns same JSON the Webex Connect flows expect.

const DATA = {
  vendors: [
    {vendor_id:'VND1001', name:'TechServe Solutions Pvt Ltd', contact_name:'Rajesh Kumar',  email:'rohit@simcomm.com',  phone:'+919810012345', gstin:'07AABCT1234F1Z5', pan:'AABCT1234F', status:'active',    city:'New Delhi'},
    {vendor_id:'VND1002', name:'NetCom Infosystems',          contact_name:'Priya Sharma',  email:'reethu@simcomm.com', phone:'+919820098765', gstin:'27AADCN5678G1Z3', pan:'AADCN5678G', status:'active',    city:'Mumbai'},
    {vendor_id:'VND1003', name:'Apex IT Distributors',        contact_name:'Sanjay Mehta',  email:'sanjay@apexitd.co.in',  phone:'+919844455566', gstin:'29AAGCA9012H1Z1', pan:'AAGCA9012H', status:'suspended', city:'Bengaluru'},
  ],
  empanelments: [
    {id:1, vendor_id:'VND1001', oem_product:'Cisco Collaboration', customer:'Infosys',       status:'empaneled', valid_from:'2025-04-01', valid_till:'2027-03-31', remarks:'Renewed FY26'},
    {id:2, vendor_id:'VND1001', oem_product:'Cisco Security',      customer:'Infosys',       status:'pending',   valid_from:null,         valid_till:null,         remarks:'Awaiting OEM authorization letter'},
    {id:3, vendor_id:'VND1001', oem_product:'Cisco Collaboration', customer:'Wipro',         status:'empaneled', valid_from:'2025-07-01', valid_till:'2026-06-30', remarks:null},
    {id:4, vendor_id:'VND1002', oem_product:'Cisco Collaboration', customer:'Infosys',       status:'expired',   valid_from:'2023-04-01', valid_till:'2025-03-31', remarks:'Renewal not submitted'},
    {id:5, vendor_id:'VND1002', oem_product:'Cisco Networking',    customer:'HCLTech',       status:'empaneled', valid_from:'2025-01-15', valid_till:'2026-12-31', remarks:null},
    {id:6, vendor_id:'VND1003', oem_product:'Cisco Collaboration', customer:'Tech Mahindra', status:'rejected',  valid_from:null,         valid_till:null,         remarks:'Vendor suspended — compliance hold'},
  ],
  doc_requirements: [
    {id:1,  oem_product:'Cisco Collaboration', customer:'*',       document_type:'GST Registration Certificate',              mandatory:1},
    {id:2,  oem_product:'Cisco Collaboration', customer:'*',       document_type:'PAN Card',                                  mandatory:1},
    {id:3,  oem_product:'Cisco Collaboration', customer:'*',       document_type:'Cisco Partner Authorization Letter',        mandatory:1},
    {id:4,  oem_product:'Cisco Collaboration', customer:'*',       document_type:'Signed Master Service Agreement',           mandatory:1},
    {id:5,  oem_product:'Cisco Collaboration', customer:'Infosys', document_type:'Infosys Vendor Code of Conduct (signed)',   mandatory:1},
    {id:6,  oem_product:'Cisco Collaboration', customer:'Infosys', document_type:'ISO 27001 Certificate',                    mandatory:0},
    {id:7,  oem_product:'Cisco Security',      customer:'*',       document_type:'GST Registration Certificate',              mandatory:1},
    {id:8,  oem_product:'Cisco Security',      customer:'*',       document_type:'Cisco Security Specialization Certificate', mandatory:1},
    {id:9,  oem_product:'Cisco Networking',    customer:'*',       document_type:'GST Registration Certificate',              mandatory:1},
    {id:10, oem_product:'Cisco Networking',    customer:'*',       document_type:'Cisco Partner Authorization Letter',        mandatory:1},
  ],
  vendor_documents: [
    {id:1, vendor_id:'VND1001', document_type:'GST Registration Certificate',       file_name:'VND1001_GST_Certificate.pdf', file_url:'https://docs.example.com/vnd1001/gst-certificate.pdf'},
    {id:2, vendor_id:'VND1001', document_type:'PAN Card',                           file_name:'VND1001_PAN.pdf',             file_url:'https://docs.example.com/vnd1001/pan.pdf'},
    {id:3, vendor_id:'VND1001', document_type:'Cisco Partner Authorization Letter', file_name:'VND1001_Cisco_PAL.pdf',       file_url:'https://docs.example.com/vnd1001/cisco-pal.pdf'},
    {id:4, vendor_id:'VND1001', document_type:'Signed Master Service Agreement',    file_name:'VND1001_MSA_Signed.pdf',      file_url:'https://docs.example.com/vnd1001/msa-signed.pdf'},
    {id:5, vendor_id:'VND1002', document_type:'GST Registration Certificate',       file_name:'VND1002_GST_Certificate.pdf', file_url:'https://docs.example.com/vnd1002/gst-certificate.pdf'},
  ],
  invoices: [
    {invoice_id:'INV24007', vendor_id:'VND1001', description:'Webex devices supply — Infosys Pune campus',   po_number:'PO-SIM-2024-118', amount:1250000, invoice_date:'2026-03-10', due_date:'2026-06-08', status:'outstanding'},
    {invoice_id:'INV24019', vendor_id:'VND1001', description:'AMC renewal Q1 — collaboration endpoints',     po_number:'PO-SIM-2024-141', amount:345000,  invoice_date:'2026-04-22', due_date:'2026-07-21', status:'outstanding'},
    {invoice_id:'INV24021', vendor_id:'VND1001', description:'Professional services — UC migration support', po_number:'PO-SIM-2024-150', amount:580000,  invoice_date:'2026-05-02', due_date:'2026-07-31', status:'partially_paid'},
    {invoice_id:'INV23088', vendor_id:'VND1001', description:'Network hardware supply',                      po_number:'PO-SIM-2023-201', amount:920000,  invoice_date:'2025-11-15', due_date:'2026-02-13', status:'paid'},
    {invoice_id:'INV24033', vendor_id:'VND1002', description:'Switching infrastructure — HCLTech project',  po_number:'PO-SIM-2024-162', amount:2150000, invoice_date:'2026-05-20', due_date:'2026-08-18', status:'outstanding'},
  ],
  payment_schedules: [
    {id:1, invoice_id:'INV24007', installment_no:1, amount:625000,  scheduled_date:'2026-06-30', status:'scheduled', payment_mode:'NEFT', utr_number:null},
    {id:2, invoice_id:'INV24007', installment_no:2, amount:625000,  scheduled_date:'2026-07-30', status:'scheduled', payment_mode:'NEFT', utr_number:null},
    {id:3, invoice_id:'INV24019', installment_no:1, amount:345000,  scheduled_date:'2026-07-25', status:'scheduled', payment_mode:'NEFT', utr_number:null},
    {id:4, invoice_id:'INV24021', installment_no:1, amount:290000,  scheduled_date:'2026-05-30', status:'released',  payment_mode:'NEFT', utr_number:'UTR2605300042187'},
    {id:5, invoice_id:'INV24021', installment_no:2, amount:290000,  scheduled_date:'2026-08-05', status:'scheduled', payment_mode:'NEFT', utr_number:null},
    {id:6, invoice_id:'INV24033', installment_no:1, amount:2150000, scheduled_date:'2026-08-18', status:'on_hold',   payment_mode:'RTGS', utr_number:null},
  ],
};

// ── helpers ──────────────────────────────────────────────────────────────
function maskEmail(e){if(!e||!e.includes('@'))return e||'';const[u,d]=e.split('@');return u.slice(0,2)+'*'.repeat(Math.max(u.length-2,2))+'@'+d;}
function maskPhone(p){if(!p)return'';return p.slice(0,-4).replace(/\d/g,'*')+p.slice(-4);}
function formatINR(n){const[i,d]=Number(n).toFixed(2).split('.');let s=i.slice(-3),r=i.slice(0,-3);while(r.length>0){s=r.slice(-2)+','+s;r=r.slice(0,-2);}return'₹'+s+(d!=='00'?'.'+d:'');}
function amountToSpeech(n){const ones=['','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];const tens=['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];function td(x){if(x<20)return ones[x];return tens[Math.floor(x/10)]+(x%10?' '+ones[x%10]:'');}function thr(x){const h=Math.floor(x/100),r=x%100;return(h?ones[h]+' hundred'+(r?' ':''):'')+( r?td(r):'');}let x=Math.round(n);if(!x)return'zero rupees';const p=[];const cr=Math.floor(x/1e7);x%=1e7;const la=Math.floor(x/1e5);x%=1e5;const th=Math.floor(x/1000);x%=1000;if(cr)p.push(td(cr)+' crore');if(la)p.push(td(la)+' lakh');if(th)p.push(td(th)+' thousand');if(x)p.push(thr(x));return p.join(' ')+' rupees';}
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
function dateToSpeech(s){if(!s)return'';const[y,m,d]=s.split('-').map(Number);return`${d} ${MONTHS[m-1]} ${y}`;}
function getVendor(id){if(!id)return null;return DATA.vendors.find(v=>v.vendor_id.toUpperCase()===String(id).trim().toUpperCase())||null;}

// ── route handlers ───────────────────────────────────────────────────────
function validateVendor({vendor_id, phone}){
  let v=getVendor(vendor_id);
  if(!v&&phone){const d=String(phone).replace(/\D/g,'').slice(-10);v=DATA.vendors.find(x=>x.phone.replace(/\D/g,'').slice(-10)===d)||null;}
  if(!v)return{valid:false,message:'Vendor not found. Please check the vendor ID.'};
  if(v.status!=='active')return{valid:false,vendor_id:v.vendor_id,status:v.status,message:`This vendor account is currently ${v.status}.`};
  return{valid:true,vendor_id:v.vendor_id,vendor_name:v.name,contact_name:v.contact_name,email:v.email,phone:v.phone,status:v.status};
}

function checkEmpanelment({vendor_id,oem_product,customer}){
  const v=getVendor(vendor_id);
  if(!v)return{found:false,message:'Vendor not found.'};
  const op=(oem_product||'').toLowerCase(),cu=(customer||'').toLowerCase();
  const emp=DATA.empanelments.find(e=>e.vendor_id===v.vendor_id&&e.oem_product.toLowerCase().includes(op)&&e.customer.toLowerCase().includes(cu));
  const docs=DATA.doc_requirements.filter(d=>d.oem_product.toLowerCase().includes(op)&&(d.customer==='*'||d.customer.toLowerCase().includes(cu)));
  const onFile=DATA.vendor_documents.filter(d=>d.vendor_id===v.vendor_id).map(d=>d.document_type);
  const required=docs.map(d=>({document_type:d.document_type,mandatory:!!d.mandatory,on_file:onFile.includes(d.document_type)}));
  const missing=required.filter(d=>d.mandatory&&!d.on_file).map(d=>d.document_type);
  return{found:true,vendor_id:v.vendor_id,oem_product,customer,empanelment_status:emp?emp.status:'not_empaneled',valid_till:emp?emp.valid_till:null,remarks:emp?emp.remarks:'No empanelment record exists for this combination.',required_documents:required,missing_documents:missing,documents_speech:required.length?required.map(d=>d.document_type).join(', '):'No specific documents configured.'};
}

function requestDocument({vendor_id,document_type}){
  const v=getVendor(vendor_id);
  if(!v)return{sent:false,message:'Vendor not found.'};
  const dt=(document_type||'').toLowerCase();
  const doc=DATA.vendor_documents.find(d=>d.vendor_id===v.vendor_id&&d.document_type.toLowerCase().includes(dt));
  if(!doc)return{sent:false,message:`We do not have "${document_type}" on file for this vendor.`};
  return{sent:true,document_type:doc.document_type,file_name:doc.file_name,file_url:doc.file_url,to_email:v.email,email_masked:maskEmail(v.email),message:`The ${doc.document_type} will be emailed to ${maskEmail(v.email)}.`};
}

function outstandingPayments({vendor_id}){
  const v=getVendor(vendor_id);
  if(!v)return{authorized:false,message:'Vendor not found.'};
  const rows=DATA.invoices.filter(i=>i.vendor_id===v.vendor_id&&['outstanding','partially_paid'].includes(i.status)).sort((a,b)=>a.due_date.localeCompare(b.due_date));
  return{authorized:true,vendor_id:v.vendor_id,count:rows.length,invoices:rows.map(r=>({invoice_id:r.invoice_id,description:r.description,amount:r.amount,amount_display:formatINR(r.amount),amount_speech:amountToSpeech(r.amount),due_date:r.due_date,due_date_speech:dateToSpeech(r.due_date),status:r.status})),summary_speech:rows.length===0?'There are no outstanding payments on this account.':`There are ${rows.length} pending invoices: `+rows.map(r=>`invoice ${r.invoice_id} for ${amountToSpeech(r.amount)}, due ${dateToSpeech(r.due_date)}`).join('; ')};
}

function paymentSchedule({vendor_id,invoice_id}){
  const v=getVendor(vendor_id);
  if(!v)return{authorized:false,message:'Vendor not found.'};
  const inv=DATA.invoices.find(i=>i.vendor_id===v.vendor_id&&i.invoice_id.toUpperCase()===(invoice_id||'').toUpperCase());
  if(!inv)return{authorized:true,found:false,message:`Invoice ${invoice_id} was not found on this vendor account.`};
  const sched=DATA.payment_schedules.filter(s=>s.invoice_id===inv.invoice_id).sort((a,b)=>a.installment_no-b.installment_no);
  return{authorized:true,found:true,invoice_id:inv.invoice_id,description:inv.description,total_amount:inv.amount,total_amount_display:formatINR(inv.amount),total_amount_speech:amountToSpeech(inv.amount),status:inv.status,installments:sched.map(s=>({installment_no:s.installment_no,amount:s.amount,amount_display:formatINR(s.amount),amount_speech:amountToSpeech(s.amount),scheduled_date:s.scheduled_date,scheduled_date_speech:dateToSpeech(s.scheduled_date),status:s.status,payment_mode:s.payment_mode,utr_number:s.utr_number})),schedule_speech:sched.length===0?`Invoice ${inv.invoice_id} has no payment schedule configured yet.`:sched.map(s=>`Installment ${s.installment_no} of ${amountToSpeech(s.amount)} is ${s.status==='released'?'already released':s.status==='on_hold'?'on hold':'scheduled'} for ${dateToSpeech(s.scheduled_date)} by ${s.payment_mode}`).join('. ')};
}

// ── Vercel handler ───────────────────────────────────────────────────────
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({error:'POST only'});

  const route = req.url.replace(/\?.*$/, '').replace('/api/agent/', '');
  const body = req.body || {};

  const routes = {
    'validate-vendor':      () => validateVendor(body),
    'check-empanelment':    () => checkEmpanelment(body),
    'request-document':     () => requestDocument(body),
    'outstanding-payments': () => outstandingPayments(body),
    'payment-schedule':     () => paymentSchedule(body),
  };

  if (!routes[route]) return res.status(404).json({error:`Unknown route: ${route}`, available: Object.keys(routes).map(r=>'/api/agent/'+r)});
  return res.status(200).json(routes[route]());
};
