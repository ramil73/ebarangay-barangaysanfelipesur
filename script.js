const STORE_KEY="ebarangay_requests_v2", SMS_KEY="ebarangay_sms_v2", SEQ_KEY="ebarangay_seq_v2", RES_KEY="ebarangay_residents_v2", AUDIT_KEY="ebarangay_audit_v2";
const currentAdmin="admin";

function load(key){return JSON.parse(localStorage.getItem(key)||"[]")}
function save(key,val){localStorage.setItem(key,JSON.stringify(val))}
function loadRequests(){return load(STORE_KEY)}
function saveRequests(v){save(STORE_KEY,v)}
function nextSeq(){let n=+(localStorage.getItem(SEQ_KEY)||0)+1;localStorage.setItem(SEQ_KEY,n);return n}
function todayPH(){return new Date().toLocaleDateString("en-PH",{year:"numeric",month:"long",day:"numeric"})}
function nowPH(){return new Date().toLocaleString("en-PH")}
function esc(s){const d=document.createElement("div");d.textContent=s??"";return d.innerHTML}
function badge(s){const c={"Pending":"pending","Under Review":"review","Ready for Pickup":"ready","Issued":"ready","Rejected":"rejected","On Hold":"hold"}[s]||"review";return `<span class="badge ${c}">${esc(s)}</span>`}
function addAudit(action,ref="",details=""){const a=load(AUDIT_KEY);a.unshift({time:nowPH(),staff:currentAdmin,action,ref,details});save(AUDIT_KEY,a)}
function sendSms(to,msg){const s=load(SMS_KEY);s.unshift({to,msg,time:nowPH()});save(SMS_KEY,s)}

