'use strict';
// Lightweight exhibit physics: gravity, a small bounce, and ground/stand contact.
class DroneDynamics{
 constructor(scene,world){this.scene=scene;this.world=world;this.items=[];this.surfaces=[];this.box=new AFRAME.THREE.Box3();}
 register(el,home){this.items.push({el,home,velocity:new AFRAME.THREE.Vector3(),sleeping:true});}
 item(el){return this.items.find(i=>i.el===el);}
 release(el,velocity){const item=this.item(el);if(!item)return;item.velocity.copy(velocity||new AFRAME.THREE.Vector3()).clampLength(0,4);item.sleeping=false;}
 reset(el){const i=this.item(el);if(!i||el.heldBy)return;el.object3D.position.set(i.home.x,i.home.y,i.home.z);el.object3D.quaternion.identity();i.velocity.set(0,0,0);i.sleeping=true;}
 support(x,z,bottom){let h=this.world.ground(x,z);for(const s of this.surfaces){const inside=s.r?Math.hypot(x-s.x,z-s.z)<s.r:Math.abs(x-s.x)<s.rx&&Math.abs(z-s.z)<s.rz;if(inside&&bottom>=s.h-.06)h=Math.max(h,s.h);}return h;}
 tick(dt){
  dt=Math.min(dt,.04);const T=AFRAME.THREE;
  for(const i of this.items){
   if(i.el.heldBy||i.sleeping)continue;const o=i.el.object3D;o.updateWorldMatrix(true,true);this.box.setFromObject(i.el.getObject3D('mesh'));const previousBottom=this.box.min.y;
   i.velocity.y-=9.81*dt;o.position.addScaledVector(i.velocity,dt);o.updateWorldMatrix(true,true);this.box.setFromObject(i.el.getObject3D('mesh'));
   const p=o.position,h=this.support(p.x,p.z,previousBottom),floor=Math.max(h,this.world.ground(this.box.min.x,this.box.min.z),this.world.ground(this.box.max.x,this.box.max.z));
   if(this.box.min.y<floor){o.position.y+=floor-this.box.min.y+.004;if(i.velocity.y<0)i.velocity.y*=-.16;i.velocity.x*=.65;i.velocity.z*=.65;if(i.velocity.length()<.18){i.velocity.set(0,0,0);i.sleeping=true;}}
   if(Math.abs(p.x)>190||Math.abs(p.z)>190||p.y< -30)this.reset(i.el);
  }
 }
}
if(typeof module!=='undefined')module.exports=DroneDynamics;
