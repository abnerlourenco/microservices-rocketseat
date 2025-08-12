import '@opentelemetry/auto-instrumentations-node/register'

import { fastify } from 'fastify'
import {fastifyCors } from '@fastify/cors'
import { z } from 'zod'
import { 
  serializerCompiler, 
  validatorCompiler, 
  type ZodTypeProvider 
} from 'fastify-type-provider-zod'
import { trace } from '@opentelemetry/api'
import { db } from '../db/client.ts'
import { schema } from '../db/schema/index.ts'
import { dispatchOrderCreated } from '../broker/messages/order-created.ts'
import { tracer } from '../tracer/tracer.ts'

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)

app.register(fastifyCors, { origin: '*' })

app.get('/health', () => {
  return 'OK'
})

app.post('/orders', {
  schema: {
    body: z.object({
      amount: z.number()
    })
  }
}, async (request, reply) => {
  const { amount } = request.body

  console.log('Creating an order with amount ', amount)

  const orderId = crypto.randomUUID()

  const span = tracer.startSpan('Gravando orders no banco de dados')

  span.setAttribute('order.id', orderId)

  await db.insert(schema.orders).values({
    id: orderId,
    customerId: '299b9a91-a32e-4ea7-8e22-fc26aea47b07',
    amount,
  })

  span.end()

  dispatchOrderCreated({
    orderId,
    amount,
    constumer: { 
      id: '299b9a91-a32e-4ea7-8e22-fc26aea47b07',
    }
  })

  return reply.status(201).send()
})

app.listen({ host: '0.0.0.0', port: 3333}).then(() => {
  console.log('[Orders] HTTP Server running!')
})