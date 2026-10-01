'use strict';
const $=s=>document.querySelector(s);
const scene=$('#gallery'),rig=$('#rig'),camera=$('#camera');
const stops=[
 {name:'Modüler drone',pos:[0,0,15],yaw:0},
 {name:'Drone ve 3D tasarım',pos:[0,0,6.2],yaw:0},
 {name:'Kestrel MK-1',pos:[-8.8,0,-3.5],yaw:25},
 {name:'Simurg',pos:[0,0,-11.5],yaw:0},
 {name:'OpenIPC',pos:[8.8,0,-3.5],yaw:-25}
];
const projects=[
 {title:'Modüler drone',copy:'Bu gövdeyi, farklı boyutlarda drone kurarken her defasında baştan tasarım yapmamak için geliştiriyorum. Karbon tüpler kolları oluşturuyor; merkez gövde, motor bağlantıları, batarya ve kamera ayrı bölümler halinde bir araya geliyor. Burada gördüğün 10 inç X8 düzeninde dört kol üzerinde sekiz motor ve sekiz pervane var. Ayrılmış parçalar, gövdenin nasıl toplandığını gösteriyor. Küçük modeli eline aldığında büyük model birleşiyor; böylece parçaları ve tamamını karşılaştırabiliyorsun.',note:'10 inç X8 · Modüler gövde tasarımı'},
 {title:'Kestrel MK-1',copy:'Kestrel MK-1’de droneun kamerada gördüklerini uçuş hareketlerine dönüştürmesi üzerine çalışıyorum. Hedefim, önündeki engeli fark edip yaklaşırken hızını ve yönünü buna göre ayarlayabilmesi. Ekrandaki kayıt, engelden kaçınma denemelerinden iki bölüm içeriyor. Görüntünün yanında uçuş bilgilerini de izleyerek droneun ne gördüğünü ve buna nasıl karşılık verdiğini takip ediyorum. Bu denemeler, hangi durumlarda doğru tepki verdiğini, nerelerde geliştirmem gerektiğini görmemi sağlıyor.',note:'Kamera görüntüsüyle uçuş ve engelden kaçınma'},
 {title:'Simurg',copy:'Simurg, drone algılama modelleri için görüntü ve etiket hazırladığım proje. Bir droneun farklı açılardan, uzaklıklardan ve arka planlarda nasıl göründüğünü içeren örnekler üretmek istiyorum. Buradaki dört görüntüyü önceki üretimlerimden seçtim: tüketici tipi drone, FPV, sabit kanat ve karma sahne. Her görüntünün yanında droneun konumunu ve türünü belirten etiketler bulunuyor. Bu eşleşme, modele yalnızca bir fotoğraf vermek yerine fotoğrafın neresinde ne araması gerektiğini de anlatıyor.',note:'Algılama modelleri için görüntü ve etiket üretimi'},
 {title:'OpenIPC',copy:'OpenIPC tarafında kameradan gelen görüntüyü ayrı bir video ünitesi üzerinden aktarmak için çalışıyorum. Amacım, görüntü aktarımını droneun diğer parçalarından bağımsız hazırlayabildiğim bir düzen kurmak. Kamera, aktarım birimi ve görüntüyü izlediğim tarafı birlikte ele alıyorum; bu çalışma sergideki projelerin görüntü bağlantısı tarafını oluşturuyor. Burada odaklandığım konu, kameranın gördüğünü karşı tarafa ulaştırmak ve bunun için kullanacağım donanımı hazırlamak.',note:'Bağımsız görüntü aktarım üniteleri'}
];
let current=0,ready=false,rotating=false,explode=false,mainModel,batteryModel,toastTimer,fullModel,guide,world,blink,exhibit;
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,5500);}
function el(tag,attrs={},parent=scene){const e=document.createElement(tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);parent.appendChild(e);return e;}
function box(p,w,h,d,color,parent=scene){return el('a-box',{position:p,width:w,height:h,depth:d,material:`color: ${color}; roughness: 0.9; metalness: 0.05`},parent);}
function wrap(ctx,text,x,y,maxWidth,lineHeight){let line='';for(const word of text.split(' ')){const test=line+word+' ';if(ctx.measureText(test).width>maxWidth&&line){ctx.fillText(line.trim(),x,y);line=word+' ';y+=lineHeight;}else line=test;}ctx.fillText(line.trim(),x,y);return y+lineHeight;}
function canvas(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);return c;}
function panel(texture,p,width,height,rotation='0 0 0',parent=scene){const e=el('a-plane',{position:p,rotation,width,height,material:{shader:'flat',side:'front',transparent:true}},parent);const apply=()=>{const t=new AFRAME.THREE.CanvasTexture(texture);t.colorSpace=AFRAME.THREE.SRGBColorSpace;t.anisotropy=Math.min(4,scene.renderer.capabilities.getMaxAnisotropy());const mesh=e.getObject3D('mesh');mesh.material.map=t;mesh.material.color.set('#ffffff');mesh.material.needsUpdate=true;};if(e.getObject3D('mesh'))apply();else e.addEventListener('loaded',apply,{once:true});return e;}
function label(text,p,w=2,h=.22,size=48,color='#eaf0f4',rotation='0 0 0',parent=scene){return panel(canvas(1024,Math.max(100,Math.round(1024*h/w)),(c,W,H)=>{c.clearRect(0,0,W,H);c.fillStyle=color;c.font=`500 ${size}px Arial`;c.textBaseline='middle';c.textAlign='center';c.fillText(text,W/2,H/2);}),p,w,h,rotation,parent);}
function board(project,index,p,rotation){
 const group=el('a-entity',{position:p,rotation});
 box('0 0 -.05',3.24,1.94,.08,'#293631',group);
 for(const x of [-1.2,1.2])box(`${x} -1.15 -.03`,.045,.65,.045,'#293631',group);
 const t=canvas(1400,820,(c,W,H)=>{c.fillStyle='#f0f0e9';c.fillRect(0,0,W,H);c.fillStyle='#384a42';c.font='500 65px Arial';c.fillText(project.title,65,110);c.fillStyle='#415049';c.font='36px Arial';wrap(c,project.copy,65,215,W-130,54);c.fillStyle='#65736b';c.font='25px Arial';wrap(c,project.note,65,735,W-130,35);});
 return panel(t,'0 0 .005',3.12,1.83,'0 0 0',group);
}
function imagePanel(src,p,w,h,rotation='0 0 0'){el('a-plane',{position:p,rotation,width:w+.12,height:h+.12,material:'color: #0b1724; shader: flat'});const xyz=p.split(' ').map(Number),yaw=Number(rotation.split(' ')[1])*Math.PI/180;xyz[0]+=.025*Math.sin(yaw);xyz[2]+=.025*Math.cos(yaw);return el('a-image',{src,position:xyz.join(' '),rotation,width:w,height:h});}
function projectNote(project,p,w,h,rotation='0 0 0'){
 const texture=canvas(1100,Math.round(1100*h/w),(c,W,H)=>{
  c.fillStyle='#f0f0e9';c.fillRect(0,0,W,H);c.fillStyle='#384a42';c.font='500 52px Arial';c.fillText(project.title,50,78);
  c.fillStyle='#415049';c.font='40px Arial';wrap(c,project.copy,50,148,W-100,56);
 });
 return panel(texture,p,w,h,rotation);
}
function action(text,p,fn,w=1.6,rot='0 0 0'){const e=panel(canvas(768,150,(c,W,H)=>{c.fillStyle='#dce3d9';c.fillRect(0,0,W,H);c.fillStyle='#263a31';c.font='bold 42px Arial';c.textAlign='center';c.textBaseline='middle';c.fillText(text,W/2,H/2);}),p,w,.31,rot);e.classList.add('interactive');e.addEventListener('click',fn);e.addEventListener('mouseenter',()=>e.setAttribute('scale','1.035 1.035 1.035'));e.addEventListener('mouseleave',()=>e.setAttribute('scale','1 1 1'));return e;}
function go(index){current=(index+stops.length)%stops.length;const stop=stops[current];const T=AFRAME.THREE,offset=new T.Vector3();camera.object3D.getWorldPosition(offset);offset.sub(rig.object3D.position);rig.object3D.position.set(stop.pos[0]-offset.x,stop.pos[1],stop.pos[2]-offset.z);
 if(!scene.is('vr-mode')){const look=camera.components['look-controls'];if(look){look.yawObject.rotation.y=T.MathUtils.degToRad(stop.yaw);look.pitchObject.rotation.x=0;}rig.object3D.rotation.y=0;rig.object3D.position.set(...stop.pos);}else{const q=new T.Quaternion();camera.object3D.getWorldQuaternion(q);const yaw=new T.Euler().setFromQuaternion(q,'YXZ').y;rig.object3D.rotation.y+=T.MathUtils.degToRad(stop.yaw)-yaw;const head=new T.Vector3();camera.object3D.getWorldPosition(head);rig.object3D.position.x+=stop.pos[0]-head.x;rig.object3D.position.z+=stop.pos[2]-head.z;}
 document.body.classList.add('touring');$('#location').hidden=false;$('#section-number').textContent=$('#progress').textContent=`0${current} / 04`;$('#section-title').textContent=stop.name;$('#info').close();if(current===2)playKestrel();}

