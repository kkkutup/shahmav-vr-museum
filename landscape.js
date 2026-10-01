'use strict';
// All scenery is local geometry. The flat clearing blends into walkable hills.
const GalleryLandscape=(()=>{
 const PATH=[[0,15],[0,8],[-5,5],[-9,-2],[-10,-6],[-7,-11],[0,-12],[7,-11],[10,-6],[9,-2],[5,5],[0,8],[0,15]];
 function pathDistance(x,z){let best=Infinity;for(let i=1;i<PATH.length;i++){const [ax,az]=PATH[i-1],[bx,bz]=PATH[i],dx=bx-ax,dz=bz-az,t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz)));best=Math.min(best,Math.hypot(x-ax-t*dx,z-az-t*dz));}return best;}
 const SIZE=400,SEGMENTS=224,STEP=SIZE/SEGMENTS;
 const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
 function hash(x,z){let n=Math.imul(x,374761393)^Math.imul(z,668265263);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295;}
 function noise(x,z){const ix=Math.floor(x),iz=Math.floor(z),u=smooth(x-ix),v=smooth(z-iz);return (hash(ix,iz)*(1-u)+hash(ix+1,iz)*u)*(1-v)+(hash(ix,iz+1)*(1-u)+hash(ix+1,iz+1)*u)*v;}
 function height(x,z){
  const r=Math.hypot(x,z),blend=smooth((r-25)/30);
  const hill=(cx,cz,h,w)=>h*Math.exp(-((x-cx)**2+(z-cz)**2)/(w*w));
  return blend*(hill(-62,-68,27,49)+hill(78,-104,39,61)+hill(113,64,23,54)+hill(-103,71,31,67)+7*(noise(x*.026,z*.026)-.45)+1.4*(noise(x*.1,z*.1)-.5));
 }
 // Interpolate the same triangles used by PlaneGeometry, not a second surface.
 function ground(x,z){
  const gx=(x+SIZE/2)/STEP,gz=(z+SIZE/2)/STEP,ix=Math.floor(gx),iz=Math.floor(gz),u=gx-ix,v=gz-iz;
  const px=ix*STEP-SIZE/2,pz=iz*STEP-SIZE/2,a=height(px,pz),b=height(px+STEP,pz),c=height(px,pz+STEP),d=height(px+STEP,pz+STEP);
  return u+v<=1?a+(b-a)*u+(c-a)*v:d+(c-d)*(1-u)+(b-d)*(1-v);
 }
 function build(scene){
  const T=AFRAME.THREE,group=new T.Group(),obstacles=[];
  scene.object3D.add(group);scene.setAttribute('fog','type: exponential; color: #b4d9e4; density: 0.0032');
  const geo=new T.PlaneGeometry(SIZE,SIZE,SEGMENTS,SEGMENTS);geo.rotateX(-Math.PI/2);
  const pos=geo.attributes.position,colors=[];
  for(let i=0;i<pos.count;i++){
   const x=pos.getX(i),z=pos.getZ(i),y=height(x,z);pos.setY(i,y);
   const variation=noise(x*.2,z*.2),plaza=1-smooth((Math.hypot(x,z)-4.7)/1.2),path=1-smooth((pathDistance(x,z)-.85)/.6);
   const c=new T.Color('#277a3c').lerp(new T.Color('#83b947'),variation*.85).lerp(new T.Color('#d7ae70'),Math.max(path,plaza)*.94);
   colors.push(c.r,c.g,c.b);
  }
  geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();
  group.add(new T.Mesh(geo,new T.MeshStandardMaterial({vertexColors:true,roughness:1})));
  // Atmospheric sky only; hills and every tree below it have real depth.
  const sky=new T.Mesh(new T.SphereGeometry(290,32,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{top:{value:new T.Color('#328cda')},horizon:{value:new T.Color('#c8e4eb')}},vertexShader:'varying vec3 v; void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 top;uniform vec3 horizon;varying vec3 v;void main(){float h=pow(max(normalize(v).y,0.),.6);gl_FragColor=vec4(mix(horizon,top,h),1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'}));
  group.add(sky);
  let seed=9821;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const wind={value:0},animated=[];
  const addBlock=(x,z,r,top=3)=>obstacles.push({x,z,r,bottom:ground(x,z),top});
  const placements={CommonTree_2:[],Pine_5:[],TwistedTree_4:[],CommonTree_1:[],CommonTree_3:[],TwistedTree_1:[],Pine_2:[],Bush_Common_Flowers:[],Fern_1:[],Flower_3_Group:[],Rock_Medium_1:[]};
  function place(name,x,z,h,yaw=random()*6.28){placements[name].push({x,z,y:ground(x,z),h,yaw});}
  // Trees frame each exhibit: the hanging displays sit between their trunks.
  for(const [x,z] of [[-17,-16],[-8,-18],[-7,-25],[7,-25],[8,-18],[17,-16],[-5,1],[5,1]]){place('TwistedTree_1',x,z,9);addBlock(x,z,.7,7);}
  function displayClearing(x,z){
   return [[-11,-8,25,7.6],[0,-17,0,7.2],[11,-8,-25,5.5]].some(([cx,cz,yaw,width])=>{
    const a=yaw*Math.PI/180,dx=x-cx,dz=z-cz,lx=Math.cos(a)*dx-Math.sin(a)*dz,lz=Math.sin(a)*dx+Math.cos(a)*dz;
    return Math.abs(lx)<width/2+3.5&&lz> -3.5&&lz<9;
   });
  }
  const trees=[];
  for(let i=0;i<440;i++){
   const a=random()*6.28,r=18+Math.pow(random(),1.7)*130,x=Math.sin(a)*r,z=Math.cos(a)*r;
   if(displayClearing(x,z)||Math.abs(x)<8&&z> -27&&z< -8||Math.abs(x)<4&&z>7&&z<23)continue;
   if(trees.some(t=>Math.hypot(x-t.x,z-t.z)<4.2))continue;
   trees.push({x,z});const far=['Pine_2','Pine_5','CommonTree_2'],near=['CommonTree_1','CommonTree_2','CommonTree_3','TwistedTree_4'];const types=r>65?far:near,name=types[Math.floor(random()*types.length)];place(name,x,z,6+random()*6);addBlock(x,z,.6,ground(x,z)+6);
  }
  for(let i=0;i<170;i++){
   const a=random()*6.28,r=6+random()*34,x=Math.sin(a)*r,z=Math.cos(a)*r;if(pathDistance(x,z)<1.8||Math.hypot(x,z)<6||Math.abs(z+8)<4&&Math.abs(x)>7&&Math.abs(x)<15||z< -13&&Math.abs(x)<5)continue;
   const name=i%3===0?'Bush_Common_Flowers':i%3===1?'Fern_1':'Flower_3_Group';place(name,x,z,name==='Bush_Common_Flowers'?.7+random()*.7:.25+random()*.4);
  }
  for(let i=0;i<28;i++){const a=random()*6.28,r=27+random()*80,x=Math.sin(a)*r,z=Math.cos(a)*r;place('Rock_Medium_1',x,z,.6+random()*1.3);addBlock(x,z,.7,ground(x,z)+1);}
  function windMaterial(material,height=1,amount=.028){
   const m=material.clone();m.roughness=1;m.metalness=0;if(m.transparent||m.alphaTest){m.alphaTest=.42;m.transparent=false;m.depthWrite=true;}
   m.onBeforeCompile=shader=>{shader.uniforms.uWindTime=wind;shader.vertexShader='uniform float uWindTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
    vec4 windWorld=vec4(position,1.0);
    #ifdef USE_INSTANCING
    windWorld=instanceMatrix*windWorld;
    #endif
    float bend=pow(clamp(position.y/${height.toFixed(4)},0.,1.),2.);
    transformed.x+=sin(uWindTime*1.3+windWorld.x*.33+windWorld.z*.23)*bend*${amount.toFixed(4)};
    transformed.z+=cos(uWindTime*.9+windWorld.x*.24)*bend*${(amount*.45).toFixed(4)};`);};
   m.customProgramCacheKey=()=>`nature-wind-${height}-${amount}`;return m;
  }
  const loader=new T.GLTFLoader();
  const loading=Object.entries(placements).map(([name,items])=>new Promise(resolve=>{
   if(!items.length){resolve();return;}
   loader.load(`./assets/nature/${name}.glb`,gltf=>{
    const root=gltf.scene;root.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(root),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3()),scale=1/size.y;
    root.traverse(node=>{if(!node.isMesh)return;
     const geometry=node.geometry.clone().applyMatrix4(node.matrixWorld);geometry.translate(-center.x,-bounds.min.y,-center.z);geometry.scale(scale,scale,scale);
     const mats=(Array.isArray(node.material)?node.material:[node.material]).map(m=>windMaterial(m,1,name.includes('Rock')?0:.035));
     const mesh=new T.InstancedMesh(geometry,Array.isArray(node.material)?mats:mats[0],items.length),dummy=new T.Object3D();
     items.forEach((p,i)=>{dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(0,p.yaw,0);dummy.scale.setScalar(p.h);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});mesh.computeBoundingSphere();mesh.userData.nature=name;group.add(mesh);
    });resolve();
   },undefined,error=>{console.warn('Nature asset unavailable',name,error);scene.emit('nature-error',{name});resolve();});
  }));
  // Taller, denser grass nearby; distant tiles use fewer clumps to keep VR light.
  const blades=[];
  for(let b=0;b<3;b++){const a=b*Math.PI/3,c=Math.cos(a),q=Math.sin(a),w=.065;blades.push(-w*c,0,-w*q,w*c,0,w*q,.015*c,.32,.015*q);}
  const grassGeo=new T.BufferGeometry();grassGeo.setAttribute('position',new T.Float32BufferAttribute(blades,3));grassGeo.computeVertexNormals();
  const grassMat=windMaterial(new T.MeshStandardMaterial({color:'#ffffff',side:T.DoubleSide,roughness:1}),.32,.060);
  const TILE=12,GRID=56,FAR_GRID=28,RADIUS=4,grassTiles=[],dummy=new T.Object3D(),visitor=new T.Vector3();let grassCell='';
  for(let i=0;i<(RADIUS*2+1)**2;i++){const mesh=new T.InstancedMesh(grassGeo,grassMat,GRID*GRID);mesh.userData.grass=true;mesh.userData.tile=null;group.add(mesh);grassTiles.push(mesh);}
  function fillGrass(mesh,tx,tz,grid){
   let count=0;const step=TILE/grid;
   for(let ix=0;ix<grid;ix++)for(let iz=0;iz<grid;iz++){
    const gx=tx*grid+ix,gz=tz*grid+iz,h=hash(gx,gz),x=tx*TILE+(ix+.15+hash(gx+871,gz)*.7)*step,z=tz*TILE+(iz+.15+hash(gx,gz+913)*.7)*step;
    if(pathDistance(x,z)<1.13||Math.hypot(x,z)<5.6||Math.abs(x)>196||Math.abs(z)>196)continue;
    dummy.position.set(x,ground(x,z)-.006,z);dummy.rotation.set(0,h*6.28,0);dummy.scale.setScalar(.7+hash(gx+711,gz+22)*.45);dummy.updateMatrix();mesh.setMatrixAt(count,dummy.matrix);mesh.setColorAt(count++,new T.Color().setHSL(.23+hash(gx+99,gz)*.065,.52,.29+h*.16));
   }
   mesh.count=count;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;mesh.computeBoundingSphere();mesh.userData.tile=`${tx},${tz},${grid}`;mesh.userData.grid=grid;
  }
  function updateGrass(){
   if(scene.camera)scene.camera.getWorldPosition(visitor);else visitor.set(0,1.65,15);
   const cx=Math.floor(visitor.x/TILE),cz=Math.floor(visitor.z/TILE),cell=`${cx},${cz}`;if(cell===grassCell)return;grassCell=cell;
   const needed=new Map();for(let x=cx-RADIUS;x<=cx+RADIUS;x++)for(let z=cz-RADIUS;z<=cz+RADIUS;z++){const grid=Math.max(Math.abs(x-cx),Math.abs(z-cz))<=2?GRID:FAR_GRID;needed.set(`${x},${z},${grid}`,[x,z,grid]);}
   const spare=[];for(const mesh of grassTiles){if(needed.has(mesh.userData.tile))needed.delete(mesh.userData.tile);else spare.push(mesh);}
   for(const [tx,tz,grid] of needed.values())fillGrass(spare.pop(),tx,tz,grid);
  }
  updateGrass();
  // Soft contact shadows ground the trees without costly dynamic shadow maps.
  const shadows=new T.InstancedMesh(new T.CircleGeometry(1,20),new T.MeshBasicMaterial({color:'#15361b',transparent:true,opacity:.14,depthWrite:false}),trees.length);
  trees.forEach((p,i)=>{dummy.position.set(p.x,ground(p.x,p.z)+.025,p.z);dummy.rotation.set(-Math.PI/2,0,0);dummy.scale.set(2.2,2.2,1);dummy.updateMatrix();shadows.setMatrixAt(i,dummy.matrix);});shadows.computeBoundingSphere();group.add(shadows);
  const dustGeo=new T.BufferGeometry(),dustPositions=[],dustOrigins=[];
  for(let i=0;i<220;i++){const x=(random()-.5)*45,z=(random()-.5)*45,y=ground(x,z)+.6+random()*4;dustPositions.push(x,y,z);dustOrigins.push(x,y,z);}
  dustGeo.setAttribute('position',new T.Float32BufferAttribute(dustPositions,3));const dust=new T.Points(dustGeo,new T.PointsMaterial({color:'#fff2b3',size:.045,transparent:true,opacity:.7,depthWrite:false}));group.add(dust);
  function tick(t){wind.value=t;updateGrass();const p=dustGeo.attributes.position;for(let i=0;i<p.count;i++){const a=i*3;p.setXYZ(i,dustOrigins[a]+Math.sin(t*.2+i)*.9,dustOrigins[a+1]+Math.sin(t*.5+i)*.25,dustOrigins[a+2]+Math.cos(t*.17+i)*.7);}p.needsUpdate=true;for(const fn of animated)fn(t);}
  function clear(point,margin=.32){return !obstacles.some(o=>point.y<o.top+.2&&point.y>=o.bottom-.3&&Math.hypot(point.x-o.x,point.z-o.z)<o.r+margin);}
  function valid(point){
   if(Math.abs(point.x)>193||Math.abs(point.z)>193||!clear(point))return false;
   const dx=(ground(point.x+.4,point.z)-ground(point.x-.4,point.z))/.8,dz=(ground(point.x,point.z+.4)-ground(point.x,point.z-.4))/.8;
   return Math.hypot(dx,dz)<.65;
  }
  function ray(origin,direction,max=50){
   const point=new T.Vector3();let previous=0;
   for(let d=.25;d<=max;d+=.4){
    point.copy(direction).multiplyScalar(d).add(origin);
    if(point.y<=ground(point.x,point.z)){
     let lo=previous,hi=d;for(let i=0;i<10;i++){const mid=(lo+hi)/2;point.copy(direction).multiplyScalar(mid).add(origin);if(point.y<=ground(point.x,point.z))hi=mid;else lo=mid;}
     point.copy(direction).multiplyScalar(hi).add(origin);point.y=ground(point.x,point.z);
     return {point:point.clone(),distance:hi,valid:valid(point)};
    }
    if(!clear(point,0))return {point:point.clone(),distance:d,valid:false,obstacle:true};
    previous=d;
   }
   return null;
  }
  const world={ground,valid,clear,ray,group,obstacles,addBlock,tick,animated,ready:Promise.all(loading),pathDistance,treeCount:trees.length,grassTiles,placements};scene.galleryWorld=world;return world;
 }
 return {build,height,ground,pathDistance,PATH};
})();
if(typeof module!=='undefined')module.exports=GalleryLandscape;
