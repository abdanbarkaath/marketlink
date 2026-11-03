require('ts-node/register/transpile-only');
const test = require('node:test');
const assert = require('node:assert/strict');
const {parseServiceGroups, groupedServiceFilter} = require('../src/lib/providerSearch');
test('all selected services allows equivalent tokens within each service',()=> {
 const groups=parseServiceGroups('[["seo","local-seo"],["google-ads"]]');
 assert.deepEqual(groupedServiceFilter(groups,'all'),{AND:[{services:{hasSome:['seo','local-seo']}},{services:{hasSome:['google-ads']}}]});
 assert.deepEqual(groupedServiceFilter(groups,'any'),{services:{hasSome:['seo','local-seo','google-ads']}});
});
test('service group validation rejects malformed, empty and oversized selections',()=> {
 for(const value of ['{}','[[]]','[[1]]','[["bad token"]]',JSON.stringify(Array(65).fill(['seo']))])assert.throws(()=>parseServiceGroups(value));
 assert.deepEqual(parseServiceGroups(undefined),[]);
 assert.deepEqual(parseServiceGroups('[["seo","seo"]]'),[['seo']]);
});

test('provider route validates groups and sorts distance before pagination',async()=>{
 const Fastify=require('fastify');
 const {prisma}=require('../src/lib/prisma');
 const geo=require('../src/lib/geocoding');
 const routes=require('../src/routes/providers').default;
 const app=Fastify();await app.register(routes);
 const originalMany=prisma.expert.findMany,originalCount=prisma.expert.count,originalGeo=geo.geocodeSearchCenter;
 const rows=[3,1,2].map(n=>({id:String(n),slug:'team-'+n,businessName:'Team '+n,expertType:'agency',tagline:null,shortDescription:null,city:'Test',state:'IL',zip:'60601',latitude:n/100,longitude:0,verified:false,logo:null,services:['seo'],rating:0,createdAt:new Date().toISOString()}));
 let captured;
 prisma.expert.findMany=async args=>{captured=args.where;return rows};prisma.expert.count=async()=>3;
 geo.geocodeSearchCenter=async()=>({ok:true,latitude:0,longitude:0});
 try{
  const invalid=await app.inject({url:'/experts?serviceGroups=%7B%7D'});assert.equal(invalid.statusCode,400);
  const noLocation=await app.inject({url:'/experts?sort=distance'});assert.equal(noLocation.statusCode,400);
  const groups=encodeURIComponent(JSON.stringify([['seo','local-seo'],['ads']]));
  const response=await app.inject({url:`/experts?zip=60601&radius=10&sort=distance&limit=1&page=2&serviceGroups=${groups}&match=all`});
  assert.equal(response.statusCode,200,response.body);
  assert.equal(response.json().data[0].id,'2');assert.equal(response.json().meta.total,3);
  assert.deepEqual(captured.AND[0],{AND:[{services:{hasSome:['seo','local-seo']}},{services:{hasSome:['ads']}}]});
 }finally{prisma.expert.findMany=originalMany;prisma.expert.count=originalCount;geo.geocodeSearchCenter=originalGeo;await app.close()}
});
