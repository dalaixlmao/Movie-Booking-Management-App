import { PrismaClient, Prisma } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  async function createUser(data: { name: string, balance:number, phone: string, email: string, password: string, city?: string, state?: string, zip?: string }) {
    try {
      const user = await prisma.user.create({
        data
      });
      console.log(`Created user with email: ${data.email}`);
      return user;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          console.log(`User with email: ${data.email} already exists. Skipping...`);
        } else {
          throw e;
        }
      } else {
        throw e;
      }
    }
  }

 const user1 = await createUser({
    name: 'Alice',
    phone: '1234567890',
    email: 'alice@example.com',
    password: 'securepassword123',
    city: 'New York',
    state: 'NY',
    zip: '10001',
    balance: 100000,
  });

  const user2 = await createUser({
    name: 'Bob',
    phone: '0987654321',
    email: 'bob@example.com',
    password: 'securepassword456',
    city: 'Los Angeles',
    state: 'CA',
    zip: '90001',
    balance: 100000,
  });

  const cinema1 = await prisma.cinema.create({
    data: {
      name: 'Cinema One',
      city: 'New York',
      state: 'NY',
      zip: '10001'
    }
  });

  const cinema2 = await prisma.cinema.create({
    data: {
      name: 'Cinema Two',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90001'
    }
  });

  const audi1 = await prisma.audi.create({
    data: {
      name: 'Audi One',
      cinema: { connect: { id: cinema1.id } }
    }
  });

  const audi2 = await prisma.audi.create({
    data: {
      name: 'Audi Two',
      cinema: { connect: { id: cinema2.id } }
    }
  });

  async function createSeatsInBatches(seats: { row: number, col: number, audiId: number, price:number }[], batchSize: number) {
    for (let i = 0; i < seats.length; i += batchSize) {
      const batch = seats.slice(i, i + batchSize);
      await prisma.seat.createMany({
        data: batch
      });
    }
  }

  const seats = [];
  for (let row = 1; row <= 10; row++) {
    for (let col = 1; col <= 20; col++) {
      seats.push({
        row,
        col,
        audiId: audi1.id,
        price: 20000
      });
    }
  }

  for (let row = 1; row <= 15; row++) {
    for (let col = 1; col <= 30; col++) {
      seats.push({
        row,
        col,
        audiId: audi2.id,
        price: 30000
      });
    }
  }

  await createSeatsInBatches(seats, 100);

  const movie1 = await prisma.movie.create({
    data: {
      name: 'Inception',
      languages: ['English', 'French'],
      certificate: 'PG-13',
      rating: '8.8',
      dates: [new Date('2024-07-16'), new Date('2024-07-17')],
      cinemas: { connect: [{ id: cinema1.id }, { id: cinema2.id }] },
      poster: 'https://lh3.googleusercontent.com/drive-viewer/AKGpihaqVe1huon-2hz7yWxAgbeMmu-JIEbCoAGad9a1ycZ2W1YdhDkf-_GxOoi4qPEoIckewtc-sWvxtd3r6kLkq6sLaptGzqfTfWI=s1600-rw-v1'
    }
  });

  const movie2 = await prisma.movie.create({
    data: {
      name: 'Demon Slayer',
      languages: ['English', 'Japanese', 'Frensh', 'Spanish'],
      certificate: 'PG-12',
      rating: '8.6',
      dates: [new Date('2024-07-18'), new Date('2024-07-19')],
      cinemas: { connect: [{ id: cinema1.id }] },
      poster: 'https://lh3.googleusercontent.com/drive-viewer/AKGpihbcjJ55VUc0_dJg2eI75qZjmAXZM7gnBcNW_85C6xoSufXWXfImlmnU5b_xPilN0pLNcmTzK0D-Sv8S5o8LQXw5Im0rr5ERi3s=s1600-rw-v1'
    }
  });

  // movieId Int
  // slots DateTime[]
  // audiId Int
  // movie Movie @relation(fields: [movieId], references: [id])
  // audi Audi @relation (fields: [audiId], references: [id])

  function getRandomDateInRange(start: Date, end: Date): Date {
    const startDate = start.getTime();
    const endDate = end.getTime();
    const randomTime = startDate + Math.random() * (endDate - startDate);
    return new Date(randomTime);
}

function generateRandomDates(numDates: number, start: Date, end: Date): Date[] {
    const dates: Date[] = [];
    for (let i = 0; i < numDates; i++) {
        dates.push(getRandomDateInRange(start, end));
    }
    return dates;
}

const startDate = new Date('2024-09-01T00:00:00Z');
const endDate = new Date('2024-09-07T23:59:59Z');

const randomDates = generateRandomDates(12, startDate, endDate);



  const slots1= await prisma.slots.create({
    data:{
      movie:{ connect: { id: movie1.id } },
      audi:{ connect: { id: audi1.id } },
      slots: generateRandomDates(12, startDate, endDate)
    }
  })
  const slots2= await prisma.slots.create({
    data:{
      movie:{ connect: { id: movie2.id } },
      audi:{ connect: { id: audi1.id } },
      slots: generateRandomDates(16, startDate, endDate)
    }
  })
  const slots3= await prisma.slots.create({
    data:{
      movie:{ connect: { id: movie1.id } },
      audi:{ connect: { id: audi2.id } },
      slots: generateRandomDates(12, startDate, endDate)
    }
  })
  const slots4= await prisma.slots.create({
    data:{
      movie:{ connect: { id: movie2.id } },
      audi:{ connect: { id: audi2.id } },
      slots: generateRandomDates(16, startDate, endDate)
    }
  })

  console.log({ user1, user2, cinema1, cinema2, audi1, audi2, movie1, movie2 });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
