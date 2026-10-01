'use strict';
// Target-ray pose aims; grip pose carries the model.
AFRAME.registerComponent('quest-input',{
 init(){
  const T=AFRAME.THREE;this.ray=new T.Raycaster();this.ray.far=50;this.origin=new T.Vector3();this.direction=new T.Vector3();this.rotation=new T.Quaternion();this.pointers=[];
  for(let i=0;i<2;i++){
   const controller=this.el.sceneEl.renderer.xr.getController(i),grip=this.el.sceneEl.renderer.xr.getControllerGrip(i);
   const line=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3(0,0,-1)]),new T.LineBasicMaterial({color:0xe5ece7,transparent:true,opacity:.65}));controller.add(line);this.el.object3D.add(controller,grip);
   const arc=new T.Line(new T.BufferGeometry().setAttribute('position',new T.BufferAttribute(new Float32Array(243),3)),new T.LineBasicMaterial({color:0xa9cba0}));
   const marker=new T.Mesh(new T.RingGeometry(.23,.31,40),new T.MeshBasicMaterial({color:0xa9cba0,side:T.DoubleSide,depthWrite:false}));this.el.sceneEl.object3D.add(arc,marker);arc.visible=marker.visible=false;
   const p={controller,grip,line,arc,marker,source:null,hover:null,latched:false,pressed:false,aiming:false,landing:null,held:null};
   p.connected=e=>{p.source=e.data;};
   p.disconnected=()=>{this.release(p);this.hover(p,null);p.source=null;p.aiming=false;p.landing=null;p.latched=p.pressed=false;p.arc.visible=p.marker.visible=false;};
   p.select=()=>{if(p.aiming||p.held)return;const hit=this.intersection(p);if(hit?.el)hit.el.emit('click',{intersection:hit.intersection});else if(hit?.floor?.valid)this.el.emit('quest-teleport',{point:hit.floor.point});};
   p.squeeze=()=>this.grab(p);p.release=()=>this.release(p);
   for(const [event,fn] of [['connected',p.connected],['disconnected',p.disconnected],['select',p.select],['squeezestart',p.squeeze],['squeezeend',p.release]])controller.addEventListener(event,fn);this.pointers.push(p);
  }
  this.exit=()=>{for(const p of this.pointers){this.release(p);p.aiming=false;p.landing=null;p.arc.visible=p.marker.visible=false;}};this.el.sceneEl.addEventListener('exit-vr',this.exit);
 },
 pose(p){p.controller.updateWorldMatrix(true,false);p.controller.getWorldPosition(this.origin);p.controller.getWorldQuaternion(this.rotation);this.direction.set(0,0,-1).applyQuaternion(this.rotation);this.ray.set(this.origin,this.direction);},
 intersection(p){
  if(!p.source||p.source.targetRayMode!=='tracked-pointer')return null;this.pose(p);
  const targets=Array.from(this.el.sceneEl.querySelectorAll('.interactive')).filter(e=>galleryVisible(e)&&!e.heldBy).map(e=>{e.object3D.updateWorldMatrix(true,true);return e.object3D;});
  const hit=this.ray.intersectObjects(targets,true)[0],floor=this.el.sceneEl.galleryWorld?.ray(this.origin,this.direction);
  if(hit&&(!floor||floor.obstacle||hit.distance<floor.distance)){p.line.scale.z=hit.distance;let object=hit.object;while(object&&!object.el)object=object.parent;return object?.el?{el:object.el,intersection:hit}:null;}
  p.line.scale.z=floor?floor.distance:8;return floor?{floor}:null;
 },
 hover(p,next){if(p.hover===next)return;p.hover?.emit('mouseleave');p.hover=next;next?.emit('mouseenter');p.line.material.opacity=next?.9:.55;},
 arc(p){
  const world=this.el.sceneEl.galleryWorld;if(!world)return;this.pose(p);
  const T=AFRAME.THREE,positions=p.arc.geometry.attributes.position,point=new T.Vector3(),previous=this.origin.clone();let count=0,landing=null,valid=false;
  for(let i=0;i<=80;i++){
   const t=i*.04;point.copy(this.direction).multiplyScalar(9*t).add(this.origin);point.y-=4.9*t*t;
   if(i>0&&point.y<=world.ground(point.x,point.z)){
    let low=0,high=1;for(let j=0;j<9;j++){const mid=(low+high)/2,test=previous.clone().lerp(point,mid);if(test.y<=world.ground(test.x,test.z))high=mid;else low=mid;}
    point.copy(previous.clone().lerp(point,high));point.y=world.ground(point.x,point.z);landing=point.clone();valid=world.valid(point);positions.setXYZ(count++,point.x,point.y+.015,point.z);break;
   }
   positions.setXYZ(count++,point.x,point.y,point.z);if(i>1&&!world.clear(point,0)){landing=point.clone();break;}previous.copy(point);
  }
  p.arc.geometry.setDrawRange(0,count);positions.needsUpdate=true;p.arc.frustumCulled=false;p.arc.visible=true;p.arc.material.color.set(valid?'#a9cba0':'#c98972');p.landing=valid?landing:null;this.marker(p,landing,valid);
 },
 marker(p,point,valid){
  p.marker.visible=!!point;if(!point)return;p.marker.position.copy(point);p.marker.position.y+=.035;p.marker.material.color.set(valid?'#a9cba0':'#c98972');
  const T=AFRAME.THREE,w=this.el.sceneEl.galleryWorld,normal=new T.Vector3(w.ground(point.x-.15,point.z)-w.ground(point.x+.15,point.z),.3,w.ground(point.x,point.z-.15)-w.ground(point.x,point.z+.15)).normalize();p.marker.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),normal);
 },
 grab(p){
  if(p.held||!p.source)return;this.pose(p);const T=AFRAME.THREE,position=new T.Vector3();p.grip.updateWorldMatrix(true,false);p.grip.getWorldPosition(position);
  const candidates=Array.from(this.el.sceneEl.querySelectorAll('.grabbable')).filter(e=>!e.heldBy&&e.getObject3D('mesh'));
  candidates.forEach(e=>e.object3D.updateWorldMatrix(true,true));let target=candidates.find(e=>{const center=new T.Vector3();e.object3D.getWorldPosition(center);return center.distanceTo(position)<.65;});
  if(!target){const hits=this.ray.intersectObjects(candidates.map(e=>e.object3D),true);if(hits[0]?.distance<6){let o=hits[0].object;while(o&&!o.el)o=o.parent;target=o?.el;}}
  if(!target||!target.classList.contains('grabbable'))return;const object=target.object3D;
  p.velocity=new T.Vector3();p.lastHeldPosition=new T.Vector3();p.held={target,parent:object.parent,position:object.position.clone(),quaternion:object.quaternion.clone(),scale:object.scale.clone()};target.heldBy=p;p.grip.attach(object);object.position.set(0,.08,-.28);object.quaternion.identity();object.getWorldPosition(p.lastHeldPosition);p.aiming=false;p.landing=null;p.arc.visible=p.marker.visible=false;this.el.emit('model-grabbed');
  p.source.gamepad?.hapticActuators?.[0]?.pulse(.25,60);
 },
 release(p){if(!p.held)return;const h=p.held;h.parent.attach(h.target.object3D);delete h.target.heldBy;this.el.sceneEl.galleryDynamics?.release(h.target,p.velocity);p.held=null;},
 tick(t,dt){
  if(!this.el.sceneEl.renderer.xr.isPresenting)return;
  for(const p of this.pointers){
   if(!p.source){p.line.visible=false;continue;}if(p.held){const pos=new AFRAME.THREE.Vector3();p.held.target.object3D.getWorldPosition(pos);if(dt>0)p.velocity.copy(pos).sub(p.lastHeldPosition).multiplyScalar(1000/dt).clampLength(0,4);p.lastHeldPosition.copy(pos);}const g=p.source.gamepad;if(!g)continue;
   const x=g.axes.length>=4?g.axes[2]:(g.axes[0]||0),y=g.axes.length>=4?g.axes[3]:(g.axes[1]||0);
   if(y<-.65&&!p.held)p.aiming=true;
   if(p.aiming){this.hover(p,null);p.line.visible=false;this.arc(p);if(y>-.3){if(p.landing)this.el.emit('quest-teleport',{point:p.landing.clone()});p.aiming=false;p.arc.visible=p.marker.visible=false;p.landing=null;}}
   else{p.line.visible=!p.held;p.arc.visible=false;const hit=p.held?null:this.intersection(p);this.hover(p,hit?.el||null);this.marker(p,hit?.floor?.point,!!hit?.floor?.valid);if(Math.abs(x)>.7&&!p.latched){this.el.emit('quest-turn',{angle:-Math.sign(x)*Math.PI/6});p.latched=true;}}
   if(Math.abs(x)<.25)p.latched=false;const pressed=!!g.buttons[4]?.pressed;if(pressed&&!p.pressed)this.el.emit('quest-navigation',{home:p.source.handedness==='left'});p.pressed=pressed;
  }
 },
 remove(){this.exit();this.el.sceneEl.removeEventListener('exit-vr',this.exit);for(const p of this.pointers){for(const [event,fn] of [['connected',p.connected],['disconnected',p.disconnected],['select',p.select],['squeezestart',p.squeeze],['squeezeend',p.release]])p.controller.removeEventListener(event,fn);for(const mesh of [p.line,p.arc,p.marker]){mesh.removeFromParent();mesh.geometry.dispose();mesh.material.dispose();}this.el.object3D.remove(p.controller,p.grip);}}
});