function galleryVisible(e){for(let o=e.object3D;o;o=o.parent)if(!o.visible)return false;return true;}
function teleport(point){
 if(!world?.valid(point))return;
 const head=new AFRAME.THREE.Vector3();camera.object3D.getWorldPosition(head);
 rig.object3D.position.x+=point.x-head.x;rig.object3D.position.z+=point.z-head.z;rig.object3D.position.y=world.ground(point.x,point.z);
 blink?.emit('blink');if(guide)guide.object3D.visible=false;
 document.body.classList.add('touring');$('#location').hidden=false;$('#section-title').textContent='Açık alanda';
}
function showGuide(){go(0);if(guide)guide.object3D.visible=true;}
function buildGuide(){
 guide=el('a-entity',{position:'-3.3 1.65 13.1',rotation:'0 60 0'});
 const texture=canvas(1280,1050,(c,W,H)=>{
  c.fillStyle='#eeeade';c.fillRect(0,0,W,H);c.fillStyle='#304137';c.font='500 66px Arial';c.fillText('Hoş geldin',72,110);
  c.font='42px Arial';let y=205;
  for(const text of ['1  Kumandayı boş bir yere doğrult. Yeşil halka çıkınca işaret parmağınla tetiğe bas: oraya geçersin.','2  Daha uzağa gitmek için çubuğu ileri tut. Eğri çizgiyle yer seç, sonra çubuğu bırak.','3  10 inç droneu işaret et. Yandaki kavrama tuşunu sıkıp tut; elini çevirerek incele. Bırakınca düşer; yerden tekrar alabilirsin.','4  Çubuğu sağa / sola iterek dön. Sol kumandada X başlangıca, sağda A sonraki projeye götürür.']){y=wrap(c,text,72,y,W-144,57)+36;}
 });
 panel(texture,'0 0 0',2.5,2.05,'0 0 0',guide);
 const button=panel(canvas(800,130,(c,W,H)=>{c.fillStyle='#3d5343';c.fillRect(0,0,W,H);c.fillStyle='#f3f1e9';c.font='42px Arial';c.textAlign='center';c.fillText('Tamam, deneyelim',W/2,82);}), '0 -1.2 .015',1.65,.28,'0 0 0',guide);
 button.classList.add('interactive');button.addEventListener('click',()=>guide.object3D.visible=false);
 blink=el('a-plane',{position:'0 0 -.12',width:2,height:2,material:'shader: flat; color: #000; transparent: true; opacity: 0; depthTest: false; depthWrite: false; fog: false','animation__blink':'property: material.opacity; from: 0.65; to: 0; dur: 160; startEvents: blink'},camera);
}

