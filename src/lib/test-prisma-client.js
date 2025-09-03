const { PrismaClient } = require('@prisma/client')

async function testPrismaClient() {
  const prisma = new PrismaClient()
  
  try {
    console.log('Testing Prisma client...')
    
    // Check if user model exists
    console.log('Available Prisma models:', Object.keys(prisma))
    
    // Test database connection
    await prisma.$connect()
    console.log('✅ Database connected')
    
    // Test simple query
    const userCount = await prisma.user.count()
    console.log('✅ User model accessible, count:', userCount)
    
  } catch (error) {
    console.error('❌ Prisma test failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testPrismaClient()