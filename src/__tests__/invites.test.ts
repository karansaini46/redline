import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../app/api/orgs/[orgId]/invites/route'
import { prisma } from '../lib/prisma'
import { auth } from '../lib/auth'

vi.mock('../lib/prisma', () => ({
  prisma: {
    membership: { findUnique: vi.fn() },
    orgInvite: { create: vi.fn() },
    auditLogEntry: { create: vi.fn() },
    $transaction: vi.fn(),
  }
}))

vi.mock('../lib/auth', () => ({
  auth: vi.fn()
}))

vi.mock('resend', () => {
  const ResendMock = vi.fn()
  ResendMock.prototype.emails = { send: vi.fn() }
  return { Resend: ResendMock }
})

describe('POST /api/orgs/[orgId]/invites', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 if not logged in', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(auth as any).mockResolvedValue(null)
    const req = new Request('http://localhost/api', { method: 'POST' })
    const res = await POST(req, { params: { orgId: 'org1' } })
    expect(res.status).toBe(401)
  })

  it('returns 403 if caller is MEMBER', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(auth as any).mockResolvedValue({ user: { id: 'user1' } })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(prisma.membership.findUnique as any).mockResolvedValue({ role: 'MEMBER' })
    
    const req = new Request('http://localhost/api', { method: 'POST', body: JSON.stringify({ email: 'test@test.com', role: 'MEMBER' }) })
    const res = await POST(req, { params: { orgId: 'org1' } })
    expect(res.status).toBe(403)
  })

  it('succeeds if caller is ADMIN', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(auth as any).mockResolvedValue({ user: { id: 'admin1' } })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(prisma.membership.findUnique as any).mockResolvedValue({ role: 'ADMIN' })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(prisma.$transaction as any).mockImplementation(async (cb: any) => {
      const tx = {
        orgInvite: { create: vi.fn().mockResolvedValue({ id: 'invite1' }) },
        auditLogEntry: { create: vi.fn() }
      }
      return await cb(tx)
    })
    
    const req = new Request('http://localhost/api', { method: 'POST', body: JSON.stringify({ email: 'test@test.com', role: 'MEMBER' }) })
    const res = await POST(req, { params: { orgId: 'org1' } })
    
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
  })
})
