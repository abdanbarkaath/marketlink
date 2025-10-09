import { Prisma, PrismaClient } from "@prisma/client";
import Fastify from "fastify";

const fastify = Fastify({ logger: true });
const prisma = new PrismaClient();

fastify.get("/health", async () => {
  return { ok: true, service: "marketlink-backend", time: new Date().toISOString() };
});

fastify.get("/providers", async (req, reply) => {
  const { city } = req.query as { city?: string };

  const providers = await prisma.provider.findMany({
    where: city ? { city: { equals: city, mode: "insensitive" } } : {},
    orderBy: { createdAt: "desc" },
    take: 20
  });
  return providers;
})

const port = Number(process.env.PORT || 4000);

fastify.listen({ port, host: "0.0.0.0"}).then(()=>{
  console.log(`API running on http://localhost:${port}`);
}).catch((err)=>{
  fastify.log.error(err);
  process.exit(1);
});
