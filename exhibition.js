'use strict';
// One entrance display, followed by three connected outdoor project stops.
function buildExhibition(){
 const T=AFRAME.THREE;
 const logoImage=new Image();logoImage.src='./assets/shah-logo.png';
 const palette={wood:'#98532e',edge:'#542e21',ink:'#133d42',teal:'#137e86',gold:'#e6b34a',paper:'#fff1d5'};
 const state={parts:[],amount:1,from:1,target:1,elapsed:3,flags:[],explosion:{value:1}};
 function rod(a,b,r,color,parent=scene){const av=new T.Vector3(...a),bv=new T.Vector3(...b),mid=av.clone().add(bv).multiplyScalar(.5);const e=el('a-cylinder',{position:mid.toArray().join(' '),radius:r,height:av.distanceTo(bv),'segments-radial':8,material:`color: ${color}; roughness: 1`},parent);e.object3D.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());return e;}
 function shadow(x,z,r,parent=scene){return el('a-circle',{position:`${x} .027 ${z}`,rotation:'-90 0 0',radius:r,material:'shader: flat; color: #163724; transparent: true; opacity: .16; depthWrite: false'},parent);}
 function hanging(w,h,x,y,parent,src){
  const holder=el('a-entity',{position:`${x} ${y} 0`},parent);
  box('0 0 -.045',w+.16,h+.16,.08,palette.edge,holder);
  box(`0 ${h/2+.055} .01`,w+.24,.10,.1,palette.wood,holder);box(`0 ${-h/2-.055} .01`,w+.24,.10,.1,palette.wood,holder);
  for(const side of [-1,1])rod([side*w*.38,h/2+.07,0],[side*w*.38,h/2+.55,0],.012,'#d6bc83',holder);
  if(src)el('a-image',{src,width:w,height:h,position:'0 0 .012'},holder);
  return holder;
 }
 function station(x,z,yaw,title,number,color,width=6.8){
  const group=el('a-entity',{position:`${x} 0 ${z}`,rotation:`0 ${yaw} 0`});
  for(const side of [-1,1]){box(`${side*width/2} 1.8 -.16`,.16,3.6,.16,palette.wood,group);rod([side*width/2,2.85,-.16],[side*(width/2-.55),3.45,-.16],.065,palette.wood,group);}
  box('0 3.48 -.16',width+.35,.18,.18,palette.wood,group);
  label(title,'0 3.78 0',width,.34,52,palette.paper,'0 0 0',group);
  banner(x-width*.58,z+.8,number,title,color,yaw);
  // Collision footprints match the display line, leaving its approach open.
  const a=yaw*Math.PI/180;
  for(let i=-width/2;i<=width/2;i+=.8)world.addBlock(x+i*Math.cos(a),z-i*Math.sin(a),.37,3.5);
  return group;
 }
 function note(project,x,y,w,h,parent){
  const holder=hanging(w,h,x,y,parent);
  const texture=canvas(1100,Math.round(1100*h/w),(c,W,H)=>{c.fillStyle=palette.paper;c.fillRect(0,0,W,H);c.fillStyle=palette.ink;c.font='500 56px Arial';c.fillText(project.title,60,90);c.font='40px Arial';wrap(c,project.copy,60,170,W-120,54);});
  panel(texture,'0 0 .014',w,h,'0 0 0',holder);
 }
 function banner(x,z,number,title,color,yaw=0){
  const y=world.ground(x,z),group=el('a-entity',{position:`${x} ${y} ${z}`,rotation:`0 ${yaw} 0`});
  rod([0,0,0],[0,4.8,0],.045,palette.edge,group);rod([0,4.45,0],[1.35,4.45,0],.035,palette.edge,group);
  const bannerCanvas=canvas(512,896,(c,W,H)=>{c.fillStyle=color;c.fillRect(0,0,W,H);c.fillStyle='#fff1d5';c.font='bold 57px Arial';c.textAlign='center';c.fillText('SHAHMAV',W/2,335);c.fillRect(60,369,W-120,3);c.font='140px Arial';c.fillText(number,W/2,558);c.font='31px Arial';let y=650;for(const word of title.split(' · ')){c.fillText(word,W/2,y);y+=55;}c.font='24px Arial';c.fillText('Ahmet Kutup Tan',W/2,840);});
  const texture=new T.CanvasTexture(bannerCanvas);texture.colorSpace=T.SRGBColorSpace;
  function paintLogo(){const c=bannerCanvas.getContext('2d');c.save();c.fillStyle=palette.paper;c.beginPath();c.arc(256,150,128,0,Math.PI*2);c.fill();c.drawImage(logoImage,127,128,246,245,156,50.5,200,199);c.restore();texture.needsUpdate=true;}
  if(logoImage.complete&&logoImage.naturalWidth)paintLogo();else logoImage.addEventListener('load',paintLogo,{once:true});

  const geometry=new T.PlaneGeometry(1.15,2.25,12,20),mesh=new T.Mesh(geometry,new T.MeshStandardMaterial({map:texture,side:T.DoubleSide,roughness:1}));mesh.position.set(.67,3.25,.035);group.object3D.add(mesh);
  state.flags.push({mesh,rest:geometry.attributes.position.array.slice(),phase:x*.2+z*.1});world.addBlock(x,z,.12,4.8);
 }
 // Broad walnut plinth, inset teal band, and a smaller matching pickup stand.
 shadow(0,0,3.2);
 el('a-cylinder',{position:'0 .25 0',radius:2.95,height:.5,'segments-radial':64,material:`color: ${palette.ink}; roughness: .75`});
 for(let i=0;i<64;i++){const a=i*Math.PI/32;box(`${Math.sin(a)*2.89} .71 ${Math.cos(a)*2.89}`,.13,.42,.11,palette.wood).object3D.rotation.y=a;}
 el('a-cylinder',{position:'0 .945 0',radius:2.96,height:.05,'segments-radial':64,material:`color: ${palette.gold}; metalness: .35; roughness: .5`});
 el('a-cylinder',{position:'0 .99 0',radius:2.9,height:.04,'segments-radial':64,material:`color: ${palette.edge}; roughness: .85`});
 world.addBlock(0,0,3.1,3.2);
 mainModel=addModel('./assets/drone-10inch-modules.glb','0 1.70 0',3.25,'frame-model');
 mainModel.addEventListener('model-loaded',()=>{
  const root=mainModel.getObject3D('mesh');
  root.traverse(n=>{if(!n.isMesh)return;
   // Main modules stay ordered, with the carbon tubes in a separate upper layer.
   const attribute=n.geometry.getAttribute('_explode');if(!attribute)throw Error('Missing module offsets');
   n.geometry.setAttribute('partOffset',attribute);n.frustumCulled=false;
   n.material=n.material.clone();n.material.onBeforeCompile=shader=>{shader.uniforms.uExplosion=state.explosion;shader.vertexShader='uniform float uExplosion;\nattribute vec3 partOffset;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed += partOffset * uExplosion;');};
   n.material.customProgramCacheKey=()=> 'main-modules-v1';state.parts.push(n);
  });

 });
 label('Modüler drone','0 .68 2.965',2.9,.3,70,palette.paper);
 label('Küçük modeli eline al. Parçaların birleşmesini izle.','0 .41 2.97',3.8,.15,30,palette.paper);
 const droneNote=el('a-entity',{position:'-3.65 0 2.2',rotation:'0 24 0'});
 for(const x of [-.88,.88])box(`${x} 1.5 -.16`,.10,3,.10,palette.wood,droneNote);
 box('0 2.98 -.16',2.36,.12,.14,palette.wood,droneNote);
 note(projects[0],0,1.65,2.1,1.7,droneNote);
 for(const x of [-.88,0,.88])world.addBlock(-3.65+x*Math.cos(24*Math.PI/180),2.2-x*Math.sin(24*Math.PI/180),.4,3.1);
 const small=el('a-entity',{position:'0 0 4.15',scale:'.9 .9 .9'});
 shadow(0,0,.9,small);box('0 .42 0',1.15,.84,.85,palette.ink,small);
 for(const x of [-.48,.48])box(`${x} .44 0`,.09,.88,.87,palette.wood,small);
 box('0 .91 0',1.32,.10,1.02,palette.gold,small);box('0 .98 0',1.24,.04,.94,palette.edge,small);
 fullModel=addModel('./assets/drone-10inch-light.glb','0 1.11 4.15',.86,'drone-10inch');fullModel.classList.add('grabbable','interactive');
 fullModel.addEventListener('model-loaded',()=>{
  // A low-cost pickup volume includes thin arms and propellers.
  const model=fullModel.getObject3D('mesh');model.updateWorldMatrix(true,true);const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3()).divide(fullModel.object3D.scale);
  model.traverse(n=>{if(n.isMesh)n.raycast=()=>{};});
  const proxy=new T.Mesh(new T.BoxGeometry(size.x,size.y+.10,size.z),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false}));proxy.el=fullModel;fullModel.object3D.add(proxy);
  scene.galleryDynamics.register(fullModel,{x:0,y:1.11,z:4.15});
 });
 fullModel.addEventListener('click',()=>{if(!scene.is('vr-mode')){assemble();fullModel.object3D.rotation.y+=Math.PI/6;}});
 label('10 İNÇ X8','0 .612 4.543',.855,.153,50,palette.paper);
 label('Yan tuşu sıkıp tut','0 .369 4.544',.855,.117,35,palette.paper);
 scene.galleryDynamics.surfaces.push({x:0,z:4.15,h:.9,rx:.585,rz:.468},{x:0,z:0,h:1.01,r:2.9});
 world.addBlock(0,4.15,.63,1.2);
 banner(-4.6,5.3,'01','Modüler drone',palette.teal,12);banner(4.3,5.3,'01','Tasarımdan uçuşa','#bc573a',-12);
 action('Yeniden göster','2.05 .93 3.45',()=>{state.from=state.amount;state.target=1;state.elapsed=0;scene.galleryDynamics.reset(fullModel);},1.6,'0 -18 0');
 action('Kısa rehber','-2.05 .93 3.45',showGuide,1.6,'0 18 0');
 function assemble(){state.from=state.amount;state.target=0;state.elapsed=0;}
 rig.addEventListener('model-grabbed',assemble);
 // Kestrel: the flight recording and workstation screenshot share one bay.
 const kestrel=station(-11,-8,25,'Kestrel MK-1','02','#bd5438',7.6);
 const movie=hanging(3.2,3.2*608/832,-1.4,1.86,kestrel);
 const screen=el('a-video',{src:'#kestrel-video',width:3.2,height:3.2*608/832,position:'0 0 .014',class:'interactive'},movie);screen.addEventListener('click',toggleKestrel);
 label('Ekrana dokun: oynat / durdur','0 -1.37 .02',3,.16,34,palette.paper,'0 0 0',movie);
 hanging(2,1.25,2.1,2.77,kestrel,'./assets/kestrel-workspace.png');
 note(projects[1],2.1,1.06,2.7,1.75,kestrel);
 // Simurg: a small outdoor print display, with the context beside the images.
 const simurg=station(0,-17,0,'Simurg','03','#386bae',7.2);
 const samples=[['consumer.jpg','Tüketici tipi'],['fpv.jpg','FPV'],['fixed-wing.jpg','Sabit kanat'],['mixed.jpg','Karma sahne']];
 samples.forEach(([file,title],i)=>{const x=i%2?.6:-1.2,y=i<2?2.45:1.14;const frame=hanging(1.6,.9,x,y,simurg,`./assets/simurg/${file}`);label(title,'0 -.6 .02',1.6,.15,40,palette.paper,'0 0 0',frame);});
 note(projects[2],2.6,1.86,1.75,2.1,simurg);
 const openipc=station(11,-8,-25,'OpenIPC','04','#16836c',5.5);
 note(projects[3],-.7,1.82,2.8,2.2,openipc);
 hanging(1.65,1.65*1027/2411,1.7,2.6,openipc,'./assets/openipc/diy-assembly.jpg');
 hanging(1.65,1.65*3376/6000,1.7,1.4,openipc,'./assets/openipc/diy-system.jpg');
 label('DIY örnekleri · OpenIPC wiki','1.7 .7 .02',1.8,.13,32,palette.paper,'0 0 0',openipc);
 // Discreet numbered route markers reinforce the path and the flag sequence.
 for(const [x,z,text,yaw] of [[-6,2,'02  Kestrel',35],[-7,-11,'03  Simurg',45],[7,-11,'04  OpenIPC',-45],[6,2,'01  Drone',-35]]){
  const sign=el('a-entity',{position:`${x} 0 ${z}`,rotation:`0 ${yaw} 0`});box('0 .48 0',.06,.96,.06,palette.wood,sign);box('0 .93 0',1.65,.32,.07,palette.ink,sign);label(text,'0 .93 .042',1.55,.22,48,palette.paper,'0 0 0',sign);world.addBlock(x,z,.15,1.15);
 }
 return {tick(t,dt){
  state.elapsed+=dt;const progress=Math.min(1,state.elapsed/2.15),smooth=progress*progress*(3-2*progress);state.amount=state.from+(state.target-state.from)*smooth;
  state.explosion.value=state.amount;
  if(mainModel){mainModel.object3D.position.y=1.80-state.amount*.10;mainModel.object3D.rotation.y+=dt*Math.PI/30;}
  for(const flag of state.flags){const p=flag.mesh.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=flag.rest[i*3],y=flag.rest[i*3+1],free=(1.125-y)/2.25;p.setZ(i,Math.sin(t*2.2+x*4.5+y*2+flag.phase)*.11*free+Math.sin(t*1.1+flag.phase)*.06*free);}p.needsUpdate=true;flag.mesh.geometry.computeVertexNormals();}
 },assemble,state};
}