function turn(angle){const T=AFRAME.THREE,before=new T.Vector3(),after=new T.Vector3();camera.object3D.getWorldPosition(before);rig.object3D.rotation.y+=angle;rig.object3D.updateMatrixWorld(true);camera.object3D.getWorldPosition(after);rig.object3D.position.x+=before.x-after.x;rig.object3D.position.z+=before.z-after.z;}
function toggleRotate(){rotating=!rotating;toast(rotating?'Model döndürme açık.':'Model döndürme kapalı.');}
function playKestrel(){const video=$('#kestrel-video');video.muted=true;video.play().catch(()=>toast('Videoyu başlatmak için ekranın altındaki Oynat / durdur düğmesini seç.'));}
function toggleKestrel(){const video=$('#kestrel-video');if(video.paused)playKestrel();else video.pause();}
function toggleExplode(){if(!mainModel?.getObject3D('mesh'))return;explode=!explode;mainModel.getObject3D('mesh').traverse(n=>{if(!n.isMesh)return;if(!n.userData.rest){n.userData.rest=n.position.clone();const b=new AFRAME.THREE.Box3().setFromBufferAttribute(n.geometry.attributes.position);n.userData.spread=b.getCenter(new AFRAME.THREE.Vector3()).multiplyScalar(.55);}n.position.copy(n.userData.rest);if(explode)n.position.add(n.userData.spread);});}
function addModel(src,position,maxSize,id){const e=el('a-entity',{id,position,'gltf-model':src});e.addEventListener('model-loaded',()=>{const model=e.getObject3D('mesh'),T=AFRAME.THREE,b=new T.Box3().setFromObject(model),size=b.getSize(new T.Vector3()),center=b.getCenter(new T.Vector3());e.object3D.worldToLocal(center);model.position.sub(center);const s=maxSize/Math.max(size.x,size.y,size.z);e.object3D.scale.set(s,s,s);if(id==='frame-model'){ready=true;$('#start').disabled=false;$('#start').textContent='Sergiyi gez';$('#loading').textContent='10 inç X8 · 4 proje';}});e.addEventListener('model-error',()=>{$('#loading').textContent='Model yüklenemedi; galeriyi görsellerle gezebilirsin.';$('#start').disabled=false;$('#start').textContent='Sergiyi gez';toast('3D model yüklenemedi. Bağlantıyı kontrol edip sayfayı yenile.');});return e;}
function build(){
 const T=AFRAME.THREE;
 world=GalleryLandscape.build(scene);
 el('a-entity',{light:'type: hemisphere; color: #e5f3ff; groundColor: #47782f; intensity: 1.35'});
 el('a-entity',{light:'type: directional; color: #fff0ce; intensity: 1.8',position:'-30 45 15'});
 scene.galleryDynamics=new DroneDynamics(scene,world);
 exhibit=buildExhibition();
 buildGuide();
 rig.setAttribute('quest-input','');
 rig.addEventListener('quest-teleport',e=>teleport(e.detail.point));
 rig.addEventListener('quest-turn',e=>turn(e.detail.angle));
 rig.addEventListener('quest-navigation',e=>go(e.detail.home?0:current+1));
 scene.addEventListener('enter-vr',()=>{document.body.classList.add('immersive');$('#info').close();showGuide();playKestrel();});
 scene.addEventListener('exit-vr',()=>{document.body.classList.remove('immersive');});
 let pointerStart;
 scene.canvas.addEventListener('pointerdown',e=>{pointerStart=[e.clientX,e.clientY];});
 scene.canvas.addEventListener('pointerup',e=>{if(scene.is('vr-mode')||!pointerStart||Math.hypot(e.clientX-pointerStart[0],e.clientY-pointerStart[1])>8)return;const r=scene.canvas.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),scene.camera);const targets=Array.from(document.querySelectorAll('.interactive')).filter(galleryVisible).map(e=>e.object3D);const hit=ray.intersectObjects(targets,true)[0];if(hit){let o=hit.object;while(o&&!o.el)o=o.parent;o?.el?.emit('click',{intersection:hit});}else{const floor=world.ray(ray.ray.origin,ray.ray.direction);if(floor?.valid)teleport(floor.point);}pointerStart=null;});
 // A-Frame owns the XR render loop.
 const animator=el('a-entity',{'model-motion':''});
}
if(window.AFRAME){AFRAME.registerComponent('model-motion',{tick(t,dt){const seconds=Math.min(dt||0,50)/1000;world?.tick(t/1000);exhibit?.tick(t/1000,seconds);scene.galleryDynamics?.tick(seconds);if(rotating&&mainModel)mainModel.object3D.rotation.y+=seconds*.25;}});if(scene.hasLoaded)build();else scene.addEventListener('loaded',build,{once:true});}else{$('#loading').textContent='Galeri motoru yüklenemedi. İnternet bağlantısını kontrol edip yenile.';}
$('#start').onclick=()=>{playKestrel();showGuide();};$('#guide-open').onclick=showGuide;$('#home').onclick=()=>go(0);$('#next').onclick=()=>go(current+1);$('#prev').onclick=()=>go(current-1);
$('#info-open').onclick=()=>$('#info').showModal();$('#info-close').onclick=()=>$('#info').close();$$go();
function $$go(){document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(Number(b.dataset.go)));}
document.addEventListener('keydown',e=>{if($('#info').open||e.target.closest('button,a,input'))return;if(e.key==='ArrowRight')go(current+1);if(e.key==='ArrowLeft')go(current-1);if(e.key==='Home')go(0);});
async function checkVR(){try{const ok=!!navigator.xr&&await navigator.xr.isSessionSupported('immersive-vr');$('#vr').disabled=false;$('#vr').onclick=async()=>{if(!ok){toast('VR için bu bağlantıyı Quest tarayıcısında aç. Bilgisayarda sergiyi gezebilirsin.');return;}try{await scene.enterVR();document.body.classList.add('touring');}catch(e){toast('VR açılamadı. Quest tarayıcısında izinleri kontrol edip tekrar dene.');}};if(!ok)$('#vr').title='Quest tarayıcısında aç';}catch(e){$('#vr').disabled=false;$('#vr').onclick=()=>toast('VR için Quest tarayıcısından güvenli bağlantıyı aç.');}}
checkVR();
// Offline cache implementation is in sw.js; nothing is sent to a third party.
let serviceReady;
if('serviceWorker' in navigator&&window.isSecureContext){serviceReady=navigator.serviceWorker.register('./sw.js',{scope:'./'}).then(async reg=>{try{await reg.update();}catch(err){if(!reg.active)throw err;}const pending=reg.installing||reg.waiting;if(pending&&pending.state!=='activated')await new Promise((resolve,reject)=>{pending.addEventListener('statechange',()=>{if(pending.state==='activated')resolve();if(pending.state==='redundant')reject(Error('Çevrimdışı hazırlık yüklenemedi.'));});});return navigator.serviceWorker.ready;}).catch(()=>null);}
async function swMessage(type){const reg=await serviceReady;if(!reg?.active)throw Error('Tarayıcı çevrimdışı kaydı desteklemiyor.');return new Promise((resolve,reject)=>{const c=new MessageChannel();const timer=setTimeout(()=>reject(Error('İşlem tamamlanamadı. İnternet açıkken tekrar dene.')),120000);c.port1.onmessage=e=>{clearTimeout(timer);e.data.error?reject(Error(e.data.error)):resolve(e.data);};reg.active.postMessage({type},[c.port2]);});}
$('#offline').onclick=async()=>{const b=$('#offline');b.disabled=true;$('#offline-status').textContent='Galeri, modeller ve görseller indiriliyor…';try{await swMessage('DOWNLOAD');$('#offline-status').textContent='Sergi bu tarayıcıya kaydedildi. İnterneti kapatıp bu adresi yeniden açarak dene.';b.textContent='Çevrimdışı kopyayı yenile';}catch(e){$('#offline-status').textContent=e.message;}finally{b.disabled=false;}};
if(serviceReady)swMessage('STATUS').then(s=>{$('#offline-status').textContent=s.complete?'Bu sürüm bu tarayıcıya kaydedilmiş. Sergiden önce çevrimdışı açmayı dene.':'Çevrimdışı kullanmak için sergiyi bu cihaza kaydet.';}).catch(()=>{$('#offline-status').textContent='Çevrimdışı kayıt kullanılamıyor; internet bağlantısıyla gezebilirsin.';});
setTimeout(()=>{if(!ready&&$('#start').disabled){$('#start').disabled=false;$('#start').textContent='Galeriyi gez';$('#loading').textContent='Model hâlâ yükleniyor; galeriyi gezmeye başlayabilirsin.';}},25000);



