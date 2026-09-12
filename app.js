(() => {
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const store = { get(k,d){try{return JSON.parse(localStorage.getItem(k)) ?? d}catch{return d}}, set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}} };
  const gate=$('#gate'), intro=$('#intro'), introVideo=$('#introVideo'), nextWrap=$('#nextWrap'), nextBtn=$('#nextBtn'), introSound=$('#introSound'), introError=$('#introError'), app=$('#app');
  const dashboardVideo=$('#dashboardVideo'), dashboardMute=$('#dashboardMute');
  let unlocked=false, firstIntroEnd=false;

  function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),2200)}
  function mount(){window.mountIcons?.()}
  function setStatus(text,ok=true){$('#authStatus').innerHTML=`<span style="background:${ok?'#5ee0b0':'#ef7180'};box-shadow:0 0 16px ${ok?'#5ee0b0':'#ef7180'}"></span>${text}`}

  // Fingerprint is a local visual simulation only. The tap is the user gesture that unlocks the intro.
  $('#fingerprint').addEventListener('click', async () => {
    if(unlocked) return; unlocked=true; setStatus('MEMBACA SENSOR…');
    $('#fingerprint').classList.add('reading');
    await new Promise(r=>setTimeout(r,850));
    setStatus('AKSES DITERIMA');
    gate.classList.add('hidden'); intro.classList.remove('hidden');
    introVideo.muted=true; introVideo.currentTime=0;
    try{await introVideo.play()}catch{introError.classList.remove('hidden');}
    toast('Intro LearnX dimulai');
  });
  introVideo.addEventListener('error',()=>introError.classList.remove('hidden'));
  introVideo.addEventListener('loadeddata',()=>introError.classList.add('hidden'));
  introVideo.addEventListener('ended',()=>{firstIntroEnd=true;nextWrap.classList.remove('hidden');});
  introSound.addEventListener('click',async()=>{introVideo.muted=!introVideo.muted;introSound.innerHTML=`<span data-icon="${introVideo.muted?'volume-off':'volume'}"></span>`;mount();try{await introVideo.play()}catch{}});
  nextBtn.addEventListener('click',()=>{intro.classList.add('hidden');app.classList.remove('hidden');sessionStart();startDashboardSequence();window.scrollTo(0,0);toast('Learning OS siap digunakan');});

  // Dashboard audio sequence: voice greeting first, then the blonde dashboard video audio. If autoplay with audio is blocked, keep video muted and expose the mute button.
  let dashboardStarted=false;
  function updateDashboardMute(){dashboardMute.innerHTML=`<span data-icon="${dashboardVideo.muted?'volume-off':'volume'}"></span>`;mount()}
  async function playDashboard(){
    if(dashboardStarted) return; dashboardStarted=true;
    dashboardVideo.currentTime=0; dashboardVideo.muted=false;
    try{await dashboardVideo.play(); updateDashboardMute();}
    catch{dashboardVideo.muted=true; updateDashboardMute(); try{await dashboardVideo.play()}catch{}}
  }
  function startDashboardSequence(){
    dashboardVideo.pause(); dashboardVideo.currentTime=0; dashboardVideo.muted=true; updateDashboardMute();
    const fallback=()=>setTimeout(playDashboard,900);
    if('speechSynthesis' in window){
      speechSynthesis.cancel();
      const u=new SpeechSynthesisUtterance('Hello everyone, welcome to LearnX');u.lang='en-US';u.rate=.86;u.pitch=1.08;u.volume=.72;
      const voices=speechSynthesis.getVoices(); const preferred=voices.find(v=>/female|samantha|zira|aria|jenny|ava|google us english/i.test(v.name))||voices.find(v=>/^en(-|_)/i.test(v.lang)); if(preferred)u.voice=preferred;
      let finished=false; const done=()=>{if(finished)return;finished=true;playDashboard()};u.onend=done;u.onerror=done;
      speechSynthesis.speak(u);setTimeout(()=>{if(!speechSynthesis.speaking)done()},4500);
    }else fallback();
  }
  dashboardMute.addEventListener('click',async()=>{dashboardVideo.muted=!dashboardVideo.muted;updateDashboardMute();try{await dashboardVideo.play()}catch{}});

  // Navigation
  function showPage(id){$$('.page').forEach(p=>p.classList.toggle('active',p.id===id));$$('.nav').forEach(n=>n.classList.toggle('active',n.dataset.page===id));window.scrollTo({top:0,behavior:'smooth'});if(id==='progress')renderProgress();if(id==='iq')renderIq();if(id==='curriculum')renderModules();if(id==='notes')syncNotes();$('#sidebar').classList.remove('open')}
  document.addEventListener('click',e=>{const el=e.target.closest('[data-page]');if(el)showPage(el.dataset.page)});
  $('#menuBtn').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));

  // Clock and session state
  function sessionStart(){store.set('learnxSessions',store.get('learnxSessions',0)+1)}
  function tick(){const d=new Date();$('#clock').textContent=d.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});$('#date').textContent=d.toLocaleDateString('id-ID',{weekday:'short',day:'2-digit',month:'short'})}
  tick();setInterval(tick,1000);sessionStart();
  const week=$('#weekBars'); const hs=[42,60,35,78,55,88,66];week.innerHTML=hs.map((h,i)=>`<i style="--h:${h}%"><span>${['S','S','R','K','J','S','M'][i]}</span></i>`).join('');

  // Dynamic curriculum
  const modules=[['Matematika','Aljabar, fungsi, geometri, statistika'],['Bahasa Indonesia','Teks LHO, eksposisi, argumentasi, sastra'],['Bahasa Inggris','Grammar, reading, vocabulary, speaking'],['Bahasa Jepang','Hiragana, katakana, kosakata, dialog'],['IPA','Fisika, kimia, biologi, eksperimen'],['IPS','Sejarah, ekonomi, geografi, sosiologi'],['PKN','Pancasila, konstitusi, kewarganegaraan'],['Informatika','Algoritma, data, jaringan, coding'],['Seni Budaya','Seni rupa, musik, tari, teater'],['PJOK','Kebugaran, permainan, kesehatan']];
  function renderModules(){const g=$('#moduleGrid');g.innerHTML=modules.map((m,i)=>`<article class="module-card glass"><span class="kicker">MODULE ${String(i+1).padStart(2,'0')}</span><h3>${m[0]}</h3><p>${m[1]}</p><button onclick="window.learnxToast('Ruang ${m[0]} siap')">Buka ruang →</button></article>`).join('')}
  window.learnxToast=toast;renderModules();

  // IQ: deterministic answer keys, shuffled order, no repeat until the current local pool is exhausted.
  const bank=[
    ['Urutan berikut mengikuti pola yang sama: 2, 4, 8, 16, …','24|30|32|34',2],['Jika semua L adalah M dan semua M adalah N, maka…','Semua L adalah N|Semua N adalah L|Sebagian N adalah L|Tidak ada hubungan',0],['3, 6, 11, 18, 27, …','36|38|40|42',1],['Jika ▲ = 4 dan ■ = 7, maka ▲ + ■ × ▲ = …','32|28|44|35',0],['Manakah yang berbeda?','Apel|Mangga|Wortel|Jeruk',2],['A, C, F, J, O, … huruf berikutnya adalah…','T|U|V|W',0],['Sebuah jam terlambat 10 menit setiap jam. Setelah 3 jam, total keterlambatannya…','10 menit|20 menit|30 menit|40 menit',2],['5, 10, 20, 40, …','60|70|80|90',2],['Jika 4 pekerja menyelesaikan tugas dalam 6 hari dengan laju sama, 8 pekerja memerlukan…','2 hari|3 hari|4 hari|6 hari',1],['Semua mawar adalah bunga. Sebagian bunga cepat layu. Kesimpulan yang pasti adalah…','Semua mawar cepat layu|Sebagian mawar cepat layu|Mawar termasuk bunga|Tidak ada mawar',2],['1, 1, 2, 3, 5, 8, …','11|12|13|14',2],['Jika CAT menjadi DBU dengan pola +1 tiap huruf, DOG menjadi…','EPH|EOG|DPH|FPI',0],['12, 15, 21, 30, 42, …','54|55|57|60',2],['Mana pasangan yang memiliki hubungan paling mirip: BUKU : MEMBACA','Pensil : Menulis|Kursi : Berlari|Sepatu : Makan|Jam : Tidur',0],['Jika hari ini Rabu, 17 hari lagi adalah…','Jumat|Sabtu|Minggu|Senin',0],['9, 18, 36, 72, …','108|126|144|152',2],['Sebuah kotak berisi 3 bola merah dan 2 biru. Peluang mengambil bola biru adalah…','1/5|2/5|3/5|1/2',1],['Semua siswa di kelas A suka membaca. Rina berada di kelas A. Maka…','Rina suka membaca|Rina tidak suka membaca|Rina guru|Tidak dapat disimpulkan',0],['4, 7, 13, 25, 49, …','73|85|97|101',2],['Jika KAMUS disusun alfabetis huruf per huruf, huruf pertama adalah…','A|K|M|S',0],['2, 5, 10, 17, 26, …','35|36|37|38',2],['Jika 1=3, 2=6, 3=9, maka 7=…','18|21|24|27',1],['Manakah yang bukan alat tulis?','Penghapus|Penggaris|Kalkulator|Pensil',2],['Semua X adalah Y. Tidak ada Y yang Z. Maka…','Sebagian X adalah Z|Tidak ada X yang Z|Semua Z adalah X|Semua Y adalah Z',1],['10, 13, 19, 28, 40, …','52|55|56|58',1],['Jika 2 mesin membuat 2 barang dalam 2 menit, 1 mesin membuat 1 barang dalam…','1 menit|2 menit|4 menit|8 menit',1],['Urutan: Senin, Rabu, Jumat, …','Sabtu|Minggu|Senin|Selasa',1],['8, 12, 18, 26, 36, …','46|48|50|52',1],['KATA : HURUF = KALIMAT : …','Buku|Kata|Paragraf|Suara',1],['Jika semua A bukan B, dan C adalah A, maka…','C adalah B|C bukan B|B adalah C|Tidak ada hubungan',1],['15, 14, 12, 9, 5, …','1|0|-1|-2',2],['Pola 3, 9, 27, 81, …','162|216|243|324',2],['Jika utara berlawanan selatan, timur berlawanan…','barat|atas|bawah|tengah',0],['Manakah yang paling berbeda?','Segitiga|Persegi|Lingkaran|Kubus',3],['6 orang berjabat tangan satu kali dengan setiap orang lain. Total jabat tangan…','12|15|18|30',1],['Jika 25% dari 80 adalah…','15|20|25|30',1],['7, 14, 28, 56, …','84|98|112|126',2],['Semua dokter terlatih. Sari adalah dokter. Maka…','Sari terlatih|Sari bukan dokter|Semua terlatih dokter|Tidak pasti',0],['Urutan B, E, I, N, …','R|S|T|U',2],['Jika 3 buku seharga 45 ribu, 5 buku seharga…','60 ribu|65 ribu|70 ribu|75 ribu',3]
  ];
  let iqState={set:[],pos:0,score:0,answered:false};
  function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
  function newIqSet(){let used=store.get('learnxIqUsed',[]);let available=bank.map((_,i)=>i).filter(i=>!used.includes(i));if(available.length<10){used=[];available=bank.map((_,i)=>i)}const chosen=shuffle(available.slice()).slice(0,10);iqState={set:chosen,pos:0,score:0,answered:false};store.set('learnxIqUsed',[...used,...chosen].slice(-bank.length));renderIq()}
  function renderIq(){if(!iqState.set.length)newIqSet();const idx=iqState.set[iqState.pos];const q=bank[idx];const opts=q[1].split('|');const mapped=opts.map((t,i)=>({t,i}));shuffle(mapped);$('#iqProgress').textContent=`SOAL ${iqState.pos+1} / 10`;$('#iqBar').style.width=`${((iqState.pos)/10)*100}%`;$('#iqQuestion').textContent=q[0];const box=$('#iqAnswers');box.innerHTML='';mapped.forEach(o=>{const b=document.createElement('button');b.className='answer';b.textContent=o.t;b.onclick=()=>answerIq(b,o.i,q[2]);box.appendChild(b)});$('#iqResult').classList.add('hidden');iqState.answered=false}
  function answerIq(btn,choice,correct){if(iqState.answered)return;iqState.answered=true;$$('.answer').forEach(x=>x.disabled=true);if(choice===correct){btn.classList.add('correct');iqState.score++}else{btn.classList.add('wrong');$$('.answer')[0]?.classList.remove('wrong')}setTimeout(()=>{if(iqState.pos<9){iqState.pos++;renderIq()}else{const score=iqState.score*10;store.set('learnxBestIq',Math.max(score,store.get('learnxBestIq',0)));$('#iqBar').style.width='100%';$('#iqResult').classList.remove('hidden');$('#iqResult').innerHTML=`<b>Set selesai · ${score}/100</b><br><span style="color:#817989">Skor latihan ini akurat terhadap kunci soal aplikasi. Ini bukan pengukuran IQ klinis.</span>`}},550)}
  $('#newIq').addEventListener('click',()=>{newIqSet();toast('Set IQ baru dibuat')});

  // Notes
  const notes=$('#notesArea');function syncNotes(){notes.value=store.get('learnxNotes','');$('#noteCount').textContent=notes.value.length}notes.addEventListener('input',()=>{store.set('learnxNotes',notes.value);$('#noteCount').textContent=notes.value.length});syncNotes();
  // Focus timer
  let timer=1500,timerId=null;function renderTimer(){const m=String(Math.floor(timer/60)).padStart(2,'0'),s=String(timer%60).padStart(2,'0');$('#timer').textContent=`${m}:${s}`};renderTimer();$('#timerStart').addEventListener('click',()=>{if(timerId){clearInterval(timerId);timerId=null;$('#timerStart').textContent='Mulai'}else{timerId=setInterval(()=>{timer=Math.max(0,timer-1);renderTimer();if(!timer){clearInterval(timerId);timerId=null;toast('Sesi fokus selesai')}} ,1000);$('#timerStart').textContent='Jeda'}});$('#timerReset').addEventListener('click',()=>{clearInterval(timerId);timerId=null;timer=1500;renderTimer();$('#timerStart').textContent='Mulai'});

  // Theme and performance settings
  $('#themeBtn').addEventListener('click',()=>{document.body.classList.toggle('light');toast('Tema berubah')});
  $('#motionToggle').addEventListener('change',e=>document.body.classList.toggle('no-motion',!e.target.checked));
  $('#reducedToggle').addEventListener('change',e=>document.body.classList.toggle('reduced-motion',e.target.checked));
  $('#touchToggle').addEventListener('change',e=>document.body.classList.toggle('no-touch',!e.target.checked));
  $('#autoPlayToggle').addEventListener('change',e=>{store.set('learnxAutoPlay',e.target.checked);toast(e.target.checked?'Auto-play aktif':'Auto-play nonaktif')});

  // Touch feedback: lightweight ripple, no heavy DOM animation.
  document.addEventListener('click',e=>{if(document.body.classList.contains('no-touch'))return;const b=e.target.closest('button');if(!b)return;const r=document.createElement('span');r.className='tap-ripple';const rect=b.getBoundingClientRect();r.style.left=`${e.clientX-rect.left}px`;r.style.top=`${e.clientY-rect.top}px`;b.appendChild(r);setTimeout(()=>r.remove(),420)},{passive:true});

  // Music Island: built-in synthesized ambient tracks + user audio file. Search is local and instant.
  const tracks=[['Night Vector','Ambient · 18 min'],['Quiet Orbit','Focus · 24 min'],['Purple Room','Minimal · 16 min'],['Soft Circuit','Study · 20 min']];let currentTrack=null,audio=$('#audio');let audioCtx,osc,gain;
  function musicTone(name){if(audioCtx){try{audioCtx.close()}catch{}}audioCtx=new (window.AudioContext||window.webkitAudioContext)();gain=audioCtx.createGain();gain.gain.value=.035;gain.connect(audioCtx.destination);osc=audioCtx.createOscillator();osc.type='sine';osc.frequency.value= name==='Night Vector'?174:name==='Quiet Orbit'?196:name==='Purple Room'?220:147;osc.connect(gain);osc.start();currentTrack=name;$('#trackName').textContent=name;$('#trackState').textContent='Ambient local';$('#musicPlay').textContent='Pause'}
  function stopTone(){if(osc){try{osc.stop()}catch{}osc=null}if(audioCtx){try{audioCtx.close()}catch{}audioCtx=null}$('#musicPlay').textContent='Play'}
  function renderMusic(filter=''){const list=$('#musicList');list.innerHTML=tracks.filter(t=>t[0].toLowerCase().includes(filter.toLowerCase())).map(t=>`<div class="track"><div><b>${t[0]}</b><small>${t[1]}</small></div><button data-track="${t[0]}">Pilih</button></div>`).join('')||'<div style="padding:12px;color:#716a79;font-size:9px">Tidak ditemukan.</div>'}
  renderMusic();$('#musicList').addEventListener('click',e=>{const b=e.target.closest('[data-track]');if(b){stopTone();musicTone(b.dataset.track)}});$('#musicSearch').addEventListener('input',e=>renderMusic(e.target.value));$('#musicBtn').addEventListener('click',()=>$('#musicPanel').classList.remove('hidden'));$('#musicClose').addEventListener('click',()=>$('#musicPanel').classList.add('hidden'));$('#musicPlay').addEventListener('click',()=>{if(currentTrack){if(audioCtx?.state==='running')stopTone();else musicTone(currentTrack)}else{musicTone(tracks[0][0])}});$('#musicFile').addEventListener('change',e=>{const f=e.target.files?.[0];if(!f)return;stopTone();audio.src=URL.createObjectURL(f);audio.loop=true;audio.play().then(()=>{$('#trackName').textContent=f.name;$('#trackState').textContent='File perangkat';$('#musicPlay').textContent='Pause'}).catch(()=>toast('Tekan Play untuk memulai musik'))});

  // Command palette + global search.
  const commands=[['Dashboard','dashboard'],['Kurikulum','curriculum'],['Tes IQ','iq'],['Bahasa Jepang','japanese'],['Psikologi','psychology'],['Focus Room','focus'],['Catatan','notes'],['Progress','progress'],['Pengaturan','settings']];
  function renderCommands(q=''){const box=$('#commandList');box.innerHTML=commands.filter(x=>x[0].toLowerCase().includes(q.toLowerCase())).map(x=>`<button class="command-item" data-page="${x[1]}">${x[0]}</button>`).join('')}
  $('#commandBtn').addEventListener('click',()=>{$('#command').classList.remove('hidden');$('#commandSearch').focus();renderCommands()});document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#command').classList.remove('hidden');$('#commandSearch').focus();renderCommands()}if(e.key==='Escape'){$('#command').classList.add('hidden');$('#musicPanel').classList.add('hidden')}});$('#commandSearch').addEventListener('input',e=>renderCommands(e.target.value));$('#command').addEventListener('click',e=>{if(e.target===e.currentTarget)e.currentTarget.classList.add('hidden')});$('#search').addEventListener('keydown',e=>{if(e.key==='Enter'){const q=e.target.value.toLowerCase();const hit=commands.find(x=>x[0].toLowerCase().includes(q));if(hit)showPage(hit[1]);else toast('Materi tidak ditemukan')}});

  function renderProgress(){$('#sessionCount').textContent=store.get('learnxSessions',0);$('#bestIq').textContent=store.get('learnxBestIq',null)??'—';$('#noteCount').textContent=($('#notesArea').value||'').length}
  // Cache busting and basic media health signal.
  dashboardVideo.addEventListener('error',()=>toast('Video Dashboard gagal dimuat — periksa folder assets'));introVideo.addEventListener('error',()=>toast('Video Intro gagal dimuat — periksa folder assets'));
  mount();
})();