document.querySelectorAll(".tab-btn").forEach(b=>b.addEventListener("click",()=>showTab(b.dataset.tab)));
function showTab(name){document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active"));document.getElementById("tab-"+name).classList.add("active");document.querySelectorAll(".tab-btn").forEach(b=>b.classList.toggle("active",b.dataset.tab===name));if(name==="admin")refreshAdmin();}

const _d=new Date();document.getElementById("f_date").min=new Date(_d-_d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
const filesInput=document.getElementById("f_files");
filesInput.addEventListener("change",()=>{document.getElementById("fileList").textContent=filesInput.files.length?Array.from(filesInput.files).map(f=>f.name).join(" • "):"Accepted: JPG, PNG, PDF. Prototype stores file names only."});

document.getElementById("requestForm").addEventListener("submit",e=>{
  e.preventDefault();
  const files=Array.from(filesInput.files||[]).filter(f=>/(\.jpg|\.jpeg|\.png|\.pdf)$/i.test(f.name)).map(f=>({name:f.name,type:f.type,size:f.size}));
  const ref="SFS-"+new Date().getFullYear()+"-"+String(nextSeq()).padStart(4,"0");
  const r={ref,name:document.getElementById("f_name").value.trim(),mobile:document.getElementById("f_mobile").value.trim(),address:document.getElementById("f_address").value.trim(),doctype:document.getElementById("f_doctype").value,copies:+document.getElementById("f_copies").value,purpose:document.getElementById("f_purpose").value,details:document.getElementById("f_details").value.trim(),files,status:"Pending",dateFiled:todayPH(),pickupDate:document.getElementById("f_date").value,pickupTime:document.getElementById("f_time").value,fee:0};
  const all=loadRequests();all.unshift(r);saveRequests(all);addAudit("Request submitted",ref,r.doctype);refreshAdmin();
  sendSms(r.mobile,`Good day ${r.name.split(" ")[0]}! Your request ${r.ref} has been received and is PENDING review.`);
  document.getElementById("refResult").innerHTML=`<div class="refbox">Request submitted successfully. Your reference number is <b>${r.ref}</b>.<br>Keep this code for tracking. A confirmation SMS was simulated for <b>${esc(r.mobile)}</b>.</div>`;
  e.target.reset();document.getElementById("fileList").textContent="Accepted: JPG, PNG, PDF. Prototype stores file names only.";
});

document.getElementById("trackBtn").addEventListener("click",()=>{
  const ref=document.getElementById("trackRef").value.trim();const r=loadRequests().find(x=>x.ref.toLowerCase()===ref.toLowerCase());const b=document.getElementById("trackResult");
  if(!r){b.innerHTML=`<div class="empty">No request found with that reference number.</div>`;return}
  b.innerHTML=`<div class="card" style="box-shadow:none;background:#fbfdfc"><div class="grid grid-2">
  <div><b>${esc(r.doctype)}</b><div class="lead">${esc(r.ref)} • Filed ${esc(r.dateFiled)}</div>${badge(r.status)}</div>
  <div><b>Pickup</b><div>${r.pickupDate?esc(r.pickupDate):"Not scheduled"} ${esc(r.pickupTime||"")}</div></div></div>
  <hr style="border:0;border-top:1px solid var(--line);margin:16px 0">
  <div><b>Applicant:</b> ${esc(r.name)}<br><b>Purpose:</b> ${esc(r.purpose)}<br><b>Requirements:</b> ${r.files.length?esc(r.files.map(f=>f.name).join(", ")):"None uploaded"}</div>
  ${r.reason?`<div style="margin-top:14px" class="notice"><b>Staff note:</b> ${esc(r.reason)}</div>`:""}</div>`;
});

document.getElementById("verifyBtn").addEventListener("click",()=>{
  const ref=document.getElementById("verifyRef").value.trim();const r=loadRequests().find(x=>x.ref.toLowerCase()===ref.toLowerCase());const b=document.getElementById("verifyResult");
  b.innerHTML=r&&!["Ready for Pickup","Issued"].includes(r.status)?`<div class="notice">Record found for <b>${esc(r.ref)}</b>, but the certificate has not been issued yet (status: ${esc(r.status)}). It cannot be verified as an official certificate.</div>`:r?`<div class="verify"><div class="row"><div><h3>Verified Record</h3><p><b>Reference:</b> ${esc(r.ref)}<br><b>Document:</b> ${esc(r.doctype)}<br><b>Name:</b> ${esc(r.name)}<br><b>Status:</b> ${badge(r.status)}</p></div><div style="text-align:center"><div class="qr"></div><small style="color:var(--muted)">QR verification demo</small></div></div></div>`:`<div class="empty">No certificate/request record found.</div>`;
});

document.getElementById("adminLoginBtn").addEventListener("click",()=>{
  const u=document.getElementById("adm_user").value.trim(),p=document.getElementById("adm_pass").value;
  if(u==="admin"&&p==="brgy2026"){document.getElementById("adminLoginCard").style.display="none";document.getElementById("adminDashboard").style.display="block";renderAllAdmin();document.getElementById("loginError").textContent=""}
  else document.getElementById("loginError").textContent="Invalid username or password.";
});
document.getElementById("logoutBtn").addEventListener("click",()=>{document.getElementById("adminLoginCard").style.display="block";document.getElementById("adminDashboard").style.display="none";document.getElementById("adm_pass").value=""});
document.querySelectorAll(".admin-tab").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".admin-tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderAllAdmin();document.querySelectorAll(".admin-section").forEach(s=>s.classList.remove("active"));document.getElementById("admin-"+b.dataset.section).classList.add("active")}));

function renderAllAdmin(){renderOverview();renderRequests();renderResidents();renderAppointments();renderReports();renderSMS();renderAudit()}
function renderOverview(){
 const r=loadRequests();const counts={Pending:r.filter(x=>x.status==="Pending").length,Review:r.filter(x=>x.status==="Under Review").length,Ready:r.filter(x=>x.status==="Ready for Pickup").length,Issued:r.filter(x=>x.status==="Issued").length,Rejected:r.filter(x=>x.status==="Rejected").length};
 document.getElementById("admin-overview").innerHTML=`<div class="grid grid-4 kpis">${Object.entries(counts).map(([k,v])=>`<div class="stats"><div class="num">${v}</div><div class="label">${k}</div></div>`).join("")}</div>
 <div class="grid grid-2"><div class="card"><h3>Recent Requests</h3>${r.slice(0,6).length?r.slice(0,6).map(x=>`<p style="margin:8px 0"><b>${esc(x.ref)}</b> — ${esc(x.name)}<br>${esc(x.doctype)} &nbsp; ${badge(x.status)}</p>`).join(""):`<div class="empty">No requests yet.</div>`}</div>
 <div class="card"><h3>System Modules</h3><p>✔ Online document request</p><p>✔ Requirement upload names</p><p>✔ Request tracking</p><p>✔ SMS simulation</p><p>✔ Appointment scheduling</p><p>✔ Certificate / PDF print</p><p>✔ QR verification demo</p><p>✔ Resident & census records</p></div></div>`;
}
function renderRequests(){
 const r=loadRequests();document.getElementById("admin-requests").innerHTML=`<div class="card"><h3>Request Processing Center</h3><p class="lead">Approve, hold, reject, issue, or view certificates.</p><div style="overflow:auto"><table><thead><tr><th>Ref</th><th>Resident</th><th>Document</th><th>Pickup</th><th>Status</th><th>Action</th></tr></thead><tbody>${r.length?r.map(x=>`<tr><td>${esc(x.ref)}</td><td>${esc(x.name)}<br><small>${esc(x.mobile)}</small></td><td>${esc(x.doctype)}<br><small>${esc(x.purpose)}</small></td><td>${esc(x.pickupDate||"—")}<br>${esc(x.pickupTime||"")}</td><td>${badge(x.status)}</td><td><button class="btn small" onclick="openProcess('${x.ref}')">Process</button> ${["Ready for Pickup","Issued"].includes(x.status)?`<button class="btn small secondary" onclick="viewCertificate('${x.ref}')">Certificate</button>`:""}</td></tr>`).join(""):`<tr><td colspan="6"><div class="empty">No requests submitted yet.</div></td></tr>`}</tbody></table></div></div>`;
}
let processingRef=null;
function openProcess(ref){
 const r=loadRequests().find(x=>x.ref===ref);if(!r)return;processingRef=ref;
 document.getElementById("modalBody").innerHTML=`<div class="notice"><b>${esc(r.ref)}</b> — ${esc(r.name)} — ${esc(r.doctype)}</div>
 <label>Status</label><select id="p_status"><option ${r.status==="Pending"?"selected":""}>Pending</option><option ${r.status==="Under Review"?"selected":""}>Under Review</option><option ${r.status==="Ready for Pickup"?"selected":""}>Ready for Pickup</option><option ${r.status==="Issued"?"selected":""}>Issued</option><option ${r.status==="On Hold"?"selected":""}>On Hold</option><option ${r.status==="Rejected"?"selected":""}>Rejected</option></select>
 <label>Fee (PHP)</label><input id="p_fee" type="number" min="0" step="1" value="${r.fee||0}">
 <label>Staff Note / Rejection Reason</label><textarea id="p_reason" placeholder="Reason for hold/rejection or processing note">${esc(r.reason||"")}</textarea>
 <label>Issued By</label><input id="p_staff" value="Admin / Authorized Staff">`;
 document.getElementById("requestModal").classList.add("open");
}
document.getElementById("closeModal").onclick=()=>document.getElementById("requestModal").classList.remove("open");
document.getElementById("saveProcess").onclick=()=>{
 const all=loadRequests(),r=all.find(x=>x.ref===processingRef);if(!r)return;const old=r.status;const status=document.getElementById("p_status").value;
 r.status=status;r.fee=+document.getElementById("p_fee").value||0;r.reason=document.getElementById("p_reason").value.trim();r.processedBy=document.getElementById("p_staff").value.trim();r.processedAt=nowPH();
 saveRequests(all);addAudit("Status updated",r.ref,old+" → "+status);
 if(status==="Ready for Pickup")sendSms(r.mobile,`Good day ${r.name.split(" ")[0]}! Your ${r.doctype} (${r.ref}) is ready for pickup. Schedule: ${r.pickupDate||"Contact barangay"} ${r.pickupTime||""}.`);
 if(status==="Rejected")sendSms(r.mobile,`Your request ${r.ref} was rejected/on hold. Reason: ${r.reason||"Please visit the Barangay Hall for details."}`);
 document.getElementById("requestModal").classList.remove("open");renderAllAdmin();
};

function renderResidents(){
 let res=load(RES_KEY); if(!res.length){const names=[["Juan Dela Cruz","Purok 1","Adult","Resident"],["Maria Santos","Purok 2","Senior Citizen","Senior Citizen"],["Pedro Reyes","Purok 3","Adult","PWD"]];res=names.map((x,i)=>({id:i+1,name:x[0],address:x[1],ageGroup:x[2],sector:x[3]}));save(RES_KEY,res)}
 document.getElementById("admin-residents").innerHTML=`<div class="card"><h3>Resident Database & Census</h3><div class="grid grid-3"><div class="stats"><div class="num">${res.length}</div><div class="label">Recorded residents</div></div><div class="stats"><div class="num">${res.filter(x=>x.sector==="Senior Citizen").length}</div><div class="label">Senior Citizens</div></div><div class="stats"><div class="num">${res.filter(x=>x.sector==="PWD").length}</div><div class="label">PWD</div></div></div></div>
 <div class="card"><h3>Add Resident</h3><div class="row"><div><label>Full Name</label><input id="r_name"></div><div><label>Address / Purok</label><input id="r_addr"></div></div><div class="row"><div><label>Age Group</label><select id="r_age"><option>Child</option><option>Youth</option><option selected>Adult</option><option>Senior Citizen</option></select></div><div><label>Sector</label><select id="r_sector"><option>Resident</option><option>Senior Citizen</option><option>PWD</option><option>Solo Parent</option></select></div></div><div class="actions"><button class="btn" onclick="addResident()">Add Resident</button></div></div>
 <div class="card"><table><thead><tr><th>Name</th><th>Address</th><th>Age Group</th><th>Sector</th><th></th></tr></thead><tbody>${res.map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.address)}</td><td>${esc(x.ageGroup)}</td><td>${esc(x.sector)}</td><td><button class="btn small danger" onclick="delResident(${x.id})">Delete</button></td></tr>`).join("")}</tbody></table></div>`;
}
function renderAppointments(){
 const r=loadRequests().filter(x=>x.pickupDate);document.getElementById("admin-appointments").innerHTML=`<div class="card"><h3>Digital Queue / Appointments</h3><p class="lead">Pickup schedules help reduce crowding at the Barangay Hall.</p><table><thead><tr><th>Date</th><th>Time</th><th>Reference</th><th>Resident</th><th>Document</th><th>Status</th></tr></thead><tbody>${r.length?r.sort((a,b)=>(a.pickupDate||"").localeCompare(b.pickupDate||"")).map(x=>`<tr><td>${esc(x.pickupDate)}</td><td>${esc(x.pickupTime||"")}</td><td>${esc(x.ref)}</td><td>${esc(x.name)}</td><td>${esc(x.doctype)}</td><td>${badge(x.status)}</td></tr>`).join(""):`<tr><td colspan="6"><div class="empty">No scheduled pickups.</div></td></tr>`}</tbody></table></div>`;
}
function renderReports(){
 const r=loadRequests();const types={};r.forEach(x=>types[x.doctype]=(types[x.doctype]||0)+1);const max=Math.max(1,...Object.values(types));const revenue=r.reduce((s,x)=>s+(+x.fee||0),0);
 document.getElementById("admin-reports").innerHTML=`<div class="grid grid-3"><div class="stats"><div class="num">${r.length}</div><div class="label">Total requests</div></div><div class="stats"><div class="num">₱${revenue.toLocaleString()}</div><div class="label">Recorded fees</div></div><div class="stats"><div class="num">${r.filter(x=>x.status==="Issued").length}</div><div class="label">Issued documents</div></div></div>
 <div class="card"><h3>Requests by Document Type</h3>${Object.keys(types).length?Object.entries(types).map(([k,v])=>`<div style="margin:12px 0"><div style="display:flex;justify-content:space-between;font-size:13px"><span>${esc(k)}</span><b>${v}</b></div><div class="bar"><i style="width:${Math.round(v/max*100)}%"></i></div></div>`).join(""):`<div class="empty">No analytics data yet.</div>`}</div>
 <div class="card"><h3>Daily / Monthly Revenue Summary</h3><table><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody><tr><td>Total fees recorded</td><td>₱${revenue.toLocaleString()}</td></tr><tr><td>Potential paid requests</td><td>${r.filter(x=>(+x.fee||0)>0).length}</td></tr></tbody></table></div>`;
}
function renderSMS(){
 document.getElementById("admin-sms").innerHTML=`<div class="grid grid-2"><div class="card"><h3>SMS Broadcast Engine</h3><p class="lead">Prototype simulation of Semaphore / iTexMo-style outbound messages.</p><label>Recipient mobile numbers</label><textarea id="sms_to" placeholder="09171234567, 09181234567"></textarea><label>Message</label><textarea id="sms_msg" maxlength="160" placeholder="Barangay announcement..."></textarea><div class="actions"><button class="btn blue" onclick="broadcastSms()">Send Broadcast</button></div></div><div class="card"><h3>SMS Log</h3><div class="sms-log">${(load(SMS_KEY).length?load(SMS_KEY):[]).map(x=>`<div class="sms-line">[${esc(x.time)}] To ${esc(x.to)}: ${esc(x.msg)}</div>`).join("")||'<div class="sms-line">No messages yet.</div>'}</div></div></div>`;
}
function broadcastSms(){const to=document.getElementById("sms_to").value.split(",").map(x=>x.trim()).filter(Boolean),msg=document.getElementById("sms_msg").value.trim();if(!msg||!to.length)return alert("Enter recipients and a message.");to.forEach(n=>sendSms(n,msg));addAudit("SMS broadcast","",`${to.length} recipients`);renderAllAdmin()}
function renderAudit(){
 const a=load(AUDIT_KEY);document.getElementById("admin-audit").innerHTML=`<div class="card"><h3>Transaction Logs / Audit Trail</h3><p class="lead">Tracks staff processing actions such as approval, printing, issuing and status updates.</p><table><thead><tr><th>Time</th><th>Staff</th><th>Action</th><th>Reference</th><th>Details</th></tr></thead><tbody>${a.length?a.map(x=>`<tr><td>${esc(x.time)}</td><td>${esc(x.staff)}</td><td>${esc(x.action)}</td><td>${esc(x.ref||"—")}</td><td>${esc(x.details||"")}</td></tr>`).join(""):`<tr><td colspan="5"><div class="empty">No audit records yet.</div></td></tr>`}</tbody></table></div>`;
}

function viewCertificate(ref){
 const r=loadRequests().find(x=>x.ref===ref);if(!r)return;
 const bodies={
 "Barangay Clearance":`This is to certify that <b>${esc(r.name.toUpperCase())}</b>, of legal age, and a resident of ${esc(r.address)}, Barangay San Felipe Sur, Binalonan, Pangasinan, is known to this office to be of good moral character and has no derogatory record on file as of this date.`,
 "Certificate of Residency":`This is to certify that <b>${esc(r.name.toUpperCase())}</b> is a bona fide resident of ${esc(r.address)}, Barangay San Felipe Sur, Binalonan, Pangasinan.`,
 "Certificate of Indigency":`This is to certify that <b>${esc(r.name.toUpperCase())}</b>, a resident of ${esc(r.address)}, Barangay San Felipe Sur, Binalonan, Pangasinan, belongs to an indigent family in this barangay based on records available in this office.`,
 "First Time Job Seeker Certificate":`This is to certify that <b>${esc(r.name.toUpperCase())}</b>, a resident of ${esc(r.address)}, Barangay San Felipe Sur, Binalonan, Pangasinan, is requesting this certification for first-time job seeker purposes.`,
 "Business Permit Endorsement":`This is to certify that <b>${esc(r.name.toUpperCase())}</b>, of ${esc(r.address)}, Barangay San Felipe Sur, Binalonan, Pangasinan, is endorsed for business permit processing, subject to applicable barangay ordinances and regulations.`
 };
 document.getElementById("certContent").innerHTML=`<div class="cert-head"><div class="seal" style="margin:auto auto 8px">SFS</div><div style="font-size:12px;color:#5f6b64">REPUBLIC OF THE PHILIPPINES • PROVINCE OF PANGASINAN • MUNICIPALITY OF BINALONAN<br>OFFICE OF THE BARANGAY CAPTAIN</div><h2>BARANGAY SAN FELIPE SUR</h2></div><hr style="border:0;border-top:1px solid #d7dfd9;margin:18px 0"><div class="cert-title">${esc(r.doctype)}</div><div class="cert-body"><p>TO WHOM IT MAY CONCERN:</p><p>${bodies[r.doctype]||bodies["Barangay Clearance"]}</p><p>This certification is issued upon the request of the above-named person for <b>${esc(r.purpose)}</b>.</p><p>Issued this ${esc(r.dateApproved||todayPH())} at Barangay San Felipe Sur, Binalonan, Pangasinan.</p><p style="font-size:12px;color:#777">Reference No. ${esc(r.ref)} • Copies issued: ${r.copies} • QR verification code: ${esc(r.ref)}</p></div><div class="cert-sign"><div><div class="name">HON. JUAN P. SANTOS</div><div class="role">Punong Barangay / Authorized Signatory</div></div></div></div>`;
 showTab("cert");addAudit("Certificate viewed/printed",r.ref,r.doctype);
}
document.getElementById("backFromCert").onclick=()=>showTab("admin");
document.getElementById("printCertBtn").onclick=()=>window.print();

function addResident(){
  const name=document.getElementById("r_name").value.trim(),address=document.getElementById("r_addr").value.trim();
  if(!name||!address)return alert("Enter the resident's name and address.");
  const res=load(RES_KEY);res.unshift({id:Date.now(),name,address,ageGroup:document.getElementById("r_age").value,sector:document.getElementById("r_sector").value});
  save(RES_KEY,res);addAudit("Resident added","",name);renderAllAdmin();
}
function delResident(id){
  if(!confirm("Delete this resident record?"))return;
  const res=load(RES_KEY),x=res.find(r=>r.id===id);save(RES_KEY,res.filter(r=>r.id!==id));addAudit("Resident deleted","",x?x.name:"");renderAllAdmin();
}
function download(name,text,type){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();URL.revokeObjectURL(a.href)}
function exportCSV(){
  const cols=["ref","name","mobile","address","doctype","copies","purpose","status","fee","dateFiled","pickupDate","pickupTime","reason","processedBy","processedAt"];
  const q=v=>'"'+String(v??"").replace(/"/g,'""')+'"';
  const rows=[cols.join(",")].concat(loadRequests().map(r=>cols.map(c=>q(r[c])).join(",")));
  download("ebarangay_requests.csv","\ufeff"+rows.join("\n"),"text/csv");addAudit("Requests exported","","CSV");renderAudit();
}
function backupJSON(){
  const data={requests:load(STORE_KEY),residents:load(RES_KEY),sms:load(SMS_KEY),audit:load(AUDIT_KEY),exportedAt:nowPH()};
  download("ebarangay_backup.json",JSON.stringify(data,null,2),"application/json");addAudit("Backup created","","JSON");renderAudit();
}

function refreshAdmin(){if(document.getElementById("adminDashboard").style.display==="block")renderAllAdmin()}
window.addEventListener("storage",refreshAdmin);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)refreshAdmin()});
