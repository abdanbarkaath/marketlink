import Fastify from "fastify";

const fastify = Fastify({ logger: true });

fastify.get("/health", async () => {
  return { ok: true, service: "marketlink-backend", time: new Date().toISOString() };
});

const port = Number(process.env.PORT || 4000);

fastify.listen({ port, host: "0.0.0.0"}).then(()=>{
  console.log(`API running on http://localhost:${port}`);
}).catch((err)=>{
  fastify.log.error(err);
  process.exit(1);
});
