import { describe, it, expect, vi, beforeEach } from 'vitest'
import { requireRole, ForbiddenError, roleLevels } from '../server/rbac'
import { prisma } from '../lib/prisma'
import { Role } from '@prisma/client'

vi.mock('../lib/prisma', () => ({
  prisma: {
    membership: { findUnique: vi.fn() }
  }
}))

describe('requireRole RBAC', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws if no membership is found', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(prisma.membership.findUnique as any).mockResolvedValue(null)
    await expect(requireRole('org1', 'user1', 'VIEWER')).rejects.toThrow(ForbiddenError)
  })

  const roles: Role[] = ['VIEWER', 'MEMBER', 'ADMIN', 'OWNER']

  roles.forEach(callerRole => {
    roles.forEach(minRole => {
      const callerLevel = roleLevels[callerRole]
      const minLevel = roleLevels[minRole]
      
      it(`Caller ${callerRole} calling minRole ${minRole} should ${callerLevel >= minLevel ? 'succeed' : 'throw'}`, async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(prisma.membership.findUnique as any).mockResolvedValue({
          role: callerRole
        })

        if (callerLevel >= minLevel) {
          const result = await requireRole('org1', 'user1', minRole)
          expect(result.role).toBe(callerRole)
        } else {
          await expect(requireRole('org1', 'user1', minRole)).rejects.toThrow(ForbiddenError)
        }
      })
    })
  })
})
